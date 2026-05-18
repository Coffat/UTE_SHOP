import User from '../models/User.js';
import Customer from '../models/Customer.js';

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

/**
 * Lấy danh sách sản phẩm yêu thích đã được populate thông tin chi tiết.
 * @param {string} userId
 */
export const getUserFavorites = async (userId) => {
  const customer = await Customer.findById(userId)
    .populate({
      path: 'favorites',
      match: { status: 'ACTIVE' }, // chỉ lấy sản phẩm đang bán
      populate: {
        path: 'category',
        select: 'name slug',
      }
    })
    .select('favorites');
  
  return customer ? customer.favorites : [];
};

/**
 * Thêm sản phẩm vào danh sách yêu thích.
 * @param {string} userId
 * @param {string} productId
 */
export const addProductToFavorites = async (userId, productId) => {
  const customer = await Customer.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: productId } },
    { new: true }
  ).populate('favorites');

  return customer;
};

/**
 * Xóa sản phẩm khỏi danh sách yêu thích.
 * @param {string} userId
 * @param {string} productId
 */
export const removeProductFromFavorites = async (userId, productId) => {
  const customer = await Customer.findByIdAndUpdate(
    userId,
    { $pull: { favorites: productId } },
    { new: true }
  );

  return customer;
};

