import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as staffCategoriesController from '../controllers/categories.controller.js';
import {
  validateAdminCategoryList,
  validateAdminCreateCategory,
  validateAdminUpdateCategory,
  validateCategoryId,
} from '../../catalog/middlewares/catalog.validator.js';

const router = express.Router();

const STAFF_WRITE_ROLES = ['ADMIN', 'WAREHOUSE_STAFF'] as const;

// GET /staff/categories
router.get(
  '/',
  authenticate,
  authorize(...STAFF_WRITE_ROLES),
  validateAdminCategoryList,
  staffCategoriesController.listCategories
);

// GET /staff/categories/:id
router.get(
  '/:id',
  authenticate,
  authorize(...STAFF_WRITE_ROLES),
  validateCategoryId,
  staffCategoriesController.getCategory
);

// POST /staff/categories
router.post(
  '/',
  authenticate,
  authorize(...STAFF_WRITE_ROLES),
  validateAdminCreateCategory,
  staffCategoriesController.createCategory
);

// PATCH /staff/categories/:id
router.patch(
  '/:id',
  authenticate,
  authorize(...STAFF_WRITE_ROLES),
  validateAdminUpdateCategory,
  staffCategoriesController.updateCategory
);

export default router;
