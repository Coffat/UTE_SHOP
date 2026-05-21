import { ClientSession } from 'mongoose';
import Payment, { IPayment, MOPayment, CODPayment, CashPayment } from '../models/Payment.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
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
    await mongoose.model('Order').findByIdAndUpdate(
      payment.order,
      {
        status: OrderStatus.CONFIRMED,
        $push: {
          statusHistory: {
            status: OrderStatus.CONFIRMED,
            note: `Payment completed via ${paymentMethod}. Transaction ID: ${transactionId}`,
            timestamp: new Date(),
          },
        },
      }
    );
  } else if (status === PaymentStatus.FAILED) {
    await mongoose.model('Order').findByIdAndUpdate(
      payment.order,
      {
        status: OrderStatus.CANCELLED,
        $push: {
          statusHistory: {
            status: OrderStatus.CANCELLED,
            note: `Payment failed via ${paymentMethod}.`,
            timestamp: new Date(),
          },
        },
      }
    );
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

      // 2. Update associated Order status directly to prevent circular dependency imports
      if (status === PaymentStatus.SUCCESS) {
        await mongoose.model('Order').findByIdAndUpdate(
          payment.order,
          {
            status: OrderStatus.CONFIRMED,
            $push: {
              statusHistory: {
                status: OrderStatus.CONFIRMED,
                note: `Payment completed via ${paymentMethod}. Transaction ID: ${transactionId}`,
                timestamp: new Date(),
              },
            },
          },
          { session }
        );
      } else if (status === PaymentStatus.FAILED) {
        await mongoose.model('Order').findByIdAndUpdate(
          payment.order,
          {
            status: OrderStatus.CANCELLED,
            $push: {
              statusHistory: {
                status: OrderStatus.CANCELLED,
                note: `Payment failed via ${paymentMethod}.`,
                timestamp: new Date(),
              },
            },
          },
          { session }
        );
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
