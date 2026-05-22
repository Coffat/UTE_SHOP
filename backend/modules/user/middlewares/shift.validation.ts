import { body, param, query } from 'express-validator';
import { validateRequest } from '../../../shared/middlewares/validateRequest.js';

export const validateCreateShift = [
  body('title').notEmpty().withMessage('Tên ca làm việc là bắt buộc').trim(),
  body('startTime')
    .notEmpty().withMessage('Giờ bắt đầu là bắt buộc')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ bắt đầu phải theo định dạng HH:MM'),
  body('endTime')
    .notEmpty().withMessage('Giờ kết thúc là bắt buộc')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ kết thúc phải theo định dạng HH:MM'),
  body('color').optional().isString(),
  body('bg').optional().isString(),
  body('date')
    .notEmpty().withMessage('Ngày làm việc là bắt buộc')
    .isISO8601().withMessage('Ngày làm việc phải đúng định dạng ngày hợp lệ'),
  body('assignedStaff')
    .notEmpty().withMessage('Phân công nhân sự là bắt buộc')
    .isArray().withMessage('Danh sách nhân sự được giao ca phải dạng mảng'),
  body('assignedStaff.*')
    .isMongoId().withMessage('ID nhân viên phân công không hợp lệ'),
  validateRequest,
];

export const validateUpdateShift = [
  param('id').isMongoId().withMessage('ID ca làm việc không hợp lệ'),
  body('title').optional().notEmpty().withMessage('Tên ca làm việc không được để trống').trim(),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ bắt đầu phải theo định dạng HH:MM'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ kết thúc phải theo định dạng HH:MM'),
  body('color').optional().isString(),
  body('bg').optional().isString(),
  body('date').optional().isISO8601().withMessage('Ngày làm việc phải đúng định dạng ngày hợp lệ'),
  body('assignedStaff').optional().isArray().withMessage('Danh sách nhân sự được giao ca phải dạng mảng'),
  body('assignedStaff.*').optional().isMongoId().withMessage('ID nhân viên phân công không hợp lệ'),
  validateRequest,
];

export const validateShiftId = [
  param('id').isMongoId().withMessage('ID ca làm việc không hợp lệ'),
  validateRequest,
];

export const validateShiftListQuery = [
  query('date').optional().isISO8601().withMessage('Định dạng ngày lọc không hợp lệ'),
  query('startDate').optional().isISO8601().withMessage('Định dạng ngày bắt đầu không hợp lệ'),
  query('endDate').optional().isISO8601().withMessage('Định dạng ngày kết thúc không hợp lệ'),
  validateRequest,
];
