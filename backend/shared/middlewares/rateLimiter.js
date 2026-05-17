import rateLimit from 'express-rate-limit';

/**
 * Tạo rate limiter có thể tái sử dụng.
 *
 * @param {number} windowMs  - Khoảng thời gian tính bằng ms
 * @param {number} max       - Số request tối đa trong khoảng thời gian
 * @param {string} message   - Message trả về khi bị block
 */
export const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
};

// ─── Preset limiters ──────────────────────────────────────────────────────────

/** 5 request / 15 phút – dành cho đăng nhập */
export const loginLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.'
);

/** 3 request / 15 phút – dành cho quên mật khẩu */
export const forgotPasswordLimiter = createRateLimiter(
  15 * 60 * 1000,
  3,
  'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút.'
);

/** 200 request / phút – dành cho API chung (tránh brute-force) */
export const generalLimiter = createRateLimiter(
  60 * 1000,
  200,
  'Quá nhiều request. Vui lòng thử lại sau.'
);
