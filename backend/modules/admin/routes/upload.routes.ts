import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { uploadImage as uploadImageMiddleware } from '../../../shared/middlewares/uploadImage.js';
import * as uploadController from '../controllers/upload.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

const router = express.Router();

router.post(
  '/image',
  authenticate,
  authorize('ADMIN', 'SALES', 'WAREHOUSE_STAFF', 'STORE_STAFF'),
  uploadImageMiddleware.single('image'),
  asyncHandler(async (req, res) => {
    uploadController.uploadImage(req, res);
  })
);

export default router;
