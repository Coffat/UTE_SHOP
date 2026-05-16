import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import ProductVariant from '../../catalog/models/ProductVariant.js';

// ─── Cross-module imports (gọi SERVICE, không import MODEL) ───────────────────
import { decreaseStock, increaseStock } from '../../inventory/services/stock.service.js';
import { validateAndCalculateVoucher, markVoucherUsed } from '../../marketing/services/voucher.service.js';
import { createPaymentRecord } from '../../finance/services/payment.service.js';
// ─────────────────────────────────────────────────────────────────────────────

import OrderStatus from '../../../shared/enums/OrderStatus.js';
import OrderType from '../../../shared/enums/OrderType.js';

const generateOrderCode = () => `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getOrCreateCart = async (customerId, sessionId) => {
  const filter = customerId ? { customer: customerId } : { sessionId };
  let cart = await Cart.findOne({ ...filter, status: 'ACTIVE' }).populate('items.productVariant');
  if (!cart) {
    cart = await Cart.create({ ...filter, items: [] });
  }
  return cart;
};

export const addToCart = async (cartId, variantId, quantity) => {
  const cart = await Cart.findById(cartId);
  const existingItem = cart.items.find((i) => i.productVariant.toString() === variantId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productVariant: variantId, quantity });
  }
  return cart.save();
};

export const removeFromCart = async (cartId, variantId) => {
  return Cart.findByIdAndUpdate(cartId, { $pull: { items: { productVariant: variantId } } }, { new: true });
};

// ─── Place Order (ACID Transaction) ──────────────────────────────────────────
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
  paymentMethod, // 'MOMO' | 'COD' | 'CASH'
  note,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ── STEP 0: Lấy cart & tính subtotal ─────────────────────────────────────
    const cart = await Cart.findById(cartId).populate('items.productVariant').session(session);
    if (!cart || cart.items.length === 0) throw new Error('Giỏ hàng trống');

    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const price = Number(item.productVariant.price);
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      return {
        productVariant: item.productVariant._id,
        quantity: item.quantity,
        unitPrice: price,
        snapshotName: item.productVariant.sku,
        subtotal: itemSubtotal,
      };
    });

    // ── STEP 1: Áp voucher (marketing.service) ────────────────────────────────
    let discountAmount = 0;
    let voucherId = null;
    if (voucherCode) {
      const { discountAmount: disc, voucher } = await validateAndCalculateVoucher(voucherCode, subtotal);
      discountAmount = disc;
      voucherId = voucher._id;
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
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          voucher: voucherId,
          note: note || '',
          statusHistory: [{ status: OrderStatus.PENDING, note: 'Order placed' }],
        },
      ],
      { session }
    );

    // ── STEP 3: Trừ kho (inventory.service) ──────────────────────────────────
    for (const item of cart.items) {
      await decreaseStock(item.productVariant._id, item.quantity, customerId || 'GUEST', session);
    }

    // ── STEP 4: Tạo Payment record (finance.service) ──────────────────────────
    await createPaymentRecord({ orderId: order._id, amount: totalAmount, paymentMethod, session });

    // ── STEP 5: Mark voucher used ─────────────────────────────────────────────
    if (voucherId) await markVoucherUsed(voucherId, session);

    // ── STEP 6: Convert cart ──────────────────────────────────────────────────
    await Cart.findByIdAndUpdate(cartId, { status: 'CONVERTED' }, { session });

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err; // bubble lên controller → asyncHandler → 500
  } finally {
    session.endSession();
  }
};

// ─── Thay đổi trạng thái Order ───────────────────────────────────────────────

export const updateOrderStatus = async (orderId, newStatus, note, changedById) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng');

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, note, changedBy: changedById });
  return order.save();
};

export const cancelOrder = async (orderId, reason, cancelledById) => {
  const order = await Order.findById(orderId).populate('items.productVariant');
  if (!order) throw new Error('Không tìm thấy đơn hàng');

  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
    throw new Error('Không thể hủy đơn hàng ở trạng thái này');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    order.status = OrderStatus.CANCELLED;
    order.statusHistory.push({ status: OrderStatus.CANCELLED, note: reason, changedBy: cancelledById });
    await order.save({ session });

    // Hoàn trả kho
    for (const item of order.items) {
      await increaseStock(item.productVariant._id, item.quantity, cancelledById, reason, session);
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

export const getOrders = async ({ customerId, status, page = 1, limit = 20 } = {}) => {
  const filter = {};
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

export const getOrderById = async (orderId) => {
  return Order.findById(orderId)
    .populate('items.productVariant', 'sku sizeName price')
    .populate('customer', 'email fullName');
};
