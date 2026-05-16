import { body, param } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

// ─── Voucher ──────────────────────────────────────────────────────────────────

export const validateCreateVoucher = [
  body('code')
    .notEmpty().withMessage('Mã voucher là bắt buộc')
    .trim().toUpperCase()
    .isLength({ min: 3, max: 30 }).withMessage('Mã voucher từ 3 đến 30 ký tự')
    .matches(/^[A-Z0-9_-]+$/).withMessage('Mã voucher chỉ chứa chữ hoa, số, _ và -'),
  body('discountType')
    .notEmpty()
    .isIn(['PERCENTAGE', 'FIXED']).withMessage('discountType phải là PERCENTAGE hoặc FIXED'),
  body('discountValue')
    .notEmpty().isFloat({ min: 0.01 }).withMessage('Giá trị giảm phải > 0'),
  body('validUntil')
    .notEmpty().isISO8601().withMessage('validUntil phải là ngày hợp lệ (ISO8601)')
    .custom((val) => {
      if (new Date(val) <= new Date()) throw new Error('validUntil phải là ngày trong tương lai');
      return true;
    }),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('minOrderAmount').optional().isFloat({ min: 0 }),
  body('maxDiscountAmount').optional().isFloat({ min: 0 }),
  handleValidationErrors,
];

export const validateToggleVoucher = [
  param('id').isMongoId().withMessage('Voucher ID không hợp lệ'),
  body('isActive').isBoolean().withMessage('isActive phải là true/false'),
  handleValidationErrors,
];
