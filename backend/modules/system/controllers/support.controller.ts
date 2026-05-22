import { Request, Response } from 'express';
import * as supportService from '../services/support.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

/**
 * Controller: Support Controller
 * 
 * Tuân thủ Single Responsibility Principle (SRP) và Interface Segregation.
 * Tiếp nhận các yêu cầu HTTP liên quan đến Support Ticket, điều phối qua Service Layer.
 */
export const createTicket = async (req: Request, res: Response) => {
  const { fullName, email, phone, subject, category, message } = req.body;
  const userId = req.user?.id;

  const ticket = await supportService.createTicket({
    fullName,
    email,
    phone,
    subject,
    category,
    message,
    userId
  });

  return sendSuccess(res, 201, 'Gửi yêu cầu hỗ trợ thành công. Chúng tôi sẽ phản hồi sớm nhất.', ticket);
};

export const getMyTickets = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Bạn cần đăng nhập để thực hiện chức năng này.');
  }
  
  const tickets = await supportService.getTicketsByUserId(req.user.id);
  return sendSuccess(res, 200, 'Tải danh sách yêu cầu hỗ trợ thành công.', tickets);
};
