import Payment, { MOPayment, CODPayment, CashPayment } from '../models/Payment.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';

/**
 * ⚡ Được gọi bởi order.service.js trong ACID transaction (Cross-Module Communication)
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {number} params.amount
 * @param {'MOMO'|'COD'|'CASH'} params.paymentMethod
 * @param {ClientSession} params.session
 */
export const createPaymentRecord = async ({ orderId, amount, paymentMethod, session }) => {
  const ModelMap = { MOMO: MOPayment, COD: CODPayment, CASH: CashPayment };
  const Model = ModelMap[paymentMethod] ?? Payment;

  const [payment] = await Model.create(
    [{ order: orderId, amount, status: PaymentStatus.PENDING }],
    { session }
  );
  return payment;
};

export const confirmPayment = async (paymentId, transactionId) => {
  return Payment.findByIdAndUpdate(
    paymentId,
    { status: PaymentStatus.SUCCESS, transactionId },
    { new: true }
  );
};

export const getPaymentsByOrder = async (orderId) => {
  return Payment.find({ order: orderId });
};
