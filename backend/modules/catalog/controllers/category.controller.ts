import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as categoryService from '../services/category.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/utils/AppError.js';

const handleCategoryError = (err: unknown, res: Response): boolean => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message);
    return true;
  }
  return false;
};

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, 'OK', await categoryService.getCategories());
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const idOrSlug = req.params.idOrSlug as string;
  const category = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? await categoryService.getCategoryById(idOrSlug)
    : await categoryService.getCategoryBySlug(idOrSlug);
  if (!category) return sendError(res, 404, 'Không tìm thấy danh mục');
  sendSuccess(res, 200, 'OK', category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    sendSuccess(res, 201, 'Tạo danh mục thành công', await categoryService.createCategory(req.body));
  } catch (err) {
    if (handleCategoryError(err, res)) return;
    throw err;
  }
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const category = await categoryService.updateCategory(id, req.body);
    if (!category) return sendError(res, 404, 'Không tìm thấy danh mục');
    sendSuccess(res, 200, 'OK', category);
  } catch (err) {
    if (handleCategoryError(err, res)) return;
    throw err;
  }
});

export const adminListCategories = asyncHandler(async (req: Request, res: Response) => {
  const { search, isActive, page, limit } = req.query;
  const parsedIsActive =
    isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const result = await categoryService.getAdminCategories({
    search: search as string | undefined,
    isActive: parsedIsActive,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });
  sendSuccess(res, 200, 'OK', result);
});

export const adminCreateCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    sendSuccess(res, 201, 'Tạo danh mục thành công', await categoryService.createCategory(req.body));
  } catch (err) {
    if (handleCategoryError(err, res)) return;
    throw err;
  }
});

export const adminUpdateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const category = await categoryService.updateCategory(id, req.body);
    if (!category) return sendError(res, 404, 'Không tìm thấy danh mục');
    sendSuccess(res, 200, 'Cập nhật danh mục thành công', category);
  } catch (err) {
    if (handleCategoryError(err, res)) return;
    throw err;
  }
});

export const adminToggleCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { isActive } = req.body as { isActive: boolean };
  const category = await categoryService.toggleCategory(id, isActive);
  if (!category) return sendError(res, 404, 'Không tìm thấy danh mục');
  sendSuccess(res, 200, 'Cập nhật trạng thái danh mục thành công', category);
});

export const adminDeleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await categoryService.deleteCategory(id);
    sendSuccess(res, 200, 'Xóa danh mục thành công', null);
  } catch (err) {
    if (handleCategoryError(err, res)) return;
    throw err;
  }
});
