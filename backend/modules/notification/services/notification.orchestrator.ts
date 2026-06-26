import { eventBus, AppEvent, PaymentSuccessPayload, PaymentFailedPayload } from '../../../shared/utils/eventBus.js';
import { Notification, UserNotification } from '../models/Notification.js';
import User from '../../user/models/User.js';
import ProductVariant from '../../catalog/models/ProductVariant.js';
import crypto from 'crypto';
import NotificationChannel from '../../../shared/enums/NotificationChannel.js';
import { getOrCreateSettings } from '../../admin/repositories/settings.repository.js';
import { emitNotificationToUser } from '../../chat/socket/chat.socket.js';
import { sendNotificationEmail } from '../../../shared/utils/email.js';
import {
  createPendingLog,
  markDeliveryFailed,
  markDeliverySent,
  markDeliverySkipped,
} from './notification.delivery.service.js';
import { getNotificationPreferencesMap } from './notification.preference.service.js';
import {
  CHAT_UNASSIGNED_RECIPIENT_ROLES,
  LOW_STOCK_RECIPIENT_ROLES,
  ORDER_STAFF_RECIPIENT_ROLES,
  PAYMENT_STAFF_RECIPIENT_ROLES,
} from '../constants/notificationRecipients.js';

export const registerNotificationEventHandlers = () => {
  eventBus.on(AppEvent.PAYMENT_SUCCESS, async (payload: PaymentSuccessPayload) => {
    try {
      await handlePaymentSuccess(payload);
    } catch (error: any) {
      console.error('[NotificationOrchestrator] Error handling PAYMENT_SUCCESS:', error);
    }
  });

  eventBus.on(AppEvent.PAYMENT_FAILED, async (payload: PaymentFailedPayload) => {
    try {
      await handlePaymentFailed(payload);
    } catch (error: any) {
      console.error('[NotificationOrchestrator] Error handling PAYMENT_FAILED:', error);
    }
  });

  eventBus.on(AppEvent.ORDER_CREATED, async (payload: any) => {
    try {
      await handleOrderCreated(payload);
    } catch (error: any) {
      console.error('[NotificationOrchestrator] Error handling ORDER_CREATED:', error);
    }
  });

  eventBus.on(AppEvent.ORDER_STATUS_CHANGED, async (payload: any) => {
    try {
      await handleOrderStatusChanged(payload);
    } catch (error: any) {
      console.error('[NotificationOrchestrator] Error handling ORDER_STATUS_CHANGED:', error);
    }
  });

  eventBus.on(AppEvent.CHAT_MESSAGE_RECEIVED, async (payload: any) => {
    try {
      await handleChatMessageReceived(payload);
    } catch (error: any) {
      console.error('[NotificationOrchestrator] Error handling CHAT_MESSAGE_RECEIVED:', error);
    }
  });

  eventBus.on(AppEvent.LOW_STOCK, async (payload: any) => {
    try {
      await handleLowStock(payload);
    } catch (error: any) {
      console.error('[NotificationOrchestrator] Error handling LOW_STOCK:', error);
    }
  });
};

const handleOrderCreated = async (payload: any) => {
  const staffRecipients = await resolveRecipients([...ORDER_STAFF_RECIPIENT_ROLES]);
  const customerRecipient = payload.customerId || payload.actorId;
  const amountLabel = Number(payload.totalAmount || 0).toLocaleString('vi-VN');

  if (staffRecipients.length > 0) {
    await deliverNotification({
      title: 'Đơn hàng mới cần xử lý',
      body: `Đơn hàng ${payload.orderCode} trị giá ${amountLabel}đ vừa được tạo.`,
      type: 'ORDER',
      referenceId: payload.orderId,
      referenceType: 'Order',
      actionUrl: `/orders/${payload.orderId}`,
      dedupeKey: `ORDER_CREATED:${payload.orderId}:staff`,
      recipients: staffRecipients,
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: { ...payload, audience: 'staff' },
      sourceEventId: payload.eventId
    });
  }

  if (customerRecipient) {
    await deliverNotification({
      title: 'Đặt hàng thành công',
      body: `Đơn hàng ${payload.orderCode} của bạn đã được ghi nhận.`,
      type: 'ORDER',
      referenceId: payload.orderId,
      referenceType: 'Order',
      actionUrl: '/user/profile/orders',
      dedupeKey: `ORDER_CREATED:${payload.orderId}:customer:${customerRecipient}`,
      recipients: [customerRecipient],
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: { ...payload, audience: 'customer' },
      sourceEventId: payload.eventId
    });
  }
};

