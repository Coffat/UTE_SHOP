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
  // const userRole = req.user!.role; 
  // SALES is now allowed to reject.

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

/** PATCH /staff/reviews/:id/reply */
export const handleReply = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { replyComment } = req.body;
  const userId = (req.user as any).id || (req.user as any)._id?.toString();

  const review = await reviewService.replyReview(id, replyComment, userId);
  if (!review) {
    return sendError(res, 404, 'Không tìm thấy đánh giá');
  }

  await writeAuditLog(req, 'REPLY_REVIEW', 'Review', id, {}, review.toObject());
  return sendSuccess(res, 200, 'Đã phản hồi đánh giá', review);
});

/** PATCH /staff/reviews/:id/hide */
export const handleHide = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { isHidden } = req.body;

  const review = await reviewService.toggleHideReview(id, isHidden);
  if (!review) {
    return sendError(res, 404, 'Không tìm thấy đánh giá');
  }

  await writeAuditLog(req, 'HIDE_REVIEW', 'Review', id, { isHidden: !isHidden }, review.toObject());
  return sendSuccess(res, 200, isHidden ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá', review);
});
