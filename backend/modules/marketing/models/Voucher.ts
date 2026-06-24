import mongoose, { Document, Schema } from 'mongoose';
import DiscountType from '../../../shared/enums/DiscountType.js';
import './Campaign.js';

export interface IVoucher extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: mongoose.Types.Decimal128;
  maxDiscountAmount?: mongoose.Types.Decimal128 | null;
  minOrderAmount?: mongoose.Types.Decimal128;
  validUntil: Date;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  campaign?: mongoose.Types.ObjectId | null;
  customer?: mongoose.Types.ObjectId | null; // Nếu chỉ dành riêng cho 1 user
  usedBy: { userId: mongoose.Types.ObjectId; usageCount: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: Object.values(DiscountType), required: true },
    discountValue: { type: Schema.Types.Decimal128, required: true },
    maxDiscountAmount: { type: Schema.Types.Decimal128, default: null },
    minOrderAmount: { type: Schema.Types.Decimal128, default: 0 },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = vô hạn
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
    customer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    usedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        usageCount: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const Voucher = mongoose.model<IVoucher>('Voucher', voucherSchema);
export default Voucher;
