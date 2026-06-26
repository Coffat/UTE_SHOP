import { CHAT_HANDLER_ROLES } from '../../chat/constants/chat.constants.js';

export const ORDER_STAFF_RECIPIENT_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF'] as const;

export const PAYMENT_STAFF_RECIPIENT_ROLES = ['ADMIN', 'SALES', 'STORE_STAFF'] as const;

export const CHAT_UNASSIGNED_RECIPIENT_ROLES = ['ADMIN', ...CHAT_HANDLER_ROLES] as const;

export const LOW_STOCK_RECIPIENT_ROLES = ['ADMIN', 'WAREHOUSE_STAFF', 'STORE_STAFF'] as const;

