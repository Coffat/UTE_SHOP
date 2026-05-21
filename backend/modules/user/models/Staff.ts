import mongoose, { Schema } from 'mongoose';
import User, { IUser } from './User.js';

export interface IStaff extends IUser {
  fullName: string;
  isActive: boolean;
  hiredAt: Date;
}

export const staffBaseFields = {
  fullName: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  hiredAt: { type: Date, default: Date.now },
};

// ─── Sales ────────────────────────────────────────────────────────────────────
export interface ISales extends IStaff {
  isOnline: boolean;
}

const Sales = User.discriminator<ISales>(
  'SALES',
  new Schema({
    ...staffBaseFields,
    isOnline: { type: Boolean, default: false },
  })
);

// ─── WarehouseStaff ───────────────────────────────────────────────────────────
export interface IWarehouseStaff extends IStaff {
  assignedWarehouse: mongoose.Types.ObjectId | null;
}

const WarehouseStaff = User.discriminator<IWarehouseStaff>(
  'WAREHOUSE_STAFF',
  new Schema({
    ...staffBaseFields,
    assignedWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', default: null },
  })
);

// ─── StoreStaff ───────────────────────────────────────────────────────────────
export interface IStoreStaff extends IStaff {
  counterId?: string;
  storeLocation?: string;
}

const StoreStaff = User.discriminator<IStoreStaff>(
  'STORE_STAFF',
  new Schema({
    ...staffBaseFields,
    counterId: { type: String, trim: true },
    storeLocation: { type: String, trim: true },
  })
);

export { Sales, WarehouseStaff, StoreStaff };
