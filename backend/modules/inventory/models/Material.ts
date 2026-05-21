import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMaterial extends Document {
  name: string;
  unit: string;
  costPerUnit: Types.Decimal128;
  shelfLifeDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new Schema<IMaterial>(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    costPerUnit: { type: Schema.Types.Decimal128, required: true },
    shelfLifeDays: { type: Number, default: null },
  },
  { timestamps: true }
);

const Material = mongoose.model<IMaterial>('Material', materialSchema);
export default Material;
