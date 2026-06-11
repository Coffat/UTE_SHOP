import {
  getOrCreateSettings,
  updateSettings,
  rotateApiKey as rotateApiKeyInDb,
} from '../repositories/settings.repository.js';
import {
  getOrCreateWebsiteInfo,
  updateWebsiteInfo,
} from '../repositories/websiteInfo.repository.js';
import type { IStoreSettings } from '../models/StoreSettings.js';
import { assertValidModelSelection } from '../../ai/config/aiModelCatalog.js';
import { AppError } from '../../../shared/utils/AppError.js';

export interface StoreSettingsDto {
  storeName: string;
  supportEmail: string;
  phone: string;
  address: string;
  openingHours: string;
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
  aiProvider: 'ollama' | 'openrouter';
  aiModelId: string;
}

export interface RotateApiKeyResult {
  apiKey: string;
  apiKeyMasked: string;
}

export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 12) return 'ute_shop_live_****';
  const prefix = apiKey.startsWith('ute_shop_live_') ? 'ute_shop_live_' : '';
  const suffix = apiKey.slice(-4);
  return `${prefix}****...${suffix}`;
};

const mapToDto = (doc: IStoreSettings, websiteInfo?: { address?: string; hotline?: string; supportEmail?: string; openingHours?: string }): StoreSettingsDto => ({
  storeName: doc.storeName,
  supportEmail: websiteInfo?.supportEmail?.trim() || doc.supportEmail,
  phone: websiteInfo?.hotline?.trim() || doc.phone,
  address: websiteInfo?.address?.trim() || doc.address,
  openingHours: websiteInfo?.openingHours?.trim() || '',
  timezone: doc.timezone,
  vnpayActive: doc.vnpayActive,
  codActive: doc.codActive,
  momoActive: doc.momoActive,
  vat: doc.vat,
  roundPrice: doc.roundPrice,
  currency: doc.currency,
  notifyEmail: doc.notifyEmail,
  notifySMS: doc.notifySMS,
  lowStock: doc.lowStock,
  newOrder: doc.newOrder,
  tfaActive: doc.tfaActive,
  sessionTimeout: doc.sessionTimeout,
  apiKeyMasked: maskApiKey(doc.apiKey),
  defaultShippingFee: doc.defaultShippingFee,
  freeShippingThreshold: doc.freeShippingThreshold,
  webhookUrl: doc.webhookUrl,
  webhookEnabled: doc.webhookEnabled,
  logoUrl: doc.logoUrl,
  aiProvider: doc.aiProvider,
  aiModelId: doc.aiModelId,
});

export const getAdminSettings = async (): Promise<StoreSettingsDto> => {
  const [doc, websiteInfo] = await Promise.all([getOrCreateSettings(), getOrCreateWebsiteInfo()]);
  return mapToDto(doc, websiteInfo);
};

export const putAdminSettings = async (
  payload: Partial<StoreSettingsDto> & { apiKey?: string }
): Promise<StoreSettingsDto> => {
  if (payload.aiProvider !== undefined || payload.aiModelId !== undefined) {
    const current = await getOrCreateSettings();
    const provider = payload.aiProvider ?? current.aiProvider;
    const modelId = payload.aiModelId ?? current.aiModelId;
    try {
      assertValidModelSelection(provider, modelId);
    } catch {
      throw new AppError('Cấu hình AI provider/model không hợp lệ.', 422);
    }
  }
  const doc = await updateSettings(payload);
  await updateWebsiteInfo({
    address: payload.address,
    hotline: payload.phone,
    supportEmail: payload.supportEmail,
    openingHours: typeof payload.openingHours === 'string' ? payload.openingHours : undefined,
  });
  const websiteInfo = await getOrCreateWebsiteInfo();
  return mapToDto(doc, websiteInfo);
};

export const rotateAdminApiKey = async (): Promise<RotateApiKeyResult> => {
  const doc = await rotateApiKeyInDb();
  return {
    apiKey: doc.apiKey,
    apiKeyMasked: maskApiKey(doc.apiKey),
  };
};
