import { ClientSession } from 'mongoose';
import Payment, { IPayment, MOPayment, CODPayment, CashPayment, VNPayPayment } from '../models/Payment.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';
import OrderPaymentStatus from '../../../shared/enums/OrderPaymentStatus.js';
import { eventBus, AppEvent } from '../../../shared/utils/eventBus.js';
import { PaymentStrategyFactory } from './strategies/PaymentStrategyFactory.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../../order/models/Order.js';

interface CreatePaymentRecordParams {
  orderId: string;
  amount: number | string;
  paymentMethod: 'MOMO' | 'COD' | 'CASH' | 'VNPAY';
  session?: ClientSession;
}

/**
 * Called by order.service.ts in an ACID transaction
 */
export const createPaymentRecord = async ({
  orderId,
  amount,
  paymentMethod,
  session,
}: CreatePaymentRecordParams): Promise<IPayment> => {
  const ModelMap: Record<string, any> = { MOMO: MOPayment, VNPAY: VNPayPayment, COD: CODPayment, CASH: CashPayment };
  const Model = ModelMap[paymentMethod] ?? Payment;

  const [payment] = await Model.create(
    [{ order: orderId, amount, status: PaymentStatus.PENDING }],
    session ? { session } : {}
  );
  return payment as IPayment;
};

/**
 * Initiates the payment process using Strategy + Factory pattern
 */
export const processPayment = async (paymentId: string, extraData?: any) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error(`Payment record not found: ${paymentId}`);
  }

  // Get strategy from Factory
  const strategy = PaymentStrategyFactory.getStrategy(payment.method);

  // Delegate process to Strategy
  const result = await strategy.processPayment(payment, extraData);
  return result;
};

/**
 * Fallback handler for webhook processing without transactions
 */
const handleWebhookWithoutTransaction = async (payment: any, paymentMethod: string, status: string, transactionId?: string) => {
  payment.status = status as PaymentStatus;
  payment.transactionId = transactionId || null;
  await payment.save();
  const order = await Order.findById(payment.order).select('customer');
  const customerId = order?.customer ? order.customer.toString() : undefined;

  if (status === PaymentStatus.SUCCESS) {
    await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
      eventId: crypto.randomUUID(),
      occurredAt: new Date(),
      entityId: payment.order.toString(),
      actorId: customerId,
      customerId,
      orderId: payment.order.toString(),
      paymentId: payment._id.toString(),
      paymentMethod,
      transactionId,
    });
  } else if (status === PaymentStatus.FAILED) {
    await eventBus.emitAsync(AppEvent.PAYMENT_FAILED, {
      eventId: crypto.randomUUID(),
      occurredAt: new Date(),
      entityId: payment.order.toString(),
      actorId: customerId,
      customerId,
      orderId: payment.order.toString(),
      paymentId: payment._id.toString(),
      paymentMethod,
      reason: `Payment failed via ${paymentMethod}.`,
    });
  }
  return payment;
};

/**
 * Handles server-to-server webhook callback (e.g. from MoMo)
 */
export const handleWebhook = async (paymentMethod: string, payload: any) => {
  const { paymentId } = payload;
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error(`Payment record not found for webhook: ${paymentId}`);
  }
  const order = await Order.findById(payment.order).select('customer');
  const customerId = order?.customer ? order.customer.toString() : undefined;

  const strategy = PaymentStrategyFactory.getStrategy(paymentMethod);
  const { status, transactionId } = await strategy.handleWebhook(payment, payload);

  let session: ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessionErr: any) {
    console.warn('⚠️ Standard MongoDB without replica set, bypassing session creation in handleWebhook:', sessionErr.message);
  }

  if (session) {
    try {
      // 1. Update Payment status
      payment.status = status as PaymentStatus;
      payment.transactionId = transactionId || null;
      await payment.save({ session });

      // 2. Emit event inside the transaction session
      if (status === PaymentStatus.SUCCESS) {
        await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
          eventId: crypto.randomUUID(),
          occurredAt: new Date(),
          entityId: payment.order.toString(),
          actorId: customerId,
          customerId,
          orderId: payment.order.toString(),
          paymentId: payment._id.toString(),
          paymentMethod,
          transactionId,
          session,
        });
      } else if (status === PaymentStatus.FAILED) {
        await eventBus.emitAsync(AppEvent.PAYMENT_FAILED, {
          eventId: crypto.randomUUID(),
          occurredAt: new Date(),
          entityId: payment.order.toString(),
          actorId: customerId,
          customerId,
          orderId: payment.order.toString(),
          paymentId: payment._id.toString(),
          paymentMethod,
          reason: `Payment failed via ${paymentMethod}.`,
          session,
        });
      }

      await session.commitTransaction();
      return payment;
    } catch (error: any) {
      await session.abortTransaction();
      const isTransactionError = error.message?.includes('replica set') || error.message?.includes('Transaction numbers');
      if (isTransactionError) {
        console.warn('⚠️ Replica set transaction error caught in handleWebhook. Falling back...');
        session.endSession();
        return handleWebhookWithoutTransaction(payment, paymentMethod, status, transactionId);
      }
      throw error;
    } finally {
      if (session && session.inTransaction()) {
        session.endSession();
      }
    }
  } else {
    return handleWebhookWithoutTransaction(payment, paymentMethod, status, transactionId);
  }
};

