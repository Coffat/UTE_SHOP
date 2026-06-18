import { eventBus, AppEvent, PaymentSuccessPayload, PaymentFailedPayload } from '../../../shared/utils/eventBus.js';
import { Notification, UserNotification } from '../models/Notification.js';
import User from '../../user/models/User.js';
import crypto from 'crypto';

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
};

const handleOrderCreated = async (payload: any) => {
  const adminIds = await resolveRecipients(['ADMIN']);
  const recipients = [...adminIds, payload.actorId].filter(Boolean);
  
  if (!recipients.length) return;

  const dedupeKey = `ORDER_CREATED:${payload.orderId}`;
  
  await deliverNotification({
    title: 'Đơn hàng mới',
    body: `Đơn hàng ${payload.orderCode} trị giá ${payload.totalAmount.toLocaleString('vi-VN')}đ vừa được tạo.`,
    type: 'ORDER',
    referenceId: payload.orderId,
    referenceType: 'Order',
    dedupeKey,
    recipients,
    channelPreferences: { IN_APP: true, EMAIL: true },
    payload,
    sourceEventId: payload.eventId
  });
};

const handleOrderStatusChanged = async (payload: any) => {
  const adminIds = await resolveRecipients(['ADMIN']);
  const recipients = [...adminIds, payload.actorId].filter(Boolean);
  
  if (!recipients.length) return;

  const dedupeKey = `ORDER_STATUS_CHANGED:${payload.orderId}:${payload.newStatus}`;

  await deliverNotification({
    title: 'Cập nhật đơn hàng',
    body: `Đơn hàng ${payload.orderCode} đã chuyển từ ${payload.oldStatus} sang ${payload.newStatus}.`,
    type: 'ORDER',
    referenceId: payload.orderId,
    referenceType: 'Order',
    dedupeKey,
    recipients,
    channelPreferences: { IN_APP: true, EMAIL: true },
    payload,
    sourceEventId: payload.eventId
  });
};

const handleChatMessageReceived = async (payload: any) => {
  let recipients: string[] = [];

  if (payload.recipientId !== 'UNASSIGNED') {
    recipients = [payload.recipientId];
  } else {
    // If unassigned, notify admins
    const adminIds = await resolveRecipients(['ADMIN']);
    recipients = adminIds.map(id => id.toString());
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
  return users.map(u => u._id);
};

const handlePaymentSuccess = async (payload: PaymentSuccessPayload) => {
  const adminAndSalesIds = await resolveRecipients(['ADMIN', 'SALES']);
  const recipients = [...adminAndSalesIds, payload.actorId].filter(Boolean);

  if (!recipients.length) return;

  const dedupeKey = `PAYMENT_SUCCESS:${payload.paymentId}:${payload.entityId}`;

  await deliverNotification({
    title: 'Thanh toán thành công',
    body: `Đơn hàng của bạn đã được thanh toán thành công qua ${payload.paymentMethod}.`,
    type: AppEvent.PAYMENT_SUCCESS as any,
    referenceId: payload.entityId,
    referenceType: 'ORDER',
    actionUrl: `/orders/${payload.entityId}`,
    priority: 'HIGH',
    dedupeKey,
    recipients,
    channelPreferences: { IN_APP: true, EMAIL: true },
    payload: {
      orderId: payload.entityId,
      paymentId: payload.paymentId,
      paymentMethod: payload.paymentMethod,
      transactionId: payload.transactionId,
    },
    sourceEventId: payload.eventId
  });
};

const handlePaymentFailed = async (payload: PaymentFailedPayload) => {
  const adminIds = await resolveRecipients(['ADMIN']);
  const recipients = [...adminIds, payload.actorId].filter(Boolean);

  if (!recipients.length) return;

  const dedupeKey = `PAYMENT_FAILED:${payload.paymentId}:${payload.entityId}`;

  await deliverNotification({
    title: 'Thanh toán thất bại',
    body: `Đơn hàng của bạn thanh toán thất bại qua ${payload.paymentMethod}. Lý do: ${payload.reason || 'Không rõ'}.`,
    type: AppEvent.PAYMENT_FAILED as any,
    referenceId: payload.entityId,
    referenceType: 'ORDER',
    actionUrl: `/orders/${payload.entityId}`,
    priority: 'HIGH',
    dedupeKey,
    recipients,
    channelPreferences: { IN_APP: true, EMAIL: true },
    payload: {
      orderId: payload.entityId,
      paymentId: payload.paymentId,
      paymentMethod: payload.paymentMethod,
      reason: payload.reason,
    },
    sourceEventId: payload.eventId
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
  recipients: any[];
  channelPreferences: { IN_APP?: boolean; EMAIL?: boolean };
  payload?: any;
  sourceEventId?: string;
}

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

    // Unique recipients
    const uniqueRecipients = Array.from(new Set(params.recipients.map(r => r.toString())));

    if (params.channelPreferences.IN_APP && uniqueRecipients.length > 0) {
      const userNotifications = uniqueRecipients.map(userId => ({
        user: userId,
        notification: notification._id,
      }));
      await UserNotification.insertMany(userNotifications);
    }

    // TODO: Socket emit and async email logic (Phase 3 & 4)

  } catch (error: any) {
    if (error.code === 11000) {
      console.log(`[NotificationOrchestrator] Dedupe hit for key ${params.dedupeKey}. Ignoring duplicate.`);
      return;
    }
    throw error;
  }
};
