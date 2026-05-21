import express from 'express';
import type { Request, Response } from 'express';
import * as paymentService from '../services/payment.service.ts';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
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
  asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.getPaymentsByOrder(req.params.orderId);
    sendSuccess(res, 200, 'OK', result);
  })
);

// PATCH /api/v1/payments/:id/confirm – xác nhận thanh toán (admin/staff)
router.patch(
  '/:id/confirm',
  authenticate, authorize('ADMIN', 'SALES', 'STORE_STAFF'),
  validateConfirmPayment,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.confirmPayment(req.params.id, req.body.transactionId);
    sendSuccess(res, 200, 'Xác nhận thanh toán thành công', result);
  })
);

// POST /api/v1/payments/:id/process – xử lý thanh toán (MOMO tạo link redirect, COD xử lý tại chỗ)
router.post(
  '/:id/process',
  authenticate,
  param('id').isMongoId().withMessage('Payment ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.processPayment(req.params.id, req.body);
    sendSuccess(res, 200, 'Xử lý thanh toán thành công', result);
  })
);

// POST /api/v1/payments/momo-ipn – IPN Webhook callback từ MoMo (public)
router.post(
  '/momo-ipn',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.handleWebhook('MOMO', req.body);
    sendSuccess(res, 200, 'IPN received and processed successfully', result);
  })
);

export default router;
