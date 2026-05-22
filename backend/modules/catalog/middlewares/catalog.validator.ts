import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import mongoose from 'mongoose';
import ProductStatus from '../../../shared/enums/ProductStatus.js';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

// ─── Product ──────────────────────────────────────────────────────────────────

export const validateCreateProduct = [
  body('name').notEmpty().withMessage('Tên sản phẩm là bắt buộc').trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('category').notEmpty().withMessage('Danh mục là bắt buộc').custom(isObjectId),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'UNISEX']),
  body('tags').optional().isArray(),
  handleValidationErrors,
];

export const validateUpdateProduct = [
  param('id').custom(isObjectId),
  body('name').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('category').optional().custom(isObjectId),
  handleValidationErrors,
];

export const validateProductId = [
  param('id').custom(isObjectId).withMessage('Product ID không hợp lệ'),
  handleValidationErrors,
];

// ─── Variant ──────────────────────────────────────────────────────────────────

export const validateCreateVariant = [
  param('id').custom(isObjectId),
  body('sku').notEmpty().withMessage('SKU là bắt buộc').trim(),
  body('price').notEmpty().isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
  body('sizeName').notEmpty().withMessage('Kích thước là bắt buộc').trim(),
  handleValidationErrors,
];

// ─── Category ─────────────────────────────────────────────────────────────────

export const validateCreateCategory = [
  body('name').notEmpty().withMessage('Tên danh mục là bắt buộc').trim().isLength({ max: 100 }),
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Slug chỉ chứa chữ thường, số và dấu -'),
  handleValidationErrors,
];

export const validateUpdateCategory = [
  param('id').custom(isObjectId),
  body('name').optional().trim().isLength({ max: 100 }),
  handleValidationErrors,
];

// ─── Review ───────────────────────────────────────────────────────────────────

export const validateCreateReview = [
  param('id').custom(isObjectId),
  body('rating').notEmpty().isInt({ min: 1, max: 5 }).withMessage('Rating từ 1 đến 5'),
  body('comment').optional().trim().isLength({ max: 1000 }),
  handleValidationErrors,
];

// ─── Pagination query params ──────────────────────────────────────────────────

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
];

// ─── Admin product list / summary ───────────────────────────────────────────

export const validateAdminProductList = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status')
    .optional()
    .isIn(Object.values(ProductStatus))
    .withMessage(`status phải là: ${Object.values(ProductStatus).join(', ')}`),
  query('categoryId').optional().custom(isObjectId),
  query('search').optional().trim().isLength({ max: 100 }),
  query('stockFilter')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock'])
    .withMessage('stockFilter không hợp lệ'),
  handleValidationErrors,
];

export const validateAdminCreateProduct = [
  body('name').notEmpty().withMessage('Tên sản phẩm là bắt buộc').trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('categoryId').notEmpty().withMessage('Danh mục là bắt buộc').custom(isObjectId),
  body('sku').notEmpty().withMessage('SKU là bắt buộc').trim().isLength({ max: 80 }),
  body('price').notEmpty().isFloat({ min: 0 }).withMessage('Giá phải là số không âm'),
  body('stock').notEmpty().isInt({ min: 0 }).withMessage('Tồn kho phải là số nguyên không âm'),
  body('status')
    .optional()
    .isIn(Object.values(ProductStatus))
    .withMessage(`status phải là: ${Object.values(ProductStatus).join(', ')}`),
  body('mainImageUrl').optional().trim().isURL().withMessage('mainImageUrl không hợp lệ'),
  handleValidationErrors,
];

export const validateAdminUpdateProduct = [
  param('id').custom(isObjectId),
  body('name').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('categoryId').optional().custom(isObjectId),
  body('sku').optional().trim().isLength({ max: 80 }),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('status')
    .optional()
    .isIn(Object.values(ProductStatus))
    .withMessage(`status phải là: ${Object.values(ProductStatus).join(', ')}`),
  handleValidationErrors,
];
