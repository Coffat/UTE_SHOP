import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import {
  assignConversation,
  getConversationOrThrowWithAccess,
  getMessagePage,
  getOrCreateCurrentConversation,
  listStaffConversations,
  markConversationRead,
  updateConversationStatus,
} from '../services/conversation.service.js';
import { createSystemEventMessage, sendMessage } from '../services/message.service.js';
import { DEFAULT_MESSAGE_PAGE_SIZE, type ChatConversationStatus } from '../constants/chat.constants.js';
import { isChatHttpError } from '../services/chat.errors.js';
import {
  emitConversationUpdated,
  emitNewMessage,
  emitStaffInboxConversationUpdated,
  emitStaffAssigned,
} from '../socket/chat.socket.js';

const extractUserId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    // Populated Mongoose document: { _id: ObjectId, ... }
    if (value._id) return value._id.toString();
    // Bare Mongoose/BSON ObjectId — .toString() returns the 24-char hex string.
    // Do NOT use value.id here: on Mongoose ObjectId that property is a raw Buffer.
    const str = String(value);
    if (str && str !== '[object Object]') return str;
  }
  return null;
};

const getParticipantUserIds = (conversation: any) => {
  const ids = new Set<string>();
  const customerId = extractUserId(conversation?.customerId);
  const staffId = extractUserId(conversation?.assignedStaffId);
  if (customerId) ids.add(customerId);
  if (staffId) ids.add(staffId);
  return [...ids];
};

const shouldBroadcastMessageToStaffInbox = (conversation: any) =>
  conversation?.status === 'waiting_staff';

const getActor = (req: Request) => {
  if (!req.user) throw new Error('Unauthorized');
  return { id: req.user.id, role: req.user.role };
};

const sendChatError = (res: Response, error: unknown) => {
  if (isChatHttpError(error)) return sendError(res, error.statusCode, error.message);
  const fallbackMessage = error instanceof Error ? error.message : 'Internal Server Error';
  return sendError(res, 500, fallbackMessage);
};

