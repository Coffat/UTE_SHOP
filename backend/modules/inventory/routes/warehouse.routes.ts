import express from 'express';
import * as stockController from '../controllers/stock.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { validateImportStock } from '../middlewares/inventory.validator.js';

const router = express.Router();

// Middleware áp dụng cho toàn bộ warehouse routes
router.use(authenticate, authorize('ADMIN', 'WAREHOUSE_STAFF'));

// GET /api/v1/warehouse/summary – Dashboard stats
router.get('/summary', asyncHandler(stockController.getWarehouseSummary));

// GET /api/v1/warehouse/stock?type=material|variant – Danh sách tồn kho
router.get('/stock', asyncHandler(stockController.getStockLevels));

// POST /api/v1/warehouse/import – Nhập kho
router.post('/import', validateImportStock, asyncHandler(stockController.importStock));

// GET /api/v1/warehouse/transactions – Lịch sử giao dịch
router.get('/transactions', asyncHandler(stockController.getTransactions));

// GET /api/v1/warehouse/materials – Danh sách nguyên liệu (để chọn trong form)
router.get('/materials', asyncHandler(stockController.getMaterials));

export default router;
