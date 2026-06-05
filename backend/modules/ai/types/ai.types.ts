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
  /** Model thực tế gọi OpenRouter (khi fallback 429). */
  usedModelId?: string;
  wasFallback?: boolean;
}

export type AiHealthCheckMode = 'full' | 'chat_preflight';

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

export type AiProviderId = 'ollama' | 'openrouter';
export type AiRuntimeSource = 'store_settings' | 'env_default';
export type AiHealthStatusCode =
  | 'ready'
  | 'not_configured'
  | 'unreachable'
  | 'model_missing'
  | 'ping_failed'
  | 'rate_limited';

export interface EffectiveAiRuntime {
  provider: AiProviderId;
  modelId: string;
  runtimeSource: AiRuntimeSource;
  requestTimeoutMs: number;
  maxPredictTokens: number;
  temperature: number;
  toolDecisionMaxPredictTokens: number;
  toolDecisionTemperature: number;
}

export interface AiAdminHealthResult {
  provider: AiProviderId;
  modelId: string;
  runtimeSource: AiRuntimeSource;
  ok: boolean;
  statusCode: AiHealthStatusCode;
  message: string;
  reachable?: boolean;
  modelAvailable?: boolean;
  apiKeyConfigured?: boolean;
  modelListed?: boolean;
  pingOk?: boolean;
}

export interface AiCompleteOptions {
  temperature?: number;
  maxPredictTokens?: number;
  signal?: AbortSignal;
}

