import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as staffSupportController from '../controllers/support.controller.js';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';
import mongoose from 'mongoose';

const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'SALES'] as const;

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

const validateId = [
  param('id').custom(isObjectId).withMessage('ID không hợp lệ'),
  handleValidationErrors,
];

const validateStatusUpdate = [
  param('id').custom(isObjectId).withMessage('ID không hợp lệ'),
  body('status')
    .notEmpty()
    .withMessage('status là bắt buộc')
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED'])
    .withMessage('status phải là OPEN, IN_PROGRESS hoặc RESOLVED'),
  handleValidationErrors,
];

const validateReply = [
  param('id').custom(isObjectId).withMessage('ID không hợp lệ'),
  body('replyMessage')
    .notEmpty()
    .withMessage('Nội dung phản hồi không được để trống')
    .trim(),
  handleValidationErrors,
];

// GET /staff/support/tickets - Danh sách ticket
router.get(
  '/tickets',
  authenticate,
  authorize(...STAFF_ROLES),
  staffSupportController.listTickets
);

// GET /staff/support/tickets/:id - Chi tiết ticket
router.get(
  '/tickets/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  validateId,
  staffSupportController.getTicketDetails
);

// PATCH /staff/support/tickets/:id/status - Cập nhật trạng thái
router.patch(
  '/tickets/:id/status',
  authenticate,
  authorize(...STAFF_ROLES),
  validateStatusUpdate,
  staffSupportController.updateTicketStatus
);

// POST /staff/support/tickets/:id/reply - Phản hồi ticket
router.post(
  '/tickets/:id/reply',
  authenticate,
  authorize(...STAFF_ROLES),
  validateReply,
  staffSupportController.replyTicket
);

export default router;
