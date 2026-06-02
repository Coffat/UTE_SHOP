import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import * as paymentGatewayController from '../../finance/controllers/paymentGateway.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validatePlaceOrder,
  validateChangeStatus,
  validateCancelOrder,
  validateListOrders,
} from '../middlewares/order.validator.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { param } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const router = express.Router();

// GET /api/v1/orders – Danh sách đơn (admin thấy tất, customer thấy của mình)
router.get('/', authenticate, validateListOrders, orderController.listOrders);

// GET /api/v1/orders/:id/payment-status – Trạng thái thanh toán đơn hàng
router.get(
  '/:id/payment-status',
  authenticate,
  param('id').isMongoId().withMessage('Order ID không hợp lệ'),
  handleValidationErrors,
  asyncHandler(paymentGatewayController.getOrderPaymentStatus)
);

// GET /api/v1/orders/:id – Chi tiết đơn
router.get('/:id', authenticate, orderController.getOrder);

// POST /api/v1/orders/cart/sync – Đồng bộ giỏ hàng
router.post(
  '/cart/sync',
  authenticate, authorize('CUSTOMER'),
  orderController.syncCart
);

// POST /api/v1/orders – Đặt hàng – chỉ CUSTOMER
router.post(
  '/',
  authenticate, authorize('CUSTOMER'),
  validatePlaceOrder,
  orderController.placeOrder
);

// PATCH /api/v1/orders/:id/status – ADMIN, SALES, STORE_STAFF
router.patch(
  '/:id/status',
  authenticate, authorize('ADMIN', 'SALES', 'STORE_STAFF'),
  validateChangeStatus,
  orderController.changeStatus
);

// POST /api/v1/orders/:id/cancel – CUSTOMER (đơn của mình) hoặc ADMIN
router.post(
  '/:id/cancel',
  authenticate, authorize('CUSTOMER', 'ADMIN'),
  validateCancelOrder,
  orderController.cancelOrder
);

export default router;