const handleOrderStatusChanged = async (payload: any) => {
  const staffRecipients = await resolveRecipients([...ORDER_STAFF_RECIPIENT_ROLES]);
  const customerRecipient = payload.customerId;

  if (staffRecipients.length > 0) {
    await deliverNotification({
      title: 'Cập nhật trạng thái đơn hàng',
      body: `Đơn hàng ${payload.orderCode} đã chuyển từ ${payload.oldStatus} sang ${payload.newStatus}.`,
      type: 'ORDER',
      referenceId: payload.orderId,
      referenceType: 'Order',
      actionUrl: `/orders/${payload.orderId}`,
      dedupeKey: `ORDER_STATUS_CHANGED:${payload.orderId}:${payload.newStatus}:staff`,
      recipients: staffRecipients,
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: { ...payload, audience: 'staff' },
      sourceEventId: payload.eventId
    });
  }

  if (customerRecipient) {
    await deliverNotification({
      title: 'Đơn hàng của bạn được cập nhật',
      body: `Đơn hàng ${payload.orderCode} đã chuyển sang trạng thái ${payload.newStatus}.`,
      type: 'ORDER',
      referenceId: payload.orderId,
      referenceType: 'Order',
      actionUrl: '/user/profile/orders',
      dedupeKey: `ORDER_STATUS_CHANGED:${payload.orderId}:${payload.newStatus}:customer:${customerRecipient}`,
      recipients: [customerRecipient],
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: { ...payload, audience: 'customer' },
      sourceEventId: payload.eventId
    });
  }
};

const handleChatMessageReceived = async (payload: any) => {
  let recipients: string[] = [];

  if (payload.recipientId !== 'UNASSIGNED') {
    recipients = [payload.recipientId];
  } else {
    const handlerIds = await resolveRecipients([...CHAT_UNASSIGNED_RECIPIENT_ROLES]);
    recipients = handlerIds.map(id => id.toString());
  }

  if (!recipients.length) return;

  const dedupeKey = `CHAT_MESSAGE:${payload.messageId}`;

  await deliverNotification({
    title: payload.senderType === 'customer' ? 'Tin nhắn mới từ khách hàng' : 'Tin nhắn mới từ hỗ trợ viên',
    body: payload.contentPreview,
    type: 'INFO',
    referenceId: payload.conversationId,
    referenceType: 'Conversation',
    dedupeKey,
    recipients,
    channelPreferences: { IN_APP: true, EMAIL: false }, // Usually chat is in-app only, maybe push notification, but not email
    payload,
    sourceEventId: payload.eventId
  });
};

const resolveRecipients = async (roles: string[]) => {
  const users = await User.find({ role: { $in: roles }, isActive: true, deletedAt: null }).select('_id');
  return users.map((u) => u._id.toString());
};

const handlePaymentSuccess = async (payload: PaymentSuccessPayload) => {
  const staffRecipients = await resolveRecipients([...PAYMENT_STAFF_RECIPIENT_ROLES]);
  const customerRecipient = payload.customerId || payload.actorId;

  if (staffRecipients.length > 0) {
    await deliverNotification({
      title: 'Thanh toán đơn hàng thành công',
      body: `Đơn ${payload.orderId} đã thanh toán thành công qua ${payload.paymentMethod}.`,
      type: AppEvent.PAYMENT_SUCCESS as any,
      referenceId: payload.entityId,
      referenceType: 'ORDER',
      actionUrl: `/orders/${payload.entityId}`,
      priority: 'HIGH',
      dedupeKey: `PAYMENT_SUCCESS:${payload.paymentId}:${payload.entityId}:staff`,
      recipients: staffRecipients,
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: {
        ...payload,
        audience: 'staff',
      },
      sourceEventId: payload.eventId
    });
  }

  if (customerRecipient) {
    await deliverNotification({
      title: 'Thanh toán thành công',
      body: `Đơn hàng của bạn đã được thanh toán thành công qua ${payload.paymentMethod}.`,
      type: AppEvent.PAYMENT_SUCCESS as any,
      referenceId: payload.entityId,
      referenceType: 'ORDER',
      actionUrl: '/user/profile/orders',
      priority: 'HIGH',
      dedupeKey: `PAYMENT_SUCCESS:${payload.paymentId}:${payload.entityId}:customer:${customerRecipient}`,
      recipients: [customerRecipient],
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: {
        ...payload,
        audience: 'customer',
      },
      sourceEventId: payload.eventId
    });
  }
};

