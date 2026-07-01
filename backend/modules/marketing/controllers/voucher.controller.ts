import { Request, Response } from 'express';
import * as voucherService from '../services/voucher.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

export const getVouchers = async (req: Request, res: Response) => {
  sendSuccess(res, 200, 'OK', await voucherService.getVouchers());
};

export const getMyVouchers = asyncHandler(async (req: Request, res: Response) => {
  const items = await voucherService.getAvailableVouchersForCustomer(req.user!.id);
  sendSuccess(res, 200, 'OK', { items, total: items.length });
});

export const createVoucher = async (req: Request, res: Response) => {
  sendSuccess(res, 201, 'Tạo voucher thành công', await voucherService.createVoucher(req.body));
};

export const toggleVoucher = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  sendSuccess(res, 200, 'OK', await voucherService.toggleVoucher(id, req.body.isActive));
};

export const updateVoucher = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updated = await voucherService.updateVoucher(id, req.body);
  sendSuccess(res, 200, 'Cập nhật voucher thành công', updated);
});
