import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface DaySchedule {
  enabled: boolean;
  open: string;  // "HH:mm" 24h, e.g. "08:00"
  close: string; // "HH:mm" 24h, e.g. "21:00"
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

const DEFAULT_WEEKDAY: DaySchedule = { enabled: true, open: '08:00', close: '21:00' };
const DEFAULT_SATURDAY: DaySchedule = { enabled: true, open: '08:00', close: '21:00' };
const DEFAULT_SUNDAY: DaySchedule = { enabled: false, open: '08:00', close: '21:00' };

export const DEFAULT_WORKING_HOURS_SCHEDULE: WorkingHoursSchedule = {
  monday: DEFAULT_WEEKDAY,
  tuesday: DEFAULT_WEEKDAY,
  wednesday: DEFAULT_WEEKDAY,
  thursday: DEFAULT_WEEKDAY,
  friday: DEFAULT_WEEKDAY,
  saturday: DEFAULT_SATURDAY,
  sunday: DEFAULT_SUNDAY,
};

export interface IStoreSettings extends Document {
  key: string;
  storeName: string;
  supportEmail: string;
  phone: string;
  address: string;
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

const dayScheduleSchema = {
  enabled: { type: Boolean, default: true },
  open: { type: String, default: '08:00' },
  close: { type: String, default: '21:00' },
};

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    storeName: { type: String, default: 'UTESHOP' },
    supportEmail: { type: String, default: 'support@uteshop.vn' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    timezone: { type: String, default: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
    timezoneIana: { type: String, default: 'Asia/Ho_Chi_Minh' },
    workingHoursSchedule: {
      type: {
        monday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_WEEKDAY }) },
        tuesday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_WEEKDAY }) },
        wednesday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_WEEKDAY }) },
        thursday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_WEEKDAY }) },
        friday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_WEEKDAY }) },
        saturday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_SATURDAY }) },
        sunday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_SUNDAY, enabled: false }) },
      },
      default: () => ({ ...DEFAULT_WORKING_HOURS_SCHEDULE }),
    },
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
