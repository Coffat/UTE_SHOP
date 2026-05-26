import mongoose, { Schema } from 'mongoose';
import User, { IUser } from './User.js';
import UserStatus from '../../../shared/enums/UserStatus.js';

export interface IStaff extends IUser {
  fullName: string;
  hiredAt: Date;
  status: UserStatus;
  performanceScore: number;
}

export const staffBaseFields = {
  fullName: { type: String, required: true, trim: true, index: true },
  hiredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED'], default: 'ACTIVE', index: true },
  performanceScore: { type: Number, default: 100 },
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
