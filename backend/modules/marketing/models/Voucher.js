import mongoose from 'mongoose';
import DiscountType from '../../../shared/enums/DiscountType.js';

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: Object.values(DiscountType), required: true },
    discountValue: { type: mongoose.Types.Decimal128, required: true },
    maxDiscountAmount: { type: mongoose.Types.Decimal128, default: null },
    minOrderAmount: { type: mongoose.Types.Decimal128, default: 0 },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = vô hạn
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  },
  { timestamps: true }
);

const Voucher = mongoose.model('Voucher', voucherSchema);
export default Voucher;
