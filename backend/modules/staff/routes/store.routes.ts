import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as storeController from '../controllers/store.controller.js';
import { validateChangeStatus, validateListOrders } from '../../order/middlewares/order.validator.js';
import { param, body } from 'express-validator';
import mongoose from 'mongoose';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const router = express.Router();

// Áp dụng auth cho toàn bộ store routes
router.use(authenticate, authorize('STORE_STAFF', 'ADMIN'));

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

const validateOrderId = [
  param('id').custom(isObjectId).withMessage('Order ID không hợp lệ'),
  handleValidationErrors,
];

const validateCancelOrder = [
  param('id').custom(isObjectId),
  body('reason').optional().isString().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Cần ít nhất một sản phẩm'),
  body('items.*.variantId').notEmpty().withMessage('variantId là bắt buộc'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải >= 1'),
  body('recipientInfo.fullName').notEmpty().withMessage('Họ tên người nhận là bắt buộc'),
  body('recipientInfo.phone').notEmpty().withMessage('SĐT người nhận là bắt buộc'),
  body('paymentMethod').optional().isIn(['CASH', 'MOMO', 'VNPAY']).withMessage('Phương thức thanh toán phải là CASH, MOMO hoặc VNPAY'),
  handleValidationErrors,
];

// Dashboard summary
router.get('/summary', storeController.getStoreSummary);

// Orders list
router.get('/orders', validateListOrders, storeController.listOrders);

// Customer lookup (for POS create order)
router.get('/customers', storeController.listCustomers);

// Order detail
router.get('/orders/:id', validateOrderId, storeController.getOrder);

// Advance status
router.patch('/orders/:id/status', validateOrderId, validateChangeStatus, storeController.changeStatus);

// Cancel order
router.post('/orders/:id/cancel', validateCancelOrder, storeController.cancelOrder);

// Manual confirm payment
router.post('/orders/:id/confirm-payment', validateOrderId, storeController.confirmPaymentManual);

// Create AT_STORE order
router.post('/orders', validateCreateOrder, storeController.createAtStoreOrder);

export default router;
