import { Request, Response } from 'express';
import * as productService from '../../catalog/services/product.service.js';
import { sendSuccess, sendError, sendPaginated } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/utils/AppError.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';
import {
  mapAdminProductToStaffListItem,
  mapAdminSummaryToStaffSummary,
  AdminProductSummary,
} from '../../../shared/mappers/product.mapper.js';

/** GET /staff/products/summary */
export const getProductSummary = asyncHandler(async (_req: Request, res: Response) => {
  const adminSummary = await productService.getAdminProductSummary();
  const staffSummary = mapAdminSummaryToStaffSummary(adminSummary as unknown as AdminProductSummary);
  sendSuccess(res, 200, 'OK', staffSummary);
});

/** GET /staff/products */
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

  const staffItems = result.items.map(mapAdminProductToStaffListItem);

  sendPaginated(res, staffItems, {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
    totalPages: result.meta.pages,
  });
});

/** GET /staff/products/:id */
export const getProductDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.getProductById(id);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'OK', product);
});

/** POST /staff/products */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  try {
    const product = await productService.createAdminProduct(req.body);
    await writeAuditLog(req, 'CREATE', 'Product', product.id, undefined, product.toObject());
    sendSuccess(res, 201, 'Tạo sản phẩm thành công', product);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});

/** PATCH /staff/products/:id */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const beforeProduct = await productService.getProductById(id);
    if (!beforeProduct) return sendError(res, 404, 'Không tìm thấy sản phẩm');

    const product = await productService.updateAdminProduct(id, req.body);
    await writeAuditLog(
      req,
      'UPDATE',
      'Product',
      id,
      beforeProduct.toObject(),
      product.toObject()
    );
    sendSuccess(res, 200, 'Cập nhật sản phẩm thành công', product);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    throw err;
  }
});
