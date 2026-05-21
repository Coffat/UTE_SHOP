import crypto from 'crypto';

/**
 * Hash một token (refresh token) bằng SHA-256 trước khi lưu vào Redis.
 * Tránh lưu raw token vào storage.
 * @param token
 * @returns
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
