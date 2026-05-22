import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((e: any) => `${e.path || e.param || 'field'}: ${e.msg}`).join(', ');
    return next(new AppError(`Dữ liệu không hợp lệ: ${errorDetails}`, 400));
  }

  next();
};