export const confirmPayment = async (paymentId: string, transactionId: string): Promise<IPayment | null> => {
  return Payment.findByIdAndUpdate(
    paymentId,
    { status: PaymentStatus.SUCCESS, transactionId },
    { new: true }
  );
};

export const getPaymentsByOrder = async (orderId: string): Promise<IPayment[]> => {
  return Payment.find({ order: orderId });
};

export const getPaymentsByOrderIds = async (orderIds: string[]): Promise<IPayment[]> => {
  if (orderIds.length === 0) return [];
  return Payment.find({ order: { $in: orderIds } }).sort({ createdAt: -1 });
};

/** Order IDs whose latest payment record matches the given status. */
export const getOrderIdsByPaymentStatus = async (status: string): Promise<string[]> => {
  const payments = await Payment.find({ status })
    .select('order createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const seen = new Set<string>();
  const orderIds: string[] = [];
  for (const payment of payments) {
    const orderId = String(payment.order);
    if (!seen.has(orderId)) {
      seen.add(orderId);
      orderIds.push(orderId);
    }
  }
  return orderIds;
};

interface ConfirmManualPaymentParams {
  orderId: string;
  paymentMethod?: 'MOMO' | 'COD' | 'CASH' | 'VNPAY';
  note?: string;
  actorId: string;
}

export const confirmManualPaymentByOrder = async ({
  orderId,
  paymentMethod = 'CASH',
  note,
  actorId,
}: ConfirmManualPaymentParams): Promise<IPayment> => {
  const persistManualPayment = async (session?: ClientSession) => {
    const orderQuery = Order.findById(orderId).select('customer status finalTotal totalAmount');
    const order = session ? await orderQuery.session(session) : await orderQuery;
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    let payment: any = await Payment.findOne({
      order: orderId,
      status: { $ne: PaymentStatus.SUCCESS },
    })
      .sort({ createdAt: -1 })
      .session(session || null);

    if (!payment) {
      payment = await createPaymentRecord({
        orderId,
        amount: (order as any).finalTotal || (order as any).totalAmount || 0,
        paymentMethod,
        session,
      });
    }

    payment.status = PaymentStatus.SUCCESS;
    payment.transactionId = `MANUAL-${Date.now()}`;
    await payment.save(session ? { session } : {});

    await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: OrderPaymentStatus.PAID,
        $push: {
          statusHistory: {
            status: order.status,
            note: note || 'Xác nhận thanh toán thủ công',
            changedBy: actorId,
          },
        },
      },
      session ? { session } : {}
    );

    return { order, payment };
  };

  let session: ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessionErr: any) {
    console.warn('⚠️ Standard MongoDB without replica set, bypassing session creation in confirmManualPaymentByOrder:', sessionErr.message);
  }

  if (session) {
    try {
      const { order, payment } = await persistManualPayment(session);
      const customerId = order.customer ? order.customer.toString() : undefined;
      await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
        eventId: crypto.randomUUID(),
        occurredAt: new Date(),
        entityId: orderId,
        actorId,
        customerId,
        orderId,
        paymentId: payment._id.toString(),
        paymentMethod: payment.method || paymentMethod,
        transactionId: payment.transactionId || undefined,
        session,
      });
      await session.commitTransaction();
      return payment as IPayment;
    } catch (error: any) {
      await session.abortTransaction();
      const isTransactionError = error.message?.includes('replica set') || error.message?.includes('Transaction numbers');
      if (isTransactionError) {
        console.warn('⚠️ Replica set transaction error caught in confirmManualPaymentByOrder. Falling back...');
        session.endSession();
        session = undefined;
        const { order, payment } = await persistManualPayment();
        const customerId = order.customer ? order.customer.toString() : undefined;
        await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
          eventId: crypto.randomUUID(),
          occurredAt: new Date(),
          entityId: orderId,
          actorId,
          customerId,
          orderId,
          paymentId: payment._id.toString(),
          paymentMethod: payment.method || paymentMethod,
          transactionId: payment.transactionId || undefined,
        });
        return payment as IPayment;
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  const { order, payment } = await persistManualPayment();
  const customerId = order.customer ? order.customer.toString() : undefined;
  await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
    eventId: crypto.randomUUID(),
    occurredAt: new Date(),
    entityId: orderId,
    actorId,
    customerId,
    orderId,
    paymentId: payment._id.toString(),
    paymentMethod: payment.method || paymentMethod,
    transactionId: payment.transactionId || undefined,
  });
  return payment as IPayment;
};
