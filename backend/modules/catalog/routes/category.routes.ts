import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as categoryController from '../controllers/category.controller.js';
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateAdminCategoryList,
  validateAdminCreateCategory,
  validateAdminUpdateCategory,
  validateCategoryId,
  validateToggleCategory,
} from '../middlewares/catalog.validator.js';

const router = express.Router();

const ADMIN_STAFF_READ_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'] as const;

// ─── Admin (must be before /:idOrSlug) ───────────────────────────────────────
router.get(
  '/admin/list',
  authenticate,
  authorize(...ADMIN_STAFF_READ_ROLES),
  validateAdminCategoryList,
  categoryController.adminListCategories
);

router.post(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  validateAdminCreateCategory,
  categoryController.adminCreateCategory
);

router.put(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  validateAdminUpdateCategory,
  categoryController.adminUpdateCategory
);

router.patch(
  '/admin/:id/toggle',
  authenticate,
  authorize('ADMIN'),
  validateCategoryId,
  validateToggleCategory,
  categoryController.adminToggleCategory
);

router.delete(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  validateCategoryId,
  categoryController.adminDeleteCategory
);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', categoryController.listCategories);
router.get('/:idOrSlug', categoryController.getCategory);

// ─── Legacy ADMIN routes (keep for backward compatibility) ────────────────────
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateCreateCategory,
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateUpdateCategory,
  categoryController.updateCategory
);

export default router;
