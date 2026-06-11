import Conversation from '../../chat/models/Conversation.js';

interface StreamLockState {
  startedAt: number;
}

const streamLocks = new Map<string, StreamLockState>();

export const acquireConversationStreamLock = (
  conversationId: string,
  lockMaxMs: number
): void => {
  const current = streamLocks.get(conversationId);
  if (current && Date.now() - current.startedAt < lockMaxMs) {
    throw new Error('STREAM_ALREADY_RUNNING');
  }
  streamLocks.set(conversationId, { startedAt: Date.now() });
};

export const releaseConversationStreamLock = (conversationId: string): void => {
  streamLocks.delete(conversationId);
};

export const isConversationAiFinalizeAllowed = async (conversationId: string): Promise<boolean> => {
  const snapshot = await Conversation.findById(conversationId)
    .select('status assignedStaffId aiEnabled')
    .lean();
  if (!snapshot) return false;
  if (snapshot.aiEnabled === false) return false;
  if (snapshot.status === 'staff_handling' || snapshot.status === 'closed') return false;
  if (snapshot.assignedStaffId != null) return false;
  return snapshot.status === 'waiting_staff';
};

