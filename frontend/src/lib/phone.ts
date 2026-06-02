const LEGACY_MOBILE_PREFIX: Record<string, string> = {
  "012": "070",
  "016": "076",
  "017": "078",
  "018": "078",
  "019": "079",
  "092": "052",
  "093": "053",
  "094": "084",
  "096": "096",
  "097": "097",
  "098": "098",
};

export const normalizeVietnamesePhone = (raw: string): string => {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("84")) {
    digits = `0${digits.slice(2)}`;
  } else if (!digits.startsWith("0") && digits.length === 9) {
    digits = `0${digits}`;
  }

  if (digits.length === 10 && digits.startsWith("01")) {
    const legacyPrefix = digits.slice(0, 3);
    const mapped = LEGACY_MOBILE_PREFIX[legacyPrefix];
    if (mapped) {
      digits = `${mapped}${digits.slice(3)}`;
    }
  }

  return digits;
};

export const isValidVietnameseMobilePhone = (raw: string): boolean => {
  const normalized = normalizeVietnamesePhone(raw);
  return /^0(3|5|7|8|9)\d{8}$/.test(normalized);
};

export const formatVietnamesePhoneDisplay = (raw: string): string => {
  const n = normalizeVietnamesePhone(raw);
  if (n.length !== 10) return raw.trim();
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
};
