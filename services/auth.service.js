const bcrypt = require('bcryptjs');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { sendOtpEmail } = require('../utils/email');
const { hashToken } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const registerUser = async (userData) => {
  const { fullName, email, password, phone } = userData;

  // Check if the email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user (is_active: false by default per schema)
  const newUser = await User.create({
    fullName,
    email,
    password: hashedPassword,
    phone,
    is_active: false
  });

  // Generate 6-digit numeric OTP
  const otpCode = generateOtp();

  // Save OTP to Redis with TTL of 300 seconds (5 minutes)
  const redisKey = `otp_register:${email}`;
  await redisClient.setEx(redisKey, 300, otpCode);

  // Send OTP email
  await sendOtpEmail(email, otpCode);

  return { message: 'Registration successful. Please check your email for the OTP.' };
};

const verifyRegistrationOtp = async (email, otp) => {
  const redisKey = `otp_register:${email}`;
  
  // Retrieve the stored OTP from Redis
  const storedOtp = await redisClient.get(redisKey);

  // Check if OTP exists and matches
  if (!storedOtp || storedOtp !== otp) {
    throw new Error('Invalid or expired OTP');
  }

  // Update user in MongoDB
  const updatedUser = await User.findOneAndUpdate(
    { email },
    { is_active: true },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('User not found');
  }

  // Delete the OTP key from Redis
  await redisClient.del(redisKey);

  return { message: 'Email verified successfully. Your account is now active.' };
};
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.is_active) {
    throw new Error('Please verify your email first');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const hashedToken = hashToken(refreshToken);
  await redisClient.set(`refresh:${user._id}`, hashedToken, { EX: 7 * 24 * 60 * 60 });

  return { user, accessToken, refreshToken };
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  // 1. Verify the user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // 2. Generate a 6-digit numeric OTP
  const otp = generateOtp();

  // 3. Persist OTP in Redis with 5-minute TTL
  await redisClient.setEx(`otp_forgot:${email}`, 300, otp);

  // 4. Deliver the OTP via email
  await sendOtpEmail(email, otp);

  return { message: 'Password recovery OTP sent. Please check your email.' };
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (email, otp, newPassword) => {
  // 1. Retrieve OTP from Redis
  const storedOtp = await redisClient.get(`otp_forgot:${email}`);

  // 2. Validate OTP
  if (!storedOtp || storedOtp !== otp) {
    throw new Error('Invalid or expired OTP');
  }

  // 3. Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // 4. Persist the new password in MongoDB
  await User.findOneAndUpdate(
    { email },
    { password: hashedPassword }
  );

  // 5. Invalidate the used OTP
  await redisClient.del(`otp_forgot:${email}`);

  return { message: 'Password has been reset successfully.' };
};

module.exports = {
  registerUser,
  verifyRegistrationOtp,
  loginUser,
  forgotPassword,
  resetPassword,
};