const handlePaymentFailed = async (payload: PaymentFailedPayload) => {
  const staffRecipients = await resolveRecipients([...PAYMENT_STAFF_RECIPIENT_ROLES]);
  const customerRecipient = payload.customerId || payload.actorId;

  if (staffRecipients.length > 0) {
    await deliverNotification({
      title: 'Thanh toán đơn hàng thất bại',
      body: `Đơn ${payload.orderId} thanh toán thất bại qua ${payload.paymentMethod}.`,
      type: AppEvent.PAYMENT_FAILED as any,
      referenceId: payload.entityId,
      referenceType: 'ORDER',
      actionUrl: `/orders/${payload.entityId}`,
      priority: 'HIGH',
      dedupeKey: `PAYMENT_FAILED:${payload.paymentId}:${payload.entityId}:staff`,
      recipients: staffRecipients,
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: {
        ...payload,
        audience: 'staff',
      },
      sourceEventId: payload.eventId
    });
  }

  if (customerRecipient) {
    await deliverNotification({
      title: 'Thanh toán thất bại',
      body: `Đơn hàng của bạn thanh toán thất bại qua ${payload.paymentMethod}. Lý do: ${payload.reason || 'Không rõ'}.`,
      type: AppEvent.PAYMENT_FAILED as any,
      referenceId: payload.entityId,
      referenceType: 'ORDER',
      actionUrl: '/user/profile/orders',
      priority: 'HIGH',
      dedupeKey: `PAYMENT_FAILED:${payload.paymentId}:${payload.entityId}:customer:${customerRecipient}`,
      recipients: [customerRecipient],
      channelPreferences: { IN_APP: true, EMAIL: true },
      payload: {
        ...payload,
        audience: 'customer',
      },
      sourceEventId: payload.eventId
    });
  }
};

const handleLowStock = async (payload: any) => {
  const recipients = await resolveRecipients([...LOW_STOCK_RECIPIENT_ROLES]);
  if (!recipients.length) return;
  const variant = await ProductVariant.findById(payload.variantId).select('sku sizeName');
  const variantLabel = variant?.sku || variant?.sizeName || payload.variantId;

  await deliverNotification({
    title: payload.status === 'OUT_OF_STOCK' ? 'Sản phẩm đã hết hàng' : 'Cảnh báo tồn kho thấp',
    body:
      payload.status === 'OUT_OF_STOCK'
        ? `Biến thể ${variantLabel} đã hết hàng.`
        : `Biến thể ${variantLabel} chỉ còn ${payload.quantity} (ngưỡng ${payload.threshold}).`,
    type: 'LOW_STOCK',
    referenceId: payload.variantId,
    referenceType: 'ProductVariant',
    actionUrl: '/warehouse/stock',
    priority: 'HIGH',
    dedupeKey: `LOW_STOCK:${payload.stockLevelId}:${payload.status}`,
    recipients,
    channelPreferences: { IN_APP: true, EMAIL: true },
    payload,
    sourceEventId: payload.eventId,
  });
};

interface DeliverNotificationParams {
  title: string;
  body: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  dedupeKey: string;
  recipients: string[];
  channelPreferences: { IN_APP?: boolean; EMAIL?: boolean };
  payload?: any;
  sourceEventId?: string;
}

const isSmtpConfigured = () =>
  Boolean(process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS);

const isStorePolicyEnabled = (
  channel: NotificationChannel,
  params: DeliverNotificationParams,
  settings: { notifyEmail: boolean; newOrder: boolean; lowStock: boolean }
) => {
  if (channel === NotificationChannel.EMAIL && !settings.notifyEmail) return false;
  if (params.type === 'ORDER' && !settings.newOrder) return false;
  if (params.type === 'LOW_STOCK' && !settings.lowStock) return false;
  return true;
};

const isUserPreferenceEnabled = (
  preference: {
    channels: { inAppEnabled: boolean; emailEnabled: boolean };
    types: Record<string, { inAppEnabled?: boolean; emailEnabled?: boolean }>;
  },
  type: string,
  channel: NotificationChannel
) => {
  const typePreference = preference.types?.[type] || {};
  if (channel === NotificationChannel.IN_APP) {
    if (!preference.channels.inAppEnabled) return false;
    if (typeof typePreference.inAppEnabled === 'boolean') return typePreference.inAppEnabled;
    return true;
  }
  if (channel === NotificationChannel.EMAIL) {
    if (!preference.channels.emailEnabled) return false;
    if (typeof typePreference.emailEnabled === 'boolean') return typePreference.emailEnabled;
    return true;
  }
  return true;
};

