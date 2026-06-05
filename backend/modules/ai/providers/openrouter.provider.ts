import { aiConfig } from '../../../config/ai.js';
import type {
  AiAdminHealthResult,
  AiCompleteOptions,
  AiPromptMessage,
  AiProviderFinal,
  EffectiveAiRuntime,
} from '../types/ai.types.js';

interface OpenRouterModelRow {
  id?: string;
}

interface OpenRouterModelsResponse {
  data?: OpenRouterModelRow[];
}

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    message?: { content?: string };
  }>;
}

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

const readOpenRouterApiKey = (): string =>
  (process.env.OPENROUTER_API_KEY ?? aiConfig.openrouterApiKey ?? '').trim();

const buildOpenRouterHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${readOpenRouterApiKey()}`,
  };
  if (aiConfig.openrouterSiteUrl) {
    // OpenRouter docs use HTTP-Referer; Node fetch also accepts Referer.
    headers['HTTP-Referer'] = aiConfig.openrouterSiteUrl;
    headers.Referer = aiConfig.openrouterSiteUrl;
  }
  if (aiConfig.openrouterAppName) {
    headers['X-Title'] = aiConfig.openrouterAppName;
  }
  return headers;
};

const isRateLimitStatus = (status: number) => status === 429;

const isModelListed = (rows: OpenRouterModelRow[], modelId: string) =>
  rows.some((row) => row.id === modelId || row.id?.endsWith(`/${modelId}`));

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

import { OpenRouterHttpError } from './openrouterErrors.js';

const mapOpenRouterErrorMessage = (status: number): string => {
  if (isRateLimitStatus(status)) {
    return 'Model OpenRouter free đang bị rate limit tạm thời. Vui lòng thử lại sau hoặc chuyển sang Ollama local trong Admin.';
  }
  if (status === 401 || status === 403) {
    return 'OpenRouter chưa được cấu hình đúng API key trên server.';
  }
  return 'OpenRouter tạm thời không khả dụng. Mình sẽ chuyển bạn đến nhân viên hỗ trợ.';
};

const throwForHttpStatus = (status: number) => {
  throw new OpenRouterHttpError(status, mapOpenRouterErrorMessage(status));
};

const checkModelListed = async (modelId: string): Promise<boolean> => {
  const response = await fetchWithTimeout(
    `${aiConfig.openrouterBaseUrl}/models`,
    { method: 'GET', headers: buildOpenRouterHeaders() },
    aiConfig.requestTimeoutMs
  );
  if (!response.ok) return false;
  const body = (await response.json()) as OpenRouterModelsResponse;
  const rows = body.data ?? [];
  return isModelListed(rows, modelId);
};

const pingOpenRouter = async (
  runtime: EffectiveAiRuntime
): Promise<{ ok: boolean; status: number; rateLimited: boolean }> => {
  const response = await fetchWithTimeout(
    `${aiConfig.openrouterBaseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: buildOpenRouterHeaders(),
      body: JSON.stringify({
        model: runtime.modelId,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        temperature: 0,
        stream: false,
      }),
    },
    aiConfig.requestTimeoutMs
  );
  return {
    ok: response.ok,
    status: response.status,
    rateLimited: isRateLimitStatus(response.status),
  };
};

