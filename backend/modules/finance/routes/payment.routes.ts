import express, { Request, Response } from 'express';
import * as paymentService from '../services/payment.service.js';
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
    const orderId = req.params.orderId as string;
    sendSuccess(res, 200, 'OK', await paymentService.getPaymentsByOrder(orderId));
  })
);

// PATCH /api/v1/payments/:id/confirm – xác nhận thanh toán (admin/staff)
router.patch(
  '/:id/confirm',
  authenticate, authorize('ADMIN', 'SALES', 'STORE_STAFF'),
  validateConfirmPayment,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    sendSuccess(
      res, 200, 'Xác nhận thanh toán thành công',
      await paymentService.confirmPayment(id, req.body.transactionId)
    );
  })
);

// POST /api/v1/payments/:id/process – xử lý thanh toán (MOMO tạo link redirect, COD xử lý tại chỗ)
router.post(
  '/:id/process',
  authenticate,
  param('id').isMongoId().withMessage('Payment ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await paymentService.processPayment(id, req.body);
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
