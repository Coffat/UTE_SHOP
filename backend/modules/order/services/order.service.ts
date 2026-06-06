import mongoose, { ClientSession } from 'mongoose';
import Order, { IOrder } from '../models/Order.js';
import Cart, { ICart } from '../models/Cart.js';
import Product from '../../catalog/models/Product.js';
import { orderRepository } from '../repositories/order.repository.js';
import { cartRepository } from '../repositories/cart.repository.js';
export type { GetOrdersParams, OrdersSummaryDto } from '../repositories/order.repository.js';
import type { GetOrdersParams, OrdersSummaryDto } from '../repositories/order.repository.js';

// ─── Cross-module imports (gọi SERVICE, không import MODEL) ───────────────────
import { createPaymentRecord } from '../../finance/services/payment.service.js';
import { calculateOrderTotal, applyDiscounts } from '../../marketing/services/discount.service.js';
import PointLedger, { PointTransactionType } from '../../user/models/PointLedger.js';
import User from '../../user/models/User.js';
// ─────────────────────────────────────────────────────────────────────────────

import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';
import PaymentMethod from '../../../shared/enums/PaymentMethod.js';
import OrderPaymentStatus from '../../../shared/enums/OrderPaymentStatus.js';
import { AppError } from '../../../shared/utils/AppError.js';
import {
  getOrderIdsByPaymentStatus,
  getPaymentsByOrderIds,
} from '../../finance/services/payment.service.js';
import { decreaseStock, increaseStock } from '../../inventory/services/stock.service.js';
import {
  mapOrderToAdminListItem,
  type AdminOrderListItemDto,
  type AttentionOrderDto,
} from '../../../shared/mappers/order.mapper.js';
import {
  isValidOrderStatusTransition,
} from '../constants/orderStatusGroups.js';

