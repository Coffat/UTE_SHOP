import { Notification, UserNotification, INotification, IUserNotification } from '../models/Notification.js';
import NotificationChannel from '../../../shared/enums/NotificationChannel.js';
import NotificationType from '../../../shared/enums/NotificationType.js';

interface BroadcastParams {
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  userIds: string[];
  referenceType?: string | null;
  referenceId?: string | null;
}

/**
 * Gửi thông báo broadcast đến nhiều users
 * (Tách bảng UserNotification → giải quyết bài toán broadcast N users)
 */
export const broadcastNotification = async ({
  title,
  body,
  type,
  channel,
  userIds,
  referenceType = null,
  referenceId = null,
}: BroadcastParams): Promise<INotification> => {
  const notification = await Notification.create({ title, body, type, channel, referenceType, referenceId });

  const userNotifs = userIds.map((userId) => ({
    user: userId as any,
    notification: notification._id as any,
  }));
  await UserNotification.insertMany(userNotifs);

  return notification;
};

interface GetUserNotificationsOptions {
  page?: number;
  limit?: number;
}

export const getUserNotifications = async (
  userId: string,
  { page = 1, limit = 20 }: GetUserNotificationsOptions = {}
): Promise<IUserNotification[]> => {
  return UserNotification.find({ user: userId })
    .populate('notification')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .sort({ createdAt: -1 });
};

export const markAsRead = async (userNotifId: string, userId: string): Promise<IUserNotification | null> => {
  return UserNotification.findOneAndUpdate(
    { _id: userNotifId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};
