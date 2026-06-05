import { Notification, UserNotification, INotification, IUserNotification } from '../models/Notification.js';

interface BroadcastParams {
  title: string;
  body: string;
  type: string;
  channel?: string;
  userIds: string[];
  referenceType?: string | null;
  referenceId?: string | null;
  actionUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  data?: Record<string, any>;
  dedupeKey?: string;
  sourceEventId: string;
}

/**
 * Legacy support for simple broadcast if still used
 */
export const broadcastNotification = async ({
  title,
  body,
  type,
  channel,
  userIds,
  referenceType = undefined,
  referenceId = undefined,
  actionUrl = undefined,
  priority = 'NORMAL',
  data = {},
  dedupeKey,
  sourceEventId,
}: BroadcastParams): Promise<INotification> => {
  const notification = await Notification.create({ 
    title, body, type, channel, referenceType, referenceId, actionUrl, priority, data, dedupeKey, sourceEventId 
  });

  const userNotifs = userIds.map((userId) => ({
    user: userId as any,
    notification: notification._id as any,
  }));
  await UserNotification.insertMany(userNotifs);

  return notification;
};

interface GetUserNotificationsOptions {
  cursor?: string; // createdAt timestamp or objectId
  limit?: number;
}

export const getUserNotifications = async (
  userId: string,
  { cursor, limit = 20 }: GetUserNotificationsOptions = {}
) => {
  const query: any = { user: userId };
  
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const notifications = await UserNotification.find(query)
    .populate('notification')
    .sort({ createdAt: -1 })
    .limit(limit + 1); // Fetch 1 extra to check for next page

  const hasNextPage = notifications.length > limit;
  const results = hasNextPage ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasNextPage ? results[results.length - 1].createdAt.toISOString() : null;

  return {
    data: results,
    nextCursor,
  };
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return UserNotification.countDocuments({ user: userId, isRead: false });
};

export const markAsRead = async (userNotifId: string, userId: string): Promise<IUserNotification | null> => {
  return UserNotification.findOneAndUpdate(
    { _id: userNotifId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  ).populate('notification');
};

export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await UserNotification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result.modifiedCount;
};

