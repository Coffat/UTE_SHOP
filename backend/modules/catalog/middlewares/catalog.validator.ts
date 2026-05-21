import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import mongoose from 'mongoose';

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
