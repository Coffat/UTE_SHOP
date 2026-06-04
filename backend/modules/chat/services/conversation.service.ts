import mongoose from 'mongoose';
import Conversation, { type IConversation } from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../../user/models/User.js';
import {
  DEFAULT_MESSAGE_PAGE_SIZE,
  MAX_MESSAGE_PAGE_SIZE,
  REOPENABLE_STATUSES,
  type ChatConversationStatus,
} from '../constants/chat.constants.js';
import {
  canAssignConversation,
  canViewConversation,
  isAdminRole,
  isStaffChatRole,
} from './chatPermission.service.js';
import { ChatHttpError } from './chat.errors.js';

interface Actor {
  id: string;
  role: string;
}

interface ConversationListQuery {
  actor: Actor;
  status?: ChatConversationStatus;
  page?: number;
  limit?: number;
  search?: string;
}

const toObjectId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ChatHttpError(400, 'conversationId không hợp lệ');
  }
  return new mongoose.Types.ObjectId(id);
};

export const getOrCreateCurrentConversation = async (customerId: string) => {
  const activeConversation = await Conversation.findOne({
    customerId,
    status: { $in: REOPENABLE_STATUSES },
  }).sort({ updatedAt: -1 });

  if (activeConversation) return activeConversation;

  const now = new Date();
  return Conversation.create({
    customerId,
    status: 'waiting_staff',
    customerLastReadAt: now,
  });
};

export const getConversationById = async (conversationId: string) => {
  const conversation = await Conversation.findById(toObjectId(conversationId));
  if (!conversation) throw new ChatHttpError(404, 'Không tìm thấy hội thoại');
  return conversation;
};

export const getConversationOrThrowWithAccess = async (conversationId: string, actor: Actor) => {
  const conversation = await getConversationById(conversationId);
  if (!canViewConversation(actor, conversation)) {
    throw new ChatHttpError(403, 'Bạn không có quyền truy cập hội thoại này');
  }
  return conversation;
};

export const listStaffConversations = async ({
  actor,
  status,
  page = 1,
  limit = DEFAULT_MESSAGE_PAGE_SIZE,
  search,
}: ConversationListQuery) => {
  if (!isStaffChatRole(actor.role) && !isAdminRole(actor.role)) {
    throw new ChatHttpError(403, 'Bạn không có quyền xem danh sách hội thoại');
  }

  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safeLimit = Math.min(MAX_MESSAGE_PAGE_SIZE, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  if (!isAdminRole(actor.role)) {
    filter.$or = [{ status: 'waiting_staff' }, { assignedStaffId: actor.id }];
  }

  if (search?.trim()) {
    const keyword = search.trim();
    const regex = new RegExp(keyword, 'i');
    const users = await User.find({
      role: 'CUSTOMER',
      $or: [{ email: regex }, { phone: regex }, { fullName: regex }],
    })
      .select('_id')
      .limit(200);
    const customerIds = users.map((user) => user._id);
    if (customerIds.length === 0) {
      return { items: [], meta: { total: 0, page: safePage, limit: safeLimit, pages: 0 } };
    }
    filter.customerId = { $in: customerIds };
  }

  const [items, total] = await Promise.all([
    Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('customerId', 'email phone fullName role')
      .populate('assignedStaffId', 'email fullName role'),
    Conversation.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => ({
      ...item.toObject(),
      hasUnreadForStaff:
        item.lastCustomerMessageAt != null &&
        (item.staffLastReadAt == null || item.lastCustomerMessageAt > item.staffLastReadAt),
      hasUnreadForCustomer:
        item.lastStaffMessageAt != null &&
        (item.customerLastReadAt == null || item.lastStaffMessageAt > item.customerLastReadAt),
    })),
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    },
  };
};

