import mongoose from 'mongoose';
import AiToolCall, { type AiToolCallStatus } from '../models/AiToolCall.js';
import type { AiToolName, ParsedPass1Decision } from '../tools/tool.types.js';

interface RecordAiToolCallInput {
  conversationId: string;
  messageId: string;
  actorId: string;
  actorRole: string;
  toolName: AiToolName;
  status: AiToolCallStatus;
  parserStrategy: ParsedPass1Decision['strategy'];
  argumentsPayload: Record<string, unknown> | null;
  resultPayload: Record<string, unknown> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  durationMs: number;
  provider: string;
  modelName: string;
}

const SENSITIVE_KEYWORDS = ['email', 'phone', 'address', 'payment', 'card', 'token', 'password'];

const sanitizeValue = (value: unknown): unknown => {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (typeof value === 'object') {
    return sanitizeRecord(value as Record<string, unknown>);
  }
  return value;
};

const sanitizeRecord = (input: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const lowered = key.toLowerCase();
    if (SENSITIVE_KEYWORDS.some((token) => lowered.includes(token))) {
      continue;
    }
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
};

const toObjectId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

export const recordAiToolCall = async (input: RecordAiToolCallInput) => {
  try {
    const conversationObjectId = toObjectId(input.conversationId);
    const messageObjectId = toObjectId(input.messageId);
    const actorObjectId = toObjectId(input.actorId);
    if (!conversationObjectId || !messageObjectId || !actorObjectId) {
      console.error('[aiToolCall] skipped log due to invalid object ids');
      return;
    }
    await AiToolCall.create({
      conversationId: conversationObjectId,
      messageId: messageObjectId,
      actorId: actorObjectId,
      actorRole: input.actorRole,
      toolName: input.toolName,
      status: input.status,
      parserStrategy: input.parserStrategy,
      arguments: input.argumentsPayload ? sanitizeRecord(input.argumentsPayload) : null,
      result: input.resultPayload ? sanitizeRecord(input.resultPayload) : null,
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      durationMs: input.durationMs,
      provider: input.provider,
      modelName: input.modelName,
    });
  } catch (error) {
    console.error('[aiToolCall] failed to record tool call', error);
  }
};
