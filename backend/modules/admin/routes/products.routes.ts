import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as adminProductsController from '../controllers/products.controller.js';
import {
  validateAdminProductList,
  validateAdminCreateProduct,
  validateAdminUpdateProduct,
  validateProductId,
  validateCreateVariant,
} from '../../catalog/middlewares/catalog.validator.js';

const router = express.Router();

const ADMIN_READ_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'] as const;

// GET /admin/products/summary — must be before /:id
router.get(
  '/summary',
  authenticate,
  authorize(...ADMIN_READ_ROLES),
  adminProductsController.getProductSummary
);

// GET /admin/products
router.get(
  '/',
  authenticate,
  authorize(...ADMIN_READ_ROLES),
  validateAdminProductList,
  adminProductsController.listProducts
);

// POST /admin/products
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateAdminCreateProduct,
  adminProductsController.createProduct
);

// PATCH /admin/products/:id — partial update (name, price, status, etc.)
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateAdminUpdateProduct,
  adminProductsController.updateProduct
);

// DELETE /admin/products/:id — soft delete (set status=DISCONTINUED)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateProductId,
  adminProductsController.discontinueProduct
);

// POST /admin/products/:id/variants
router.post(
  '/:id/variants',
  authenticate,
  authorize('ADMIN'),
  validateCreateVariant,
  adminProductsController.createVariant
);

export default router;
