import { aiConfig } from '../../../config/ai.js';
import type {
  AiAdminHealthResult,
  AiCompleteOptions,
  AiHealthResult,
  AiModelTag,
  AiPromptMessage,
  AiProviderFinal,
  EffectiveAiRuntime,
} from '../types/ai.types.js';

interface OllamaTagResponse {
  models?: AiModelTag[];
}

interface OllamaStreamLine {
  message?: {
    content?: string;
  };
  done?: boolean;
}

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

const parseJsonSafely = <T>(line: string): T | null => {
  try {
    return JSON.parse(line) as T;
  } catch {
    return null;
  }
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

export const listOllamaModelTags = async (timeoutMs = aiConfig.requestTimeoutMs): Promise<AiModelTag[]> => {
  try {
    const response = await fetchWithTimeout(`${aiConfig.ollamaBaseUrl}/api/tags`, { method: 'GET' }, timeoutMs);
    if (!response.ok) return [];
    const body = (await response.json()) as OllamaTagResponse;
    return body.models ?? [];
  } catch {
    return [];
  }
};

export const checkOllamaHealthForRuntime = async (
  runtime: EffectiveAiRuntime
): Promise<AiAdminHealthResult> => {
  const url = `${aiConfig.ollamaBaseUrl}/api/tags`;
  const base = {
    provider: runtime.provider,
    modelId: runtime.modelId,
    runtimeSource: runtime.runtimeSource,
  };

  try {
    const response = await fetchWithTimeout(url, { method: 'GET' }, runtime.requestTimeoutMs);
    if (!response.ok) {
      return {
        ...base,
        ok: false,
        statusCode: 'unreachable',
        message: 'Không kết nối được Ollama service.',
        reachable: false,
        modelAvailable: false,
      };
    }
    const body = (await response.json()) as OllamaTagResponse;
    const models = body.models ?? [];
    const modelAvailable = models.some((model) => model.name === runtime.modelId);
    if (!modelAvailable) {
      return {
        ...base,
        ok: false,
        statusCode: 'model_missing',
        message: `Model ${runtime.modelId} chưa tồn tại trên máy.`,
        reachable: true,
        modelAvailable: false,
      };
    }
    return {
      ...base,
      ok: true,
      statusCode: 'ready',
      message: 'Ollama sẵn sàng.',
      reachable: true,
      modelAvailable: true,
    };
  } catch {
    return {
      ...base,
      ok: false,
      statusCode: 'unreachable',
      message: 'Không thể kết nối Ollama. Vui lòng kiểm tra dịch vụ local.',
      reachable: false,
      modelAvailable: false,
    };
  }
};

/** @deprecated Use checkOllamaHealthForRuntime with effective runtime */
export const checkOllamaHealth = async (): Promise<AiHealthResult> => {
  const runtime: EffectiveAiRuntime = {
    provider: 'ollama',
    modelId: aiConfig.ollamaModel,
    runtimeSource: 'env_default',
    requestTimeoutMs: aiConfig.requestTimeoutMs,
    maxPredictTokens: aiConfig.maxPredictTokens,
    temperature: aiConfig.temperature,
    toolDecisionMaxPredictTokens: aiConfig.toolDecisionMaxPredictTokens,
    toolDecisionTemperature: aiConfig.toolDecisionTemperature,
  };
  const result = await checkOllamaHealthForRuntime(runtime);
  return {
    ok: result.ok,
    reachable: result.reachable ?? false,
    modelAvailable: result.modelAvailable ?? false,
    checkedModel: runtime.modelId,
    message: result.message,
  };
};

export const streamOllamaResponse = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  onToken: (text: string) => void,
  signal?: AbortSignal
): Promise<AiProviderFinal> => {
  const start = Date.now();
  const timeoutController = new AbortController();
  let finished = false;
  const timeout = setTimeout(() => {
    if (!finished) timeoutController.abort();
  }, runtime.requestTimeoutMs);
  const compositeController = new AbortController();
  const abortComposite = () => compositeController.abort();
  timeoutController.signal.addEventListener('abort', abortComposite, { once: true });
  signal?.addEventListener('abort', abortComposite, { once: true });
  try {
    const response = await fetch(`${aiConfig.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: compositeController.signal,
      body: JSON.stringify({
        model: runtime.modelId,
        messages: promptMessages,
        stream: true,
        options: {
          temperature: runtime.temperature,
          num_predict: runtime.maxPredictTokens,
        },
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('AI service currently unavailable.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        const payload = parseJsonSafely<OllamaStreamLine>(line);
        if (!payload) continue;
        const token = payload.message?.content ?? '';
        if (token) {
          fullText += token;
          onToken(token);
        }
        if (payload.done) {
          return {
            fullText: fullText.trim(),
            latencyMs: Date.now() - start,
          };
        }
      }
    }

    return {
      fullText: fullText.trim(),
      latencyMs: Date.now() - start,
    };
  } finally {
    finished = true;
    clearTimeout(timeout);
  }
};

export const completeOllamaResponse = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  options: AiCompleteOptions = {}
): Promise<AiProviderFinal> => {
  const start = Date.now();
  const timeoutController = new AbortController();
  let finished = false;
  const timeout = setTimeout(() => {
    if (!finished) timeoutController.abort();
  }, runtime.requestTimeoutMs);
  const compositeController = new AbortController();
  const abortComposite = () => compositeController.abort();
  timeoutController.signal.addEventListener('abort', abortComposite, { once: true });
  options.signal?.addEventListener('abort', abortComposite, { once: true });

  try {
    const response = await fetch(`${aiConfig.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: compositeController.signal,
      body: JSON.stringify({
        model: runtime.modelId,
        messages: promptMessages,
        stream: false,
        options: {
          temperature: options.temperature ?? runtime.toolDecisionTemperature,
          num_predict: options.maxPredictTokens ?? runtime.toolDecisionMaxPredictTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('AI service currently unavailable.');
    }

    const payload = (await response.json()) as OllamaChatResponse;
    const fullText = payload.message?.content?.trim() ?? '';
    return {
      fullText,
      latencyMs: Date.now() - start,
    };
  } finally {
    finished = true;
    clearTimeout(timeout);
  }
};
