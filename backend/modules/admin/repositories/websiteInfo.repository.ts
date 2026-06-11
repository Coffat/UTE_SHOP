import WebsiteInfo, { type IWebsiteInfo } from '../models/WebsiteInfo.js';

const WEBSITE_INFO_KEY = 'default';

/**
 * Atomically finds or creates the singleton WebsiteInfo document.
 * Uses findOneAndUpdate with upsert to avoid a race condition between
 * findOne and create that could cause duplicate-key errors under concurrency.
 */
export const getOrCreateWebsiteInfo = async (): Promise<IWebsiteInfo> => {
  const doc = await WebsiteInfo.findOneAndUpdate(
    { key: WEBSITE_INFO_KEY },
    { $setOnInsert: { key: WEBSITE_INFO_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc!;
};

export const updateWebsiteInfo = async (
  payload: Partial<Pick<IWebsiteInfo, 'address' | 'hotline' | 'supportEmail' | 'openingHours'>>
): Promise<IWebsiteInfo> => {
  const doc = await getOrCreateWebsiteInfo();
  if (payload.address !== undefined) doc.address = payload.address;
  if (payload.hotline !== undefined) doc.hotline = payload.hotline;
  if (payload.supportEmail !== undefined) doc.supportEmail = payload.supportEmail;
  if (payload.openingHours !== undefined) doc.openingHours = payload.openingHours;
  await doc.save();
  return doc;
};
