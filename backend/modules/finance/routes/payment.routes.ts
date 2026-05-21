import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { validateConfirmPayment } from '../../logistics/middlewares/logistics.validator.js';
import { param } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const router = express.Router();

// GET /api/v1/payments/order/:orderId – xem payment theo đơn hàng
router.get(
  '/order/:orderId',
  authenticate,
  param('orderId').isMongoId().withMessage('Order ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(paymentController.getPaymentsByOrder)
);

// PATCH /api/v1/payments/:id/confirm – xác nhận thanh toán (admin/staff)
router.patch(
  '/:id/confirm',
  authenticate, authorize('ADMIN', 'SALES', 'STORE_STAFF'),
  validateConfirmPayment,
  asyncHandler(paymentController.confirmPayment)
);

// POST /api/v1/payments/:id/process – xử lý thanh toán (MOMO tạo link redirect, COD xử lý tại chỗ)
router.post(
  '/:id/process',
  authenticate,
  param('id').isMongoId().withMessage('Payment ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(paymentController.processPayment)
);

// POST /api/v1/payments/momo-ipn – IPN Webhook callback từ MoMo (public)
router.post(
  '/momo-ipn',
  asyncHandler(paymentController.handleMomoWebhook)
);

export default router;
