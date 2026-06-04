export interface AiRuntimeConfig {
  enabled: boolean;
  provider: 'ollama';
  ollamaBaseUrl: string;
  ollamaModel: string;
  toolCallingEnabled: boolean;
  maxToolCallsPerResponse: number;
  toolDecisionMaxPredictTokens: number;
  toolDecisionTemperature: number;
  enabledToolNames: Array<'handoffToStaff' | 'searchProducts' | 'getProductDetail' | 'checkOrderStatus'>;
  requestTimeoutMs: number;
  streamLockMaxMs: number;
  maxHistoryMessages: number;
  maxPredictTokens: number;
  temperature: number;
}

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const toNumber = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const normalizeBaseUrl = (value: string | undefined) => {
  const raw = value?.trim() || 'http://localhost:11434';
  return raw.replace(/\/+$/, '');
};

const normalizeModel = (value: string | undefined) => {
  const raw = value?.trim();
  return raw && raw.length > 0 ? raw : 'gemma4:e4b';
};

const ALLOWED_TOOL_NAMES = ['handoffToStaff', 'searchProducts', 'getProductDetail', 'checkOrderStatus'] as const;
type AllowedToolName = (typeof ALLOWED_TOOL_NAMES)[number];

const parseEnabledToolNames = (value: string | undefined): AllowedToolName[] => {
  if (!value || value.trim() === '') return [...ALLOWED_TOOL_NAMES];
  const unique = new Set<AllowedToolName>();
  for (const token of value.split(',').map((item) => item.trim()).filter(Boolean)) {
    if ((ALLOWED_TOOL_NAMES as readonly string[]).includes(token)) {
      unique.add(token as AllowedToolName);
    }
  }
  return unique.size > 0 ? [...unique] : [...ALLOWED_TOOL_NAMES];
};

export const aiConfig: AiRuntimeConfig = {
  enabled: toBoolean(process.env.AI_ENABLED, true),
  provider: 'ollama',
  ollamaBaseUrl: normalizeBaseUrl(process.env.OLLAMA_BASE_URL),
  ollamaModel: normalizeModel(process.env.OLLAMA_MODEL),
  toolCallingEnabled: toBoolean(process.env.AI_TOOL_CALLING_ENABLED, true),
  maxToolCallsPerResponse: toNumber(process.env.MAX_TOOL_CALLS_PER_AI_RESPONSE, 1, 0, 1),
  toolDecisionMaxPredictTokens: toNumber(process.env.AI_TOOL_DECISION_MAX_PREDICT_TOKENS, 180, 32, 512),
  toolDecisionTemperature: toNumber(process.env.AI_TOOL_DECISION_TEMPERATURE, 0.1, 0, 1),
  enabledToolNames: parseEnabledToolNames(process.env.AI_ENABLED_TOOL_NAMES),
  requestTimeoutMs: toNumber(process.env.AI_REQUEST_TIMEOUT_MS, 45_000, 5_000, 120_000),
  streamLockMaxMs: toNumber(process.env.AI_STREAM_LOCK_MAX_MS, 120_000, 10_000, 300_000),
  maxHistoryMessages: toNumber(process.env.AI_MAX_HISTORY_MESSAGES, 12, 1, 30),
  maxPredictTokens: toNumber(process.env.AI_MAX_PREDICT_TOKENS, 700, 64, 2048),
  temperature: toNumber(process.env.AI_TEMPERATURE, 0.4, 0, 1.5),
};

