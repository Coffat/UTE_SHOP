import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import {
  CUSTOMER_SENDABLE_STATUSES,
  MAX_MESSAGE_CONTENT_LENGTH,
  STAFF_SENDABLE_STATUSES,
  type ChatMessageType,
} from '../constants/chat.constants.js';
import {
  canSendAsAdmin,
  canSendAsCustomer,
  canSendAsStaff,
} from './chatPermission.service.js';
import { ChatHttpError } from './chat.errors.js';
import { eventBus, AppEvent } from '../../../shared/utils/eventBus.js';
import crypto from 'crypto';

interface Actor {
  id: string;
  role: string;
}

interface SendMessageInput {
  conversationId: string;
  actor: Actor;
  content: string;
  clientMessageId?: string;
  messageType?: ChatMessageType;
  metadata?: Record<string, unknown> | null;
}

const sanitizeContent = (content: string) => {
  return content.replace(/\s+/g, ' ').trim();
};

const toObjectId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ChatHttpError(400, 'conversationId không hợp lệ');
  }
  return new mongoose.Types.ObjectId(id);
};

const shouldReopenConversation = (role: string, status: string) => {
  return role === 'CUSTOMER' && status === 'resolved';
};

export const sendMessage = async ({
  conversationId,
  actor,
  content,
  clientMessageId,
  messageType = 'text',
  metadata = null,
}: SendMessageInput) => {
  const normalized = sanitizeContent(content);
  if (!normalized) throw new ChatHttpError(422, 'Tin nhắn không được để trống');
  if (normalized.length > MAX_MESSAGE_CONTENT_LENGTH) {
    throw new ChatHttpError(422, `Tin nhắn tối đa ${MAX_MESSAGE_CONTENT_LENGTH} ký tự`);
  }

  const conversation = await Conversation.findById(toObjectId(conversationId));
  if (!conversation) throw new ChatHttpError(404, 'Không tìm thấy hội thoại');
  if (conversation.status === 'closed') {
    throw new ChatHttpError(409, 'Hội thoại đã đóng. Vui lòng tạo hội thoại mới.');
  }

  const isCustomerSender = canSendAsCustomer(actor, conversation);
  const isStaffSender = canSendAsStaff(actor, conversation);
  const isAdminSender = canSendAsAdmin(actor, conversation);

  if (!isCustomerSender && !isStaffSender && !isAdminSender) {
    throw new ChatHttpError(403, 'Bạn không có quyền gửi tin nhắn trong hội thoại này');
  }

  if (isCustomerSender && !CUSTOMER_SENDABLE_STATUSES.includes(conversation.status)) {
    throw new ChatHttpError(409, 'Trạng thái hội thoại hiện tại không cho phép customer gửi tin');
  }

  if (isStaffSender && !STAFF_SENDABLE_STATUSES.includes(conversation.status)) {
    throw new ChatHttpError(409, 'Trạng thái hội thoại hiện tại không cho phép staff gửi tin');
  }

  let senderType: 'customer' | 'staff' | 'system' = 'system';
  if (isCustomerSender) senderType = 'customer';
  else if (isStaffSender || isAdminSender) senderType = 'staff';

  let messageDoc: any;
  try {
    messageDoc = await Message.create({
      conversationId: conversation._id,
      senderType,
      senderId: senderType === 'system' ? null : actor.id,
      clientMessageId: senderType === 'system' ? null : (clientMessageId ?? null),
      messageType,
      content: normalized,
      metadata,
    });
  } catch (error: any) {
    if (error?.code === 11000 && clientMessageId) {
      const existing = await Message.findOne({
        conversationId: conversation._id,
        senderId: actor.id,
        clientMessageId,
      });
      if (existing) {
        return { message: existing, conversation };
      }
    }
    throw error;
  }

  const now = new Date();
  conversation.lastMessageAt = now;
  conversation.lastMessagePreview = normalized;
  conversation.lastMessageSenderType = senderType;

  let wasReopened = false;
  if (senderType === 'customer') {
    conversation.lastCustomerMessageAt = now;
    if (shouldReopenConversation(actor.role, conversation.status)) {
      conversation.status = 'waiting_staff';
      conversation.assignedStaffId = null;
      conversation.handoffReason = null;
      conversation.aiFailureCount = 0;
      wasReopened = true;
    }
  }

  if (senderType === 'staff') {
    conversation.lastStaffMessageAt = now;
    conversation.staffLastReadAt = now;
  }

  await conversation.save();

  // Emit chat message received event
  if (senderType === 'staff' || senderType === 'customer') {
    const recipientId = senderType === 'staff' ? conversation.customerId.toString() : conversation.assignedStaffId?.toString();
    
    // Only emit if there is a recipient to notify (e.g., if staff sends to customer, or customer sends to an assigned staff)
    // If a customer sends to an unassigned conversation, notification orchestration will handle notifying all online staffs or admins.
    eventBus.emitAsync(AppEvent.CHAT_MESSAGE_RECEIVED, {
      eventId: crypto.randomUUID(),
      occurredAt: new Date(),
      entityId: conversation._id.toString(),
      actorId: actor.id,
      conversationId: conversation._id.toString(),
      messageId: messageDoc._id.toString(),
      senderType,
      contentPreview: normalized.substring(0, 50) + (normalized.length > 50 ? '...' : ''),
      recipientId: recipientId || 'UNASSIGNED',
    }).catch(err => console.error('[EventBus] Error emitting CHAT_MESSAGE_RECEIVED:', err));
  }

  return { message: messageDoc, conversation, wasReopened };
};

export const createSystemEventMessage = async (
  conversationId: mongoose.Types.ObjectId,
  content: string,
  metadata: Record<string, unknown> | null = null
) => {
  return Message.create({
    conversationId,
    senderType: 'system',
    senderId: null,
    clientMessageId: null,
    messageType: 'system_event',
    content: sanitizeContent(content),
    metadata,
  });
};
