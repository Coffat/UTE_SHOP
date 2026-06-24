import { Request, Response } from 'express';
import * as stockService from '../services/stock.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const getStockLevels = async (req: Request, res: Response) => {
  const { warehouseId, type } = req.query;
  sendSuccess(res, 200, 'OK', await stockService.getStockLevels(
    warehouseId as string | undefined,
    type as 'material' | 'variant' | undefined
  ));
};

export const importStock = async (req: Request, res: Response) => {
  const result = await stockService.importStock({
    ...req.body,
    performedBy: req.user!.id,
  });
  sendSuccess(res, 201, 'Nhập kho thành công', result);
};

// ─── Warehouse Dashboard Handlers ─────────────────────────────────────────────

export const getWarehouseSummary = async (req: Request, res: Response) => {
  const summary = await stockService.getWarehouseSummary();
  sendSuccess(res, 200, 'OK', summary);
};

export const getTransactions = async (req: Request, res: Response) => {
  const { type, dateFrom, dateTo, page, limit, search } = req.query;
  const result = await stockService.getTransactions({
    type: type as string | undefined,
    dateFrom: dateFrom as string | undefined,
    dateTo: dateTo as string | undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search as string | undefined,
  });
  sendSuccess(res, 200, 'OK', result);
};

export const getMaterials = async (_req: Request, res: Response) => {
  const materials = await stockService.getMaterials();
  sendSuccess(res, 200, 'OK', materials);
};
