import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

// Danh sách đơn (admin thấy tất, customer thấy của mình)
router.get('/', authenticate, orderController.listOrders);

// Chi tiết đơn
router.get('/:id', authenticate, orderController.getOrder);

// Đặt hàng – chỉ CUSTOMER
router.post('/', authenticate, authorize('CUSTOMER'), orderController.placeOrder);

// Thay đổi trạng thái – ADMIN, SALES, STORE_STAFF
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SALES', 'STORE_STAFF'), orderController.changeStatus);

// Hủy đơn – CUSTOMER (đơn của mình) hoặc ADMIN
router.post('/:id/cancel', authenticate, authorize('CUSTOMER', 'ADMIN'), orderController.cancelOrder);

export default router;
