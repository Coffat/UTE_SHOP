export type AiStreamEventName = 'token' | 'handoff' | 'done' | 'error';

export interface AiTokenEventData {
  text: string;
}

export interface AiHandoffEventData {
  required: true;
  reason: string;
}

export interface AiDoneEventData {
  messageId: string;
  conversationId: string;
}

export interface AiErrorEventData {
  message: string;
}

export interface AiProviderChunk {
  text: string;
}

export interface AiProviderFinal {
  fullText: string;
  latencyMs: number;
}

export interface AiModelTag {
  name: string;
}

export interface AiHealthResult {
  ok: boolean;
  reachable: boolean;
  modelAvailable: boolean;
  message: string;
  checkedModel: string;
}

export interface AiPromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiHandoffDecision {
  required: boolean;
  reason: string | null;
}

