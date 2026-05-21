import mongoose, { Schema, Document, Types } from 'mongoose';
import StockStatus from '../../../shared/enums/StockStatus.js';

export interface IProductVariant extends Document {
  product: Types.ObjectId;
  sku: string;
  sizeName?: string;
  price: Types.Decimal128;
  stockStatus: StockStatus;
  isActive: boolean;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { type: String, required: true, unique: true, trim: true },
    sizeName: { type: String, trim: true },
    price: { type: Schema.Types.Decimal128, required: true },
    stockStatus: {
      type: String,
      enum: Object.values(StockStatus),
      default: StockStatus.IN_STOCK,
    },
    isActive: { type: Boolean, default: true },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

const ProductVariant = mongoose.model<IProductVariant>('ProductVariant', productVariantSchema);
export default ProductVariant;
