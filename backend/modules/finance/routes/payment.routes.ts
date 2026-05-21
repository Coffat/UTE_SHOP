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

// PATCH /api/v1/payments/:id/confirm – xác nhận thanh toán
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

export default router;
