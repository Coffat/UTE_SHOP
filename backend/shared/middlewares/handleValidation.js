import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware cuối trong chuỗi validate – đọc kết quả express-validator.
 * Nếu có lỗi thì trả về 400, ngược lại gọi next().
 *
 * Sử dụng:
 *   router.post('/register', [...validationRules], handleValidationErrors, controller)
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(
      res,
      400,
      'Validation failed',
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }

  next();
};
