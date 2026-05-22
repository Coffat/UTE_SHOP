import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware cuối trong chuỗi validate – đọc kết quả express-validator.
 * Nếu có lỗi thì trả về 400, ngược lại gọi next().
 *
 * Sử dụng:
 *   router.post('/register', [...validationRules], handleValidationErrors, controller)
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // 422 Unprocessable Entity: request is well-formed but contains semantic validation errors
    return sendError(
      res,
      422,
      'Validation failed',
      errors.array().map((e: any) => ({ field: e.path || e.param, message: e.msg }))
    );
  }

  next();
};
