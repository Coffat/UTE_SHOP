/**
 * Chuẩn hóa SĐT Việt Nam: bỏ khoảng trắng, +84/84 → 0, map prefix 01x cũ sang 0[35789]x.
 */
const LEGACY_MOBILE_PREFIX: Record<string, string> = {
  '012': '070',
  '016': '076',
  '017': '078',
  '018': '078',
  '019': '079',
  '092': '052',
  '093': '053',
  '094': '084',
  '096': '096',
  '097': '097',
  '098': '098',
};

export const normalizeVietnamesePhone = (raw: string): string => {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('84')) {
    digits = `0${digits.slice(2)}`;
  } else if (!digits.startsWith('0') && digits.length === 9) {
    digits = `0${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('01')) {
    const legacyPrefix = digits.slice(0, 3);
    const mapped = LEGACY_MOBILE_PREFIX[legacyPrefix];
    if (mapped) {
      digits = `${mapped}${digits.slice(3)}`;
    }
  }

  return digits;
};

/** Số di động VN sau chuẩn hóa: 10 chữ số, bắt đầu 0(3|5|7|8|9). */
export const isValidVietnameseMobilePhone = (raw: string): boolean => {
  const normalized = normalizeVietnamesePhone(raw);
  return /^0(3|5|7|8|9)\d{8}$/.test(normalized);
};
