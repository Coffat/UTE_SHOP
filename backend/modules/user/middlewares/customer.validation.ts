import { body, param, query } from 'express-validator';
import { validateRequest } from '../../../shared/middlewares/validateRequest.js';

export const validateUpdateCustomerStatus = [
  param('id').isMongoId().withMessage('Mã định danh khách hàng không hợp lệ'),
  body('status')
    .notEmpty().withMessage('Trạng thái là bắt buộc')
    .isIn(['ACTIVE', 'BANNED', 'PENDING', 'SUSPENDED'])
    .withMessage('Trạng thái phải thuộc ACTIVE, BANNED, PENDING hoặc SUSPENDED'),
  validateRequest,
];

export const validateCustomerListQuery = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('sortBy').optional().trim(),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder phải là asc hoặc desc'),
  query('status').optional().isIn(['ACTIVE', 'BANNED', 'PENDING', 'SUSPENDED']).withMessage('status không hợp lệ'),
  validateRequest,
];

export const validateCustomerId = [
  param('id').isMongoId().withMessage('ID khách hàng không hợp lệ'),
  validateRequest,
];
