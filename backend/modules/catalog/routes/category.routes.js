import express from 'express';
import * as categoryService from '../services/category.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const data = await categoryService.getCategories();
  sendSuccess(res, 200, 'OK', data);
}));

router.post('/', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  sendSuccess(res, 201, 'Tạo danh mục thành công', data);
}));

router.put('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, 200, 'OK', data);
}));

export default router;
