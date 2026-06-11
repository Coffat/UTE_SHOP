/** Normalize Vietnamese text for search and intent parsing. */

export const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const removeVietnameseAccents = (value: string): string =>
  collapseWhitespace(
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
  );

export const normalizeVietnameseText = (value: string): string =>
  removeVietnameseAccents(value.toLowerCase());

/** Parse VND from 1tr5, 1.5tr, 1500000, 500k, etc. */
export const parseVndAmount = (raw: string): number | undefined => {
  const normalized = raw.toLowerCase().replace(/\s+/g, '');
  const plainNumber = normalized.match(/^(\d{1,3}(?:[.,]\d{3})+|\d+)$/);
  if (plainNumber) {
    const digits = plainNumber[1].replace(/[.,]/g, '');
    const parsed = Number(digits);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  const trieuMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|trieu|triệu)(?:\s*(\d))?/);
  if (trieuMatch) {
    const base = Number(trieuMatch[1].replace(',', '.'));
    const tail = trieuMatch[2] ? Number(trieuMatch[2]) : 0;
    if (!Number.isFinite(base)) return undefined;
    return Math.round(base * 1_000_000 + tail * 100_000);
  }

  const kMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (kMatch) {
    const base = Number(kMatch[1].replace(',', '.'));
    if (!Number.isFinite(base)) return undefined;
    return Math.round(base * 1_000);
  }

  return undefined;
};

const PHONE_PATTERN = /(?:\+?84|0)(?:[\s.-]?\d){8,10}\b/g;
const ORDER_CODE_PATTERN = /\b(?:ORD-[A-Z0-9-]{4,}|DH[0-9A-Z-]{2,})\b/gi;
const MONEY_CONTEXT_PATTERN =
  /\b(tầm|tam|khoảng|khoang|dưới|duoi|<=|tối đa|toi da|ngân sách|ngan sach|vnd|đ|dong|đồng)\b/i;

const maskSensitiveSpans = (content: string): string =>
  content.replace(PHONE_PATTERN, ' ').replace(ORDER_CODE_PATTERN, ' ');

export const extractBudgetMaxFromText = (content: string): number | undefined => {
  const sanitizedContent = maskSensitiveSpans(content);
  const patterns = [
    /(\d+(?:[.,]\d+)?\s*(?:tr|trieu|triệu)(?:\s*\d)?)/gi,
    /(\d+(?:[.,]\d+)?\s*k\b)/gi,
    /(?:tầm|tam|khoảng|khoang|dưới|duoi|<=|tối đa|toi da|ngân sách|ngan sach)\s*([^\n]{2,24})/gi,
    /(\d{5,9})\s*(?:vnd|đ|dong|đồng)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of sanitizedContent.matchAll(pattern)) {
      const chunk = match[1] ?? match[0];
      const parsed = parseVndAmount(chunk);
      if (parsed && parsed > 0) return parsed;
    }
  }
  if (!MONEY_CONTEXT_PATTERN.test(sanitizedContent)) {
    return undefined;
  }
  for (const match of sanitizedContent.matchAll(/(\d{5,9})/g)) {
    const parsed = parseVndAmount(match[1] ?? match[0]);
    if (parsed && parsed > 0) return parsed;
  }
  return undefined;
};

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Build accent-friendly regex: matches text with or without Vietnamese tones. */
export const buildAccentTolerantRegex = (term: string): string => {
  const normalized = normalizeVietnameseText(term);
  const map: Record<string, string> = {
    a: '[aàáạảãâầấậẩẫăằắặẳẵ]',
    e: '[eèéẹẻẽêềếệểễ]',
    i: '[iìíịỉĩ]',
    o: '[oòóọỏõôồốộổỗơờớợởỡ]',
    u: '[uùúụủũưừứựửữ]',
    y: '[yỳýỵỷỹ]',
    d: '[dđ]',
  };
  return normalized
    .split('')
    .map((ch) => map[ch] ?? escapeRegex(ch))
    .join('');
};
