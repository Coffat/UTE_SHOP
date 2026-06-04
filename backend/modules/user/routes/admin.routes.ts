import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateStaff,
  validateUpdateStaff,
  validateStaffId,
  validateStaffListQuery,
} from '../middlewares/staff.validation.js';
import {
  validateCustomerListQuery,
  validateCustomerId,
  validateUpdateCustomerStatus,
  validateCreateCustomer,
} from '../middlewares/customer.validation.js';
import {
  validateCreateShift,
  validateUpdateShift,
  validateShiftId,
  validateShiftListQuery,
} from '../middlewares/shift.validation.js';
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  listCustomers,
  getCustomer,
  updateCustomerStatus,
  createCustomer,
  listShifts,
  createShift,
  updateShift,
  cancelShift,
} from '../controllers/admin.controller.js';
import * as pointAdminController from '../controllers/point.admin.controller.js';

const router = express.Router();

// Mount authentication layer
router.use(authenticate);

// ─── Points Management Routes (Admin & Sales) ──────────────────────────────
router.get('/users/points', authorize('ADMIN', 'SALES'), pointAdminController.getUsersPoints);
router.get('/users/:id/points', authorize('ADMIN', 'SALES'), pointAdminController.getUserPointLedger);
router.post('/users/:id/points/adjust', authorize('ADMIN', 'SALES'), pointAdminController.adjustUserPoints);

// Mount global protection layers for all other admin routes
router.use(authorize('ADMIN'));

// ─── Staff Management Routes ─────────────────────────────────────────────────
router.get('/staff', validateStaffListQuery, listStaff);
router.post('/staff', validateCreateStaff, createStaff);
router.patch('/staff/:id', validateUpdateStaff, updateStaff);
router.delete('/staff/:id', validateStaffId, deleteStaff);

// ─── Customer Management Routes ──────────────────────────────────────────────
router.get('/customers', validateCustomerListQuery, listCustomers);
router.get('/customers/:id', validateCustomerId, getCustomer);
router.post('/customers', validateCreateCustomer, createCustomer);
router.patch('/customers/:id/status', validateUpdateCustomerStatus, updateCustomerStatus);

// ─── Shift Management Routes ─────────────────────────────────────────────────
router.get('/shifts', validateShiftListQuery, listShifts);
router.post('/shifts', validateCreateShift, createShift);
router.patch('/shifts/:id', validateUpdateShift, updateShift);
router.delete('/shifts/:id', validateShiftId, cancelShift);

export default router;
