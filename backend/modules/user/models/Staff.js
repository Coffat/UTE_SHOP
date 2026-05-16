import mongoose from 'mongoose';
import User from './User.js';

/**
 * Staff base schema (abstract) – không tạo discriminator trực tiếp.
 * Sales / WarehouseStaff / StoreStaff sẽ kế thừa các trường này.
 */
export const staffBaseFields = {
  fullName: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  hiredAt: { type: Date, default: Date.now },
};

// ─── Sales ────────────────────────────────────────────────────────────────────
const Sales = User.discriminator(
  'SALES',
  new mongoose.Schema({
    ...staffBaseFields,
    isOnline: { type: Boolean, default: false },
  })
);

// ─── WarehouseStaff ───────────────────────────────────────────────────────────
const WarehouseStaff = User.discriminator(
  'WAREHOUSE_STAFF',
  new mongoose.Schema({
    ...staffBaseFields,
    assignedWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
  })
);

// ─── StoreStaff ───────────────────────────────────────────────────────────────
const StoreStaff = User.discriminator(
  'STORE_STAFF',
  new mongoose.Schema({
    ...staffBaseFields,
    counterId: { type: String, trim: true },
    storeLocation: { type: String, trim: true },
  })
);

export { Sales, WarehouseStaff, StoreStaff };
