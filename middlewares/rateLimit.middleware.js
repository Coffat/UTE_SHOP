const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login / auth endpoints.
 * Allows a maximum of 5 requests per IP within a 15-minute window.
 * Uses the default in-memory store (no external dependency required).
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 requests per IP per window
  standardHeaders: true,     // include RateLimit-* headers in responses
  legacyHeaders: false,      // disable deprecated X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = { loginLimiter };
