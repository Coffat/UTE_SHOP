import mongoose from 'mongoose';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';

/**
 * Payment – base schema với discriminatorKey = 'method'
 * Sub-models: MOPayment, CODPayment, CashPayment
 */
const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: mongoose.Types.Decimal128, required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    transactionId: { type: String, default: null },
  },
  { timestamps: true, discriminatorKey: 'method' }
);

const Payment = mongoose.model('Payment', paymentSchema);

// ─── Discriminators ───────────────────────────────────────────────────────────

export const MOPayment = Payment.discriminator(
  'MOMO',
  new mongoose.Schema({ gatewayTransactionId: { type: String, default: null } })
);

export const CODPayment = Payment.discriminator(
  'COD',
  new mongoose.Schema({ shipperNote: { type: String, default: '' } })
);

export const CashPayment = Payment.discriminator(
  'CASH',
  new mongoose.Schema({
    cashTendered: { type: mongoose.Types.Decimal128, default: 0 },
    changeDue: { type: mongoose.Types.Decimal128, default: 0 },
  })
);

export default Payment;
