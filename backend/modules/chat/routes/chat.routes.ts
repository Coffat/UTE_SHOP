import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { createRateLimiter } from '../../../shared/middlewares/rateLimiter.js';
import * as chatController from '../controllers/chat.controller.js';
import {
  validateConversationIdParam,
  validateConversationListQuery,
  validateMessagesQuery,
  validateSendMessage,
  validateStatusPatch,
} from '../middlewares/chat.validator.js';

const router = express.Router();

const chatMessageLimiter = createRateLimiter(
  60 * 1000,
  40,
  'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau.'
);

const assignLimiter = createRateLimiter(
  60 * 1000,
  30,
  'Bạn đang thao tác nhận hội thoại quá nhanh. Vui lòng thử lại.'
);

// Customer chat APIs
router.post(
  '/customer/chat/conversations/current',
  authenticate,
  authorize('CUSTOMER'),
  chatController.customerCreateOrGetCurrent
);

router.get(
  '/customer/chat/conversations/:conversationId/messages',
  authenticate,
  authorize('CUSTOMER'),
  validateConversationIdParam,
  validateMessagesQuery,
  chatController.customerGetMessages
);

router.post(
  '/customer/chat/conversations/:conversationId/messages',
  authenticate,
  authorize('CUSTOMER'),
  validateConversationIdParam,
  validateSendMessage,
  chatMessageLimiter,
  chatController.customerSendMessage
);

// Staff chat APIs
router.get(
  '/staff/chat/conversations',
  authenticate,
  authorize('ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'),
  validateConversationListQuery,
  chatController.staffListConversations
);

router.post(
  '/staff/chat/conversations/:conversationId/assign',
  authenticate,
  authorize('ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'),
  validateConversationIdParam,
  assignLimiter,
  chatController.staffAssignConversation
);

router.get(
  '/staff/chat/conversations/:conversationId/messages',
  authenticate,
  authorize('ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'),
  validateConversationIdParam,
  validateMessagesQuery,
  chatController.staffGetMessages
);

router.post(
  '/staff/chat/conversations/:conversationId/messages',
  authenticate,
  authorize('ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'),
  validateConversationIdParam,
  validateSendMessage,
  chatMessageLimiter,
  chatController.staffSendMessage
);

router.patch(
  '/staff/chat/conversations/:conversationId/status',
  authenticate,
  authorize('ADMIN', 'SALES', 'STORE_STAFF', 'WAREHOUSE_STAFF'),
  validateConversationIdParam,
  validateStatusPatch,
  chatController.staffUpdateConversationStatus
);

// Admin chat APIs
router.get(
  '/admin/chat/conversations',
  authenticate,
  authorize('ADMIN'),
  validateConversationListQuery,
  chatController.adminListConversations
);

router.get(
  '/admin/chat/conversations/:conversationId/messages',
  authenticate,
  authorize('ADMIN'),
  validateConversationIdParam,
  validateMessagesQuery,
  chatController.adminGetMessages
);

export default router;
