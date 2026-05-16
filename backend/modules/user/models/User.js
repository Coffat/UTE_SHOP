import mongoose from 'mongoose';
import UserStatus from '../../../shared/enums/UserStatus.js';

/**
 * Schema gốc – dùng discriminator để phân nhánh Customer / Admin / Staff.
 *
 * Các trường chung của tất cả loại user:
 *   email, passwordHash, phone, status
 *
 * Trường `role` (discriminatorKey) sẽ tự động được thêm bởi Mongoose
 * khi tạo discriminator.
 */
const userSchema = new mongoose.Schema(
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
    // OTP fields (dùng chung cho register & forgot-password)
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
    discriminatorKey: 'role', // Mongoose sẽ lưu 'CUSTOMER' | 'ADMIN' | 'SALES' | ...
  }
);

const User = mongoose.model('User', userSchema);
export default User;
