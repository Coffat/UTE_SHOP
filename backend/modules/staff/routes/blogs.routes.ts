import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as staffBlogsController from '../controllers/blogs.controller.js';
import {
  createBlogValidators,
  updateBlogValidators,
} from '../../system/routes/blog.routes.js';
import { param } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'SALES'] as const;

const validateId = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ.'),
  handleValidationErrors,
];

// GET /staff/blogs
router.get(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  staffBlogsController.listBlogs
);

// GET /staff/blogs/filters
router.get(
  '/filters',
  authenticate,
  authorize(...STAFF_ROLES),
  staffBlogsController.getBlogFilters
);

// GET /staff/blogs/:id
router.get(
  '/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  validateId,
  staffBlogsController.getBlog
);

// POST /staff/blogs
router.post(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  createBlogValidators,
  staffBlogsController.createBlog
);

// PATCH /staff/blogs/:id
router.patch(
  '/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  updateBlogValidators,
  staffBlogsController.updateBlog
);

export default router;
