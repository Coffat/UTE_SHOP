import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { sendMessage } from '../services/message.service.js';
import {
  getConversationOrThrowWithAccess,
  markConversationRead,
} from '../services/conversation.service.js';
import { isAdminOrStaffRole } from '../services/chatPermission.service.js';
import { authenticateSocket, type SocketAuthUser } from './socketAuth.js';

interface SocketWithUser extends Socket {
  data: Socket['data'] & {
    user?: SocketAuthUser;
  };
}

interface SendMessagePayload {
  conversationId: string;
  content: string;
  clientMessageId?: string;
}

let io: Server | null = null;

const getAllowedOrigins = () => {
  const base = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ];
  const extra = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean)
    : [];
  return [...base, ...extra];
};

const getConversationRoom = (conversationId: string) => `conversation:${conversationId}`;
const getUserRoom = (userId: string) => `user:${userId}`;
const STAFF_INBOX_ROOM = 'staff:inbox';

const requireSocketUser = (socket: SocketWithUser) => {
  const user = socket.data.user;
  if (!user) throw new Error('Socket unauthorized');
  return user;
};

const createSocketRateLimiter = (maxPerMinute: number) => {
  const counters = new Map<string, number>();
  return (socketId: string, eventName: string) => {
    const key = `${socketId}:${eventName}`;
    const nextCount = (counters.get(key) ?? 0) + 1;
    counters.set(key, nextCount);
    setTimeout(() => {
      const current = counters.get(key) ?? 0;
      if (current <= 1) counters.delete(key);
      else counters.set(key, current - 1);
    }, 60_000);
    return nextCount <= maxPerMinute;
  };
};

export const initializeChatSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (getAllowedOrigins().includes(origin)) return callback(null, true);
        return callback(new Error(`Socket CORS blocked origin: ${origin}`));
      },
      credentials: true,
    },
  });

  io.on('connection', async (rawSocket) => {
    const socket = rawSocket as SocketWithUser;
    const allowEvent = createSocketRateLimiter(80);
    try {
      const user = authenticateSocket(socket);
      socket.data.user = user;
      socket.join(getUserRoom(user.id));
      if (isAdminOrStaffRole(user.role)) {
        socket.join(STAFF_INBOX_ROOM);
      }
    } catch (error: any) {
      socket.emit('chat_error', { code: 'UNAUTHORIZED', message: error.message });
      socket.disconnect(true);
      return;
    }

    socket.on('join_conversation', async ({ conversationId }: { conversationId: string }) => {
      try {
        const user = requireSocketUser(socket);
        await getConversationOrThrowWithAccess(conversationId, user);
        socket.join(getConversationRoom(conversationId));
        await markConversationRead(conversationId, user);
      } catch (error: any) {
        socket.emit('chat_error', { code: 'JOIN_DENIED', message: error.message });
      }
    });

    socket.on('leave_conversation', ({ conversationId }: { conversationId: string }) => {
      socket.leave(getConversationRoom(conversationId));
    });

    socket.on('typing_start', async ({ conversationId }: { conversationId: string }) => {
      try {
        const user = requireSocketUser(socket);
        if (!allowEvent(socket.id, 'typing_start')) {
          socket.emit('chat_error', { code: 'RATE_LIMITED', message: 'Bạn thao tác quá nhanh.' });
          return;
        }
        const room = getConversationRoom(conversationId);
        if (!socket.rooms.has(room)) {
          socket.emit('chat_error', { code: 'TYPING_DENIED', message: 'Bạn chưa tham gia hội thoại này' });
          return;
        }
        socket.to(room).emit('typing_started', {
          conversationId,
          userId: user.id,
          role: user.role,
        });
      } catch (error: any) {
        socket.emit('chat_error', { code: 'TYPING_DENIED', message: error.message });
      }
    });

    socket.on('typing_stop', async ({ conversationId }: { conversationId: string }) => {
      try {
        const user = requireSocketUser(socket);
        if (!allowEvent(socket.id, 'typing_stop')) {
          socket.emit('chat_error', { code: 'RATE_LIMITED', message: 'Bạn thao tác quá nhanh.' });
          return;
        }
        const room = getConversationRoom(conversationId);
        if (!socket.rooms.has(room)) {
          socket.emit('chat_error', { code: 'TYPING_DENIED', message: 'Bạn chưa tham gia hội thoại này' });
          return;
        }
        socket.to(room).emit('typing_stopped', {
          conversationId,
          userId: user.id,
          role: user.role,
        });
      } catch (error: any) {
        socket.emit('chat_error', { code: 'TYPING_DENIED', message: error.message });
      }
    });

    socket.on('send_message', async (payload: SendMessagePayload) => {
      try {
        if (!allowEvent(socket.id, 'send_message')) {
          socket.emit('chat_error', { code: 'RATE_LIMITED', message: 'Bạn gửi quá nhanh. Vui lòng thử lại.' });
          return;
        }
        const user = requireSocketUser(socket);
        const result = await sendMessage({
          conversationId: payload.conversationId,
          actor: user,
          content: payload.content,
          clientMessageId: payload.clientMessageId,
        });

        emitNewMessage(payload.conversationId, result.message);
        emitConversationUpdated(payload.conversationId, result.conversation);
        emitStaffInboxConversationUpdated(result.conversation);
      } catch (error: any) {
        socket.emit('chat_error', { code: 'SEND_FAILED', message: error.message });
      }
    });
  });

  return io;
};

export const getChatSocket = () => io;

export const emitNewMessage = (conversationId: string, message: unknown, participantUserIds: string[] = []) => {
  if (!io) return;
  let emitter = io.to(getConversationRoom(conversationId));
  for (const userId of participantUserIds) {
    if (!userId) continue;
    emitter = emitter.to(getUserRoom(userId));
  }
  emitter.emit('new_message', { conversationId, message });
};

export const emitConversationUpdated = (conversationId: string, conversation: unknown) => {
  if (!io) return;
  io.to(getConversationRoom(conversationId)).emit('conversation_updated', { conversationId, conversation });
};

export const emitStaffInboxConversationUpdated = (conversation: any) => {
  if (!io) return;
  io.to(STAFF_INBOX_ROOM).emit('conversation_updated', {
    conversationId: conversation?._id?.toString?.() ?? conversation?._id,
    conversation,
  });
};

export const emitStaffAssigned = (conversationId: string, payload: unknown) => {
  if (!io) return;
  io.to(getConversationRoom(conversationId)).emit('staff_assigned', payload);
  io.to(STAFF_INBOX_ROOM).emit('staff_assigned', payload);
};
