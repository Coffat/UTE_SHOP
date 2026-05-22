import StoreSettings, {
  generateApiKey,
  type IStoreSettings,
} from '../models/StoreSettings.js';

const SETTINGS_KEY = 'default';

export const getOrCreateSettings = async (): Promise<IStoreSettings> => {
  let doc = await StoreSettings.findOne({ key: SETTINGS_KEY });
  if (!doc) {
    doc = await StoreSettings.create({
      key: SETTINGS_KEY,
      apiKey: generateApiKey(),
    });
  }
  return doc;
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
