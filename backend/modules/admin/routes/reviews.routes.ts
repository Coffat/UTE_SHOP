import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as adminReviewsController from '../controllers/reviews.controller.js';
import { param } from 'express-validator';
import mongoose from 'mongoose';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

const validateId = [
  param('id').custom(isObjectId).withMessage('ID không hợp lệ'),
  handleValidationErrors,
];

const router = express.Router();

// Restrict to ADMIN
router.use(authenticate, authorize('ADMIN'));

// GET /admin/reviews
router.get('/', adminReviewsController.listReviews);

// GET /admin/reviews/:id
router.get('/:id', validateId, adminReviewsController.getReview);

// PATCH /admin/reviews/:id/approve
router.patch('/:id/approve', validateId, adminReviewsController.approveReview);

// DELETE /admin/reviews/:id
router.delete('/:id', validateId, adminReviewsController.deleteReview);

export default router;
