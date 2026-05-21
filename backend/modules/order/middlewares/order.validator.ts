import { body, param } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import mongoose from 'mongoose';
import OrderType from '../../../shared/enums/OrderType.js';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

// ─── Place Order ──────────────────────────────────────────────────────────────

export const validatePlaceOrder = [
  body('cartId').notEmpty().custom(isObjectId).withMessage('cartId không hợp lệ'),
  body('recipientInfo').notEmpty().withMessage('Thông tin người nhận là bắt buộc'),
  body('recipientInfo.fullName').notEmpty().trim().isLength({ max: 100 }),
  body('recipientInfo.phone').notEmpty().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  body('orderType')
    .optional()
    .isIn(Object.values(OrderType))
    .withMessage(`orderType phải là: ${Object.values(OrderType).join(', ')}`),
  body('voucherCode')
    .optional()
    .trim().toUpperCase()
    .isLength({ min: 3, max: 30 }),
  body('paymentMethod')
    .notEmpty()
    .isIn(['MOMO', 'COD', 'CASH'])
    .withMessage('paymentMethod phải là MOMO, COD hoặc CASH'),
  body('note').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// ─── Change Order Status ───────────────────────────────────────────────────────

export const validateChangeStatus = [
  param('id').custom(isObjectId),
  body('status').notEmpty().withMessage('status là bắt buộc').isString(),
  body('note').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// ─── Cancel Order ─────────────────────────────────────────────────────────────

export const validateCancelOrder = [
  param('id').custom(isObjectId),
  body('reason').notEmpty().withMessage('Lý do hủy là bắt buộc').trim().isLength({ max: 500 }),
  handleValidationErrors,
];
