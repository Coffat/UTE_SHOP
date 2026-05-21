import { body, query } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import mongoose from 'mongoose';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

// ─── Import Stock ──────────────────────────────────────────────────────────────

export const validateImportStock = [
  body('warehouseId').notEmpty().withMessage('Kho là bắt buộc').custom(isObjectId),
  body('quantity').notEmpty().isFloat({ min: 0.01 }).withMessage('Số lượng phải > 0'),
  body('reason').optional().trim().isLength({ max: 255 }),
  body('variantId').optional().custom(isObjectId),
  body('materialId').optional().custom(isObjectId),
  body().custom((_, { req }) => {
    if (!req.body.variantId && !req.body.materialId) {
      throw new Error('Phải cung cấp variantId hoặc materialId');
    }
    return true;
  }),
  handleValidationErrors,
];

// ─── Warehouse ID query param ─────────────────────────────────────────────────

export const validateWarehouseQuery = [
  query('warehouseId').optional().custom(isObjectId),
  handleValidationErrors,
];
