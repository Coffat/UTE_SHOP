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
const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerUser = async (userData: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
}): Promise<{ message: string }> => {
  const { fullName, email, password, phone } = userData;

  if (!password) {
    throw new Error('Mật khẩu là bắt buộc');
  }

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
export const verifyRegistrationOtp = async (email: string, otp: string): Promise<{ message: string }> => {
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

// ─── Helper function to throw error with status ───────────────────────────────
const throwError = (msg: string, status = 400): never => {
  const err = new Error(msg) as Error & { status?: number };
  err.status = status;
  throw err;
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginUser = async (email?: string, password?: string): Promise<{ user: any; accessToken: string; refreshToken: string }> => {
  if (!email || !password) {
    throw throwError('Email và mật khẩu là bắt buộc', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw throwError('Không tìm thấy người dùng', 404);
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw throwError('Tài khoản chưa được kích hoạt hoặc đã bị khóa', 403);
  }

  const hash = user.passwordHash;
  if (!hash) {
    throw throwError('Tài khoản này có lỗi dữ liệu (thiếu mật khẩu). Vui lòng liên hệ hỗ trợ.', 500);
  }

  const isMatch = await bcrypt.compare(password, hash);
  if (!isMatch) {
    throw throwError('Sai mật khẩu', 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const hashedToken = hashToken(refreshToken);
  // Store individual refresh token with TTL to support multiple sessions and rotation
  await redisClient.setEx(`refresh:${user._id}:${hashedToken}`, 7 * 24 * 60 * 60, 'valid');

  return { user, accessToken, refreshToken };
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Không tìm thấy người dùng');

  const otp = generateOtp();
  await redisClient.setEx(`otp_forgot:${email}`, 300, otp);
  await sendOtpEmail(email, otp, 'reset');

  return { message: 'OTP đặt lại mật khẩu đã được gửi. Kiểm tra email.' };
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (email: string, otp: string, newPassword?: string): Promise<{ message: string }> => {
  if (!newPassword) {
    throw new Error('Mật khẩu mới là bắt buộc');
  }

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
export const logoutUser = async (refreshToken?: string): Promise<void> => {
  if (!refreshToken) return;
  try {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error('REFRESH_TOKEN_SECRET not configured');
    const decoded = jwt.verify(refreshToken, secret) as { id: string };
    const hashedToken = hashToken(refreshToken);
    await redisClient.del(`refresh:${decoded.id}:${hashedToken}`);
  } catch {
    // Token hết hạn/invalid → vẫn cho logout thành công (cookies sẽ được xóa)
  }
};

// ─── Refresh Token (Rotation & Replay Attack Detection) ───────────────────────
export const rotateRefreshToken = async (refreshToken?: string): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!refreshToken) throw new Error('Không có refresh token');

  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET not configured');

  let decoded: { id: string };
  try {
    decoded = jwt.verify(refreshToken, secret) as { id: string };
  } catch (err) {
    throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
  }

  const userId = decoded.id;
  const hashedToken = hashToken(refreshToken);

  // Kiểm tra token trong Redis
  const exists = await redisClient.get(`refresh:${userId}:${hashedToken}`);
  
  if (!exists) {
    // REPLAY ATTACK DETECTION! Token hợp lệ về mặt chữ ký nhưng không có trong DB (đã bị dùng).
    // => Thu hồi toàn bộ refresh tokens của user này.
    const keys = await redisClient.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    throw new Error('Phát hiện truy cập bất thường. Vui lòng đăng nhập lại.');
  }

  // Nếu hợp lệ, xóa token cũ (để không dùng lại được nữa)
  await redisClient.del(`refresh:${userId}:${hashedToken}`);

  // Tìm user để lấy thông tin mới nhất
  const user = await User.findById(userId);
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new Error('Tài khoản không hợp lệ');
  }

  // Tạo cặp token mới
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newHashedToken = hashToken(newRefreshToken);

  // Lưu token mới
  await redisClient.setEx(`refresh:${userId}:${newHashedToken}`, 7 * 24 * 60 * 60, 'valid');

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
