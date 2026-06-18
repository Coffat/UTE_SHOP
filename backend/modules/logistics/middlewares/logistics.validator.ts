import { body, param } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

// ─── Address ──────────────────────────────────────────────────────────────────

export const validateCreateAddress = [
  body('street').notEmpty().withMessage('Địa chỉ đường là bắt buộc').trim().isLength({ max: 200 }),
  body('city').notEmpty().withMessage('Thành phố là bắt buộc').trim().isLength({ max: 100 }),
  body('district').optional().trim().isLength({ max: 100 }),
  body('ward').optional().trim().isLength({ max: 100 }),
  body('label').optional().trim().isLength({ max: 50 }),
  body('isDefault').optional().isBoolean(),
  handleValidationErrors,
];

export const validateUpdateAddress = [
  body('street').optional().notEmpty().withMessage('Địa chỉ đường không được để trống').trim().isLength({ max: 200 }),
  body('city').optional().notEmpty().withMessage('Thành phố không được để trống').trim().isLength({ max: 100 }),
  body('district').optional().trim().isLength({ max: 100 }),
  body('ward').optional().trim().isLength({ max: 100 }),
  body('label').optional().trim().isLength({ max: 50 }),
  body('isDefault').optional().isBoolean(),
  body().custom((value: Record<string, unknown>) => {
    const allowedKeys = ['street', 'city', 'district', 'ward', 'label', 'isDefault'];
    const keys = Object.keys(value || {}).filter((k) => allowedKeys.includes(k));
    if (keys.length === 0) {
      throw new Error('Không có trường hợp lệ để cập nhật');
    }
    return true;
  }),
  handleValidationErrors,
];

export const validateAddressId = [
  param('id').isMongoId().withMessage('Address ID không hợp lệ'),
  handleValidationErrors,
];

// ─── Confirm Payment ──────────────────────────────────────────────────────────

export const validateConfirmPayment = [
  param('id').isMongoId().withMessage('Payment ID không hợp lệ'),
  body('transactionId').optional().trim().isLength({ max: 200 }),
  handleValidationErrors,
];
