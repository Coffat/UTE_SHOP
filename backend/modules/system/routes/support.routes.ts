import express from 'express';
import { body } from 'express-validator';
import * as supportController from '../controllers/support.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate } from '../../../shared/middlewares/authenticate.js';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Optional authentication middleware
const optionalAuthenticate = (req: any, res: any, next: any) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next();
  }
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
  } catch {
    // Ignore invalid/expired tokens for optional authentication
  }
  next();
};

const createTicketValidators = [
  body('fullName').notEmpty().withMessage('Họ và tên không được trống.').trim(),
  body('email').notEmpty().withMessage('Email không được trống.').isEmail().withMessage('Email không hợp lệ.').trim(),
  body('phone').notEmpty().withMessage('Số điện thoại không được trống.').trim(),
  body('subject').notEmpty().withMessage('Tiêu đề hỗ trợ không được trống.').trim(),
  body('category').notEmpty().withMessage('Danh mục hỗ trợ không được trống.').isIn(['ORDER', 'PAYMENT', 'PRODUCT', 'OTHER']).withMessage('Danh mục hỗ trợ không hợp lệ.').trim(),
  body('message').notEmpty().withMessage('Nội dung hỗ trợ không được trống.'),
  handleValidationErrors,
];

// POST /api/v1/support/tickets - Gửi yêu cầu hỗ trợ (khách hoặc thành viên)
router.post(
  '/tickets',
  optionalAuthenticate,
  createTicketValidators,
  asyncHandler(supportController.createTicket)
);

// GET /api/v1/support/my-tickets - Lấy danh sách yêu cầu của bản thân (yêu cầu đăng nhập)
router.get(
  '/my-tickets',
  authenticate,
  asyncHandler(supportController.getMyTickets)
);

export default router;
