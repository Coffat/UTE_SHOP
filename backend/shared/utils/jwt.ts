import jwt from 'jsonwebtoken';

interface UserPayload {
  _id: any;
  email: string;
  role: string;
}

/**
 * Tạo Access Token (15 phút)
 * @param user - Mongoose user document
 * @returns
 */
export const generateAccessToken = (user: UserPayload): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('ACCESS_TOKEN_SECRET is not configured');
  }
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    secret,
    { expiresIn: '15m' }
  );
};

/**
 * Tạo Refresh Token (7 ngày)
 * @param user - Mongoose user document or ID holder
 * @returns
 */
export const generateRefreshToken = (user: { _id: any }): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET is not configured');
  }
  return jwt.sign(
    { id: user._id },
    secret,
    { expiresIn: '7d' }
  );
};
