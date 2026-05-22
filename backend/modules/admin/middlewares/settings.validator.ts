import { body } from 'express-validator';
import { validateRequest } from '../../../shared/middlewares/validateRequest.js';

export const validateUpdateSettings = [
  body('storeName').optional().isString().trim().isLength({ max: 120 }),
  body('supportEmail').optional().isEmail().withMessage('Email hỗ trợ không hợp lệ'),
  body('phone').optional().isString().trim().isLength({ max: 30 }),
  body('address').optional().isString().trim().isLength({ max: 500 }),
  body('timezone').optional().isString().trim().isLength({ max: 120 }),
  body('vnpayActive').optional().isBoolean(),
  body('codActive').optional().isBoolean(),
  body('momoActive').optional().isBoolean(),
  body('vat').optional().isString().trim().isLength({ max: 10 }),
  body('roundPrice').optional().isString().trim().isLength({ max: 80 }),
  body('currency').optional().isString().trim().isLength({ max: 80 }),
  body('notifyEmail').optional().isBoolean(),
  body('notifySMS').optional().isBoolean(),
  body('lowStock').optional().isBoolean(),
  body('newOrder').optional().isBoolean(),
  body('tfaActive').optional().isBoolean(),
  body('sessionTimeout').optional().isString().trim().isLength({ max: 40 }),
  body('apiKey').optional().isString().trim(),
  body('defaultShippingFee').optional().isInt({ min: 0 }),
  body('freeShippingThreshold').optional().isInt({ min: 0 }),
  body('webhookUrl').optional().isString().trim().isLength({ max: 500 }),
  body('webhookEnabled').optional().isBoolean(),
  validateRequest,
];
