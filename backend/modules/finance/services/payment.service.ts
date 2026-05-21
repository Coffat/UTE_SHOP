import { ClientSession } from 'mongoose';
import Payment, { IPayment, MOPayment, CODPayment, CashPayment } from '../models/Payment.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';

interface CreatePaymentRecordParams {
  orderId: string;
  amount: number | string;
  paymentMethod: 'MOMO' | 'COD' | 'CASH';
  session?: ClientSession;
}

export const createPaymentRecord = async ({
  orderId,
  amount,
  paymentMethod,
  session
}: CreatePaymentRecordParams): Promise<IPayment> => {
  const ModelMap: Record<string, any> = { MOMO: MOPayment, COD: CODPayment, CASH: CashPayment };
  const Model = ModelMap[paymentMethod] ?? Payment;

  const [payment] = await Model.create(
    [{ order: orderId, amount, status: PaymentStatus.PENDING }],
    { session }
  );
  return payment as IPayment;
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