const deliverNotification = async (params: DeliverNotificationParams) => {
  try {
    const notification = await Notification.create({
      title: params.title,
      body: params.body,
      type: params.type,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      actionUrl: params.actionUrl,
      priority: params.priority || 'NORMAL',
      data: params.payload,
      dedupeKey: params.dedupeKey,
      sourceEventId: params.sourceEventId || crypto.randomUUID(),
    });

    const uniqueRecipients = Array.from(new Set(params.recipients.map((recipient) => recipient.toString())));
    if (uniqueRecipients.length === 0) return;

    const [users, preferenceMap, storeSettings] = await Promise.all([
      User.find({ _id: { $in: uniqueRecipients } }).select('_id email'),
      getNotificationPreferencesMap(uniqueRecipients),
      getOrCreateSettings(),
    ]);
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const inAppRecipients: string[] = [];
    const inAppLogIdsByUser = new Map<string, string>();

    for (const userId of uniqueRecipients) {
      const preference = preferenceMap.get(userId);
      const effectivePreference = preference || {
        channels: { inAppEnabled: true, emailEnabled: true, pushEnabled: false },
        types: {},
        ui: { sidebarAutoCollapse: true },
      };

      if (params.channelPreferences.IN_APP) {
        const inAppLog = await createPendingLog({
          notificationId: notification._id.toString(),
          userId,
          provider: NotificationChannel.IN_APP,
        });
        const inAppEnabledByStore = isStorePolicyEnabled(NotificationChannel.IN_APP, params, storeSettings);
        const inAppEnabledByUser = isUserPreferenceEnabled(effectivePreference, params.type, NotificationChannel.IN_APP);
        if (!inAppEnabledByStore) {
          await markDeliverySkipped(inAppLog._id.toString(), 'CHANNEL_DISABLED', 'IN_APP disabled by store policy');
        } else if (!inAppEnabledByUser) {
          await markDeliverySkipped(inAppLog._id.toString(), 'USER_OPTED_OUT', 'IN_APP disabled by user preference');
        } else {
          inAppRecipients.push(userId);
          inAppLogIdsByUser.set(userId, inAppLog._id.toString());
        }
      }

      if (params.channelPreferences.EMAIL) {
        const emailLog = await createPendingLog({
          notificationId: notification._id.toString(),
          userId,
          provider: NotificationChannel.EMAIL,
        });
        const emailEnabledByStore = isStorePolicyEnabled(NotificationChannel.EMAIL, params, storeSettings);
        const emailEnabledByUser = isUserPreferenceEnabled(effectivePreference, params.type, NotificationChannel.EMAIL);
        const targetUser = userMap.get(userId);

        if (!emailEnabledByStore) {
          await markDeliverySkipped(emailLog._id.toString(), 'CHANNEL_DISABLED', 'EMAIL disabled by store policy');
          continue;
        }
        if (!emailEnabledByUser) {
          await markDeliverySkipped(emailLog._id.toString(), 'USER_OPTED_OUT', 'EMAIL disabled by user preference');
          continue;
        }
        if (!targetUser?.email) {
          await markDeliverySkipped(emailLog._id.toString(), 'NO_EMAIL', 'User email not found');
          continue;
        }
        if (!isSmtpConfigured()) {
          await markDeliveryFailed(emailLog._id.toString(), 'SMTP is not configured');
          continue;
        }

        try {
          const providerMessageId = await sendNotificationEmail({
            toEmail: targetUser.email,
            title: params.title,
            body: params.body,
            actionUrl: params.actionUrl,
          });
          await markDeliverySent(emailLog._id.toString(), providerMessageId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to send notification email';
          await markDeliveryFailed(emailLog._id.toString(), message);
        }
      }
    }

    if (inAppRecipients.length > 0) {
      const userNotifications = inAppRecipients.map((userId) => ({
        user: userId,
        notification: notification._id,
      }));
      const createdUserNotifications = await UserNotification.insertMany(userNotifications);
      for (const inserted of createdUserNotifications) {
        const userId = inserted.user.toString();
        const logId = inAppLogIdsByUser.get(userId);
        if (logId) {
          await markDeliverySent(logId);
        }

        emitNotificationToUser(userId, {
          _id: inserted._id.toString(),
          isRead: false,
          readAt: inserted.readAt || undefined,
          createdAt: inserted.createdAt.toISOString(),
          notification: {
            _id: notification._id.toString(),
            title: notification.title,
            body: notification.body,
            type: notification.type,
            actionUrl: notification.actionUrl || undefined,
            priority: notification.priority || undefined,
            data: notification.data || {},
            createdAt: notification.createdAt.toISOString(),
          },
        });
      }
    }

  } catch (error: any) {
    if (error.code === 11000) {
      console.log(`[NotificationOrchestrator] Dedupe hit for key ${params.dedupeKey}. Ignoring duplicate.`);
      return;
    }
    throw error;
  }
};
