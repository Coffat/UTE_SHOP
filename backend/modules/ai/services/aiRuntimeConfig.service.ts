import { aiConfig } from '../../../config/ai.js';
import { getOrCreateSettings } from '../../admin/repositories/settings.repository.js';
import { assertValidModelSelection, findCatalogEntry } from '../config/aiModelCatalog.js';
import type { AiProviderId, AiRuntimeSource, EffectiveAiRuntime } from '../types/ai.types.js';

const isValidStoredSelection = (provider: string | undefined, modelId: string | undefined) => {
  if (!provider || !modelId) return false;
  return Boolean(findCatalogEntry(provider, modelId));
};

const buildRuntimeFromCatalog = (
  provider: AiProviderId,
  modelId: string,
  runtimeSource: AiRuntimeSource
): EffectiveAiRuntime => ({
  provider,
  modelId,
  runtimeSource,
  requestTimeoutMs: aiConfig.requestTimeoutMs,
  maxPredictTokens: aiConfig.maxPredictTokens,
  temperature: aiConfig.temperature,
  toolDecisionMaxPredictTokens: aiConfig.toolDecisionMaxPredictTokens,
  toolDecisionTemperature: aiConfig.toolDecisionTemperature,
});

export const getEffectiveAiRuntime = async (options?: {
  provider?: string;
  modelId?: string;
}): Promise<EffectiveAiRuntime> => {
  const previewProvider = options?.provider?.trim();
  const previewModelId = options?.modelId?.trim();
  if (previewProvider && previewModelId && isValidStoredSelection(previewProvider, previewModelId)) {
    const entry = assertValidModelSelection(previewProvider, previewModelId);
    return buildRuntimeFromCatalog(entry.provider, entry.modelId, 'store_settings');
  }

  const settings = await getOrCreateSettings();
  const storedProvider = settings.aiProvider as string | undefined;
  const storedModelId = settings.aiModelId as string | undefined;

  let provider: AiProviderId;
  let modelId: string;
  let runtimeSource: AiRuntimeSource;

  if (isValidStoredSelection(storedProvider, storedModelId)) {
    const entry = assertValidModelSelection(storedProvider!, storedModelId!);
    provider = entry.provider;
    modelId = entry.modelId;
    runtimeSource = 'store_settings';
  } else {
    provider = aiConfig.defaultProvider;
    modelId = aiConfig.defaultModelId;
    if (!findCatalogEntry(provider, modelId)) {
      provider = 'ollama';
      modelId = aiConfig.ollamaModel;
    }
    runtimeSource = 'env_default';
  }

  return buildRuntimeFromCatalog(provider, modelId, runtimeSource);
};

export const buildAiMessageMetadata = (
  runtime: EffectiveAiRuntime,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => {
  const requestedModel =
    typeof extra.requestedModel === 'string' ? extra.requestedModel : runtime.modelId;
  const isFallback = Boolean(extra.isFallback);
  return {
    aiProvider: runtime.provider,
    model: runtime.modelId,
    runtimeSource: runtime.runtimeSource,
    requestedProvider: runtime.provider,
    requestedModel,
    isFallback,
    ...extra,
  };
};
