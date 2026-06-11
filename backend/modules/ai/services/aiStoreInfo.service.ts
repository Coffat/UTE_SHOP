import { getOrCreateSettings } from '../../admin/repositories/settings.repository.js';
import { getOrCreateWebsiteInfo } from '../../admin/repositories/websiteInfo.repository.js';

/**
 * Requestable store-info fields shown directly to customers.
 *
 * NOTE: 'storeName' is intentionally excluded from StoreInfoField for now.
 * It is used as display context in all replies but is not yet a dedicated
 * query target with its own intent patterns.
 * TODO: Add 'storeName' to StoreInfoField when store-name intent detection
 * (e.g. "shop tên gì?", "đây có phải UTESHOP không?") is implemented.
 */
export type StoreInfoField = 'address' | 'phone' | 'supportEmail' | 'openingHours';

export interface PublicStoreInfo {
  /**
   * Reflects the actual DB value. Empty string when not configured.
   * Presentation-layer fallback to 'shop' must happen inside reply builders,
   * never in this DTO — so tests can distinguish "missing" from "has data".
   */
  storeName: string;
  address: string;
  phone: string;
  supportEmail: string;
  openingHours: string;
}

// --- Intent detection patterns ---

const STORE_ADDRESS_PATTERN =
  /(địa chỉ|dia chi|ở đâu|o dau|map|bản đồ|ban do|cửa hàng ở đâu|cua hang o dau)/i;

const STORE_PHONE_PATTERN =
  /(hotline|sdt shop|số điện thoại shop|so dien thoai shop|liên hệ shop|lien he shop|gọi shop|goi shop)/i;

const STORE_EMAIL_PATTERN = /(email hỗ trợ|email shop|support email|mail shop)/i;

/**
 * Tier 1 – explicit store-hours keywords; any occurrence is a safe store-info signal.
 */
const STORE_HOURS_EXPLICIT_PATTERN =
  /(mở cửa|mo cua|đóng cửa|dong cua|giờ làm việc|gio lam viec|giờ hoạt động|gio hoat dong|lịch hoạt động|lich hoat dong|opening hours|business hours)/i;

/**
 * Tier 2 – "mấy giờ / may gio" is only a store-hours signal when adjacent to
 * store-context words (within ~30 chars). This prevents false positives such as
 * "đơn của tôi mấy giờ giao?" or "mấy giờ nhân viên gọi lại?".
 */
const STORE_HOURS_CONTEXTUAL_PATTERN =
  /\b(shop|cửa hàng|cua hang)\b.{0,30}(mấy giờ|may gio)|(mấy giờ|may gio).{0,30}\b(shop|cửa hàng|cua hang|mở cửa|mo cua)\b/i;

const matchesStoreHoursPattern = (text: string): boolean =>
  STORE_HOURS_EXPLICIT_PATTERN.test(text) || STORE_HOURS_CONTEXTUAL_PATTERN.test(text);

export const isStoreInfoIntent = (content: string): boolean => {
  const text = content.trim();
  if (!text) return false;
  return (
    STORE_ADDRESS_PATTERN.test(text) ||
    STORE_PHONE_PATTERN.test(text) ||
    STORE_EMAIL_PATTERN.test(text) ||
    matchesStoreHoursPattern(text)
  );
};

// --- Data loading ---

const normalizeFieldValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export const loadPublicStoreInfo = async (): Promise<PublicStoreInfo> => {
  const [settings, websiteInfo] = await Promise.all([
    getOrCreateSettings(),
    getOrCreateWebsiteInfo(),
  ]);
  return {
    storeName: normalizeFieldValue(settings.storeName),
    address: normalizeFieldValue(websiteInfo.address || settings.address),
    phone: normalizeFieldValue(websiteInfo.hotline || settings.phone),
    supportEmail: normalizeFieldValue(websiteInfo.supportEmail || settings.supportEmail),
    openingHours: normalizeFieldValue(websiteInfo.openingHours ?? ''),
  };
};

// --- Field extraction ---

export const extractRequestedStoreInfoFields = (content: string): StoreInfoField[] => {
  const text = content.trim();
  const fields: StoreInfoField[] = [];
  if (STORE_ADDRESS_PATTERN.test(text)) fields.push('address');
  if (STORE_PHONE_PATTERN.test(text)) fields.push('phone');
  if (STORE_EMAIL_PATTERN.test(text)) fields.push('supportEmail');
  if (matchesStoreHoursPattern(text)) fields.push('openingHours');
  if (fields.length === 0) {
    return ['address', 'phone', 'supportEmail'];
  }
  return [...new Set(fields)];
};

// --- Reply builders ---

export interface StoreInfoReply {
  content: string;
  hasAnyData: boolean;
  resolved: Record<StoreInfoField, boolean>;
}

/**
 * Returns a natural fallback contact clause when a field is missing.
 * Uses phone if available; otherwise suggests staff.
 */
const buildPhoneClause = (phone: string): string => {
  if (phone) return ` Bạn có thể liên hệ hotline ${phone} để xác nhận nhanh nhất ạ.`;
  return ' Mình sẽ hỗ trợ kết nối bạn với nhân viên để xác nhận nhé.';
};

/**
 * Builds a conversational single-field reply.
 * displayName is the shop name for use in templates (never empty — caller provides fallback).
 */
