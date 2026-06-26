import NotificationDeliveryLog from '../models/NotificationDeliveryLog.js';

export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
export type DeliverySkipReason = 'USER_OPTED_OUT' | 'CHANNEL_DISABLED' | 'NO_EMAIL' | 'SYSTEM_ERROR';

interface CreatePendingLogParams {
  notificationId: string;
  userId?: string;
  provider: string;
}

export const createPendingLog = async ({
  notificationId,
  userId,
  provider,
}: CreatePendingLogParams) => {
  return NotificationDeliveryLog.create({
    notification: notificationId,
    user: userId,
    provider,
    status: 'PENDING',
    attemptCount: 1,
  });
};

export const markDeliverySent = async (logId: string, providerMessageId?: string) => {
  return NotificationDeliveryLog.findByIdAndUpdate(
    logId,
    {
      status: 'SENT',
      sentAt: new Date(),
      providerMessageId: providerMessageId || undefined,
      errorCode: undefined,
      errorMessage: undefined,
      skipReason: undefined,
    },
    { new: true }
  );
};

export const markDeliveryFailed = async (logId: string, errorMessage: string, errorCode?: string) => {
  return NotificationDeliveryLog.findByIdAndUpdate(
    logId,
    {
      status: 'FAILED',
      errorCode: errorCode || 'DELIVERY_FAILED',
      errorMessage,
      sentAt: undefined,
      skipReason: undefined,
    },
    { new: true }
  );
};

export const markDeliverySkipped = async (logId: string, reason: DeliverySkipReason, details?: string) => {
  return NotificationDeliveryLog.findByIdAndUpdate(
    logId,
    {
      status: 'SKIPPED',
      skipReason: reason,
      errorMessage: details || undefined,
      sentAt: undefined,
    },
    { new: true }
  );
};

