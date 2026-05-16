import mongoose from 'mongoose';
import TransactionType from '../../../shared/enums/TransactionType.js';

const stockTransactionSchema = new mongoose.Schema(
  {
    stockLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockLevel',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    quantity: { type: mongoose.Types.Decimal128, required: true },
    reason: { type: String, default: '' },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // WAREHOUSE_STAFF
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
export default StockTransaction;
