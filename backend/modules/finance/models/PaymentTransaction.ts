import mongoose, { Document, Schema, Types } from 'mongoose';

export enum PaymentProvider {
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
}

export enum PaymentTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface IPaymentTransaction extends Document {
  orderId: Types.ObjectId;
  provider: PaymentProvider;
  transactionRef: string;
  providerTransactionId: string | null;
  amount: Types.Decimal128;
  status: PaymentTransactionStatus;
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  callbackPayload: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    provider: {
      type: String,
      enum: Object.values(PaymentProvider),
      required: true,
      index: true,
    },
    transactionRef: { type: String, required: true, unique: true, trim: true },
    providerTransactionId: { type: String, default: null },
    amount: { type: Schema.Types.Decimal128, required: true },
    status: {
      type: String,
      enum: Object.values(PaymentTransactionStatus),
      default: PaymentTransactionStatus.PENDING,
      index: true,
    },
    requestPayload: { type: Schema.Types.Mixed, default: null },
    responsePayload: { type: Schema.Types.Mixed, default: null },
    callbackPayload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

paymentTransactionSchema.index(
  { orderId: 1, provider: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: PaymentTransactionStatus.PENDING },
    name: 'uniq_pending_transaction_per_order_provider',
  }
);
paymentTransactionSchema.index({ orderId: 1, createdAt: -1 });
paymentTransactionSchema.index({ provider: 1, createdAt: -1 });

const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;
