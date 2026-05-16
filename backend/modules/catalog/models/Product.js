import mongoose from 'mongoose';
import ProductStatus from '../../../shared/enums/ProductStatus.js';

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
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
