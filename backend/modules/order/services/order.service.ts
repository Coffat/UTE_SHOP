import mongoose, { ClientSession } from 'mongoose';
import Order, { IOrder } from '../models/Order.js';
import Cart, { ICart } from '../models/Cart.js';
import Product from '../../catalog/models/Product.js';

// ─── Cross-module imports (gọi SERVICE, không import MODEL) ───────────────────
import { decreaseStock, increaseStock } from '../../inventory/services/stock.service.js';
import { validateAndCalculateVoucher, markVoucherUsed } from '../../marketing/services/voucher.service.js';
import { createPaymentRecord } from '../../finance/services/payment.service.js';
// ─────────────────────────────────────────────────────────────────────────────

import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';

const generateOrderCode = () => `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getOrCreateCart = async (customerId?: string, sessionId?: string): Promise<ICart> => {
  const filter = customerId ? { customer: customerId } : { sessionId };
  let cart = await Cart.findOne({ ...filter, status: 'ACTIVE' }).populate('items.productVariant');
  if (!cart) {
    cart = await Cart.create({ ...filter, items: [] });
  }
  return cart;
};

export const addToCart = async (cartId: string, variantId: string, quantity: number): Promise<ICart> => {
  const cart = await Cart.findById(cartId);
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
  return Cart.findByIdAndUpdate(cartId, { $pull: { items: { productVariant: variantId } } }, { new: true });
};

// ─── Place Order (ACID Transaction) ──────────────────────────────────────────

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
  paymentMethod: 'MOMO' | 'COD' | 'CASH';
  note?: string;
}

export const placeOrder = async ({
  customerId,
  cartId,
  recipientInfo,
  deliveryAddressId,
  orderType = OrderType.ONLINE,
  voucherCode,
  paymentMethod,
  note,
}: PlaceOrderParams): Promise<IOrder> => {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    // ── STEP 1: Áp voucher (marketing.service) ────────────────────────────────
    let discountAmount = 0;
    let voucherId: string | null = null;
    if (voucherCode) {
      const { discountAmount: disc, voucher } = await validateAndCalculateVoucher(voucherCode, subtotal);
      discountAmount = disc;
      voucherId = (voucher._id as mongoose.Types.ObjectId).toString();
    }

    const shippingFee = orderType === OrderType.ONLINE ? 30000 : 0;
    const totalAmount = subtotal + shippingFee - discountAmount;

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
          subtotal: mongoose.Types.Decimal128.fromString(subtotal.toString()) as any,
          shippingFee: mongoose.Types.Decimal128.fromString(shippingFee.toString()) as any,
          discountAmount: mongoose.Types.Decimal128.fromString(discountAmount.toString()) as any,
          totalAmount: mongoose.Types.Decimal128.fromString(totalAmount.toString()) as any,
          voucher: voucherId,
          note: note || '',
          statusHistory: [{ status: OrderStatus.PENDING, note: 'Order placed' }],
        },
      ],
      { session }
    );

    // ── STEP 3: Trừ kho (inventory.service) ──────────────────────────────────
    for (const item of cart.items) {
      await decreaseStock((item.productVariant as any)._id, item.quantity, customerId || 'GUEST', session);
      await Product.findByIdAndUpdate(
        (item.productVariant as any).product,
        { $inc: { soldCount: item.quantity } },
        { session }
      );
    }

    // ── STEP 4: Tạo Payment record (finance.service) ──────────────────────────
    await createPaymentRecord({ orderId: (order._id as mongoose.Types.ObjectId).toString(), amount: totalAmount, paymentMethod, session });

    // ── STEP 5: Mark voucher used ─────────────────────────────────────────────
    if (voucherId) await markVoucherUsed(voucherId, session);

    // ── STEP 6: Convert cart ──────────────────────────────────────────────────
    await Cart.findByIdAndUpdate(cartId, { status: 'CONVERTED' }, { session });

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Thay đổi trạng thái Order ───────────────────────────────────────────────

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
  note: string,
  changedById?: string
): Promise<IOrder> => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng');

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, note, changedBy: changedById as any });
  return order.save();
};

export const cancelOrder = async (
  orderId: string,
  reason: string,
  cancelledById: string
): Promise<IOrder> => {
  const order = await Order.findById(orderId).populate('items.productVariant');
  if (!order) throw new Error('Không tìm thấy đơn hàng');

  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
    throw new Error('Không thể hủy đơn hàng ở trạng thái này');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    order.status = OrderStatus.CANCELLED;
    order.statusHistory.push({ status: OrderStatus.CANCELLED, note: reason, changedBy: cancelledById as any });
    await order.save({ session });

    // Hoàn trả kho
    for (const item of order.items) {
      await increaseStock((item.productVariant as any)._id, item.quantity, cancelledById, reason, session);
    }

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

interface GetOrdersParams {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  items: IOrder[];
  total: number;
  page: number;
  limit: number;
}

export const getOrders = async ({
  customerId,
  status,
  page = 1,
  limit = 20
}: GetOrdersParams = {}): Promise<PaginatedOrders> => {
  const filter: Record<string, any> = {};
  if (customerId) filter.customer = customerId;
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'email fullName')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const getOrderById = async (orderId: string): Promise<IOrder | null> => {
  return Order.findById(orderId)
    .populate('items.productVariant', 'sku sizeName price')
    .populate('customer', 'email fullName');
};
