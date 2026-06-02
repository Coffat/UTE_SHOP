import mongoose, { Schema, Document, Types } from 'mongoose';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';

export interface IPayment extends Document {
  order: Types.ObjectId;
  amount: Types.Decimal128;
  status: PaymentStatus;
  transactionId: string | null;
  method: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMOPayment extends IPayment {
  gatewayTransactionId: string | null;
}

export interface IVNPayPayment extends IPayment {
  gatewayTransactionId: string | null;
}

export interface ICODPayment extends IPayment {
  shipperNote: string;
}

export interface ICashPayment extends IPayment {
  cashTendered: Types.Decimal128;
  changeDue: Types.Decimal128;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    transactionId: { type: String, default: null },
  },
  { timestamps: true, discriminatorKey: 'method' }
);

paymentSchema.index({ order: 1, createdAt: -1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export const MOPayment = Payment.discriminator<IMOPayment>(
  'MOMO',
  new Schema({ gatewayTransactionId: { type: String, default: null } })
);

export const VNPayPayment = Payment.discriminator<IVNPayPayment>(
  'VNPAY',
  new Schema({ gatewayTransactionId: { type: String, default: null } })
);

export const CODPayment = Payment.discriminator<ICODPayment>(
  'COD',
  new Schema({ shipperNote: { type: String, default: '' } })
);

export const CashPayment = Payment.discriminator<ICashPayment>(
  'CASH',
  new Schema({
    cashTendered: { type: Schema.Types.Decimal128, default: 0 },
    changeDue: { type: Schema.Types.Decimal128, default: 0 },
  })
);

export default Payment;
