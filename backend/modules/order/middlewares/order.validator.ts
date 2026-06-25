import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import mongoose from 'mongoose';
import OrderType from '../../../shared/enums/OrderType.js';
import OrderStatus from '../../../shared/enums/OrderStatus.js';
import PaymentStatus from '../../../shared/enums/PaymentStatus.js';
import {
  isValidVietnameseMobilePhone,
  normalizeVietnamesePhone,
} from '../../../shared/utils/vietnamesePhone.js';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

// ─── Place Order ──────────────────────────────────────────────────────────────

export const validatePlaceOrder = [
  body('cartId').notEmpty().custom(isObjectId).withMessage('cartId không hợp lệ'),
  body('recipientInfo').notEmpty().withMessage('Thông tin người nhận là bắt buộc'),
  body('recipientInfo.fullName').notEmpty().trim().isLength({ max: 100 }),
  body('recipientInfo.phone')
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .customSanitizer((value) => normalizeVietnamesePhone(String(value)))
    .custom((value) => {
      if (!isValidVietnameseMobilePhone(String(value))) {
        throw new Error('Số điện thoại không hợp lệ (vd: 0901234567)');
      }
      return true;
    }),
  body('recipientInfo.deliveryNote').optional().trim().isLength({ max: 500 }),
  body('deliveryAddressId').optional().custom(isObjectId),
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
    .isIn(['MOMO', 'COD', 'CASH', 'VNPAY'])
    .withMessage('paymentMethod phải là MOMO, COD, CASH hoặc VNPAY'),
  body('note').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// ─── List Orders (admin) ──────────────────────────────────────────────────────

export const validateListOrders = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status')
    .optional()
    .isIn(Object.values(OrderStatus))
    .withMessage(`status phải là: ${Object.values(OrderStatus).join(', ')}`),
  query('statusGroup')
    .optional()
    .isIn(['attention', 'pending', 'confirmed', 'ready', 'shipping', 'completed', 'cancelled'])
    .withMessage('statusGroup không hợp lệ'),
  query('orderType')
    .optional()
    .isIn(Object.values(OrderType))
    .withMessage(`orderType phải là: ${Object.values(OrderType).join(', ')}`),
  query('paymentStatus')
    .optional()
    .isIn(Object.values(PaymentStatus))
    .withMessage(`paymentStatus phải là: ${Object.values(PaymentStatus).join(', ')}`),
  query('search').optional().trim().isLength({ max: 100 }),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom không hợp lệ'),
  query('dateTo').optional().isISO8601().withMessage('dateTo không hợp lệ'),
  query('includeSummary').optional().isIn(['true', 'false']),
  query('customerId').optional().custom(isObjectId),
  handleValidationErrors,
];

// ─── Change Order Status ───────────────────────────────────────────────────────

export const validateChangeStatus = [
  param('id').custom(isObjectId),
  body('status')
    .notEmpty()
    .withMessage('status là bắt buộc')
    .isIn(Object.values(OrderStatus))
    .withMessage(`status phải là: ${Object.values(OrderStatus).join(', ')}`),
  body('note').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// ─── Admin create / preview order ─────────────────────────────────────────────

const adminOrderItemsValidation = [
  body('customerId').notEmpty().withMessage('customerId là bắt buộc').custom(isObjectId),
  body('items').isArray({ min: 1 }).withMessage('Phải có ít nhất một sản phẩm'),
  body('items.*.variantId').custom(isObjectId).withMessage('variantId không hợp lệ'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải >= 1'),
  body('recipientInfo').notEmpty().withMessage('Thông tin người nhận là bắt buộc'),
  body('recipientInfo.fullName').notEmpty().trim().isLength({ max: 100 }),
  body('recipientInfo.phone')
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .customSanitizer((value) => normalizeVietnamesePhone(String(value)))
    .custom((value) => {
      if (!isValidVietnameseMobilePhone(String(value))) {
        throw new Error('Số điện thoại không hợp lệ (vd: 0901234567)');
      }
      return true;
    }),
  body('recipientInfo.deliveryNote').optional().trim().isLength({ max: 500 }),
  body('deliveryAddressId').optional().custom(isObjectId),
  body('orderType')
    .optional()
    .isIn(Object.values(OrderType))
    .withMessage(`orderType phải là: ${Object.values(OrderType).join(', ')}`),
  body('voucherCode')
    .optional()
    .trim()
    .toUpperCase()
    .isLength({ min: 3, max: 30 }),
  body('pointsToUse').optional().isInt({ min: 0 }),
  body('note').optional().trim().isLength({ max: 500 }),
];

export const validateAdminPreviewOrder = [
  ...adminOrderItemsValidation,
  handleValidationErrors,
];

export const validateAdminCreateOrder = [
  ...adminOrderItemsValidation,
  body('paymentMethod')
    .notEmpty()
    .isIn(['MOMO', 'COD', 'CASH', 'VNPAY'])
    .withMessage('paymentMethod phải là MOMO, COD, CASH hoặc VNPAY'),
  handleValidationErrors,
];

// ─── Cancel Order ─────────────────────────────────────────────────────────────

export const validateCancelOrder = [
  param('id').custom(isObjectId),
  body('reason').notEmpty().withMessage('Lý do hủy là bắt buộc').trim().isLength({ max: 500 }),
  handleValidationErrors,
];
