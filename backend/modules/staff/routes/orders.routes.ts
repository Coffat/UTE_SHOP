import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as staffOrdersController from '../controllers/orders.controller.js';
import {
  validateListOrders,
  validateChangeStatus,
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

const STAFF_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF'] as const;

// GET /staff/orders
router.get(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  validateListOrders,
  staffOrdersController.listOrders
);

// GET /staff/orders/:id
router.get(
  '/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  validateOrderId,
  staffOrdersController.getOrder
);

// PATCH /staff/orders/:id/status
router.patch(
  '/:id/status',
  authenticate,
  authorize(...STAFF_ROLES),
  validateChangeStatus,
  staffOrdersController.changeStatus
);

// PUT /staff/orders/:id
router.put(
  '/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  validateOrderId,
  staffOrdersController.updateOrder
);

export default router;
