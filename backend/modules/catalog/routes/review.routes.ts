import express, { Request, Response } from 'express';
import * as reviewService from '../services/review.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import {
  validateCreateReview,
  validateProductId,
} from '../middlewares/catalog.validator.js';

const router = express.Router({ mergeParams: true });

// GET /api/v1/products/:id/reviews – Public
router.get(
  '/',
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    sendSuccess(res, 200, 'OK', await reviewService.getReviewsByProduct(id, req.query));
  })
);

// POST /api/v1/products/:id/reviews – CUSTOMER only
router.post(
  '/',
  authenticate, authorize('CUSTOMER'),
  validateCreateReview,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const review = await reviewService.createReview(req.user!.id, id, req.body);
    sendSuccess(res, 201, 'Đánh giá thành công', review);
  })
);

// PATCH /api/v1/products/:id/reviews/:reviewId/approve – ADMIN/SALES
router.patch(
  '/:reviewId/approve',
  authenticate, authorize('ADMIN', 'SALES'),
  asyncHandler(async (req: Request, res: Response) => {
    const reviewId = req.params.reviewId as string;
    const review = await reviewService.approveReview(reviewId);
    sendSuccess(res, 200, 'Đã duyệt đánh giá', review);
  })
);

export default router;
