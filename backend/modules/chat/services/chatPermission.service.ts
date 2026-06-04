import type { IConversation } from '../models/Conversation.js';
import { CHAT_ADMIN_OR_STAFF_ROLES, CHAT_HANDLER_ROLES } from '../constants/chat.constants.js';

interface Viewer {
  id: string;
  role: string;
}

export const isAdminRole = (role: string) => role === 'ADMIN';

export const isStaffChatRole = (role: string) =>
  (CHAT_HANDLER_ROLES as readonly string[]).includes(role);

export const isAdminOrStaffRole = (role: string) =>
  (CHAT_ADMIN_OR_STAFF_ROLES as readonly string[]).includes(role);

export const canViewConversation = (viewer: Viewer, conversation: IConversation) => {
  if (isAdminRole(viewer.role)) return true;
  if (viewer.role === 'CUSTOMER') return conversation.customerId.toString() === viewer.id;
  if (isStaffChatRole(viewer.role)) {
    return (
      conversation.status === 'waiting_staff' ||
      (conversation.assignedStaffId != null &&
        conversation.assignedStaffId.toString() === viewer.id)
    );
  }
  return false;
};

export const canSendAsCustomer = (viewer: Viewer, conversation: IConversation) => {
  return viewer.role === 'CUSTOMER' && conversation.customerId.toString() === viewer.id;
};

export const canSendAsStaff = (viewer: Viewer, conversation: IConversation) => {
  if (!isStaffChatRole(viewer.role)) return false;
  if (conversation.assignedStaffId == null) return false;
  return conversation.assignedStaffId.toString() === viewer.id;
};

export const canSendAsAdmin = (viewer: Viewer, conversation: IConversation) => {
  if (!isAdminRole(viewer.role)) return false;
  if (conversation.assignedStaffId == null) return false;
  return conversation.assignedStaffId.toString() === viewer.id;
};

export const canAssignConversation = (viewer: Viewer) => {
  return isStaffChatRole(viewer.role) || isAdminRole(viewer.role);
};
