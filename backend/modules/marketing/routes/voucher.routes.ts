import express from 'express';
import * as voucherController from '../controllers/voucher.controller.js';
import * as voucherService from '../services/voucher.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateVoucher,
  validateToggleVoucher,
} from '../middlewares/marketing.validator.js';

const router = express.Router();

router.post(
  '/validate',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { code, orderTotal } = req.body;
    const result = await voucherService.validateAndCalculateVoucher(code, Number(orderTotal), req.user!.id);
    sendSuccess(res, 200, 'Mã giảm giá hợp lệ', {
      code: result.voucher.code,
      discountAmount: result.discountAmount,
      discountType: result.voucher.discountType,
      discountValue: Number(result.voucher.discountValue),
    });
  })
);

router.get(
  '/',
  authenticate, authorize('ADMIN', 'SALES'),
  asyncHandler(voucherController.getVouchers)
);

router.post(
  '/',
  authenticate, authorize('ADMIN', 'SALES'),
  validateCreateVoucher,
  asyncHandler(voucherController.createVoucher)
);

router.patch(
  '/:id/toggle',
  authenticate, authorize('ADMIN', 'SALES'),
  validateToggleVoucher,
  asyncHandler(voucherController.toggleVoucher)
);

export default router;
