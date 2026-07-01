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
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FIXED']).withMessage('discountType phải là PERCENTAGE hoặc FIXED_AMOUNT hoặc FIXED'),
  body('discountValue')
    .notEmpty().isFloat({ min: 0.01 }).withMessage('Giá trị giảm phải > 0'),
  body('startDate')
    .notEmpty().isISO8601().withMessage('startDate phải là ngày hợp lệ (ISO8601)'),
  body('endDate')
    .notEmpty().isISO8601().withMessage('endDate phải là ngày hợp lệ (ISO8601)')
    .custom((val, { req }) => {
      if (new Date(val) <= new Date()) throw new Error('endDate phải là ngày trong tương lai');
      if (new Date(val) <= new Date(req.body.startDate)) throw new Error('endDate phải sau startDate');
      return true;
    }),
  body('campaign').optional().isMongoId().withMessage('Campaign ID không hợp lệ'),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('minOrderAmount').optional().isFloat({ min: 0 }),
  body('maxDiscountAmount').optional().isFloat({ min: 0 }),
  handleValidationErrors,
];

export const validateUpdateVoucher = [
  param('id').isMongoId().withMessage('Voucher ID không hợp lệ'),
  body('code')
    .optional()
    .trim().toUpperCase()
    .isLength({ min: 3, max: 30 }).withMessage('Mã voucher từ 3 đến 30 ký tự')
    .matches(/^[A-Z0-9_-]+$/).withMessage('Mã voucher chỉ chứa chữ hoa, số, _ và -'),
  body('discountType')
    .optional()
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FIXED']).withMessage('discountType phải là PERCENTAGE hoặc FIXED_AMOUNT hoặc FIXED'),
  body('discountValue')
    .optional().isFloat({ min: 0.01 }).withMessage('Giá trị giảm phải > 0'),
  body('startDate')
    .optional().isISO8601().withMessage('startDate phải là ngày hợp lệ (ISO8601)'),
  body('endDate')
    .optional().isISO8601().withMessage('endDate phải là ngày hợp lệ (ISO8601)'),
  body('campaign').optional({ nullable: true }),
  body('usageLimit').optional({ nullable: true }),
  body('minOrderAmount').optional().isFloat({ min: 0 }),
  body('maxDiscountAmount').optional({ nullable: true }),
  handleValidationErrors,
];

export const validateToggleVoucher = [
  param('id').isMongoId().withMessage('Voucher ID không hợp lệ'),
  body('isActive').isBoolean().withMessage('isActive phải là true/false'),
  handleValidationErrors,
];

// ─── Campaign ─────────────────────────────────────────────────────────────────

export const validateCreateCampaign = [
  body('name').notEmpty().withMessage('Tên chiến dịch là bắt buộc').trim().isLength({ max: 100 }),
  body('description').optional().trim(),
  body('bannerUrl').optional({ nullable: true }).isString(),
  body('showPopup').optional().isBoolean(),
  body('startDate').notEmpty().isISO8601().withMessage('startDate phải là ngày hợp lệ'),
  body('endDate')
    .notEmpty().isISO8601().withMessage('endDate phải là ngày hợp lệ')
    .custom((val, { req }) => {
      if (new Date(val) <= new Date(req.body.startDate)) throw new Error('endDate phải sau startDate');
      return true;
    }),
  handleValidationErrors,
];

export const validateUpdateCampaign = [
  param('id').isMongoId().withMessage('Campaign ID không hợp lệ'),
  body('name').optional().trim().isLength({ max: 100 }),
  body('bannerUrl').optional({ nullable: true }).isString(),
  body('showPopup').optional().isBoolean(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  handleValidationErrors,
];
