import express from 'express';
import * as paymentService from '../services/payment.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

router.get('/order/:orderId', authenticate, asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'OK', await paymentService.getPaymentsByOrder(req.params.orderId));
}));

router.patch('/:id/confirm', authenticate, authorize('ADMIN', 'SALES', 'STORE_STAFF'), asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Xác nhận thanh toán thành công', await paymentService.confirmPayment(req.params.id, req.body.transactionId));
}));

export default router;
