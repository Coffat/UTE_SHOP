import { body } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

// ─── Register ─────────────────────────────────────────────────────────────────
export const validateRegister = [
  body('fullName').notEmpty().withMessage('Họ tên là bắt buộc').trim(),
  body('email')
    .notEmpty().withMessage('Email là bắt buộc')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu ít nhất 6 ký tự'),
  body('phone').optional().isMobilePhone('any').withMessage('Số điện thoại không hợp lệ'),
  handleValidationErrors,
];

// ─── Login ────────────────────────────────────────────────────────────────────
export const validateLogin = [
  body('email').notEmpty().withMessage('Email là bắt buộc').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
  handleValidationErrors,
];

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const validateVerifyOtp = [
  body('email').notEmpty().isEmail().normalizeEmail(),
  body('otp').notEmpty().withMessage('OTP là bắt buộc').isLength({ min: 6, max: 6 }).withMessage('OTP phải đúng 6 chữ số'),
  handleValidationErrors,
];

// ─── Forgot & Reset Password ──────────────────────────────────────────────────
export const validateForgotPassword = [
  body('email').notEmpty().isEmail().normalizeEmail(),
  handleValidationErrors,
];

export const validateResetPassword = [
  body('email').notEmpty().isEmail().normalizeEmail(),
  body('otp').notEmpty().isLength({ min: 6, max: 6 }),
  body('newPassword').notEmpty().isLength({ min: 6 }).withMessage('Mật khẩu mới ít nhất 6 ký tự'),
  handleValidationErrors,
];
