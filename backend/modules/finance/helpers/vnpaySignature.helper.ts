import crypto from 'crypto';

type VnpParams = Record<string, string>;

/** Build sorted URLSearchParams — VNPay HMAC signs searchParams.toString(). */
export const buildVnpSearchParams = (params: VnpParams): URLSearchParams => {
  const searchParams = new URLSearchParams();
  const sortedKeys = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort((a, b) => a.localeCompare(b));

  for (const key of sortedKeys) {
    searchParams.append(key, String(params[key]));
  }
  return searchParams;
};

export const signVnpSearchParams = (searchParams: URLSearchParams, hashSecret: string): string => {
  return crypto.createHmac('sha512', hashSecret).update(searchParams.toString(), 'utf8').digest('hex');
};

export const buildVnpPaymentQuery = (params: VnpParams, secureHash: string): string => {
  const searchParams = buildVnpSearchParams(params);
  searchParams.append('vnp_SecureHash', secureHash);
  return searchParams.toString();
};

export const parseVnpDate = (dateText: string): Date | null => {
  if (!/^\d{14}$/.test(dateText)) return null;
  const year = Number(dateText.slice(0, 4));
  const month = Number(dateText.slice(4, 6)) - 1;
  const day = Number(dateText.slice(6, 8));
  const hour = Number(dateText.slice(8, 10));
  const minute = Number(dateText.slice(10, 12));
  const second = Number(dateText.slice(12, 14));
  return new Date(Date.UTC(year, month, day, hour - 7, minute, second));
};

export const formatVnpDate = (date = new Date()): string => {
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const YYYY = vnDate.getUTCFullYear().toString();
  const MM = `${vnDate.getUTCMonth() + 1}`.padStart(2, '0');
  const DD = `${vnDate.getUTCDate()}`.padStart(2, '0');
  const HH = `${vnDate.getUTCHours()}`.padStart(2, '0');
  const mm = `${vnDate.getUTCMinutes()}`.padStart(2, '0');
  const ss = `${vnDate.getUTCSeconds()}`.padStart(2, '0');
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
};
