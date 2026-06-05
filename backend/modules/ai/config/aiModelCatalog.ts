export type AiProviderId = 'ollama' | 'openrouter';
export type AiPriceTier = 'free' | 'paid';

export interface AiModelCatalogEntry {
  provider: AiProviderId;
  modelId: string;
  label: string;
  priceTier: AiPriceTier;
  enabled: boolean;
  supportsStreaming: boolean;
  supportsJsonProtocol: boolean;
}

const ollamaEntry = (
  modelId: string,
  label: string
): AiModelCatalogEntry => ({
  provider: 'ollama',
  modelId,
  label,
  priceTier: 'free',
  enabled: true,
  supportsStreaming: true,
  supportsJsonProtocol: true,
});

/** OpenRouter $0 models — đổi model khi một bản bị rate limit (429). */
const openRouterFree = (
  modelId: string,
  label: string,
  supportsJsonProtocol = true
): AiModelCatalogEntry => ({
  provider: 'openrouter',
  modelId,
  label,
  priceTier: 'free',
  enabled: true,
  supportsStreaming: true,
  supportsJsonProtocol,
});

export const AI_MODEL_CATALOG: AiModelCatalogEntry[] = [
  ollamaEntry('gemma4:e4b', 'Gemma 4 E4B — Local Ollama'),

  // Router: OpenRouter tự chọn model free còn quota (giảm 429 trên một model cố định)
  openRouterFree('openrouter/free', 'OpenRouter Free Router — tự luân phiên model free'),

  // Google Gemma
  openRouterFree('google/gemma-4-26b-a4b-it:free', 'Gemma 4 26B A4B IT — OpenRouter Free'),
  openRouterFree('google/gemma-4-31b-it:free', 'Gemma 4 31B IT — OpenRouter Free'),

  // Meta Llama
  openRouterFree('meta-llama/llama-3.2-3b-instruct:free', 'Llama 3.2 3B Instruct — nhanh, free'),
  openRouterFree('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Instruct — chất lượng, free'),

  // Qwen
  openRouterFree('qwen/qwen3-next-80b-a3b-instruct:free', 'Qwen3 Next 80B A3B Instruct — free'),
  openRouterFree('qwen/qwen3-coder:free', 'Qwen3 Coder — free (ưu tiên code/JSON)'),

  // OpenAI OSS
  openRouterFree('openai/gpt-oss-20b:free', 'GPT-OSS 20B — OpenRouter Free'),
  openRouterFree('openai/gpt-oss-120b:free', 'GPT-OSS 120B — OpenRouter Free'),

  // Zhipu / Moonshot / Nous
  openRouterFree('z-ai/glm-4.5-air:free', 'GLM 4.5 Air — OpenRouter Free'),
  openRouterFree('moonshotai/kimi-k2.6:free', 'Kimi K2.6 — OpenRouter Free'),
  openRouterFree('nousresearch/hermes-3-llama-3.1-405b:free', 'Hermes 3 Llama 3.1 405B — free'),

  // NVIDIA Nemotron
  openRouterFree('nvidia/nemotron-3-nano-30b-a3b:free', 'Nemotron 3 Nano 30B — free'),
  openRouterFree('nvidia/nemotron-3-super-120b-a12b:free', 'Nemotron 3 Super 120B — free'),
  openRouterFree('nvidia/nemotron-3-ultra-550b-a55b:free', 'Nemotron 3 Ultra 550B — free (MoE)'),

  // Khác
  openRouterFree(
    'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    'Dolphin Mistral 24B Venice — free'
  ),
  openRouterFree('liquid/lfm-2.5-1.2b-instruct:free', 'Liquid LFM 2.5 1.2B Instruct — free, nhẹ'),
  openRouterFree('liquid/lfm-2.5-1.2b-thinking:free', 'Liquid LFM 2.5 1.2B Thinking — free'),
  openRouterFree('poolside/laguna-m.1:free', 'Poolside Laguna M.1 — free'),
  openRouterFree('poolside/laguna-xs.2:free', 'Poolside Laguna XS.2 — free'),
];

export const getEnabledCatalog = (): AiModelCatalogEntry[] =>
  AI_MODEL_CATALOG.filter((entry) => entry.enabled);

/** Thứ tự thử khi model chính bị OpenRouter 429 (chỉ free). */
export const getOpenRouterFreeFallbackModelIds = (primaryModelId: string): string[] => {
  const freeIds = AI_MODEL_CATALOG.filter(
    (entry) => entry.enabled && entry.provider === 'openrouter' && entry.priceTier === 'free'
  ).map((entry) => entry.modelId);

  const ordered: string[] = [];
  if (primaryModelId !== 'openrouter/free' && freeIds.includes('openrouter/free')) {
    ordered.push('openrouter/free');
  }
  if (freeIds.includes(primaryModelId)) {
    ordered.push(primaryModelId);
  }
  for (const id of freeIds) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
};

export const findCatalogEntry = (
  provider: string,
  modelId: string
): AiModelCatalogEntry | undefined =>
  AI_MODEL_CATALOG.find(
    (entry) => entry.enabled && entry.provider === provider && entry.modelId === modelId
  );

export const assertValidModelSelection = (provider: string, modelId: string): AiModelCatalogEntry => {
  const entry = findCatalogEntry(provider, modelId);
  if (!entry) {
    throw new Error('INVALID_AI_MODEL_SELECTION');
  }
  return entry;
};
