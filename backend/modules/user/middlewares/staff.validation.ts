import { body, param, query } from 'express-validator';
import { validateRequest } from '../../../shared/middlewares/validateRequest.js';

export const validateCreateStaff = [
  body('fullName').notEmpty().withMessage('Họ tên là bắt buộc').trim(),
  body('email')
    .notEmpty().withMessage('Email là bắt buộc')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải dài ít nhất 6 ký tự'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone('any').withMessage('Số điện thoại không hợp lệ'),
  body('role')
    .notEmpty().withMessage('Vai trò nhân sự là bắt buộc')
    .isIn(['SALES', 'WAREHOUSE_STAFF', 'STORE_STAFF'])
    .withMessage('Vai trò phải thuộc nhóm SALES, WAREHOUSE_STAFF hoặc STORE_STAFF'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'ON_LEAVE', 'SUSPENDED'])
    .withMessage('Trạng thái không hợp lệ'),
  body('performanceScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Điểm hiệu suất phải từ 0 đến 100'),
  validateRequest,
];

export const validateUpdateStaff = [
  param('id').isMongoId().withMessage('Mã định danh nhân viên không hợp lệ'),
  body('fullName').optional().notEmpty().withMessage('Họ tên không được để trống').trim(),
  body('email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Mật khẩu mới phải dài ít nhất 6 ký tự'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone('any').withMessage('Số điện thoại không hợp lệ'),
  body('role')
    .optional()
    .isIn(['SALES', 'WAREHOUSE_STAFF', 'STORE_STAFF'])
    .withMessage('Vai trò phải thuộc nhóm SALES, WAREHOUSE_STAFF hoặc STORE_STAFF'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'ON_LEAVE', 'SUSPENDED'])
    .withMessage('Trạng thái không hợp lệ'),
  body('performanceScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Điểm hiệu suất phải từ 0 đến 100'),
  validateRequest,
];

export const validateStaffId = [
  param('id').isMongoId().withMessage('ID nhân sự không hợp lệ'),
  validateRequest,
];

export const validateStaffListQuery = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('sortBy').optional().trim(),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder phải là asc hoặc desc'),
  query('status').optional().isIn(['ACTIVE', 'ON_LEAVE', 'SUSPENDED']).withMessage('status không hợp lệ'),
  query('role').optional().isIn(['SALES', 'WAREHOUSE_STAFF', 'STORE_STAFF']).withMessage('role không hợp lệ'),
  validateRequest,
];
