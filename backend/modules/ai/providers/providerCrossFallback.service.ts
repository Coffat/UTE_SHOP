import { aiConfig } from '../../../config/ai.js';
import type { AiHealthCheckMode, EffectiveAiRuntime } from '../types/ai.types.js';
import { buildRuntimeFromCatalog } from '../services/aiRuntimeConfig.service.js';
import { checkActiveProviderHealth } from './aiProvider.router.js';

export const PROVIDER_UNAVAILABLE_HANDOFF_REASON = 'provider_unavailable';

/** Thông báo thân thiện khi mọi AI provider đều không khả dụng. */
export const STAFF_WAIT_USER_MESSAGE =
  'Vui lòng chờ kết nối tới nhân viên nhé. Mình đã chuyển yêu cầu của bạn sang nhân viên hỗ trợ.';

const readOpenRouterApiKey = (): string =>
  (process.env.OPENROUTER_API_KEY ?? aiConfig.openrouterApiKey ?? '').trim();

const runtimeKey = (runtime: EffectiveAiRuntime) => `${runtime.provider}:${runtime.modelId}`;

const uniqueRuntimes = (runtimes: EffectiveAiRuntime[]): EffectiveAiRuntime[] => {
  const seen = new Set<string>();
  return runtimes.filter((runtime) => {
    const key = runtimeKey(runtime);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Các provider/model dự phòng khi provider chính không khả dụng. */
export const buildAlternateProviderRuntimes = (
  primary: EffectiveAiRuntime
): EffectiveAiRuntime[] => {
  const alternates: EffectiveAiRuntime[] = [];

  if (primary.provider !== 'openrouter' && readOpenRouterApiKey()) {
    alternates.push(buildRuntimeFromCatalog('openrouter', 'openrouter/free', 'env_default'));
  }

  if (primary.provider !== 'ollama') {
    alternates.push(buildRuntimeFromCatalog('ollama', aiConfig.ollamaModel, 'env_default'));
  }

  if (
    aiConfig.defaultProvider !== primary.provider &&
    aiConfig.defaultModelId &&
    (aiConfig.defaultProvider !== 'openrouter' || readOpenRouterApiKey())
  ) {
    alternates.push(
      buildRuntimeFromCatalog(aiConfig.defaultProvider, aiConfig.defaultModelId, 'env_default')
    );
  }

  return uniqueRuntimes(alternates).filter((runtime) => runtimeKey(runtime) !== runtimeKey(primary));
};

export const buildProviderAttemptChain = (primary: EffectiveAiRuntime): EffectiveAiRuntime[] =>
  uniqueRuntimes([primary, ...buildAlternateProviderRuntimes(primary)]);

export type ResolvedHealthyRuntime = {
  runtime: EffectiveAiRuntime;
  requestedRuntime: EffectiveAiRuntime;
  usedCrossProviderFallback: boolean;
};

/**
 * Kiểm tra provider chính; nếu lỗi thì thử lần lượt các provider đã cấu hình khác.
 */
export const resolveHealthyRuntimeWithFallback = async (
  primary: EffectiveAiRuntime,
  options?: { mode?: AiHealthCheckMode }
): Promise<ResolvedHealthyRuntime | null> => {
  for (const runtime of buildProviderAttemptChain(primary)) {
    const health = await checkActiveProviderHealth(runtime, options);
    if (health.ok) {
      return {
        runtime,
        requestedRuntime: primary,
        usedCrossProviderFallback:
          runtime.provider !== primary.provider || runtime.modelId !== primary.modelId,
      };
    }
  }
  return null;
};

export class ProviderUnavailableError extends Error {
  constructor() {
    super('PROVIDER_UNAVAILABLE');
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * Gọi stream/complete lần lượt trên chuỗi provider cho tới khi thành công.
 */
export const invokeWithProviderFallback = async <T extends { usedModelId?: string; wasFallback?: boolean }>(
  primary: EffectiveAiRuntime,
  invoke: (runtime: EffectiveAiRuntime) => Promise<T>
): Promise<T & { usedCrossProviderFallback: boolean; usedRuntime: EffectiveAiRuntime }> => {
  const chain = buildProviderAttemptChain(primary);

  for (const runtime of chain) {
    try {
      const result = await invoke(runtime);
      return {
        ...result,
        usedRuntime: runtime,
        usedCrossProviderFallback:
          runtime.provider !== primary.provider || runtime.modelId !== primary.modelId,
        usedModelId: result.usedModelId ?? runtime.modelId,
      };
    } catch {
      // try next provider in chain
    }
  }

  throw new ProviderUnavailableError();
};
