import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IStoreSettings extends Document {
  key: string;
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
  apiKey: string;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  webhookUrl: string;
  webhookEnabled: boolean;
  logoUrl: string;
  aiProvider: 'ollama' | 'openrouter';
  aiModelId: string;
  createdAt: Date;
  updatedAt: Date;
}

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    storeName: { type: String, default: 'UTESHOP' },
    supportEmail: { type: String, default: 'support@uteshop.vn' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    timezone: { type: String, default: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
    vnpayActive: { type: Boolean, default: true },
    codActive: { type: Boolean, default: true },
    momoActive: { type: Boolean, default: true },
    vat: { type: String, default: '10' },
    roundPrice: { type: String, default: 'Làm tròn .000đ' },
    currency: { type: String, default: 'VND (Việt Nam Đồng)' },
    notifyEmail: { type: Boolean, default: true },
    notifySMS: { type: Boolean, default: false },
    lowStock: { type: Boolean, default: true },
    newOrder: { type: Boolean, default: true },
    tfaActive: { type: Boolean, default: false },
    sessionTimeout: { type: String, default: '30 phút' },
    apiKey: { type: String, default: '' },
    defaultShippingFee: { type: Number, default: 30000 },
    freeShippingThreshold: { type: Number, default: 0 },
    webhookUrl: { type: String, default: '' },
    webhookEnabled: { type: Boolean, default: false },
    logoUrl: { type: String, default: '' },
    aiProvider: { type: String, enum: ['ollama', 'openrouter'], default: 'ollama' },
    aiModelId: { type: String, default: 'gemma4:e4b' },
  },
  { timestamps: true }
);

export const generateApiKey = (): string => {
  const hex = crypto.randomBytes(16).toString('hex');
  return `ute_shop_live_${hex}`;
};

const StoreSettings = mongoose.model<IStoreSettings>('StoreSettings', storeSettingsSchema);
export default StoreSettings;