const buildSingleFieldReply = (
  field: StoreInfoField,
  storeInfo: PublicStoreInfo,
  displayName: string
): string => {
  const value = storeInfo[field];
  const hasValue = Boolean(value);

  if (field === 'address') {
    if (hasValue) {
      const canOfferMore = Boolean(storeInfo.phone || storeInfo.openingHours);
      const followUp = canOfferMore
        ? '\nBạn cần mình hỗ trợ thêm giờ mở cửa hoặc thông tin liên hệ không?'
        : '';
      return `Dạ, ${displayName} hiện ở ${value} ạ.${followUp}`;
    }
    return `Dạ, shop hiện chưa cập nhật địa chỉ trên hệ thống.${buildPhoneClause(storeInfo.phone)}`;
  }

  if (field === 'openingHours') {
    if (hasValue) {
      return `Dạ, shop mở cửa ${value} ạ.\nBạn có thể ghé shop trong khung giờ này nhé.`;
    }
    return `Dạ, shop hiện chưa cập nhật giờ mở cửa trên hệ thống.${buildPhoneClause(storeInfo.phone)}`;
  }

  if (field === 'phone') {
    if (hasValue) {
      return `Bạn có thể liên hệ shop qua số ${value} ạ.\nNếu cần, mình vẫn có thể hỗ trợ bạn ngay trong khung chat này.`;
    }
    return 'Dạ, shop hiện chưa cập nhật số hotline trên hệ thống. Mình sẽ hỗ trợ kết nối bạn với nhân viên nhé.';
  }

  // supportEmail
  if (hasValue) {
    return `Bạn có thể gửi email cho shop tại ${value} ạ.`;
  }
  return 'Dạ, shop hiện chưa cập nhật email hỗ trợ trên hệ thống.';
};

/**
 * Composes a natural multi-field prose reply (≥ 2 requested fields).
 * Rules:
 * - Single "Dạ" at start, never repeated per field
 * - Address + openingHours merged into one sentence when both present
 * - Phone added as follow-up contact line
 * - Missing fields mentioned inline after present fields
 * - ≤ 4 sentences total
 */
const buildMultiFieldProse = (
  requestedFields: StoreInfoField[],
  storeInfo: PublicStoreInfo,
  displayName: string
): string => {
  const present = requestedFields.filter((f) => Boolean(storeInfo[f]));
  const missing = requestedFields.filter((f) => !Boolean(storeInfo[f]));

  if (present.length === 0) {
    return (
      'Dạ, hiện mình chưa có thông tin này trên hệ thống. ' +
      'Mình sẽ hỗ trợ kết nối bạn với nhân viên để xác nhận nhanh nhất nhé.'
    );
  }

  const lines: string[] = [];

  const hasAddress = present.includes('address');
  const hasHours = present.includes('openingHours');
  const hasPhone = present.includes('phone');
  const hasEmail = present.includes('supportEmail');

  // Address and opening hours merge naturally into one sentence
  if (hasAddress && hasHours) {
    lines.push(
      `Dạ, ${displayName} hiện ở ${storeInfo.address} và mở cửa ${storeInfo.openingHours} ạ.`
    );
  } else if (hasAddress) {
    lines.push(`Dạ, ${displayName} hiện ở ${storeInfo.address} ạ.`);
  } else if (hasHours) {
    lines.push(`Dạ, shop mở cửa ${storeInfo.openingHours} ạ.`);
  }

  // Contact info follows as a separate support line
  if (hasPhone) {
    lines.push(
      lines.length > 0
        ? `Bạn có thể liên hệ shop qua số ${storeInfo.phone} nếu cần hỗ trợ thêm.`
        : `Bạn có thể liên hệ shop qua số ${storeInfo.phone} ạ.`
    );
  } else if (hasEmail) {
    lines.push(
      lines.length > 0
        ? `Email hỗ trợ của shop: ${storeInfo.supportEmail}.`
        : `Bạn có thể gửi email cho shop tại ${storeInfo.supportEmail} ạ.`
    );
  }

  // Mention missing fields inline after the available information
  if (missing.length > 0) {
    const labels = missing.map((f) => {
      if (f === 'address') return 'địa chỉ';
      if (f === 'openingHours') return 'giờ mở cửa';
      if (f === 'phone') return 'hotline';
      return 'email hỗ trợ';
    });
    // Offer a known phone number as a fallback contact if it's not the missing field
    const extra =
      storeInfo.phone && !requestedFields.includes('phone')
        ? ` bạn có thể hỏi trực tiếp qua số ${storeInfo.phone} để xác nhận nhé`
        : '';
    lines.push(`Về ${labels.join(' và ')}, shop hiện chưa cập nhật thông tin này${extra}.`);
  }

  return lines.join('\n');
};

/**
 * Builds the deterministic store-info reply for any combination of requested fields.
 * Never calls the LLM provider. Never fabricates data.
 */
export const buildDeterministicStoreInfoReply = (
  requestedFields: StoreInfoField[],
  storeInfo: PublicStoreInfo
): StoreInfoReply => {
  const resolved: Record<StoreInfoField, boolean> = {
    address: false,
    phone: false,
    supportEmail: false,
    openingHours: false,
  };

  for (const field of requestedFields) {
    resolved[field] = Boolean(storeInfo[field]);
  }

  const hasAnyData = requestedFields.some((f) => resolved[f]);

  // Presentation-layer fallback: 'shop' when storeName is not configured
  const displayName = storeInfo.storeName || 'shop';

  // Always delegate to the field-aware builders — they handle both present and missing
  // cases with appropriate fallback contacts (buildPhoneClause) or staff escalation.
  // The all-empty case is handled inside buildMultiFieldProse (present.length === 0).
  const content =
    requestedFields.length === 1
      ? buildSingleFieldReply(requestedFields[0], storeInfo, displayName)
      : buildMultiFieldProse(requestedFields, storeInfo, displayName);

  return { content, hasAnyData, resolved };
};
