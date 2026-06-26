import StoreSettings, {
  generateApiKey,
  type IStoreSettings,
} from '../models/StoreSettings.js';

const SETTINGS_KEY = 'default';

/**
 * Atomically finds or creates the singleton StoreSettings document.
 * Uses findOneAndUpdate with upsert to avoid a race condition between
 * findOne and create that could cause duplicate-key errors under concurrency.
 */
export const getOrCreateSettings = async (): Promise<IStoreSettings> => {
  const doc = await StoreSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY, apiKey: generateApiKey() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc!;
};

export const updateSettings = async (
  payload: Partial<IStoreSettings>
): Promise<IStoreSettings> => {
  const doc = await getOrCreateSettings();
  const allowedKeys: (keyof IStoreSettings)[] = [
    'storeName',
    'supportEmail',
    'phone',
    'address',
    'timezone',
    'timezoneIana',
    'workingHoursSchedule',
    'vnpayActive',
    'codActive',
    'momoActive',
    'vat',
    'roundPrice',
    'currency',
    'notifyEmail',
    'notifySMS',
    'lowStock',
    'newOrder',
    'tfaActive',
    'sessionTimeout',
    'defaultShippingFee',
    'freeShippingThreshold',
    'webhookUrl',
    'webhookEnabled',
    'logoUrl',
    'aiProvider',
    'aiModelId',
  ];

  for (const key of allowedKeys) {
    const value = payload[key];
    if (value !== undefined) {
      Object.assign(doc, { [key]: value });
    }
  }

  if (typeof payload.apiKey === 'string' && payload.apiKey.trim().length > 0) {
    doc.apiKey = payload.apiKey.trim();
  }

  await doc.save();
  return doc;
};

export const rotateApiKey = async (): Promise<IStoreSettings> => {
  const doc = await getOrCreateSettings();
  doc.apiKey = generateApiKey();
  await doc.save();
  return doc;
};
