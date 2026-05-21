import express, { Request, Response } from 'express';
import * as voucherService from '../services/voucher.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateVoucher,
  validateToggleVoucher,
} from '../middlewares/marketing.validator.js';

const router = express.Router();

router.get(
  '/',
  authenticate, authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, 200, 'OK', await voucherService.getVouchers());
  })
);

router.post(
  '/',
  authenticate, authorize('ADMIN'),
  validateCreateVoucher,
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, 201, 'Tạo voucher thành công', await voucherService.createVoucher(req.body));
  })
);

router.patch(
  '/:id/toggle',
  authenticate, authorize('ADMIN'),
  validateToggleVoucher,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    sendSuccess(res, 200, 'OK', await voucherService.toggleVoucher(id, req.body.isActive));
  })
);

export default router;
