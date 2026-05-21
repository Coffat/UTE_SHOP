import { Request, Response } from 'express';
import * as stockService from '../services/stock.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const getStockLevels = async (req: Request, res: Response) => {
  sendSuccess(res, 200, 'OK', await stockService.getStockLevels(req.query.warehouseId as string | undefined));
};

export const importStock = async (req: Request, res: Response) => {
  const result = await stockService.importStock({ 
    ...req.body, 
    performedBy: req.user!.id 
  });
  sendSuccess(res, 201, 'Nhập kho thành công', result);
};
