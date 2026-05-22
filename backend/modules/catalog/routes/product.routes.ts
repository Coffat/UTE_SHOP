import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateCreateVariant,
  validatePagination,
  validateAdminProductList,
  validateAdminCreateProduct,
  validateAdminUpdateProduct,
} from '../middlewares/catalog.validator.js';

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', validatePagination, productController.listProducts);

// ─── Admin (must be before /:id) ──────────────────────────────────────────────
// @deprecated Use GET /api/v1/admin/products/summary instead. Kept for backward compatibility.
const ADMIN_STAFF_READ_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'] as const;

router.get(
  '/admin/summary',
  authenticate,
  authorize(...ADMIN_STAFF_READ_ROLES),
  productController.adminProductSummary
);
// @deprecated Use GET /api/v1/admin/products instead. Kept for backward compatibility.
router.get(
  '/admin/list',
  authenticate,
  authorize(...ADMIN_STAFF_READ_ROLES),
  validateAdminProductList,
  productController.adminListProducts
);
// @deprecated Use POST /api/v1/admin/products instead. Kept for backward compatibility.
router.post(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  validateAdminCreateProduct,
  productController.adminCreateProduct
);
// @deprecated Use PATCH /api/v1/admin/products/:id instead. Kept for backward compatibility.
router.put(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  validateAdminUpdateProduct,
  productController.adminUpdateProduct
);

router.get('/:id', validateProductId, productController.getProduct);
router.get('/:id/related', validateProductId, productController.getRelatedProducts);
router.get('/:id/variants', validateProductId, productController.listVariants);
router.post('/:id/view', productController.incrementViews);

// ─── ADMIN only ───────────────────────────────────────────────────────────────
// @deprecated Use POST /api/v1/admin/products instead. Kept for backward compatibility.
router.post(
  '/',
  authenticate, authorize('ADMIN'),
  validateCreateProduct,
  productController.createProduct
);

// @deprecated Use PATCH /api/v1/admin/products/:id instead. Kept for backward compatibility.
router.put(
  '/:id',
  authenticate, authorize('ADMIN'),
  validateUpdateProduct,
  productController.updateProduct
);

// @deprecated Use PATCH /api/v1/admin/products/:id with { status: 'ACTIVE' } instead.
router.patch(
  '/:id/publish',
  authenticate, authorize('ADMIN'),
  validateProductId,
  productController.publishProduct
);

// @deprecated Use DELETE /api/v1/admin/products/:id instead. Kept for backward compatibility.
router.patch(
  '/:id/discontinue',
  authenticate, authorize('ADMIN'),
  validateProductId,
  productController.discontinueProduct
);

router.post(
  '/:id/variants',
  authenticate, authorize('ADMIN'),
  validateCreateVariant,
  productController.createVariant
);

export default router;
