import express, { Request, Response } from 'express';
import * as addressService from '../services/address.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateAddress,
  validateAddressId,
} from '../middlewares/logistics.validator.js';

const router = express.Router();

router.get(
  '/',
  authenticate, authorize('CUSTOMER'),
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, 200, 'OK', await addressService.getAddressesByCustomer(req.user!.id));
  })
);

router.post(
  '/',
  authenticate, authorize('CUSTOMER'),
  validateCreateAddress,
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, 201, 'Thêm địa chỉ thành công', await addressService.createAddress(req.user!.id, req.body));
  })
);

router.delete(
  '/:id',
  authenticate, authorize('CUSTOMER'),
  validateAddressId,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await addressService.deleteAddress(id, req.user!.id);
    sendSuccess(res, 200, 'Đã xóa địa chỉ');
  })
);

router.patch(
  '/:id/default',
  authenticate, authorize('CUSTOMER'),
  validateAddressId,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    sendSuccess(res, 200, 'OK', await addressService.setDefaultAddress(id, req.user!.id));
  })
);

export default router;
