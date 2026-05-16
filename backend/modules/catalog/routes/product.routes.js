import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

// Public
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.get('/:id/variants', productController.listVariants);

// Admin/Staff only
router.post('/', authenticate, authorize('ADMIN'), productController.createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), productController.updateProduct);
router.patch('/:id/publish', authenticate, authorize('ADMIN'), productController.publishProduct);
router.patch('/:id/discontinue', authenticate, authorize('ADMIN'), productController.discontinueProduct);
router.post('/:id/variants', authenticate, authorize('ADMIN'), productController.createVariant);

export default router;
