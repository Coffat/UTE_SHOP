import mongoose, { Document, Schema } from 'mongoose';
import NotificationChannel from '../../../shared/enums/NotificationChannel.js';
import NotificationType from '../../../shared/enums/NotificationType.js';

export interface INotification extends Document {
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserNotification extends Document {
  user: mongoose.Types.ObjectId;
  notification: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
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

const userNotificationSchema = new Schema<IUserNotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notification: { type: Schema.Types.ObjectId, ref: 'Notification', required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const UserNotification = mongoose.model<IUserNotification>('UserNotification', userNotificationSchema);
