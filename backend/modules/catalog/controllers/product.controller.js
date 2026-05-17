import * as productService from '../services/product.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { status, categoryId, categorySlug, search, color, style, minPrice, maxPrice, sortBy, page, limit } = req.query;
  const result = await productService.getProducts({ 
    status, categoryId, categorySlug, search, color, style, minPrice, maxPrice, sortBy, 
    page: page ? parseInt(page) : 1, 
    limit: limit ? parseInt(limit) : 12 
  });
  sendSuccess(res, 200, 'OK', result);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'OK', product);
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? +req.query.limit : 4;
  const products = await productService.getRelatedProducts(req.params.id, limit);
  sendSuccess(res, 200, 'OK', products);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  sendSuccess(res, 201, 'Tạo sản phẩm thành công', product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
  sendSuccess(res, 200, 'Cập nhật thành công', product);
});

export const publishProduct = asyncHandler(async (req, res) => {
  const product = await productService.publishProduct(req.params.id);
  sendSuccess(res, 200, 'Sản phẩm đã được phát hành', product);
});

export const discontinueProduct = asyncHandler(async (req, res) => {
  const product = await productService.discontinueProduct(req.params.id);
  sendSuccess(res, 200, 'Sản phẩm đã ngừng kinh doanh', product);
});

// Variants
export const createVariant = asyncHandler(async (req, res) => {
  const variant = await productService.createVariant(req.params.id, req.body);
  sendSuccess(res, 201, 'Tạo biến thể thành công', variant);
});

export const listVariants = asyncHandler(async (req, res) => {
  const variants = await productService.getVariantsByProduct(req.params.id);
  sendSuccess(res, 200, 'OK', variants);
});
