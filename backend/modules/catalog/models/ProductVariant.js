import mongoose from 'mongoose';
import StockStatus from '../../../shared/enums/StockStatus.js';

/**
 * ProductVariant – một biến thể (SKU) của sản phẩm (theo size, màu, ...).
 * Kho hàng (StockLevel) sẽ tham chiếu tới ProductVariant._id.
 */
const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { type: String, required: true, unique: true, trim: true },
    sizeName: { type: String, trim: true }, // S, M, L, XL, ...
    price: { type: mongoose.Types.Decimal128, required: true },
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

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
export default ProductVariant;
