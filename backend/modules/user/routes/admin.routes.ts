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
  validateUpdateCustomerStatus,
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
  updateCustomerStatus,
  listShifts,
  createShift,
  updateShift,
  cancelShift,
} from '../controllers/admin.controller.js';

const router = express.Router();

// Mount global protection layers for all routes mounted under /api/v1/admin
router.use(authenticate);
router.use(authorize('ADMIN'));

// ─── Staff Management Routes ─────────────────────────────────────────────────
router.get('/staff', validateStaffListQuery, listStaff);
router.post('/staff', validateCreateStaff, createStaff);
router.put('/staff/:id', validateUpdateStaff, updateStaff);
router.delete('/staff/:id', validateStaffId, deleteStaff);

// ─── Customer Management Routes ──────────────────────────────────────────────
router.get('/customers', validateCustomerListQuery, listCustomers);
router.patch('/customers/:id/status', validateUpdateCustomerStatus, updateCustomerStatus);

// ─── Shift Management Routes ─────────────────────────────────────────────────
router.get('/shifts', validateShiftListQuery, listShifts);
router.post('/shifts', validateCreateShift, createShift);
router.put('/shifts/:id', validateUpdateShift, updateShift);
router.delete('/shifts/:id', validateShiftId, cancelShift);

export default router;