export const assignConversation = async (conversationId: string, actor: Actor) => {
  if (!canAssignConversation(actor)) {
    throw new ChatHttpError(403, 'Bạn không có quyền nhận hội thoại');
  }

  const now = new Date();
  const updated = await Conversation.findOneAndUpdate(
    {
      _id: toObjectId(conversationId),
      status: 'waiting_staff',
      assignedStaffId: null,
    },
    {
      $set: {
        assignedStaffId: actor.id,
        status: 'staff_handling',
        staffLastReadAt: now,
      },
    },
    { new: true }
  )
    .populate('customerId', 'email phone fullName role')
    .populate('assignedStaffId', 'email fullName role');

  if (updated) return updated;

  const existing = await Conversation.findById(toObjectId(conversationId));
  if (!existing) throw new ChatHttpError(404, 'Không tìm thấy hội thoại');
  throw new ChatHttpError(409, 'Hội thoại đã được nhân viên khác nhận');
};

export const isAllowedConversationStatusTransition = (
  currentStatus: ChatConversationStatus,
  nextStatus: ChatConversationStatus
) => {
  const transitions: Record<ChatConversationStatus, ChatConversationStatus[]> = {
    waiting_staff: ['staff_handling'],
    staff_handling: ['resolved'],
    resolved: ['closed'],
    closed: [],
  };
  return transitions[currentStatus].includes(nextStatus);
};

export const updateConversationStatus = async (
  conversationId: string,
  nextStatus: ChatConversationStatus,
  actor: Actor
) => {
  const conversation = await getConversationById(conversationId);

  if (!isAdminRole(actor.role)) {
    if (!isStaffChatRole(actor.role)) throw new ChatHttpError(403, 'Không có quyền cập nhật trạng thái');
    if (conversation.assignedStaffId == null || conversation.assignedStaffId.toString() !== actor.id) {
      throw new ChatHttpError(403, 'Bạn chỉ có thể cập nhật hội thoại được phân công cho mình');
    }
  }

  if (!isAllowedConversationStatusTransition(conversation.status, nextStatus)) {
    throw new ChatHttpError(422, `Không thể chuyển trạng thái từ ${conversation.status} sang ${nextStatus}`);
  }

  const now = new Date();
  const updates: Partial<IConversation> = { status: nextStatus };

  if (nextStatus === 'resolved') updates.resolvedAt = now;
  if (nextStatus === 'closed') updates.closedAt = now;

  const updated = await Conversation.findByIdAndUpdate(conversation._id, { $set: updates }, { new: true })
    .populate('customerId', 'email phone fullName role')
    .populate('assignedStaffId', 'email fullName role');
  if (!updated) throw new ChatHttpError(404, 'Không tìm thấy hội thoại');

  return updated;
};

export const markConversationRead = async (conversationId: string, actor: Actor) => {
  const conversation = await getConversationOrThrowWithAccess(conversationId, actor);
  const now = new Date();

  if (actor.role === 'CUSTOMER') {
    conversation.customerLastReadAt = now;
  } else if (isAdminRole(actor.role) || isStaffChatRole(actor.role)) {
    conversation.staffLastReadAt = now;
  }
  await conversation.save();
  return conversation;
};

export const closeConversationBySystem = async (conversationId: mongoose.Types.ObjectId) => {
  return Conversation.findByIdAndUpdate(
    conversationId,
    {
      $set: {
        status: 'closed',
        closedAt: new Date(),
      },
    },
    { new: true }
  );
};

export const getMessagePage = async (conversationId: string, before?: string, limit = DEFAULT_MESSAGE_PAGE_SIZE) => {
  const safeLimit = Math.min(MAX_MESSAGE_PAGE_SIZE, Math.max(1, limit));
  const query: Record<string, unknown> = {
    conversationId: toObjectId(conversationId),
  };

  if (before) {
    if (!mongoose.Types.ObjectId.isValid(before)) {
      throw new ChatHttpError(400, 'before phải là messageId hợp lệ');
    }
    query._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  const rows = await Message.find(query).sort({ _id: -1 }).limit(safeLimit).lean();
  const items = [...rows].reverse();
  const oldest = items[0];
  const hasMore = rows.length === safeLimit;

  return {
    items,
    pagination: {
      limit: safeLimit,
      hasMore,
      nextBefore: oldest?._id?.toString() ?? null,
    },
  };
};
