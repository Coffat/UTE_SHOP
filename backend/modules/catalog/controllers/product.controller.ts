import { Request, Response } from 'express';
import * as productService from '../services/product.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { status, categoryId, categorySlug, search, color, style, minPrice, maxPrice, sortBy, page, limit } = req.query;
  
  const result = await productService.getProducts({ 
    status: status as string | undefined,
    categoryId: categoryId as string | undefined,
    categorySlug: categorySlug as string | undefined,
    search: search as string | undefined,
    color: color as string | undefined,
    style: style as string | undefined,
    minPrice: minPrice as string | number | undefined,
    maxPrice: maxPrice as string | number | undefined,
    sortBy: sortBy as string | undefined, 
    page: page ? parseInt(page as string) : 1, 
    limit: limit ? parseInt(limit as string) : 12 
  });
  sendSuccess(res, 200, 'OK', result);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.getProductById(id);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'OK', product);
});

export const incrementViews = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.incrementProductViews(id);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'Tăng lượt xem thành công', { views: product.views });
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const limit = req.query.limit ? +req.query.limit : 4;
  const products = await productService.getRelatedProducts(id, limit);
  sendSuccess(res, 200, 'OK', products);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  sendSuccess(res, 201, 'Tạo sản phẩm thành công', product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.updateProduct(id, req.body);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'Cập nhật thành công', product);
});

export const publishProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.publishProduct(id);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'Sản phẩm đã được phát hành', product);
});

export const discontinueProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.discontinueProduct(id);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'Sản phẩm đã ngừng kinh doanh', product);
});

// Variants
export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const variant = await productService.createVariant(id, req.body);
  sendSuccess(res, 201, 'Tạo biến thể thành công', variant);
});

export const listVariants = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const variants = await productService.getVariantsByProduct(id);
  sendSuccess(res, 200, 'OK', variants);
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminProductSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await productService.getAdminProductSummary();
  sendSuccess(res, 200, 'OK', summary);
});

export const adminListProducts = asyncHandler(async (req: Request, res: Response) => {
  const { status, categoryId, search, stockFilter, page, limit } = req.query;
  const result = await productService.getAdminProducts({
    status: status as string,
    categoryId: categoryId as string,
    search: search as string,
    stockFilter: stockFilter as 'in_stock' | 'low_stock' | 'out_of_stock',
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });
  sendSuccess(res, 200, 'OK', result);
});

export const adminCreateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createAdminProduct(req.body);
  sendSuccess(res, 201, 'Tạo sản phẩm thành công', product);
});

export const adminUpdateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.updateAdminProduct(id, req.body);
  sendSuccess(res, 200, 'Cập nhật sản phẩm thành công', product);
});
