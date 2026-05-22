import { api } from "../../lib/api";

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  phone: string;
  address: string;
  timezone: string;
  vnpayActive: boolean;
  codActive: boolean;
  momoActive: boolean;
  vat: string;
  roundPrice: string;
  currency: string;
  notifyEmail: boolean;
  notifySMS: boolean;
  lowStock: boolean;
  newOrder: boolean;
  tfaActive: boolean;
  sessionTimeout: string;
  apiKeyMasked: string;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  webhookUrl: string;
  webhookEnabled: boolean;
  logoUrl: string;
}

export interface RotateApiKeyResult {
  apiKey: string;
  apiKeyMasked: string;
}

export async function fetchAdminSettings(): Promise<StoreSettings> {
  const response = await api.get("/api/v1/admin/settings");
  return response.data.data as StoreSettings;
}

export async function updateAdminSettings(
  payload: Partial<StoreSettings> & { apiKey?: string }
): Promise<StoreSettings> {
  const response = await api.patch("/api/v1/admin/settings", payload);
  return response.data.data as StoreSettings;
}

export async function rotateAdminApiKey(): Promise<RotateApiKeyResult> {
  const response = await api.post("/api/v1/admin/settings/rotate-api-key");
  return response.data.data as RotateApiKeyResult;
}
