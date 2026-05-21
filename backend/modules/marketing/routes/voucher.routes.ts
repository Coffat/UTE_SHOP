import express from 'express';
import * as voucherController from '../controllers/voucher.controller.js';
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
  asyncHandler(voucherController.getVouchers)
);

router.post(
  '/',
  authenticate, authorize('ADMIN'),
  validateCreateVoucher,
  asyncHandler(voucherController.createVoucher)
);

router.patch(
  '/:id/toggle',
  authenticate, authorize('ADMIN'),
  validateToggleVoucher,
  asyncHandler(voucherController.toggleVoucher)
);

export default router;
