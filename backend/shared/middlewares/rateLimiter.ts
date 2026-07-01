import rateLimit from 'express-rate-limit';

/**
 * Tạo rate limiter có thể tái sử dụng.
 *
 * @param windowMs  - Khoảng thời gian tính bằng ms
 * @param max       - Số request tối đa trong khoảng thời gian
 * @param message   - Message trả về khi bị block
 */
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
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

export const loginLimiter = (req: any, res: any, next: any) => next();

/** 3 request / 15 phút – dành cho quên mật khẩu */
export const forgotPasswordLimiter = createRateLimiter(
  15 * 60 * 1000,
  3,
  'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút.'
);

export const generalLimiter = (req: any, res: any, next: any) => next();
