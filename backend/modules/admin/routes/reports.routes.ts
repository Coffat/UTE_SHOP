import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as reportsController from '../controllers/reports.controller.js';

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
  reportsController.getReports
);

export default router;
