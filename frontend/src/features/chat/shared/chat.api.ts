import { api } from "@/lib/api";
import type { Conversation, ConversationListResult, MessagePage } from "./chat.types";

const unwrap = <T>(response: any): T => response.data.data as T;

export async function createOrGetCustomerConversation(): Promise<Conversation> {
  const response = await api.post("/api/v1/customer/chat/conversations/current");
  return unwrap<Conversation>(response);
}

export async function getCustomerMessages(conversationId: string, before?: string, limit = 30) {
  const response = await api.get(`/api/v1/customer/chat/conversations/${conversationId}/messages`, {
    params: { before, limit },
  });
  return unwrap<MessagePage>(response);
}

export async function sendCustomerMessage(
  conversationId: string,
  payload: { content: string; clientMessageId?: string }
) {
  const response = await api.post(
    `/api/v1/customer/chat/conversations/${conversationId}/messages`,
    payload
  );
  return unwrap<{ message: any; conversation: Conversation }>(response);
}

export async function listStaffConversations(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get("/api/v1/staff/chat/conversations", { params });
  return unwrap<ConversationListResult>(response);
}

export async function assignStaffConversation(conversationId: string) {
  const response = await api.post(`/api/v1/staff/chat/conversations/${conversationId}/assign`);
  return unwrap<Conversation>(response);
}

export async function getStaffMessages(conversationId: string, before?: string, limit = 30) {
  const response = await api.get(`/api/v1/staff/chat/conversations/${conversationId}/messages`, {
    params: { before, limit },
  });
  return unwrap<MessagePage>(response);
}

export async function sendStaffMessage(
  conversationId: string,
  payload: { content: string; clientMessageId?: string }
) {
  const response = await api.post(`/api/v1/staff/chat/conversations/${conversationId}/messages`, payload);
  return unwrap<{ message: any; conversation: Conversation }>(response);
}

export async function updateStaffConversationStatus(conversationId: string, status: string) {
  const response = await api.patch(`/api/v1/staff/chat/conversations/${conversationId}/status`, {
    status,
  });
  return unwrap<Conversation>(response);
}
