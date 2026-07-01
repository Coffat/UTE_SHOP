import { api } from "../../lib/api";

export interface DaySchedule {
  enabled: boolean;
  open: string;  // "HH:mm" 24h
  close: string; // "HH:mm" 24h
}

export interface WorkingHoursSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export const DEFAULT_WORKING_HOURS: WorkingHoursSchedule = {
  monday:    { enabled: true,  open: "08:00", close: "21:00" },
  tuesday:   { enabled: true,  open: "08:00", close: "21:00" },
  wednesday: { enabled: true,  open: "08:00", close: "21:00" },
  thursday:  { enabled: true,  open: "08:00", close: "21:00" },
  friday:    { enabled: true,  open: "08:00", close: "21:00" },
  saturday:  { enabled: true,  open: "08:00", close: "21:00" },
  sunday:    { enabled: false, open: "08:00", close: "21:00" },
};

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  phone: string;
  address: string;
  openingHours: string;
  timezone: string;
  timezoneIana: string;
  workingHoursSchedule: WorkingHoursSchedule;
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
  ghnApiUrl: string;
  ghnApiToken: string;
  ghnShopId: string;
  ghnFromDistrictId: number;
  webhookUrl: string;
  webhookEnabled: boolean;
  logoUrl: string;
  aiProvider: "ollama" | "openrouter";
  aiModelId: string;
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
