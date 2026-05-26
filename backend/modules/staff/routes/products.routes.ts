import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as staffProductsController from '../controllers/products.controller.js';
import {
  validateAdminProductList,
  validateAdminCreateProduct,
  validateAdminUpdateProduct,
  validateProductId,
} from '../../catalog/middlewares/catalog.validator.js';

const router = express.Router();

const STAFF_READ_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'] as const;
const STAFF_WRITE_ROLES = ['ADMIN', 'WAREHOUSE_STAFF'] as const;

// GET /staff/products/summary — must be before /:id
router.get(
  '/summary',
  authenticate,
  authorize(...STAFF_READ_ROLES),
  staffProductsController.getProductSummary
);

// GET /staff/products
router.get(
  '/',
  authenticate,
  authorize(...STAFF_READ_ROLES),
  validateAdminProductList,
  staffProductsController.listProducts
);

// GET /staff/products/:id
router.get(
  '/:id',
  authenticate,
  authorize(...STAFF_READ_ROLES),
  validateProductId,
  staffProductsController.getProductDetail
);

// POST /staff/products
router.post(
  '/',
  authenticate,
  authorize(...STAFF_WRITE_ROLES),
  validateAdminCreateProduct,
  staffProductsController.createProduct
);

// PATCH /staff/products/:id
router.patch(
  '/:id',
  authenticate,
  authorize(...STAFF_WRITE_ROLES),
  validateAdminUpdateProduct,
  staffProductsController.updateProduct
);

export default router;
