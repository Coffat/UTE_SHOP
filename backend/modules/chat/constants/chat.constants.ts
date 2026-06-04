export const CHAT_CONVERSATION_STATUSES = [
  'waiting_staff',
  'staff_handling',
  'resolved',
  'closed',
] as const;

export type ChatConversationStatus = (typeof CHAT_CONVERSATION_STATUSES)[number];

export const CHAT_SENDER_TYPES = ['customer', 'staff', 'ai', 'system'] as const;
export type ChatSenderType = (typeof CHAT_SENDER_TYPES)[number];

export const CHAT_MESSAGE_TYPES = ['text', 'system_event'] as const;
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number];

export const CHAT_HANDLER_ROLES = ['SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'] as const;

export const CHAT_ADMIN_OR_STAFF_ROLES = ['ADMIN', ...CHAT_HANDLER_ROLES] as const;

export const DEFAULT_MESSAGE_PAGE_SIZE = 30;
export const MAX_MESSAGE_PAGE_SIZE = 100;
export const MAX_MESSAGE_CONTENT_LENGTH = 2000;

export const REOPENABLE_STATUSES: ChatConversationStatus[] = [
  'waiting_staff',
  'staff_handling',
  'resolved',
];

export const CUSTOMER_SENDABLE_STATUSES: ChatConversationStatus[] = [
  'waiting_staff',
  'staff_handling',
  'resolved',
];

export const STAFF_SENDABLE_STATUSES: ChatConversationStatus[] = [
  'staff_handling',
  'resolved',
];
