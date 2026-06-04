export type ConversationStatus = "waiting_staff" | "staff_handling" | "resolved" | "closed";
export type SenderType = "customer" | "staff" | "system";
export type MessageType = "text" | "system_event";
export type MessageDeliveryState = "sending" | "sent" | "failed";

export interface ChatUserBrief {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Conversation {
  _id: string;
  customerId: string | ChatUserBrief;
  assignedStaffId: string | ChatUserBrief | null;
  status: ConversationStatus;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  lastMessageSenderType?: SenderType | null;
  lastCustomerMessageAt?: string | null;
  lastStaffMessageAt?: string | null;
  customerLastReadAt?: string | null;
  staffLastReadAt?: string | null;
  hasUnreadForStaff?: boolean;
  hasUnreadForCustomer?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderType: SenderType;
  senderId?: string | null;
  clientMessageId?: string | null;
  messageType: MessageType;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
  deliveryState?: MessageDeliveryState;
}

export interface MessagePage {
  items: Message[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextBefore: string | null;
  };
}

export interface ConversationListResult {
  items: Conversation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
