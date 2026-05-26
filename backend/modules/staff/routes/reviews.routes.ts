import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as staffReviewsController from '../controllers/reviews.controller.js';
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

const validateReviewModeration = [
  param('id').custom(isObjectId).withMessage('ID không hợp lệ'),
  body('status')
    .notEmpty()
    .withMessage('status là bắt buộc')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('status phải là APPROVED hoặc REJECTED'),
  body('note').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// GET /staff/reviews
router.get(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  staffReviewsController.listReviews
);

// GET /staff/reviews/:id
router.get(
  '/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  validateId,
  staffReviewsController.getReview
);

// PATCH /staff/reviews/:id/moderation
router.patch(
  '/:id/moderation',
  authenticate,
  authorize(...STAFF_ROLES),
  validateReviewModeration,
  staffReviewsController.moderateReview
);

export default router;
