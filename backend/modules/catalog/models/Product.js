import mongoose from 'mongoose';
import ProductStatus from '../../../shared/enums/ProductStatus.js';

const minifiedVariantSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  sizeName: { type: String, required: true },
  price: { type: mongoose.Types.Decimal128, required: true },
  inStock: { type: Boolean, default: true },
}, { _id: false });

const productSchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    minifiedVariants: [minifiedVariantSchema],
    reviewStats: {
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
