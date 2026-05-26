import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

const ADMIN_STAFF_READ_ROLES = [
  'ADMIN',
  'SALES',
  'STORE_STAFF',
  'WAREHOUSE_STAFF',
] as const;

router.get(
  '/',
  authenticate,
  authorize(...ADMIN_STAFF_READ_ROLES),
  dashboardController.getDashboard
);

export default router;
