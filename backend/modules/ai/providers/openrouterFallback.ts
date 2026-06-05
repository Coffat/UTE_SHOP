import { getOpenRouterFreeFallbackModelIds } from '../config/aiModelCatalog.js';
import type {
  AiCompleteOptions,
  AiPromptMessage,
  AiProviderFinal,
  EffectiveAiRuntime,
} from '../types/ai.types.js';
import { completeOpenRouterResponse, streamOpenRouterResponse } from './openrouter.provider.js';
import { isOpenRouterRateLimitError, OpenRouterHttpError } from './openrouterErrors.js';

export { isOpenRouterRateLimitError, OpenRouterHttpError } from './openrouterErrors.js';

const withRuntimeModel = (runtime: EffectiveAiRuntime, modelId: string): EffectiveAiRuntime => ({
  ...runtime,
  modelId,
});

const runWithFallback = async (
  runtime: EffectiveAiRuntime,
  invoke: (attempt: EffectiveAiRuntime) => Promise<AiProviderFinal>
): Promise<AiProviderFinal> => {
  const chain = getOpenRouterFreeFallbackModelIds(runtime.modelId);
  let lastRateLimit: OpenRouterHttpError | null = null;

  for (const modelId of chain) {
    const attempt = withRuntimeModel(runtime, modelId);
    try {
      const result = await invoke(attempt);
      const usedModelId = attempt.modelId;
      if (usedModelId !== runtime.modelId) {
        return { ...result, usedModelId, wasFallback: true };
      }
      return { ...result, usedModelId: runtime.modelId, wasFallback: false };
    } catch (error) {
      if (isOpenRouterRateLimitError(error)) {
        lastRateLimit = error;
        continue;
      }
      throw error;
    }
  }

  throw (
    lastRateLimit ??
    new OpenRouterHttpError(
      429,
      'Các model OpenRouter free đang bị rate limit. Vui lòng thử lại sau hoặc Admin chuyển sang Ollama local.'
    )
  );
};

export const streamOpenRouterWithFallback = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  onToken: (text: string) => void,
  signal?: AbortSignal
): Promise<AiProviderFinal> =>
  runWithFallback(runtime, (attempt) =>
    streamOpenRouterResponse(attempt, promptMessages, onToken, signal)
  );

export const completeOpenRouterWithFallback = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  options: AiCompleteOptions = {}
): Promise<AiProviderFinal> =>
  runWithFallback(runtime, (attempt) => completeOpenRouterResponse(attempt, promptMessages, options));
