import mongoose, { Schema, Document, Types } from 'mongoose';
import ProductStatus from '../../../shared/enums/ProductStatus.js';

export interface IMinifiedVariant {
  variantId: Types.ObjectId;
  sizeName: string;
  price: Types.Decimal128;
  inStock: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  mainImageUrl: string;
  status: ProductStatus;
  category: Types.ObjectId;
  tags: Types.ObjectId[];
  minifiedVariants: IMinifiedVariant[];
  reviewStats: {
    averageRating: number;
    totalReviews: number;
  };
  views: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const minifiedVariantSchema = new Schema<IMinifiedVariant>({
  variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  sizeName: { type: String, required: true },
  price: { type: Schema.Types.Decimal128, required: true },
  inStock: { type: Boolean, default: true },
}, { _id: false });

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    mainImageUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.DRAFT,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    minifiedVariants: [minifiedVariantSchema],
    reviewStats: {
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    views: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
