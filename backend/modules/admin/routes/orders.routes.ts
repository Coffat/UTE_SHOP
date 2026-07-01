import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as adminOrdersController from '../controllers/orders.controller.js';
import {
  validateListOrders,
  validateChangeStatus,
  validateCancelOrder,
  validateAdminPreviewOrder,
  validateAdminCreateOrder,
} from '../../order/middlewares/order.validator.js';
import { param } from 'express-validator';
import mongoose from 'mongoose';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

const validateOrderId = [
  param('id').custom(isObjectId).withMessage('Order ID không hợp lệ'),
  handleValidationErrors,
];

const router = express.Router();

// All routes are ADMIN only
router.use(authenticate, authorize('ADMIN'));

// GET /admin/orders
router.get('/', validateListOrders, adminOrdersController.listOrders);

// POST /admin/orders/preview
router.post('/preview', validateAdminPreviewOrder, adminOrdersController.previewOrder);

// POST /admin/orders
router.post('/', validateAdminCreateOrder, adminOrdersController.createOrder);

// GET /admin/orders/:id
router.get('/:id', validateOrderId, adminOrdersController.getOrder);

// PUT /admin/orders/:id
router.put('/:id', validateOrderId, adminOrdersController.updateOrder);

// PATCH /admin/orders/:id/status
router.patch('/:id/status', validateChangeStatus, adminOrdersController.changeStatus);

// POST /admin/orders/:id/cancel
router.post('/:id/cancel', validateCancelOrder, adminOrdersController.cancelOrder);

// DELETE /admin/orders/:id (soft delete)
router.delete('/:id', validateOrderId, adminOrdersController.deleteOrder);

export default router;
