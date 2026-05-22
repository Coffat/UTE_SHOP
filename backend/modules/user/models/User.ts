import mongoose, { Schema, Document } from 'mongoose';
import UserStatus from '../../../shared/enums/UserStatus.js';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  phone: string | null;
  status: UserStatus;
  role: string;
  otpCode: string | null;
  otpExpires: Date | null;
  isActive: boolean;
  deletedAt: Date | null;
  deletedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

// Indexes for query optimization
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ fullName: 1 });
userSchema.index({ role: 1, isActive: 1, deletedAt: 1 });

const User = mongoose.model<IUser>('User', userSchema);
export default User;
