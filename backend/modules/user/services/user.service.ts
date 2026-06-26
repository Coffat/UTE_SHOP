import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User.js';
import Customer from '../models/Customer.js';
import { AppError } from '../../../shared/utils/AppError.js';
import Order from '../../order/models/Order.js';
import AuditLog from '../../system/models/AuditLog.js';
import { UserNotification } from '../../notification/models/Notification.js';

/**
 * Lấy profile của user đang đăng nhập.
 * @param userId
 */
export const getUserById = async (userId: string): Promise<IUser | null> => {
  const user = await User.findById(userId).select('-passwordHash -otpCode -otpExpires');
  return user;
};

/**
 * Cập nhật profile – chỉ cho phép thay đổi các field whitelisted.
 * Sensitive fields (email, passwordHash, role, status) bị loại bỏ hoàn toàn.
 * @param userId
 * @param updateData - raw body từ request
 */
export const updateUserProfile = async (userId: string, updateData: Record<string, any>): Promise<IUser | null> => {
  const ALLOWED_FIELDS = ['fullName', 'phone'];

  const sanitised: Record<string, any> = {};
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

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user?.passwordHash) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không đúng', 400);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
};

/**
 * Lấy danh sách sản phẩm yêu thích đã được populate thông tin chi tiết.
 * @param userId
 */
export const getUserFavorites = async (userId: string): Promise<any[]> => {
  const customer = await Customer.findById(userId)
    .populate({
      path: 'favorites',
      match: { status: 'ACTIVE' },
      populate: {
        path: 'category',
        select: 'name slug',
      }
    })
    .select('favorites');
  
  return customer ? (customer.favorites as any[]) : [];
};

/**
 * Thêm sản phẩm vào danh sách yêu thích.
 * @param userId
 * @param productId
 */
export const addProductToFavorites = async (userId: string, productId: string): Promise<any> => {
  const customer = await Customer.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: productId } },
    { new: true }
  ).populate('favorites');

  return customer;
};

/**
 * Xóa sản phẩm khỏi danh sách yêu thích.
 * @param userId
 * @param productId
 */
export const removeProductFromFavorites = async (userId: string, productId: string): Promise<any> => {
  const customer = await Customer.findByIdAndUpdate(
    userId,
    { $pull: { favorites: productId } },
    { new: true }
  );

  return customer;
};

export interface UserProfileStats {
  notifications: {
    unread: number;
  };
  operations: {
    ordersHandled: number;
    activityLast7Days: number;
  };
  performance: {
    score: number | null;
  };
}

export const getUserProfileStats = async (userId: string): Promise<UserProfileStats> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [unreadNotifications, ordersHandled, activityLast7Days, profile] = await Promise.all([
    UserNotification.countDocuments({ user: userId, isRead: false }),
    Order.countDocuments({ 'statusHistory.changedBy': userId }),
    AuditLog.countDocuments({ actorId: userId, createdAt: { $gte: sevenDaysAgo } }),
    User.findById(userId).select('performanceScore'),
  ]);

  const performanceScore =
    profile && Object.prototype.hasOwnProperty.call(profile.toObject(), 'performanceScore')
      ? Number((profile as any).performanceScore)
      : null;

  return {
    notifications: {
      unread: unreadNotifications,
    },
    operations: {
      ordersHandled,
      activityLast7Days,
    },
    performance: {
      score: Number.isFinite(performanceScore) ? performanceScore : null,
    },
  };
};
