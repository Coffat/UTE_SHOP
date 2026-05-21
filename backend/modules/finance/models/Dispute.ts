import mongoose, { Schema, Document, Types } from 'mongoose';
import DisputeStatus from '../../../shared/enums/DisputeStatus.js';

export interface IDispute extends Document {
  order: Types.ObjectId;
  customer: Types.ObjectId;
  description: string;
  status: DisputeStatus;
  resolution: string;
  evidenceUrls: string[];
  resolvedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<IDispute>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    status: { type: String, enum: Object.values(DisputeStatus), default: DisputeStatus.OPEN },
    resolution: { type: String, default: '' },
    evidenceUrls: [{ type: String }],
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const Dispute = mongoose.model<IDispute>('Dispute', disputeSchema);
export default Dispute;
