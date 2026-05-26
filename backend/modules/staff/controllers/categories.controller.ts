import { Request, Response } from 'express';
import * as categoryService from '../../catalog/services/category.service.js';
import { sendSuccess, sendError, sendPaginated } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/utils/AppError.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';

/** GET /staff/categories */
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

/** GET /staff/categories/:id */
export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await categoryService.getCategoryById(id);
  if (!category) {
    return sendError(res, 404, 'Không tìm thấy danh mục');
  }
  sendSuccess(res, 200, 'OK', category);
});

/** POST /staff/categories */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const category = await categoryService.createCategory(req.body);
    await writeAuditLog(req, 'CREATE', 'Category', category.id, undefined, category.toObject());
    sendSuccess(res, 201, 'Tạo danh mục thành công', category);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});

/** PATCH /staff/categories/:id */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const beforeCategory = await categoryService.getCategoryById(id);
    if (!beforeCategory) return sendError(res, 404, 'Không tìm thấy danh mục');

    const category = await categoryService.updateCategory(id, req.body);
    if (!category) return sendError(res, 404, 'Không tìm thấy danh mục');

    await writeAuditLog(
      req,
      'UPDATE',
      'Category',
      id,
      beforeCategory.toObject(),
      category.toObject()
    );

    sendSuccess(res, 200, 'Cập nhật danh mục thành công', category);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});
