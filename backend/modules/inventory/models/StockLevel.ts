import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStockLevel extends Document {
  warehouse: Types.ObjectId;
  productVariant: Types.ObjectId | null;
  material: Types.ObjectId | null;
  quantity: Types.Decimal128;
  minThreshold: Types.Decimal128;
  createdAt: Date;
  updatedAt: Date;
}

const stockLevelSchema = new Schema<IStockLevel>(
  {
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    productVariant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      default: null,
    },
    material: {
      type: Schema.Types.ObjectId,
      ref: 'Material',
      default: null,
    },
    quantity: { type: Schema.Types.Decimal128, required: true, default: 0 },
    minThreshold: { type: Schema.Types.Decimal128, default: 0 },
  },
  { timestamps: true }
);

stockLevelSchema.index({ warehouse: 1, productVariant: 1 }, { unique: true, sparse: true });
stockLevelSchema.index({ warehouse: 1, material: 1 }, { unique: true, sparse: true });

const StockLevel = mongoose.model<IStockLevel>('StockLevel', stockLevelSchema);
export default StockLevel;
