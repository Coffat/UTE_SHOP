import { Request, Response } from 'express';
import * as reviewService from '../../catalog/services/review.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

// GET /api/v1/admin/reviews
export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await reviewService.getAllReviews({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  sendSuccess(res, 200, 'OK', result);
});

// GET /api/v1/admin/reviews/:id
export const getReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const review = await reviewService.getReviewById(id);
  if (!review) {
    return sendError(res, 404, 'Không tìm thấy đánh giá');
  }
  sendSuccess(res, 200, 'OK', review);
});

// PATCH /api/v1/admin/reviews/:id/approve
export const approveReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const review = await reviewService.approveReview(id);
  if (!review) {
    return sendError(res, 404, 'Không tìm thấy đánh giá');
  }
  sendSuccess(res, 200, 'Đã duyệt đánh giá', review);
});

// DELETE /api/v1/admin/reviews/:id
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const success = await reviewService.rejectReview(id);
  if (!success) {
    return sendError(res, 404, 'Không tìm thấy đánh giá để xóa');
  }
  sendSuccess(res, 200, 'Xóa đánh giá thành công', null);
});
