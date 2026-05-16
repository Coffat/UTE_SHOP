import mongoose from 'mongoose';
import DisputeStatus from '../../../shared/enums/DisputeStatus.js';

const disputeSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    status: { type: String, enum: Object.values(DisputeStatus), default: DisputeStatus.OPEN },
    resolution: { type: String, default: '' },
    evidenceUrls: [{ type: String }],
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // SALES hoặc ADMIN
  },
  { timestamps: true }
);

const Dispute = mongoose.model('Dispute', disputeSchema);
export default Dispute;
