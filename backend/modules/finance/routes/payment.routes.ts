import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import * as paymentGatewayController from '../controllers/paymentGateway.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { validateConfirmPayment } from '../../logistics/middlewares/logistics.validator.js';
import { body, param } from 'express-validator';
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

// Gateway routes (sandbox)
router.post(
  '/momo/create',
  authenticate,
  body('orderId').isMongoId().withMessage('Order ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(paymentGatewayController.createMomoPayment)
);

router.post(
  '/vnpay/create',
  authenticate,
  body('orderId').isMongoId().withMessage('Order ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(paymentGatewayController.createVnpayPayment)
);

router.post('/momo/ipn', asyncHandler(paymentGatewayController.handleMomoIpn));
router.get('/momo/return', asyncHandler(paymentGatewayController.handleMomoReturn));
router.get('/vnpay/return', asyncHandler(paymentGatewayController.handleVnpayReturn));
router.get('/vnpay/ipn', asyncHandler(paymentGatewayController.handleVnpayIpn));

router.get(
  '/orders/:orderId/status',
  authenticate,
  param('orderId').isMongoId().withMessage('Order ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(paymentGatewayController.getOrderPaymentStatus)
);

router.get(
  '/transactions/:transactionRef/status',
  authenticate,
  param('transactionRef').isLength({ min: 8 }).withMessage('transactionRef không hợp lệ'),
  handleValidationErrors,
  asyncHandler(paymentGatewayController.getPaymentStatusByTransactionRef)
);

export default router;