export const customerCreateOrGetCurrent = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    if (actor.role !== 'CUSTOMER') return sendError(res, 403, 'Chỉ customer mới được tạo hội thoại');
    const conversation = await getOrCreateCurrentConversation(actor.id);
    return sendSuccess(res, 200, 'OK', conversation);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const customerGetMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const before = (req.query.before as string | undefined) ?? undefined;
    const limit = Number(req.query.limit ?? DEFAULT_MESSAGE_PAGE_SIZE);

    await getConversationOrThrowWithAccess(conversationId, actor);
    const payload = await getMessagePage(conversationId, before, limit);
    await markConversationRead(conversationId, actor);

    return sendSuccess(res, 200, 'OK', payload);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const customerSendMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const { content, clientMessageId } = req.body as { content: string; clientMessageId?: string };

    const result = await sendMessage({ conversationId, actor, content, clientMessageId });

    emitNewMessage(conversationId, result.message, getParticipantUserIds(result.conversation), {
      includeStaffInbox: shouldBroadcastMessageToStaffInbox(result.conversation),
    });

    // When a resolved conversation is reopened by the customer, emit a notice
    // so both sides know AI is handling the conversation again.
    if (result.wasReopened) {
      const reopenMsg = await createSystemEventMessage(
        result.conversation._id,
        'Trợ lý AI đang hỗ trợ bạn. Bạn có thể tiếp tục đặt câu hỏi.',
        { event: 'conversation_reopened' }
      );
      emitNewMessage(conversationId, reopenMsg, getParticipantUserIds(result.conversation), {
        includeStaffInbox: true,
      });
    }

    emitConversationUpdated(conversationId, result.conversation);
    emitStaffInboxConversationUpdated(result.conversation);

    return sendSuccess(res, 201, 'Gửi tin nhắn thành công', result);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const staffListConversations = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const status = req.query.status as ChatConversationStatus | undefined;
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? DEFAULT_MESSAGE_PAGE_SIZE);

    const payload = await listStaffConversations({
      actor,
      status,
      search,
      page,
      limit,
    });

    return sendSuccess(res, 200, 'OK', payload);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const staffAssignConversation = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const conversation = await assignConversation(conversationId, actor);

    // assignedStaffId is populated by assignConversation — use the real name when available.
    const staffDoc = conversation.assignedStaffId as any;
    const staffName: string = staffDoc?.fullName || staffDoc?.email || actor.id;

    const systemMessage = await createSystemEventMessage(
      conversation._id,
      `Nhân viên ${staffName} đã nhận cuộc trò chuyện`,
      { event: 'staff_assigned', staffId: actor.id, staffName }
    );

    emitNewMessage(conversationId, systemMessage, getParticipantUserIds(conversation), {
      includeStaffInbox: shouldBroadcastMessageToStaffInbox(conversation),
    });
    emitStaffAssigned(conversationId, {
      conversationId,
      staffId: actor.id,
      staffName,
      assignedAt: new Date().toISOString(),
    });
    emitConversationUpdated(conversationId, conversation);
    emitStaffInboxConversationUpdated(conversation);

    return sendSuccess(res, 200, 'Nhận hội thoại thành công', conversation);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const staffGetMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const before = (req.query.before as string | undefined) ?? undefined;
    const limit = Number(req.query.limit ?? DEFAULT_MESSAGE_PAGE_SIZE);

    await getConversationOrThrowWithAccess(conversationId, actor);
    const payload = await getMessagePage(conversationId, before, limit);
    await markConversationRead(conversationId, actor);

    return sendSuccess(res, 200, 'OK', payload);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const staffSendMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const { content, clientMessageId } = req.body as { content: string; clientMessageId?: string };
    const result = await sendMessage({ conversationId, actor, content, clientMessageId });

    emitNewMessage(conversationId, result.message, getParticipantUserIds(result.conversation), {
      includeStaffInbox: shouldBroadcastMessageToStaffInbox(result.conversation),
    });
    emitConversationUpdated(conversationId, result.conversation);
    emitStaffInboxConversationUpdated(result.conversation);

    return sendSuccess(res, 201, 'Gửi tin nhắn thành công', result);
  } catch (error) {
    return sendChatError(res, error);
  }
});

const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  staff_handling: 'Nhân viên đang hỗ trợ',
  resolved: 'Đã được xử lý',
  closed: 'Đã đóng',
};

export const staffUpdateConversationStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const status = req.body.status as ChatConversationStatus;

    const conversation = await updateConversationStatus(conversationId, status, actor);

    const statusLabel = CONVERSATION_STATUS_LABELS[status] ?? status;
    const systemMessage = await createSystemEventMessage(
      conversation._id,
      statusLabel,
      { event: 'conversation_status_updated', status }
    );

    emitNewMessage(conversationId, systemMessage, getParticipantUserIds(conversation), {
      includeStaffInbox: shouldBroadcastMessageToStaffInbox(conversation),
    });
    emitConversationUpdated(conversationId, conversation);
    emitStaffInboxConversationUpdated(conversation);

    return sendSuccess(res, 200, 'Cập nhật trạng thái hội thoại thành công', conversation);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const adminListConversations = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const status = req.query.status as ChatConversationStatus | undefined;
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? DEFAULT_MESSAGE_PAGE_SIZE);

    const payload = await listStaffConversations({
      actor,
      status,
      search,
      page,
      limit,
    });

    return sendSuccess(res, 200, 'OK', payload);
  } catch (error) {
    return sendChatError(res, error);
  }
});

export const adminGetMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const before = (req.query.before as string | undefined) ?? undefined;
    const limit = Number(req.query.limit ?? DEFAULT_MESSAGE_PAGE_SIZE);

    await getConversationOrThrowWithAccess(conversationId, actor);
    const payload = await getMessagePage(conversationId, before, limit);
    await markConversationRead(conversationId, actor);

    return sendSuccess(res, 200, 'OK', payload);
  } catch (error) {
    return sendChatError(res, error);
  }
});
