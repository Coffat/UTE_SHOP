import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as categoryService from '../services/category.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateCategory,
  validateUpdateCategory,
} from '../middlewares/catalog.validator.js';

const router = express.Router();

// Public
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, 200, 'OK', await categoryService.getCategories());
}));

router.get('/:idOrSlug', asyncHandler(async (req: Request, res: Response) => {
  const idOrSlug = req.params.idOrSlug as string;
  const category = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? await categoryService.getCategoryById(idOrSlug)
    : await categoryService.getCategoryBySlug(idOrSlug);
  if (!category) return sendError(res, 404, 'Không tìm thấy danh mục');
  sendSuccess(res, 200, 'OK', category);
}));

// ADMIN only
router.post(
  '/',
  authenticate, authorize('ADMIN'),
  validateCreateCategory,
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, 201, 'Tạo danh mục thành công', await categoryService.createCategory(req.body));
  })
);

router.put(
  '/:id',
  authenticate, authorize('ADMIN'),
  validateUpdateCategory,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    sendSuccess(res, 200, 'OK', await categoryService.updateCategory(id, req.body));
  })
);

export default router;
