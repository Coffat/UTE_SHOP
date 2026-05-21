import express from 'express';
import * as stockController from '../controllers/stock.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateImportStock,
  validateWarehouseQuery,
} from '../middlewares/inventory.validator.js';

const router = express.Router();

// GET /api/v1/stock?warehouseId=...
router.get(
  '/',
  authenticate, authorize('ADMIN', 'WAREHOUSE_STAFF'),
  validateWarehouseQuery,
  asyncHandler(stockController.getStockLevels)
);

// POST /api/v1/stock/import – nhập hàng
router.post(
  '/import',
  authenticate, authorize('ADMIN', 'WAREHOUSE_STAFF'),
  validateImportStock,
  asyncHandler(stockController.importStock)
);

export default router;
