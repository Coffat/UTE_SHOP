import type { AiPromptMessage } from '../types/ai.types.js';

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?84|0)(?:[\s.-]?\d){8,10}\b/g;
const CUSTOMER_ADDRESS_HINT_PATTERN =
  /\b(số nhà|so nha|đường|duong|phường|phuong|quận|quan|huyện|huyen|xã|xa|shipping address|địa chỉ nhận|dia chi nhan)\b/i;
const STAFF_INTERNAL_PATTERN = /\b(internal note|ghi chú nội bộ|ghi chu noi bo|staff_note)\b/i;
const PAYMENT_RAW_PATTERN = /\b(card|cvv|bank|payment_raw|transaction_raw|otp)\b/i;
const CUSTOMER_ID_PATTERN = /\b(customerId|userId)\b/gi;

const PUBLIC_STORE_ALLOWLIST = new Set(['UTESHOP', 'store_settings']);

const maskCustomerText = (text: string): string => {
  let masked = text.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
  masked = masked.replace(PHONE_PATTERN, '[REDACTED_PHONE]');
  if (CUSTOMER_ADDRESS_HINT_PATTERN.test(masked)) {
    masked = masked.replace(/(:\s*)([^\n]+)/g, '$1[REDACTED_ADDRESS]');
  }
  masked = masked.replace(CUSTOMER_ID_PATTERN, '[REDACTED_ID_KEY]');
  return masked;
};

const sanitizePublicStoreContext = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  const raw = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(raw)) {
    if (typeof item === 'string') {
      output[key] = item.trim();
    } else {
      output[key] = item;
    }
  }
  return output;
};

const sanitizeContextObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeContextObject(item));
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') return maskCustomerText(value);
    return value;
  }
  const raw = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(raw)) {
    if (key === 'publicStoreContext') {
      output[key] = sanitizePublicStoreContext(item);
      continue;
    }
    if (key === 'customerId' || key === 'userId' || key === 'recipientName') continue;
    if (STAFF_INTERNAL_PATTERN.test(key) || PAYMENT_RAW_PATTERN.test(key)) continue;
    if (typeof item === 'string') {
      if (PUBLIC_STORE_ALLOWLIST.has(item) || PUBLIC_STORE_ALLOWLIST.has(key)) {
        output[key] = item;
      } else {
        output[key] = maskCustomerText(item);
      }
      continue;
    }
    output[key] = sanitizeContextObject(item);
  }
  return output;
};

export const sanitizeProviderPayload = (messages: AiPromptMessage[]): AiPromptMessage[] =>
  messages.map((message) => ({
    ...message,
    content: typeof message.content === 'string' ? maskCustomerText(message.content) : message.content,
  }));

export const sanitizeToolPayloadForProvider = (payload: unknown): unknown => sanitizeContextObject(payload);

