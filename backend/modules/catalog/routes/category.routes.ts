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
// @deprecated Use GET /api/v1/admin/categories instead. Kept for backward compatibility.
router.get(
  '/admin/list',
  authenticate,
  authorize(...ADMIN_STAFF_READ_ROLES),
  validateAdminCategoryList,
  categoryController.adminListCategories
);

// @deprecated Use POST /api/v1/admin/categories instead. Kept for backward compatibility.
router.post(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  validateAdminCreateCategory,
  categoryController.adminCreateCategory
);

// @deprecated Use PATCH /api/v1/admin/categories/:id instead. Kept for backward compatibility.
router.put(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  validateAdminUpdateCategory,
  categoryController.adminUpdateCategory
);

// @deprecated Use PATCH /api/v1/admin/categories/:id with body { isActive } instead.
router.patch(
  '/admin/:id/toggle',
  authenticate,
  authorize('ADMIN'),
  validateCategoryId,
  validateToggleCategory,
  categoryController.adminToggleCategory
);

// @deprecated Use DELETE /api/v1/admin/categories/:id instead. Kept for backward compatibility.
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

// @deprecated (legacy) Use POST /api/v1/admin/categories instead.
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateCreateCategory,
  categoryController.createCategory
);

// @deprecated (legacy) Use PATCH /api/v1/admin/categories/:id instead.
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateUpdateCategory,
  categoryController.updateCategory
);

export default router;
