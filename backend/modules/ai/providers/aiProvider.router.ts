import type {
  AiAdminHealthResult,
  AiCompleteOptions,
  AiHealthCheckMode,
  AiPromptMessage,
  AiProviderFinal,
  EffectiveAiRuntime,
} from '../types/ai.types.js';
import { checkOllamaHealthForRuntime, completeOllamaResponse, streamOllamaResponse } from './ollama.provider.js';
import { checkOpenRouterHealth } from './openrouter.provider.js';
import {
  completeOpenRouterWithFallback,
  streamOpenRouterWithFallback,
} from './openrouterFallback.js';

export const checkActiveProviderHealth = async (
  runtime: EffectiveAiRuntime,
  options?: { mode?: AiHealthCheckMode }
): Promise<AiAdminHealthResult> => {
  if (runtime.provider === 'openrouter') {
    return checkOpenRouterHealth(runtime, {
      skipPing: options?.mode === 'chat_preflight',
    });
  }
  return checkOllamaHealthForRuntime(runtime);
};

export const streamActiveProviderResponse = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  onToken: (text: string) => void,
  signal?: AbortSignal
): Promise<AiProviderFinal> => {
  if (runtime.provider === 'openrouter') {
    return streamOpenRouterWithFallback(runtime, promptMessages, onToken, signal);
  }
  return streamOllamaResponse(runtime, promptMessages, onToken, signal);
};

export const completeActiveProviderResponse = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  options: AiCompleteOptions = {}
): Promise<AiProviderFinal> => {
  if (runtime.provider === 'openrouter') {
    return completeOpenRouterWithFallback(runtime, promptMessages, options);
  }
  return completeOllamaResponse(runtime, promptMessages, options);
};
