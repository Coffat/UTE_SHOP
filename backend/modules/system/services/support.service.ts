import SupportTicket, { ISupportTicket } from '../models/SupportTicket.js';

interface TicketCreationData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  category: 'ORDER' | 'PAYMENT' | 'PRODUCT' | 'OTHER';
  message: string;
  userId?: string;
}

/**
 * Service: Support Service
 * 
 * Tuân thủ Single Responsibility Principle (SRP):
 * Chỉ chịu trách nhiệm xử lý logic nghiệp vụ tạo mới và quản lý các Support Ticket.
 */
export const createTicket = async (data: TicketCreationData): Promise<ISupportTicket> => {
  const ticket = await SupportTicket.create({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    category: data.category,
    message: data.message,
    userId: data.userId ? (data.userId as any) : undefined,
    status: 'OPEN'
  });
  return ticket;
};

export const getTicketsByUserId = async (userId: string): Promise<ISupportTicket[]> => {
  return SupportTicket.find({ userId }).sort({ createdAt: -1 });
};

export const getTickets = async (filter: any = {}): Promise<ISupportTicket[]> => {
  return SupportTicket.find(filter).sort({ createdAt: -1 });
};
