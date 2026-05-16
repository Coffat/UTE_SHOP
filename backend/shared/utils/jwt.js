import jwt from 'jsonwebtoken';

/**
 * Tạo Access Token (15 phút)
 * @param {Object} user - Mongoose user document
 * @returns {string}
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Tạo Refresh Token (7 ngày)
 * @param {Object} user - Mongoose user document
 * @returns {string}
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};
