import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import { createRateLimiter } from '../../../shared/middlewares/rateLimiter.js';
import { validateConversationIdParam } from '../../chat/middlewares/chat.validator.js';
import * as aiController from '../controllers/ai.controller.js';

const router = express.Router();

const aiStreamLimiter = createRateLimiter(
  60 * 1000,
  20,
  'Bạn đang gọi AI quá nhanh. Vui lòng thử lại sau.'
);

const handoffLimiter = createRateLimiter(
  60 * 1000,
  10,
  'Bạn thao tác chuyển nhân viên quá nhanh. Vui lòng thử lại.'
);

router.get('/health/ai', aiController.publicCheckAiHealth);
router.get('/health/ollama', aiController.publicCheckOllamaHealth);

router.get(
  '/customer/chat/conversations/:conversationId/ai/stream',
  authenticate,
  authorize('CUSTOMER'),
  validateConversationIdParam,
  aiStreamLimiter,
  aiController.customerStreamAiReply
);

router.post(
  '/customer/chat/conversations/:conversationId/handoff',
  authenticate,
  authorize('CUSTOMER'),
  validateConversationIdParam,
  handoffLimiter,
  aiController.customerManualHandoff
);

router.get(
  '/admin/ai/model-catalog',
  authenticate,
  authorize('ADMIN'),
  aiController.adminGetModelCatalog
);

router.get(
  '/system/health/ai',
  authenticate,
  authorize('ADMIN'),
  aiController.adminCheckAiHealth
);

router.get(
  '/system/health/ollama',
  authenticate,
  authorize('ADMIN'),
  aiController.adminCheckOllamaHealth
);

export default router;
