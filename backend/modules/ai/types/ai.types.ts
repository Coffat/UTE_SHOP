export type AiStreamEventName = 'token' | 'handoff' | 'done' | 'error';

// ---------------------------------------------------------------------------
// Typed AI message metadata
// ---------------------------------------------------------------------------

/**
 * Typed metadata attached to AI-generated messages.
 * Prefer adding named fields here over using the index signature catch-all.
 * The index signature exists only for backward compatibility during migration.
 */
export interface AiMessageMetadata {
  templateType?: 'plain_text' | 'product_suggestions' | 'clarifying';
  /** Inline product suggestion cards rendered below the AI bubble */
  productSuggestions?: Array<{
    id: string;
    name: string;
    slug?: string;
    description?: string;
    mainImageUrl?: string;
    priceFrom?: number;
    inStock?: boolean;
  }>;
  /** Clarifying question chips rendered below the AI bubble (Pass3 output) */
  clarifyingQuestions?: string[];
  /** Intent confidence score from the resolver (0–1) */
  confidence?: number;
  /** Handoff reason code if this message triggered staff escalation */
  handoffReason?: string | null;
  /** How the response was generated */
  responseMode?: 'stream' | 'deterministic';
  /** Which internal handler produced this message */
  source?: string;
  /** Total latency in ms from request to final token */
  latencyMs?: number;
  /** AI provider id used for this response */
  provider?: string | null;
  /** Model id used for this response */
  model?: string | null;
  /** Catch-all for legacy fields — narrow over time */
  [key: string]: unknown;
}

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

