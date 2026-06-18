import express from 'express';
import * as addressController from '../controllers/address.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateAddress,
  validateUpdateAddress,
  validateAddressId,
} from '../middlewares/logistics.validator.js';

const router = express.Router();

router.get(
  '/',
  authenticate, authorize('CUSTOMER'),
  asyncHandler(addressController.getAddresses)
);

router.post(
  '/',
  authenticate, authorize('CUSTOMER'),
  validateCreateAddress,
  asyncHandler(addressController.createAddress)
);

router.delete(
  '/:id',
  authenticate, authorize('CUSTOMER'),
  validateAddressId,
  asyncHandler(addressController.deleteAddress)
);

router.patch(
  '/:id',
  authenticate, authorize('CUSTOMER'),
  validateAddressId,
  validateUpdateAddress,
  asyncHandler(addressController.updateAddress)
);

router.patch(
  '/:id/default',
  authenticate, authorize('CUSTOMER'),
  validateAddressId,
  asyncHandler(addressController.setDefaultAddress)
);

export default router;
