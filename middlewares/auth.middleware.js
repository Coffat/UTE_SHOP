const jwt = require('jsonwebtoken');

/**
 * Middleware: verifyToken
 *
 * Extracts and verifies a JWT from the `accessToken` HttpOnly cookie.
 *
 * Flow:
 *  1. Read `req.cookies.accessToken` (set by cookie-parser).
 *  2. If absent  → 401 Unauthorized.
 *  3. Verify against ACCESS_TOKEN_SECRET from .env.
 *  4. If invalid / expired → 403 Forbidden.
 *  5. If valid → attach decoded payload to `req.user` and call next().
 *
 * Requires `cookie-parser` to be registered in app.js BEFORE this middleware.
 */
const verifyToken = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // e.g. { userId, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = { verifyToken };
