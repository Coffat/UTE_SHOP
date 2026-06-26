import mongoose, { Document, Schema } from 'mongoose';

export interface NotificationChannelPreference {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface NotificationTypePreference {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
}

export interface INotificationPreference extends Document {
  user: mongoose.Types.ObjectId;
  channels: NotificationChannelPreference;
  types: Record<string, NotificationTypePreference>;
  ui: {
    sidebarAutoCollapse: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    channels: {
      inAppEnabled: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: false },
    },
    types: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ui: {
      sidebarAutoCollapse: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);

export default NotificationPreference;