const generateOrderCode = () => `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getOrCreateCart = async (customerId?: string, sessionId?: string): Promise<ICart> => {
  const existing = customerId
    ? await cartRepository.findActiveByCustomer(customerId)
    : sessionId
      ? await cartRepository.findActiveBySession(sessionId)
      : null;
  if (existing) return existing;
  return cartRepository.create(
    customerId ? { customer: customerId as any, items: [] } : { sessionId, items: [] }
  );
};

export const syncCart = async (customerId: string, items: { variantId: string; quantity: number }[] = []): Promise<ICart> => {
  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item.variantId)) {
      throw new AppError(`variantId không hợp lệ: ${item.variantId}`, 400);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new AppError('Số lượng sản phẩm phải là số nguyên dương', 400);
    }
  }

  let cart = await Cart.findOne({ customer: customerId, status: 'ACTIVE' });
  if (!cart) {
    cart = new Cart({ customer: customerId, status: 'ACTIVE', items: [] });
  }
  cart.items = items.map((item) => ({
    productVariant: item.variantId as any,
    quantity: item.quantity,
  } as any));
  return cart.save();
};

export const addToCart = async (cartId: string, variantId: string, quantity: number): Promise<ICart> => {
  const cart = await cartRepository.findById(cartId);
  if (!cart) throw new Error('Không tìm thấy giỏ hàng');
  const existingItem = cart.items.find((i) => i.productVariant.toString() === variantId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productVariant: variantId as any, quantity } as any);
  }
  return cart.save();
};

export const removeFromCart = async (cartId: string, variantId: string): Promise<ICart | null> => {
  return cartRepository.removeItem(cartId, variantId);
};

// ─── Place Order (ACID Transaction with Standalone Fallback) ──────────────────

interface PlaceOrderParams {
  customerId?: string;
  cartId: string;
  recipientInfo: {
    fullName: string;
    phone: string;
    deliveryNote?: string;
  };
  deliveryAddressId?: string;
  orderType?: OrderType;
  voucherCode?: string;
  pointsToUse?: number;
  paymentMethod: 'MOMO' | 'COD' | 'CASH' | 'VNPAY';
  note?: string;
}

const resolveInitialOrderPaymentStatus = (paymentMethod: PlaceOrderParams['paymentMethod']): OrderPaymentStatus => {
  if (paymentMethod === PaymentMethod.MOMO || paymentMethod === PaymentMethod.VNPAY) {
    return OrderPaymentStatus.PENDING;
  }
  return OrderPaymentStatus.UNPAID;
};

/**
 * Fallback checkout flow for MongoDB installations without replica sets.
 */
export const placeOrderWithoutTransaction = async ({
  customerId,
  cartId,
  recipientInfo,
  deliveryAddressId,
  orderType = OrderType.ONLINE,
  voucherCode,
  pointsToUse,
  paymentMethod,
  note,
}: PlaceOrderParams): Promise<IOrder> => {
  // ── STEP 0: Lấy cart & tính subtotal ─────────────────────────────────────
  const cart = await Cart.findById(cartId).populate('items.productVariant');
  if (!cart || cart.items.length === 0) throw new Error('Giỏ hàng trống');

  let subtotal = 0;
  const orderItems = cart.items.map((item: any) => {
    const price = Number(item.productVariant.price);
    const itemSubtotal = price * item.quantity;
    subtotal += itemSubtotal;
    return {
      productVariant: item.productVariant._id,
      quantity: item.quantity,
      unitPrice: mongoose.Types.Decimal128.fromString(price.toString()) as any,
      snapshotName: item.productVariant.sku,
      subtotal: mongoose.Types.Decimal128.fromString(itemSubtotal.toString()) as any,
    };
  });

  // ── STEP 1: Áp voucher và điểm (discount.service) ─────────────────────────
  const calcResult = await calculateOrderTotal({
    subTotal: subtotal,
    voucherCode,
    pointsToUse: pointsToUse || 0,
    userId: customerId || '',
  });

  const orderPaymentStatus = resolveInitialOrderPaymentStatus(paymentMethod);

  // ── STEP 2: Tạo Order ─────────────────────────────────────────────────────
  const [order] = await Order.create([
    {
      orderCode: generateOrderCode(),
      customer: customerId || null,
      status: OrderStatus.PENDING,
      orderType,
      items: orderItems,
      recipient: recipientInfo,
      deliveryAddress: deliveryAddressId || null,
      subtotal: mongoose.Types.Decimal128.fromString(calcResult.subTotal.toString()) as any,
      shippingFee: mongoose.Types.Decimal128.fromString(calcResult.shippingFee.toString()) as any,
      discountAmount: mongoose.Types.Decimal128.fromString(calcResult.voucherDiscount.toString()) as any,
      pointsUsed: calcResult.pointsUsed,
      pointsDiscount: mongoose.Types.Decimal128.fromString(calcResult.pointsDiscount.toString()) as any,
      totalAmount: mongoose.Types.Decimal128.fromString(calcResult.finalTotal.toString()) as any,
      finalTotal: mongoose.Types.Decimal128.fromString(calcResult.finalTotal.toString()) as any,
      voucher: calcResult.voucherId || null,
      note: note || '',
      paymentMethod,
      paymentStatus: orderPaymentStatus,
      statusHistory: [{ status: OrderStatus.PENDING, note: 'Order placed (no-transaction fallback)' }],
    },
  ]);

  // ── STEP 3: Trừ kho (inventory.service) ──────────────────────────────────
  for (const item of cart.items) {
    await decreaseStock((item.productVariant as any)._id, item.quantity, customerId || 'GUEST');
  }

  // ── STEP 4: Tạo Payment record (finance.service) ──────────────────────────
  await createPaymentRecord({ orderId: (order._id as mongoose.Types.ObjectId).toString(), amount: calcResult.finalTotal, paymentMethod });

  // ── STEP 5: Mark voucher used and deduct points ─────────────────────────
  if (customerId && (calcResult.voucherId || calcResult.pointsUsed > 0)) {
    await applyDiscounts(customerId, (order._id as mongoose.Types.ObjectId).toString(), calcResult.pointsUsed, calcResult.voucherId);
  }

  // ── STEP 6: Convert cart ──────────────────────────────────────────────────
  await Cart.findByIdAndUpdate(cartId, { status: 'CONVERTED' });

  return order;
};

/**
 * Luồng đặt hàng với MongoDB Transaction (4 bước ACID):
 *  1. Tạo Order
 *  2. Trừ kho (inventory.service)
 *  3. Tạo Payment record (finance.service)
 *  4. Áp voucher (marketing.service)
 *
 * Nếu BẤT KỲ bước nào lỗi → abortTransaction → rollback toàn bộ.
 *
 * ⚠️  Yêu cầu MongoDB Replica Set (không chạy trên standalone)
 */
export const placeOrder = async ({
  customerId,
  cartId,
  recipientInfo,
  deliveryAddressId,
  orderType = OrderType.ONLINE,
  voucherCode,
  pointsToUse,
  paymentMethod,
  note,
}: PlaceOrderParams): Promise<IOrder> => {
  let session: ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessionErr: any) {
    console.warn('⚠️ Standard MongoDB without replica set, bypassing session creation in placeOrder:', sessionErr.message);
    return placeOrderWithoutTransaction({
      customerId,
      cartId,
      recipientInfo,
      deliveryAddressId,
      orderType,
      voucherCode,
      pointsToUse,
      paymentMethod,
      note,
    });
  }

  try {
    // ── STEP 0: Lấy cart & tính subtotal ─────────────────────────────────────
    const cart = await Cart.findById(cartId).populate('items.productVariant').session(session);
    if (!cart || cart.items.length === 0) throw new Error('Giỏ hàng trống');

    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const price = Number((item.productVariant as any).price);
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      return {
        productVariant: (item.productVariant as any)._id,
        quantity: item.quantity,
        unitPrice: mongoose.Types.Decimal128.fromString(price.toString()) as any,
        snapshotName: (item.productVariant as any).sku,
        subtotal: mongoose.Types.Decimal128.fromString(itemSubtotal.toString()) as any,
      };
    });

    // ── STEP 1: Áp voucher và điểm (discount.service) ─────────────────────────
    const calcResult = await calculateOrderTotal({
      subTotal: subtotal,
      voucherCode,
      pointsToUse: pointsToUse || 0,
      userId: customerId || '',
    });

    const orderPaymentStatus = resolveInitialOrderPaymentStatus(paymentMethod);

    // ── STEP 2: Tạo Order ─────────────────────────────────────────────────────
    const [order] = await Order.create(
      [
        {
          orderCode: generateOrderCode(),
          customer: customerId || null,
          status: OrderStatus.PENDING,
          orderType,
          items: orderItems,
          recipient: recipientInfo,
          deliveryAddress: deliveryAddressId || null,
          subtotal: mongoose.Types.Decimal128.fromString(calcResult.subTotal.toString()) as any,
          shippingFee: mongoose.Types.Decimal128.fromString(calcResult.shippingFee.toString()) as any,
          discountAmount: mongoose.Types.Decimal128.fromString(calcResult.voucherDiscount.toString()) as any,
          pointsUsed: calcResult.pointsUsed,
          pointsDiscount: mongoose.Types.Decimal128.fromString(calcResult.pointsDiscount.toString()) as any,
          totalAmount: mongoose.Types.Decimal128.fromString(calcResult.finalTotal.toString()) as any,
          finalTotal: mongoose.Types.Decimal128.fromString(calcResult.finalTotal.toString()) as any,
          voucher: calcResult.voucherId || null,
          note: note || '',
          paymentMethod,
          paymentStatus: orderPaymentStatus,
          statusHistory: [{ status: OrderStatus.PENDING, note: 'Order placed' }],
        },
      ],
      { session }
    );

    // ── STEP 3: Trừ kho (inventory.service) ──────────────────────────────────
    for (const item of cart.items) {
      await decreaseStock((item.productVariant as any)._id, item.quantity, customerId || 'GUEST', session);
    }

    // ── STEP 4: Tạo Payment record (finance.service) ──────────────────────────
    await createPaymentRecord({ orderId: (order._id as mongoose.Types.ObjectId).toString(), amount: calcResult.finalTotal, paymentMethod, session });

    // ── STEP 5: Mark voucher used and deduct points ───────────────────────────
    if (customerId && (calcResult.voucherId || calcResult.pointsUsed > 0)) {
      await applyDiscounts(customerId, (order._id as mongoose.Types.ObjectId).toString(), calcResult.pointsUsed, calcResult.voucherId, session);
    }

    // ── STEP 6: Convert cart ──────────────────────────────────────────────────
    await Cart.findByIdAndUpdate(cartId, { status: 'CONVERTED' }, { session });

    await session.commitTransaction();
    return order;
  } catch (err: any) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // ignore
      }
    }
    const isTransactionError = err.message?.includes('replica set') || err.message?.includes('Transaction numbers');
    if (isTransactionError) {
      console.warn('⚠️ Replica set transaction error caught in placeOrder. Falling back to non-transaction checkout...');
      if (session) session.endSession();
      return placeOrderWithoutTransaction({
        customerId,
        cartId,
        recipientInfo,
        deliveryAddressId,
        orderType,
        voucherCode,
        pointsToUse,
        paymentMethod,
        note,
      });
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

// ─── Thay đổi trạng thái & Đếm số lượng bán ──────────────────────────────────

export const incrementOrderSoldCount = async (order: IOrder, session?: ClientSession) => {
  if (order.isSoldCountIncremented) return;
  for (const item of order.items) {
    const productVariant: any = typeof item.productVariant === 'object' ? item.productVariant : await mongoose.model('ProductVariant').findById(item.productVariant);
    if (productVariant) {
      await Product.findByIdAndUpdate(
        productVariant.product,
        { $inc: { soldCount: item.quantity } },
        session ? { session } : {}
      );
    }
  }
  order.isSoldCountIncremented = true;
};

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
  note: string,
  changedById?: string
): Promise<IOrder> => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

  const currentStatus = order.status as OrderStatus;
  if (!Object.values(OrderStatus).includes(newStatus)) {
    throw new AppError('Trạng thái đơn hàng không hợp lệ', 400);
  }
  if (newStatus === OrderStatus.CANCELLED) {
    throw new AppError('Không thể cập nhật trạng thái Hủy qua API này. Vui lòng sử dụng API Hủy đơn hàng riêng biệt.', 400);
  }
  if (currentStatus === newStatus) {
    throw new AppError('Đơn hàng đã ở trạng thái này', 400);
  }
  if (!isValidOrderStatusTransition(currentStatus, newStatus)) {
    throw new AppError(
      `Không thể chuyển từ ${currentStatus} sang ${newStatus}`,
      400
    );
  }

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, note: note ?? '', changedBy: changedById as any });

  // Increment soldCount when order reaches completed status.
  if (newStatus === OrderStatus.COMPLETED) {
    await incrementOrderSoldCount(order);
  }

  // Grant points when completed and not yet granted
  if (newStatus === OrderStatus.COMPLETED && order.customer) {
    // Check if points already granted
    const existingEarned = await PointLedger.findOne({ order: order._id, type: PointTransactionType.EARNED });
    if (!existingEarned) {
      const finalTotalNumber = parseFloat(order.finalTotal?.toString() || order.totalAmount.toString());
      const earnedPoints = Math.floor(finalTotalNumber / 100000);
      if (earnedPoints > 0) {
        await User.findByIdAndUpdate(order.customer, { $inc: { points: earnedPoints } });
        await PointLedger.create({
          user: order.customer,
          order: order._id,
          amount: earnedPoints,
          type: PointTransactionType.EARNED,
          description: `Tích điểm từ đơn hàng ${order.orderCode}`
        });
      }
    }
  }

  return order.save();
};

export const assertOrderAccess = (
  order: IOrder,
  userId: string,
  role: string
): void => {
  if (role === 'CUSTOMER') {
    const customer = order.customer;
    const customerId = (customer as any)?._id?.toString() || (customer as any)?.toString();
    if (!customerId || customerId !== userId) {
      throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
    }
  }
};

/**
 * Fallback cancel flow for MongoDB installations without replica sets.
 */
export const cancelOrderWithoutTransaction = async (
  orderId: string,
  reason: string,
  cancelledById: string
): Promise<IOrder> => {
  // Atomic update to prevent race conditions (double cancellation)
  const order = await Order.findOneAndUpdate(
    { 
      _id: orderId, 
      status: { $in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] } 
    },
    {
      $set: { status: OrderStatus.CANCELLED },
      $push: { 
        statusHistory: { 
          status: OrderStatus.CANCELLED, 
          note: reason, 
          changedBy: cancelledById as any 
        } 
      }
    },
    { new: true }
  ).populate('items.productVariant');

  if (!order) {
    throw new AppError('Không thể hủy đơn hàng ở trạng thái này hoặc đơn hàng không tồn tại', 400);
  }

  // Hoàn trả kho (Chỉ thực hiện nếu update thành công)
  for (const item of order.items) {
    await increaseStock((item.productVariant as any)._id, item.quantity, cancelledById, reason);
  }

  return order;
};

export const confirmOrderPayment = async (
  orderId: string,
  paymentMethod: string,
  transactionId?: string,
  session?: ClientSession
): Promise<IOrder> => {
  const order = await Order.findById(orderId).session(session || null);
  if (!order) throw new Error('Không tìm thấy đơn hàng');

  order.status = OrderStatus.CONFIRMED;
  order.statusHistory.push({
    status: OrderStatus.CONFIRMED,
    note: `Payment completed via ${paymentMethod}.${transactionId ? ` Transaction ID: ${transactionId}` : ''}`,
    changedBy: null as any
  });

  // Increment soldCount since order is PAID
  await incrementOrderSoldCount(order, session);

  await order.save(session ? { session } : {});
  return order;
};

export const cancelOrder = async (
  orderId: string,
  reason: string,
  cancelledById: string,
  session?: ClientSession
): Promise<IOrder> => {
  if (session) {
    const order = await orderRepository.findByIdWithSession(orderId, session);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new Error('Không thể hủy đơn hàng ở trạng thái này');
    }

    order.status = OrderStatus.CANCELLED;
    order.statusHistory.push({ status: OrderStatus.CANCELLED, note: reason, changedBy: cancelledById as any });
    await order.save({ session });

    // Hoàn trả kho
    for (const item of order.items) {
      await increaseStock((item.productVariant as any)._id, item.quantity, cancelledById, reason, session);
    }

    return order;
  }

  let newSession: ClientSession | undefined;
  try {
    newSession = await mongoose.startSession();
    newSession.startTransaction();
  } catch (sessionErr: any) {
    console.warn('⚠️ Standard MongoDB without replica set, bypassing session creation in cancelOrder:', sessionErr.message);
    return cancelOrderWithoutTransaction(orderId, reason, cancelledById);
  }

  try {
    const order = await orderRepository.findByIdWithSession(orderId, newSession);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new Error('Không thể hủy đơn hàng ở trạng thái này');
    }

    order.status = OrderStatus.CANCELLED;
    order.statusHistory.push({ status: OrderStatus.CANCELLED, note: reason, changedBy: cancelledById as any });
    await order.save({ session: newSession });

    // Hoàn trả kho
    for (const item of order.items) {
      await increaseStock((item.productVariant as any)._id, item.quantity, cancelledById, reason, newSession);
    }

    await newSession.commitTransaction();
    return order;
  } catch (err: any) {
    if (newSession) {
      try {
        await newSession.abortTransaction();
      } catch (abortErr) {
        // ignore
      }
    }
    const isTransactionError = err.message?.includes('replica set') || err.message?.includes('Transaction numbers');
    if (isTransactionError) {
      console.warn('⚠️ Replica set transaction error caught in cancelOrder. Falling back...');
      if (newSession) newSession.endSession();
      return cancelOrderWithoutTransaction(orderId, reason, cancelledById);
    }
    throw err;
  } finally {
    if (newSession) newSession.endSession();
  }
};

export const getAttentionOrders = (limit = 5) => orderRepository.getAttentionOrders(limit);

export const getAttentionOrdersCount = () => orderRepository.getAttentionOrdersCount();

export interface PaginatedOrders {
  items: IOrder[] | AdminOrderListItemDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary?: OrdersSummaryDto;
}

export const getOrders = async ({
  customerId,
  status,
  statusGroup,
  orderType,
  search,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
  paymentStatus,
  includeSummary = false,
}: GetOrdersParams = {}): Promise<PaginatedOrders> => {
  let filter = orderRepository.buildOrdersFilter({
    customerId,
    status,
    statusGroup,
    orderType,
    search,
    dateFrom,
    dateTo,
  });

  if (paymentStatus) {
    const matchingOrderIds = await getOrderIdsByPaymentStatus(paymentStatus);
    filter = {
      ...filter,
      _id: {
        $in: matchingOrderIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const [rawItems, total, summary] = await Promise.all([
    orderRepository.findOrders(filter, safePage, safeLimit),
    orderRepository.countOrders(filter),
    includeSummary ? orderRepository.computeOrdersSummary(filter) : Promise.resolve(undefined),
  ]);

  const orderIds = (rawItems as IOrder[]).map((o) => String((o as any)._id));
  const payments = await getPaymentsByOrderIds(orderIds);
  const paymentByOrderId = new Map<string, Record<string, unknown>>();
  for (const payment of payments) {
    const oid = payment.order?.toString();
    if (oid && !paymentByOrderId.has(oid)) {
      paymentByOrderId.set(oid, payment.toObject() as Record<string, unknown>);
    }
  }

  const items = (rawItems as IOrder[]).map((order) =>
    mapOrderToAdminListItem(
      order as unknown as Record<string, unknown>,
      paymentByOrderId.get(String((order as any)._id)) ?? null
    )
  );

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.ceil(total / safeLimit) || 1,
    ...(summary ? { summary } : {}),
  };
};

export interface AdminOrderItemInput {
  variantId: string;
  quantity: number;
}

export interface AdminOrderRecipientInput {
  fullName: string;
  phone: string;
  deliveryNote?: string;
}

export interface AdminPreviewOrderParams {
  customerId: string;
  items: AdminOrderItemInput[];
  voucherCode?: string;
  pointsToUse?: number;
}

export interface AdminCreateOrderParams extends AdminPreviewOrderParams {
  recipientInfo: AdminOrderRecipientInput;
  deliveryAddressId?: string;
  orderType?: OrderType;
  paymentMethod: PlaceOrderParams['paymentMethod'];
  note?: string;
}

const computeSubtotalFromCart = async (cartId: string): Promise<number> => {
  const cart = await Cart.findById(cartId).populate('items.productVariant');
  if (!cart || cart.items.length === 0) {
    throw new AppError('Giỏ hàng trống', 400);
  }

  let subtotal = 0;
  for (const item of cart.items) {
    const variant = item.productVariant as { price?: unknown } | null;
    if (!variant?.price) {
      throw new AppError('Không tìm thấy biến thể sản phẩm', 400);
    }
    subtotal += Number(variant.price) * item.quantity;
  }
  return subtotal;
};

export const previewAdminOrder = async ({
  customerId,
  items,
  voucherCode,
  pointsToUse,
}: AdminPreviewOrderParams) => {
  const cart = await syncCart(customerId, items);
  const subtotal = await computeSubtotalFromCart(String(cart._id));
  return calculateOrderTotal({
    subTotal: subtotal,
    voucherCode,
    pointsToUse: pointsToUse || 0,
    userId: customerId,
  });
};

export const createAdminOrder = async (
  params: AdminCreateOrderParams,
  adminUserId: string
): Promise<IOrder> => {
  const cart = await syncCart(params.customerId, params.items);
  const order = await placeOrder({
    customerId: params.customerId,
    cartId: String(cart._id),
    recipientInfo: {
      fullName: params.recipientInfo.fullName,
      phone: params.recipientInfo.phone,
      deliveryNote: params.recipientInfo.deliveryNote ?? '',
    },
    deliveryAddressId: params.deliveryAddressId,
    orderType: params.orderType ?? OrderType.AT_STORE,
    voucherCode: params.voucherCode,
    pointsToUse: params.pointsToUse,
    paymentMethod: params.paymentMethod,
    note: params.note,
  });

  const updated = await Order.findByIdAndUpdate(
    order._id,
    {
      handledBy: adminUserId,
      $push: {
        statusHistory: {
          status: order.status,
          note: 'Đơn tạo bởi admin',
          changedBy: adminUserId,
        },
      },
    },
    { new: true }
  );

  return updated ?? order;
};

export const getOrderById = (orderId: string): Promise<IOrder | null> =>
  orderRepository.findById(orderId);

export interface CustomerOrderStatusLookup {
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  recipientName: string;
}

export const getCustomerOrderStatusByCode = async (
  customerId: string,
  orderCode: string
): Promise<CustomerOrderStatusLookup | null> => {
  const normalizedCode = orderCode.trim();
  if (!normalizedCode) {
    throw new AppError('Mã đơn hàng không hợp lệ', 400);
  }

  const baseFilter = {
    customer: customerId,
    isDeleted: { $ne: true },
  };

  const order = await Order.findOne({
    ...baseFilter,
    orderCode: normalizedCode,
  })
    .select('orderCode status paymentStatus createdAt updatedAt recipient')
    .lean() || await Order.findOne({
    ...baseFilter,
    orderCode: normalizedCode.toUpperCase(),
  })
    .select('orderCode status paymentStatus createdAt updatedAt recipient')
    .lean();

  if (!order) return null;

  return {
    orderId: String(order._id),
    orderCode: String(order.orderCode),
    status: order.status as OrderStatus,
    paymentStatus: String(order.paymentStatus),
    createdAt: new Date(order.createdAt as string | Date).toISOString(),
    updatedAt: new Date(order.updatedAt as string | Date).toISOString(),
    recipientName: String((order.recipient as { fullName?: string } | undefined)?.fullName ?? ''),
  };
};

const decimalToNumber = (value: any): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && value !== null && '$numberDecimal' in value) {
    return parseFloat((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return parseFloat(String(value)) || 0;
};

export const canTransitionOrderStatus = (role: string, current: OrderStatus, next: OrderStatus): boolean => {
  if (role === 'ADMIN') return true;
  if (role === 'SALES') {
    if (current === OrderStatus.PENDING && (next === OrderStatus.CONFIRMED || next === OrderStatus.CANCELLED)) return true;
    if (current === OrderStatus.CONFIRMED && next === OrderStatus.CANCELLED) return true;
    return false;
  }
  if (role === 'STORE_STAFF') {
    if (current === OrderStatus.CONFIRMED && next === OrderStatus.READY) return true;
    if (current === OrderStatus.READY && next === OrderStatus.DELIVERING) return true;
    if (current === OrderStatus.DELIVERING && next === OrderStatus.COMPLETED) return true;
    return false;
  }
  return false;
};

export const toStaffOrderDto = (order: any, role: string) => {
  const orderObj = typeof order.toObject === 'function' ? order.toObject() : order;
  const id = String(orderObj._id || orderObj.id);

  const statusHistory = (orderObj.statusHistory || []).map((h: any) => ({
    status: h.status,
    note: h.note,
    timestamp: h.timestamp,
    changedBy: h.changedBy ? {
      id: String(h.changedBy._id || h.changedBy),
      fullName: h.changedBy.fullName || undefined
    } : null
  }));

  const customer = orderObj.customer ? {
    id: String(orderObj.customer._id || orderObj.customer),
    email: orderObj.customer.email,
    fullName: orderObj.customer.fullName,
  } : null;

  if (role === 'STORE_STAFF') {
    return {
      id,
      orderCode: orderObj.orderCode,
      status: orderObj.status,
      orderType: orderObj.orderType,
      customer,
      recipient: {
        fullName: orderObj.recipient?.fullName,
        phone: orderObj.recipient?.phone,
        deliveryNote: orderObj.recipient?.deliveryNote,
      },
      deliveryAddress: orderObj.deliveryAddress,
      items: (orderObj.items || []).map((item: any) => ({
        productVariant: item.productVariant ? {
          id: String(item.productVariant._id || item.productVariant),
          sku: item.productVariant.sku,
          sizeName: item.productVariant.sizeName,
        } : null,
        quantity: item.quantity,
        snapshotName: item.snapshotName,
      })),
      statusHistory,
      createdAt: orderObj.createdAt,
      updatedAt: orderObj.updatedAt,
    };
  }

  const items = (orderObj.items || []).map((item: any) => ({
    productVariant: item.productVariant ? {
      id: String(item.productVariant._id || item.productVariant),
      sku: item.productVariant.sku,
      sizeName: item.productVariant.sizeName,
      price: decimalToNumber(item.productVariant.price),
    } : null,
    quantity: item.quantity,
    snapshotName: item.snapshotName,
    unitPrice: decimalToNumber(item.unitPrice),
    subtotal: decimalToNumber(item.subtotal),
  }));

  return {
    id,
    orderCode: orderObj.orderCode,
    status: orderObj.status,
    orderType: orderObj.orderType,
    customer,
    recipient: {
      fullName: orderObj.recipient?.fullName,
      phone: orderObj.recipient?.phone,
      deliveryNote: orderObj.recipient?.deliveryNote,
    },
    deliveryAddress: orderObj.deliveryAddress,
    items,
    statusHistory,
    subtotal: decimalToNumber(orderObj.subtotal),
    shippingFee: decimalToNumber(orderObj.shippingFee),
    discountAmount: decimalToNumber(orderObj.discountAmount),
    totalAmount: decimalToNumber(orderObj.totalAmount),
    note: orderObj.note,
    createdAt: orderObj.createdAt,
    updatedAt: orderObj.updatedAt,
  };
};

export const softDeleteOrder = async (orderId: string): Promise<IOrder | null> => {
  return Order.findByIdAndUpdate(
    orderId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
};
