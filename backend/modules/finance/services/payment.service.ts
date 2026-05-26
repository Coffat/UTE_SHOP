import { ClientSession } from 'mongoose';
import Payment, { IPayment, MOPayment, CODPayment, CashPayment } from '../models/Payment.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';
import { eventBus, AppEvent } from '../../../shared/utils/eventBus.js';
import { PaymentStrategyFactory } from './strategies/PaymentStrategyFactory.js';
import mongoose from 'mongoose';

interface CreatePaymentRecordParams {
  orderId: string;
  amount: number | string;
  paymentMethod: 'MOMO' | 'COD' | 'CASH';
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
  const ModelMap: Record<string, any> = { MOMO: MOPayment, COD: CODPayment, CASH: CashPayment };
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

  if (status === PaymentStatus.SUCCESS) {
    await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
      orderId: payment.order.toString(),
      paymentId: payment._id.toString(),
      paymentMethod,
      transactionId,
    });
  } else if (status === PaymentStatus.FAILED) {
    await eventBus.emitAsync(AppEvent.PAYMENT_FAILED, {
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
          orderId: payment.order.toString(),
          paymentId: payment._id.toString(),
          paymentMethod,
          transactionId,
          session,
        });
      } else if (status === PaymentStatus.FAILED) {
        await eventBus.emitAsync(AppEvent.PAYMENT_FAILED, {
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
