import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress extends Document {
  customer: mongoose.Types.ObjectId;
  label?: string;
  street: string;
  city: string;
  district?: string;
  ward?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: 'Nhà', trim: true }, // Nhà, Văn phòng, ...
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    ward: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ customer: 1, createdAt: -1 });
addressSchema.index(
  { customer: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  }
);

const Address = mongoose.model<IAddress>('Address', addressSchema);
export default Address;
