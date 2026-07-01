import { api } from "@/lib/api";

export interface SupportTicketItem {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  category: "ORDER" | "PAYMENT" | "PRODUCT" | "OTHER";
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  userId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  replyMessage?: string;
  repliedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketsResponse {
  success: boolean;
  message: string;
  data: {
    items: SupportTicketItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SupportTicketDetailResponse {
  success: boolean;
  message: string;
  data: SupportTicketItem;
}

export const getStaffSupportTickets = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}) => {
  const response = await api.get<SupportTicketsResponse>("/api/v1/staff/support/tickets", { params });
  return response.data;
};

export const getStaffSupportTicketDetails = async (id: string) => {
  const response = await api.get<SupportTicketDetailResponse>(`/api/v1/staff/support/tickets/${id}`);
  return response.data;
};

export const updateStaffSupportTicketStatus = async (id: string, status: string) => {
  const response = await api.patch<SupportTicketDetailResponse>(
    `/api/v1/staff/support/tickets/${id}/status`,
    { status }
  );
  return response.data;
};

export const replyStaffSupportTicket = async (id: string, replyMessage: string) => {
  const response = await api.post<SupportTicketDetailResponse>(
    `/api/v1/staff/support/tickets/${id}/reply`,
    { replyMessage }
  );
  return response.data;
};
