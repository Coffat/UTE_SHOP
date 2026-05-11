const crypto = require('crypto'); // built-in Node.js module — no installation needed

/**
 * Hashes a token string using the SHA-256 algorithm.
 *
 * Usage: store hashToken(refreshToken) in the database instead of the raw
 * token to prevent credential exposure in the event of a data breach.
 *
 * @param {string} token - The raw token string to hash.
 * @returns {string} The SHA-256 hex digest of the input token.
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = { hashToken };
