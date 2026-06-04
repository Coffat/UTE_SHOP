import { aiConfig } from '../../../config/ai.js';
import type {
  AiHealthResult,
  AiModelTag,
  AiPromptMessage,
  AiProviderFinal,
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

interface OllamaCompleteOptions {
  temperature?: number;
  maxPredictTokens?: number;
  signal?: AbortSignal;
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

export const checkOllamaHealth = async (): Promise<AiHealthResult> => {
  const url = `${aiConfig.ollamaBaseUrl}/api/tags`;
  try {
    const response = await fetchWithTimeout(url, { method: 'GET' }, aiConfig.requestTimeoutMs);
    if (!response.ok) {
      return {
        ok: false,
        reachable: false,
        modelAvailable: false,
        checkedModel: aiConfig.ollamaModel,
        message: 'Không kết nối được Ollama service.',
      };
    }
    const body = (await response.json()) as OllamaTagResponse;
    const models = body.models ?? [];
    const modelAvailable = models.some((model) => model.name === aiConfig.ollamaModel);
    if (!modelAvailable) {
      return {
        ok: false,
        reachable: true,
        modelAvailable: false,
        checkedModel: aiConfig.ollamaModel,
        message: `Model ${aiConfig.ollamaModel} chưa tồn tại trên máy.`,
      };
    }
    return {
      ok: true,
      reachable: true,
      modelAvailable: true,
      checkedModel: aiConfig.ollamaModel,
      message: 'Ollama sẵn sàng.',
    };
  } catch {
    return {
      ok: false,
      reachable: false,
      modelAvailable: false,
      checkedModel: aiConfig.ollamaModel,
      message: 'Không thể kết nối Ollama. Vui lòng kiểm tra dịch vụ local.',
    };
  }
};

export const streamOllamaResponse = async (
  promptMessages: AiPromptMessage[],
  onToken: (text: string) => void,
  signal?: AbortSignal
): Promise<AiProviderFinal> => {
  const start = Date.now();
  const timeoutController = new AbortController();
  let finished = false;
  const timeout = setTimeout(() => {
    if (!finished) timeoutController.abort();
  }, aiConfig.requestTimeoutMs);
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
        model: aiConfig.ollamaModel,
        messages: promptMessages,
        stream: true,
        options: {
          temperature: aiConfig.temperature,
          num_predict: aiConfig.maxPredictTokens,
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
  promptMessages: AiPromptMessage[],
  options: OllamaCompleteOptions = {}
): Promise<AiProviderFinal> => {
  const start = Date.now();
  const timeoutController = new AbortController();
  let finished = false;
  const timeout = setTimeout(() => {
    if (!finished) timeoutController.abort();
  }, aiConfig.requestTimeoutMs);
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
        model: aiConfig.ollamaModel,
        messages: promptMessages,
        stream: false,
        options: {
          temperature: options.temperature ?? aiConfig.temperature,
          num_predict: options.maxPredictTokens ?? aiConfig.maxPredictTokens,
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

