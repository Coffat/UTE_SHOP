import mongoose, { Schema, Document, Types } from 'mongoose';
import TransactionType from '../../../shared/enums/TransactionType.js';

export interface IStockTransaction extends Document {
  stockLevel: Types.ObjectId;
  type: TransactionType;
  quantity: Types.Decimal128;
  unitPrice?: Types.Decimal128;
  totalCost?: Types.Decimal128;
  reason: string;
  performedBy: Types.ObjectId;
  timestamp: Date;
}

const stockTransactionSchema = new Schema<IStockTransaction>(
  {
    stockLevel: {
      type: Schema.Types.ObjectId,
      ref: 'StockLevel',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    quantity: { type: Schema.Types.Decimal128, required: true },
    unitPrice: { type: Schema.Types.Decimal128 },
    totalCost: { type: Schema.Types.Decimal128 },
    reason: { type: String, default: '' },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const StockTransaction = mongoose.model<IStockTransaction>('StockTransaction', stockTransactionSchema);
export default StockTransaction;
