import mongoose from 'mongoose';
import NotificationChannel from '../../../shared/enums/NotificationChannel.js';
import NotificationType from '../../../shared/enums/NotificationType.js';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    referenceType: { type: String, default: null }, // 'ORDER', 'REFUND', ...
    referenceId: { type: String, default: null },
  },
  { timestamps: true }
);

const userNotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
export const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
