import { Request, Response } from 'express';
import SupportTicket from '../../system/models/SupportTicket.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';

/**
 * GET /staff/support/tickets
 * Query support tickets with filters & pagination
 */
export const listTickets = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { subject: searchRegex }
    ];
  }

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('userId', 'fullName email')
      .populate('repliedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, 'Lấy danh sách yêu cầu hỗ trợ thành công', {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

/**
 * GET /staff/support/tickets/:id
 * Retrieve details for a single support ticket
 */
export const getTicketDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ticket = await SupportTicket.findById(id)
    .populate('userId', 'fullName email')
    .populate('repliedBy', 'fullName email');

  if (!ticket) {
    return sendError(res, 404, 'Không tìm thấy yêu cầu hỗ trợ');
  }

  return sendSuccess(res, 200, 'Lấy chi tiết yêu cầu hỗ trợ thành công', ticket);
});

/**
 * PATCH /staff/support/tickets/:id/status
 * Update the status of a support ticket
 */
export const updateTicketStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
    return sendError(res, 400, 'Trạng thái không hợp lệ');
  }

  const ticket = await SupportTicket.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('userId', 'fullName email').populate('repliedBy', 'fullName email');

  if (!ticket) {
    return sendError(res, 404, 'Không tìm thấy yêu cầu hỗ trợ');
  }

  await writeAuditLog(req, 'UPDATE_TICKET_STATUS', 'SupportTicket', id as string, { status }, ticket.toObject());

  return sendSuccess(res, 200, 'Cập nhật trạng thái thành công', ticket);
});

/**
 * POST /staff/support/tickets/:id/reply
 * Reply to a support ticket and automatically resolve it
 */
export const replyTicket = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { replyMessage } = req.body;
  const userId = (req.user as any).id || (req.user as any)._id?.toString();

  if (!replyMessage || replyMessage.trim().length === 0) {
    return sendError(res, 400, 'Nội dung phản hồi không được để trống');
  }

  const ticket = await SupportTicket.findByIdAndUpdate(
    id,
    {
      replyMessage,
      repliedBy: userId,
      repliedAt: new Date(),
      status: 'RESOLVED'
    },
    { new: true }
  ).populate('userId', 'fullName email').populate('repliedBy', 'fullName email');

  if (!ticket) {
    return sendError(res, 404, 'Không tìm thấy yêu cầu hỗ trợ');
  }

  await writeAuditLog(req, 'REPLY_TICKET', 'SupportTicket', id as string, { replyMessage }, ticket.toObject());

  return sendSuccess(res, 200, 'Phản hồi yêu cầu hỗ trợ thành công', ticket);
});
