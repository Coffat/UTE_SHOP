const bcrypt = require('bcryptjs');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { sendOtpEmail } = require('../utils/email');

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

module.exports = {
  registerUser,
  verifyRegistrationOtp,
};
