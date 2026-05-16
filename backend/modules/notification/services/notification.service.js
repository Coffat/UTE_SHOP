import { Notification, UserNotification } from '../models/Notification.js';

/**
 * Gửi thông báo broadcast đến nhiều users
 * (Tách bảng UserNotification → giải quyết bài toán broadcast N users)
 */
export const broadcastNotification = async ({ title, body, type, channel, userIds, referenceType, referenceId }) => {
  const notification = await Notification.create({ title, body, type, channel, referenceType, referenceId });

  const userNotifs = userIds.map((userId) => ({
    user: userId,
    notification: notification._id,
  }));
  await UserNotification.insertMany(userNotifs);

  return notification;
};

export const getUserNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  return UserNotification.find({ user: userId })
    .populate('notification')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
};

export const markAsRead = async (userNotifId, userId) => {
  return UserNotification.findOneAndUpdate(
    { _id: userNotifId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};
