import mongoose, { Schema, Document, Types } from 'mongoose';

export enum PointTransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUNDED = 'REFUNDED',
}

export interface IPointLedger extends Document {
  user: Types.ObjectId;
  order?: Types.ObjectId | null;
  amount: number;
  type: PointTransactionType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const pointLedgerSchema = new Schema<IPointLedger>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    amount: { type: Number, required: true },
    type: { type: String, enum: Object.values(PointTransactionType), required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes for query performance
pointLedgerSchema.index({ user: 1, createdAt: -1 });

const PointLedger = mongoose.model<IPointLedger>('PointLedger', pointLedgerSchema);
export default PointLedger;
