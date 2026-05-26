import { body } from 'express-validator';
import { validateRequest } from '../../../shared/middlewares/validateRequest.js';

export const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự'),
  validateRequest,
];
