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
