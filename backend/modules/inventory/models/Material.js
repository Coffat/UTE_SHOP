import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true }, // kg, lít, cái, ...
    costPerUnit: { type: mongoose.Types.Decimal128, required: true },
    shelfLifeDays: { type: Number, default: null }, // null = không có hạn
  },
  { timestamps: true }
);

const Material = mongoose.model('Material', materialSchema);
export default Material;
