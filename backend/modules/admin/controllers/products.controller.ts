import { Request, Response } from 'express';
import * as productService from '../../catalog/services/product.service.js';
import { sendSuccess, sendError, sendPaginated } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/utils/AppError.js';

const ADMIN_ROLES = ['ADMIN'] as const;

/** GET /admin/products/summary */
export const getProductSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await productService.getAdminProductSummary();
  sendSuccess(res, 200, 'OK', summary);
});

/** GET /admin/products */
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { status, categoryId, search, stockFilter, page, limit } = req.query;
  const result = await productService.getAdminProducts({
    status: status as string,
    categoryId: categoryId as string,
    search: search as string,
    stockFilter: stockFilter as 'in_stock' | 'low_stock' | 'out_of_stock',
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });
  sendPaginated(res, result.items, {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
    totalPages: result.meta.pages,
  });
});

/** POST /admin/products */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createAdminProduct(req.body);
  sendSuccess(res, 201, 'Tạo sản phẩm thành công', product);
});

/** PATCH /admin/products/:id */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const product = await productService.updateAdminProduct(id, req.body);
    sendSuccess(res, 200, 'Cập nhật sản phẩm thành công', product);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});

/** DELETE /admin/products/:id — soft delete by setting status=DISCONTINUED */
export const discontinueProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const product = await productService.discontinueAdminProduct(id);
    if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
    sendSuccess(res, 200, 'Sản phẩm đã ngừng kinh doanh', product);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});

/** POST /admin/products/:id/variants */
export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const variant = await productService.createVariant(id, req.body);
  sendSuccess(res, 201, 'Tạo biến thể thành công', variant);
});
