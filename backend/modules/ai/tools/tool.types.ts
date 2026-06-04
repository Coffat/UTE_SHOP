import type { AiPromptMessage } from '../types/ai.types.js';

export const AI_TOOL_NAMES = [
  'handoffToStaff',
  'searchProducts',
  'getProductDetail',
  'checkOrderStatus',
] as const;

export type AiToolName = (typeof AI_TOOL_NAMES)[number];

export interface AiToolCallPayload {
  type: 'tool_call';
  toolName: AiToolName;
  arguments: Record<string, unknown>;
}

export interface AiNoToolPayload {
  type: 'no_tool';
  reason: string;
}

export interface AiHandoffPayload {
  type: 'handoff';
  reason: string;
}

export type AiPass1Decision = AiToolCallPayload | AiNoToolPayload | AiHandoffPayload;

export interface AiToolExecutionContext {
  actorId: string;
  actorRole: string;
  conversationId: string;
  messageId: string;
}

export type AiToolExecutionStatus = 'SUCCESS' | 'FAILED' | 'DENIED' | 'INVALID_REQUEST' | 'TIMEOUT';

export interface AiToolExecutionResult {
  toolName: AiToolName;
  status: AiToolExecutionStatus;
  result: Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  handoffReason: string | null;
}

export interface AiToolHandler<TArgs = Record<string, unknown>> {
  name: AiToolName;
  execute: (
    args: TArgs,
    context: AiToolExecutionContext
  ) => Promise<AiToolExecutionResult>;
}

export interface ParsedPass1Decision {
  ok: boolean;
  strategy: 'strict_json' | 'first_object' | 'invalid';
  decision: AiPass1Decision | null;
  error: string | null;
  rawText: string;
}

export interface AiPass2ContextInput {
  historyMessages: AiPromptMessage[];
  decision: AiPass1Decision;
  toolResult: Record<string, unknown> | null;
}
