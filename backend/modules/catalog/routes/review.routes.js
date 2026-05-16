import express from 'express';
import * as reviewService from '../services/review.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = express.Router({ mergeParams: true }); // mergeParams để lấy productId từ parent route

// GET /api/v1/products/:id/reviews
router.get('/', asyncHandler(async (req, res) => {
  const data = await reviewService.getReviewsByProduct(req.params.id, req.query);
  sendSuccess(res, 200, 'OK', data);
}));

// POST /api/v1/products/:id/reviews
router.post('/', authenticate, authorize('CUSTOMER'), asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.params.id, req.body);
  sendSuccess(res, 201, 'Đánh giá thành công', review);
}));

// PATCH /api/v1/products/:id/reviews/:reviewId/approve
router.patch('/:reviewId/approve', authenticate, authorize('ADMIN', 'SALES'), asyncHandler(async (req, res) => {
  const review = await reviewService.approveReview(req.params.reviewId);
  sendSuccess(res, 200, 'Đã duyệt đánh giá', review);
}));

export default router;
