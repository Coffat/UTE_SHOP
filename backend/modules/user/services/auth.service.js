import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import redisClient from '../../../config/redis.js';
import { sendOtpEmail } from '../../../shared/utils/email.js';
import { hashToken } from '../../../shared/utils/hash.js';
import { generateAccessToken, generateRefreshToken } from '../../../shared/utils/jwt.js';
import UserStatus from '../../../shared/enums/UserStatus.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerUser = async (userData) => {
  const { fullName, email, password, phone } = userData;

  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email đã được sử dụng');

  const passwordHash = await bcrypt.hash(password, 10);

  // Tạo Customer (discriminator role = CUSTOMER, status = PENDING)
  await Customer.create({ fullName, email, passwordHash, phone });

  // Lưu OTP vào Redis (TTL 5 phút)
  const otp = generateOtp();
  await redisClient.setEx(`otp_register:${email}`, 300, otp);

  await sendOtpEmail(email, otp, 'register');

  return { message: 'Đăng ký thành công. Kiểm tra email để xác minh OTP.' };
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyRegistrationOtp = async (email, otp) => {
  const storedOtp = await redisClient.get(`otp_register:${email}`);

  if (!storedOtp || storedOtp !== otp) {
    throw new Error('OTP không hợp lệ hoặc đã hết hạn');
  }

  const user = await Customer.findOneAndUpdate(
    { email },
    { status: UserStatus.ACTIVE, isEmailVerified: true },
    { new: true }
  );

  if (!user) throw new Error('Không tìm thấy người dùng');

  await redisClient.del(`otp_register:${email}`);

  return { message: 'Xác minh email thành công. Tài khoản đã được kích hoạt.' };
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Không tìm thấy người dùng');

  if (user.status !== UserStatus.ACTIVE) {
    throw new Error('Tài khoản chưa được kích hoạt hoặc đã bị khóa');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Sai mật khẩu');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const hashedToken = hashToken(refreshToken);
  await redisClient.set(`refresh:${user._id}`, hashedToken, { EX: 7 * 24 * 60 * 60 });

  return { user, accessToken, refreshToken };
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Không tìm thấy người dùng');

  const otp = generateOtp();
  await redisClient.setEx(`otp_forgot:${email}`, 300, otp);
  await sendOtpEmail(email, otp, 'reset');

  return { message: 'OTP đặt lại mật khẩu đã được gửi. Kiểm tra email.' };
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (email, otp, newPassword) => {
  const storedOtp = await redisClient.get(`otp_forgot:${email}`);

  if (!storedOtp || storedOtp !== otp) {
    throw new Error('OTP không hợp lệ hoặc đã hết hạn');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ email }, { passwordHash });
  await redisClient.del(`otp_forgot:${email}`);

  return { message: 'Đặt lại mật khẩu thành công.' };
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutUser = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    await redisClient.del(`refresh:${decoded.id}`);
  } catch {
    // Token hết hạn/invalid → vẫn cho logout thành công (cookies sẽ được xóa)
  }
};
