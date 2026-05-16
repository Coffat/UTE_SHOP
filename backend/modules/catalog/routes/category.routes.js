import express from 'express';
import * as categoryService from '../services/category.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateCategory,
  validateUpdateCategory,
} from '../middlewares/catalog.validator.js';

const router = express.Router();

// Public
router.get('/', asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'OK', await categoryService.getCategories());
}));

// ADMIN only
router.post(
  '/',
  authenticate, authorize('ADMIN'),
  validateCreateCategory,
  asyncHandler(async (req, res) => {
    sendSuccess(res, 201, 'Tạo danh mục thành công', await categoryService.createCategory(req.body));
  })
);

router.put(
  '/:id',
  authenticate, authorize('ADMIN'),
  validateUpdateCategory,
  asyncHandler(async (req, res) => {
    sendSuccess(res, 200, 'OK', await categoryService.updateCategory(req.params.id, req.body));
  })
);

export default router;
