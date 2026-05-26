import { Request, Response } from 'express';
import * as categoryService from '../../catalog/services/category.service.js';
import { sendSuccess, sendError, sendPaginated } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/utils/AppError.js';

/** GET /admin/categories */
export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const { search, isActive, page, limit } = req.query;
  const parsedIsActive =
    isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const result = await categoryService.getAdminCategories({
    search: search as string | undefined,
    isActive: parsedIsActive,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });

  sendPaginated(
    res,
    result.items,
    {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPages: result.meta.pages,
      activeCount: result.meta.activeCount,
      inactiveCount: result.meta.inactiveCount,
      totalProducts: result.meta.totalProducts,
    },
    'OK',
    200
  );
});

/** POST /admin/categories */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const category = await categoryService.createCategory(req.body);
    sendSuccess(res, 201, 'Tạo danh mục thành công', category);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});

/**
 * PATCH /admin/categories/:id
 *
 * Handles all partial updates including isActive toggle.
 * Body may include: name, slug, description, imageUrl, isActive.
 * Replaces the legacy PATCH /categories/admin/:id/toggle endpoint.
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const category = await categoryService.updateCategory(id, req.body);
    if (!category) return sendError(res, 404, 'Không tìm thấy danh mục');
    sendSuccess(res, 200, 'Cập nhật danh mục thành công', category);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});

/** DELETE /admin/categories/:id */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await categoryService.deleteCategory(id);
    sendSuccess(res, 200, 'Xóa danh mục thành công', null);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});