export const checkOpenRouterHealth = async (
  runtime: EffectiveAiRuntime,
  options?: { skipPing?: boolean }
): Promise<AiAdminHealthResult> => {
  const apiKeyConfigured = readOpenRouterApiKey().length > 0;
  const base = {
    provider: runtime.provider,
    modelId: runtime.modelId,
    runtimeSource: runtime.runtimeSource,
  };

  if (!apiKeyConfigured) {
    return {
      ...base,
      ok: false,
      statusCode: 'not_configured',
      message: 'OPENROUTER_API_KEY chưa được cấu hình trên server.',
      apiKeyConfigured: false,
      modelListed: false,
      reachable: false,
      modelAvailable: false,
      pingOk: false,
    };
  }

  try {
    const modelListed = await checkModelListed(runtime.modelId);
    if (!modelListed) {
      return {
        ...base,
        ok: false,
        statusCode: 'model_missing',
        message: `Model ${runtime.modelId} không có trong danh sách OpenRouter.`,
        apiKeyConfigured: true,
        modelListed: false,
        reachable: true,
        modelAvailable: false,
        pingOk: false,
      };
    }

    let pingOk: boolean | undefined;
    if (options?.skipPing) {
      return {
        ...base,
        ok: true,
        statusCode: 'ready',
        message:
          'OpenRouter sẵn sàng (kiểm tra nhẹ — không gọi completion). Chat sẽ tự thử model free khác nếu bị rate limit.',
        apiKeyConfigured: true,
        modelListed: true,
        reachable: true,
        modelAvailable: true,
        pingOk: undefined,
      };
    }

    if (aiConfig.healthPingEnabled) {
      const pingResult = await pingOpenRouter(runtime);
      pingOk = pingResult.ok;
      if (!pingResult.ok) {
        if (pingResult.rateLimited) {
          return {
            ...base,
            ok: false,
            statusCode: 'rate_limited',
            message:
              'API key hợp lệ nhưng model free đang bị rate limit tạm thời. Thử lại sau vài phút hoặc chuyển Ollama local.',
            apiKeyConfigured: true,
            modelListed: true,
            reachable: true,
            modelAvailable: true,
            pingOk: false,
          };
        }
        return {
          ...base,
          ok: false,
          statusCode: 'ping_failed',
          message: `OpenRouter không phản hồi completion ping (HTTP ${pingResult.status}).`,
          apiKeyConfigured: true,
          modelListed: true,
          reachable: true,
          modelAvailable: true,
          pingOk: false,
        };
      }
    }

    return {
      ...base,
      ok: true,
      statusCode: 'ready',
      message: 'OpenRouter sẵn sàng.',
      apiKeyConfigured: true,
      modelListed: true,
      reachable: true,
      modelAvailable: true,
      pingOk,
    };
  } catch {
    return {
      ...base,
      ok: false,
      statusCode: 'unreachable',
      message: 'Không thể kết nối OpenRouter.',
      apiKeyConfigured: true,
      modelListed: false,
      reachable: false,
      modelAvailable: false,
      pingOk: false,
    };
  }
};

export const streamOpenRouterResponse = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  onToken: (text: string) => void,
  signal?: AbortSignal
): Promise<AiProviderFinal> => {
  if (!readOpenRouterApiKey()) {
    throw new Error('OpenRouter chưa được cấu hình API key trên server.');
  }

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
    const response = await fetch(`${aiConfig.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: buildOpenRouterHeaders(),
      signal: compositeController.signal,
      body: JSON.stringify({
        model: runtime.modelId,
        messages: promptMessages,
        stream: true,
        temperature: runtime.temperature,
        max_tokens: runtime.maxPredictTokens,
      }),
    });

    if (!response.ok || !response.body) {
      throwForHttpStatus(response.status);
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
        if (!line || !line.startsWith('data:')) continue;
        const payloadText = line.slice(5).trim();
        if (payloadText === '[DONE]') {
          return { fullText: fullText.trim(), latencyMs: Date.now() - start };
        }
        try {
          const payload = JSON.parse(payloadText) as OpenRouterStreamChunk;
          const token = payload.choices?.[0]?.delta?.content ?? '';
          if (token) {
            fullText += token;
            onToken(token);
          }
        } catch {
          // skip malformed SSE chunk
        }
      }
    }

    return { fullText: fullText.trim(), latencyMs: Date.now() - start };
  } finally {
    finished = true;
    clearTimeout(timeout);
  }
};

export const completeOpenRouterResponse = async (
  runtime: EffectiveAiRuntime,
  promptMessages: AiPromptMessage[],
  options: AiCompleteOptions = {}
): Promise<AiProviderFinal> => {
  if (!readOpenRouterApiKey()) {
    throw new Error('OpenRouter chưa được cấu hình API key trên server.');
  }

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
    const response = await fetch(`${aiConfig.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: buildOpenRouterHeaders(),
      signal: compositeController.signal,
      body: JSON.stringify({
        model: runtime.modelId,
        messages: promptMessages,
        stream: false,
        temperature: options.temperature ?? runtime.toolDecisionTemperature,
        max_tokens: options.maxPredictTokens ?? runtime.toolDecisionMaxPredictTokens,
      }),
    });

    if (!response.ok) {
      throwForHttpStatus(response.status);
    }

    const payload = (await response.json()) as OpenRouterChatResponse;
    const fullText = payload.choices?.[0]?.message?.content?.trim() ?? '';
    return { fullText, latencyMs: Date.now() - start };
  } finally {
    finished = true;
    clearTimeout(timeout);
  }
};
