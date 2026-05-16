import User from '../models/User.js';

/**
 * Lấy profile của user đang đăng nhập.
 * @param {string} userId
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash -otpCode -otpExpires');
  return user;
};

/**
 * Cập nhật profile – chỉ cho phép thay đổi các field whitelisted.
 * Sensitive fields (email, passwordHash, role, status) bị loại bỏ hoàn toàn.
 * @param {string} userId
 * @param {Object} updateData - raw body từ request
 */
export const updateUserProfile = async (userId, updateData) => {
  const ALLOWED_FIELDS = ['fullName', 'phone'];

  const sanitised = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (updateData[field] !== undefined) sanitised[field] = updateData[field];
  });

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: sanitised },
    { new: true, runValidators: true }
  ).select('-passwordHash -otpCode -otpExpires');

  return updated;
};
