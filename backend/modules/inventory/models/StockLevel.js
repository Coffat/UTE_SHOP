import mongoose from 'mongoose';

/**
 * StockLevel – lưu số lượng tồn kho của một SKU hoặc nguyên liệu tại một kho.
 * Một trong hai: productVariant HOẶC material phải có giá trị (không đồng thời null).
 */
const stockLevelSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    productVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      default: null,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      default: null,
    },
    quantity: { type: mongoose.Types.Decimal128, required: true, default: 0 },
    minThreshold: { type: mongoose.Types.Decimal128, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Đảm bảo không duplicate SKU trong cùng một kho
stockLevelSchema.index({ warehouse: 1, productVariant: 1 }, { unique: true, sparse: true });
stockLevelSchema.index({ warehouse: 1, material: 1 }, { unique: true, sparse: true });

const StockLevel = mongoose.model('StockLevel', stockLevelSchema);
export default StockLevel;
