import { body, query } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import mongoose from 'mongoose';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

// ─── Import Stock ──────────────────────────────────────────────────────────────

export const validateImportStock = [
  body('warehouseId').optional().custom(isObjectId),
  body('quantity').isNumeric().custom((val) => parseFloat(val) > 0).withMessage('Số lượng nhập phải lớn hơn 0'),
  body('unitPrice').optional().isNumeric().custom((val) => parseFloat(val) >= 0).withMessage('Đơn giá không hợp lệ'),
  body('totalCost').optional().isNumeric().custom((val) => parseFloat(val) >= 0).withMessage('Tổng tiền không hợp lệ'),
  body('reason').optional().isString(),
  body('variantId').optional().custom(isObjectId),
  body('materialId').optional().custom(isObjectId),
  body('newMaterialName').optional().trim().isLength({ min: 1, max: 255 }),
  body('newMaterialUnit').optional().trim().isLength({ min: 1, max: 50 }),
  body().custom((_, { req }) => {
    if (!req.body.variantId && !req.body.materialId && !req.body.newMaterialName) {
      throw new Error('Phải cung cấp variantId, materialId hoặc newMaterialName');
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
