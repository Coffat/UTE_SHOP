import { api } from "../../lib/api";

export type AiProviderId = "ollama" | "openrouter";
export type AiPriceTier = "free" | "paid";
export type AiRuntimeSource = "store_settings" | "env_default";
export type AiHealthStatusCode =
  | "ready"
  | "not_configured"
  | "unreachable"
  | "model_missing"
  | "ping_failed"
  | "rate_limited";

export interface AiModelCatalogEntry {
  provider: AiProviderId;
  modelId: string;
  label: string;
  priceTier: AiPriceTier;
  enabled: boolean;
  supportsStreaming: boolean;
  supportsJsonProtocol: boolean;
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

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export async function fetchAiModelCatalog(): Promise<AiModelCatalogEntry[]> {
  const response = await api.get("/api/v1/admin/ai/model-catalog");
  const data = unwrap<{ items: AiModelCatalogEntry[] }>(response);
  return data.items;
}

export async function checkAiHealth(input?: {
  provider?: AiProviderId;
  modelId?: string;
  /** full = ping completion; chat_preflight = giống chat khách (nhẹ hơn). */
  mode?: "full" | "chat_preflight";
}): Promise<AiAdminHealthResult> {
  const response = await api.get("/api/v1/system/health/ai", {
    params: {
      provider: input?.provider,
      modelId: input?.modelId,
      mode: input?.mode,
    },
    validateStatus: () => true,
  });
  const payload = response.data as {
    success?: boolean;
    message?: string;
    data?: AiAdminHealthResult;
  };
  if (payload?.data) {
    return payload.data;
  }
  throw new Error(payload?.message || "Không thể kiểm tra kết nối AI.");
}
