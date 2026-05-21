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
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

const User = mongoose.model<IUser>('User', userSchema);
export default User;
