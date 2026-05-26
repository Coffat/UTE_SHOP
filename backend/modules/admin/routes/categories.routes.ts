import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as adminCategoriesController from '../controllers/categories.controller.js';
import {
  validateAdminCategoryList,
  validateAdminCreateCategory,
  validateAdminUpdateCategory,
  validateCategoryId,
} from '../../catalog/middlewares/catalog.validator.js';

const router = express.Router();

const ADMIN_READ_ROLES = ['ADMIN'] as const;

// GET /admin/categories
router.get(
  '/',
  authenticate,
  authorize(...ADMIN_READ_ROLES),
  validateAdminCategoryList,
  adminCategoriesController.listCategories
);

// POST /admin/categories
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateAdminCreateCategory,
  adminCategoriesController.createCategory
);

/**
 * PATCH /admin/categories/:id
 *
 * Partial update — accepts any combination of: name, slug, description, imageUrl, isActive.
 * This replaces the legacy PATCH /categories/admin/:id/toggle for isActive changes.
 * Use body { isActive: boolean } to activate/deactivate a category.
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateAdminUpdateCategory,
  adminCategoriesController.updateCategory
);

// DELETE /admin/categories/:id
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateCategoryId,
  adminCategoriesController.deleteCategory
);

export default router;
