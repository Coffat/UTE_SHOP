import express from 'express';
import { body, param } from 'express-validator';
import * as blogController from '../controllers/blog.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const router = express.Router();

// --- Quy tắc Validation ---
const createBlogValidators = [
  body('title').notEmpty().withMessage('Tiêu đề không được trống.').trim(),
  body('slug').notEmpty().withMessage('Slug không được trống.').isSlug().withMessage('Slug không hợp lệ (ví dụ: y-nghia-hoa-hong).').trim(),
  body('content').notEmpty().withMessage('Nội dung không được trống.'),
  body('excerpt').notEmpty().withMessage('Tóm tắt bài viết không được trống.').trim(),
  body('coverImage').notEmpty().withMessage('Hình ảnh đại diện không được trống.').isURL().withMessage('URL hình ảnh không hợp lệ.'),
  body('category').notEmpty().withMessage('Danh mục không được trống.').trim(),
  body('tags').optional().isArray().withMessage('Danh sách thẻ tags phải là một mảng.'),
  body('isPublished').optional().isBoolean().withMessage('isPublished phải là giá trị Boolean.'),
  handleValidationErrors,
];

const updateBlogValidators = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ.'),
  body('title').optional().notEmpty().withMessage('Tiêu đề không được trống.').trim(),
  body('slug').optional().notEmpty().withMessage('Slug không được trống.').isSlug().withMessage('Slug không hợp lệ.').trim(),
  body('content').optional().notEmpty().withMessage('Nội dung không được trống.'),
  body('excerpt').optional().notEmpty().withMessage('Tóm tắt không được trống.').trim(),
  body('coverImage').optional().notEmpty().withMessage('Hình ảnh không được trống.').isURL().withMessage('URL không hợp lệ.'),
  body('category').optional().notEmpty().withMessage('Danh mục không được trống.').trim(),
  body('tags').optional().isArray().withMessage('Thẻ tags phải là mảng.'),
  body('isPublished').optional().isBoolean().withMessage('isPublished phải là Boolean.'),
  handleValidationErrors,
];

// --- Định nghĩa Routes ---

// GET /api/v1/blogs - Lấy danh sách bài viết (công khai)
router.get(
  '/',
  asyncHandler(blogController.getBlogPosts)
);

// GET /api/v1/blogs/:slug - Lấy chi tiết bài viết theo slug (công khai)
router.get(
  '/:slug',
  asyncHandler(blogController.getBlogPostBySlug)
);

// POST /api/v1/blogs - Tạo bài viết mới (chỉ Admin hoặc Staff)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  createBlogValidators,
  asyncHandler(blogController.createBlogPost)
);

// PUT /api/v1/blogs/:id - Cập nhật bài viết theo ID (chỉ Admin hoặc Staff)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  updateBlogValidators,
  asyncHandler(blogController.updateBlogPost)
);

// DELETE /api/v1/blogs/:id - Xóa bài viết theo ID (chỉ Admin hoặc Staff)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  [param('id').isMongoId().withMessage('ID bài viết không hợp lệ.'), handleValidationErrors],
  asyncHandler(blogController.deleteBlogPost)
);

export default router;
