import mongoose, { Schema, Document, Types } from 'mongoose';
import RefundStatus from '../../../shared/enums/RefundStatus.js';

export interface IRefund extends Document {
  payment: Types.ObjectId;
  order: Types.ObjectId;
  amount: Types.Decimal128;
  reason: string;
  status: RefundStatus;
  approvedBy: Types.ObjectId | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: Object.values(RefundStatus), default: RefundStatus.PENDING },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Refund = mongoose.model<IRefund>('Refund', refundSchema);
export default Refund;
