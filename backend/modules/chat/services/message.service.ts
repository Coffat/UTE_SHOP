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

  if (senderType === 'customer') {
    conversation.lastCustomerMessageAt = now;
    if (shouldReopenConversation(actor.role, conversation.status)) {
      conversation.status = 'waiting_staff';
      conversation.assignedStaffId = null;
    }
  }

  if (senderType === 'staff') {
    conversation.lastStaffMessageAt = now;
    conversation.staffLastReadAt = now;
  }

  await conversation.save();

  return { message: messageDoc, conversation };
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
