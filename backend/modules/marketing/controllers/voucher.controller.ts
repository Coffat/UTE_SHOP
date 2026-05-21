import { Request, Response } from 'express';
import * as voucherService from '../services/voucher.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const getVouchers = async (req: Request, res: Response) => {
  sendSuccess(res, 200, 'OK', await voucherService.getVouchers());
};

export const createVoucher = async (req: Request, res: Response) => {
  sendSuccess(res, 201, 'Tạo voucher thành công', await voucherService.createVoucher(req.body));
};

export const toggleVoucher = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  sendSuccess(res, 200, 'OK', await voucherService.toggleVoucher(id, req.body.isActive));
};
