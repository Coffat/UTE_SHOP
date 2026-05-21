import express, { Request, Response } from 'express';
import * as stockService from '../services/stock.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
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
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, 200, 'OK', await stockService.getStockLevels(req.query.warehouseId as string | undefined));
  })
);

// POST /api/v1/stock/import – nhập hàng
router.post(
  '/import',
  authenticate, authorize('ADMIN', 'WAREHOUSE_STAFF'),
  validateImportStock,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await stockService.importStock({ 
      ...req.body, 
      performedBy: req.user!.id 
    });
    sendSuccess(res, 201, 'Nhập kho thành công', result);
  })
);

export default router;
