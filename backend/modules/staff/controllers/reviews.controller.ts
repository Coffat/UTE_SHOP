import { Request, Response } from 'express';
import * as reviewService from '../../catalog/services/review.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';

/** GET /staff/reviews */
export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await reviewService.getAllReviews({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  return sendSuccess(res, 200, 'OK', result);
});

/** GET /staff/reviews/:id */
export const getReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const review = await reviewService.getReviewById(id);
  if (!review) {
    return sendError(res, 404, 'Không tìm thấy đánh giá');
  }
  return sendSuccess(res, 200, 'OK', review);
});

/** PATCH /staff/reviews/:id/moderation */
export const moderateReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, note } = req.body;
  const userRole = req.user!.role;

  if (status === 'REJECTED' && userRole !== 'ADMIN') {
    return sendError(res, 403, 'Chỉ Admin mới có quyền từ chối (Reject) đánh giá.');
  }

  const beforeReview = await reviewService.getReviewById(id);
  if (!beforeReview) {
    return sendError(res, 404, 'Không tìm thấy đánh giá');
  }

  let updatedReview;
  if (status === 'APPROVED') {
    updatedReview = await reviewService.approveReview(id);
  } else {
    // REJECTED
    updatedReview = await reviewService.rejectReview(id);
  }

  // Write audit log for moderation action
  await writeAuditLog(
    req,
    status === 'APPROVED' ? 'APPROVE_REVIEW' : 'REJECT_REVIEW',
    'Review',
    id,
    beforeReview.toObject(),
    updatedReview ? updatedReview.toObject() : undefined
  );

  return sendSuccess(
    res,
    200,
    status === 'APPROVED' ? 'Đã duyệt đánh giá thành công' : 'Đã xóa/từ chối đánh giá thành công',
    updatedReview
  );
});
