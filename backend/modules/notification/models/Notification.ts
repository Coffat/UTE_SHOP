import mongoose, { Document, Schema } from 'mongoose';
import NotificationChannel from '../../../shared/enums/NotificationChannel.js';
import NotificationType from '../../../shared/enums/NotificationType.js';

export interface INotification extends Document {
  title: string;
  body: string;
  type: string; // Changed from enum to string to support more types flexibly
  channel?: string; // Kept for legacy compatibility if needed
  referenceType?: string | null;
  referenceId?: string | null;
  actionUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  data: Record<string, any>;
  dedupeKey?: string;
  sourceEventId: string;
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
    type: { type: String, required: true },
    channel: { type: String, required: false },
    referenceType: { type: String, default: null }, // 'ORDER', 'REFUND', ...
    referenceId: { type: String, default: null },
    actionUrl: { type: String, default: null },
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH'], default: 'NORMAL' },
    data: { type: Schema.Types.Mixed, default: {} },
    dedupeKey: { type: String, sparse: true, unique: true },
    sourceEventId: { type: String, required: true },
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

userNotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, notification: 1 }, { unique: true });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const UserNotification = mongoose.model<IUserNotification>('UserNotification', userNotificationSchema);
