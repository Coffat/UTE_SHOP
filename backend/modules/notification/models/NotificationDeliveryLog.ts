import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationDeliveryLog extends Document {
  notification: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  attemptCount: number;
  provider: string;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  skipReason?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationDeliveryLogSchema = new Schema<INotificationDeliveryLog>(
  {
    notification: { type: Schema.Types.ObjectId, ref: 'Notification', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    status: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'], required: true, default: 'PENDING' },
    attemptCount: { type: Number, default: 0 },
    provider: { type: String, required: true },
    providerMessageId: { type: String },
    errorCode: { type: String },
    errorMessage: { type: String },
    skipReason: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

notificationDeliveryLogSchema.index({ notification: 1 });
notificationDeliveryLogSchema.index({ user: 1 });
notificationDeliveryLogSchema.index({ status: 1 });

const NotificationDeliveryLog = mongoose.model<INotificationDeliveryLog>('NotificationDeliveryLog', notificationDeliveryLogSchema);
export default NotificationDeliveryLog;
