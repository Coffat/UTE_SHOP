import mongoose from 'mongoose';
import RefundStatus from '../../../shared/enums/RefundStatus.js';

const refundSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: mongoose.Types.Decimal128, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: Object.values(RefundStatus), default: RefundStatus.PENDING },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
