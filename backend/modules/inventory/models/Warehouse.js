import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
