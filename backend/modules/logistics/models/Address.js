import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: 'Nhà', trim: true }, // Nhà, Văn phòng, ...
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    ward: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Address = mongoose.model('Address', addressSchema);
export default Address;
