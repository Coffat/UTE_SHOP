import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateCreateVariant,
  validatePagination,
} from '../middlewares/catalog.validator.js';

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', validatePagination, productController.listProducts);
router.get('/:id', validateProductId, productController.getProduct);
router.get('/:id/variants', validateProductId, productController.listVariants);

// ─── ADMIN only ───────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate, authorize('ADMIN'),
  validateCreateProduct,
  productController.createProduct
);

router.put(
  '/:id',
  authenticate, authorize('ADMIN'),
  validateUpdateProduct,
  productController.updateProduct
);

router.patch(
  '/:id/publish',
  authenticate, authorize('ADMIN'),
  validateProductId,
  productController.publishProduct
);

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
