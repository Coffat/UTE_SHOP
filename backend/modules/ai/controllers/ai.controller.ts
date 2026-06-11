import type { Request, Response } from 'express';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendError, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { isChatHttpError } from '../../chat/services/chat.errors.js';
import { createOllamaCatalogEntry, getEnabledCatalog } from '../config/aiModelCatalog.js';
import { checkActiveProviderHealth } from '../providers/aiProvider.router.js';
import { listOllamaModelTags } from '../providers/ollama.provider.js';
import { closeSse, initializeSse, writeSseEvent } from '../services/aiStream.service.js';
import { handoffToStaffByCustomer, streamAiReplyForCustomer } from '../services/aiAssistant.service.js';
import { getEffectiveAiRuntime } from '../services/aiRuntimeConfig.service.js';

const getActor = (req: Request) => {
  if (!req.user) throw new Error('Unauthorized');
  return { id: req.user.id, role: req.user.role };
};

const toUserMessage = (error: unknown) => {
  if (isChatHttpError(error)) {
    return { statusCode: error.statusCode, message: error.message };
  }
  if (error instanceof Error) {
    return { statusCode: 500, message: error.message };
  }
  return { statusCode: 500, message: 'Internal Server Error' };
};

export const customerStreamAiReply = asyncHandler(async (req: Request, res: Response) => {
  const actor = getActor(req);
  const conversationId = req.params.conversationId as string;
  const messageId = (req.query.messageId as string | undefined) ?? '';

  if (!messageId.trim()) {
    return sendError(res, 422, 'messageId là bắt buộc');
  }

  initializeSse(res);
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  try {
    const result = await streamAiReplyForCustomer({
      actor,
      conversationId,
      messageId,
      abortSignal: abortController.signal,
      onToken: (text) => writeSseEvent(res, 'token', { text }),
      onHandoff: (reason) => writeSseEvent(res, 'handoff', { required: true, reason }),
    });
    writeSseEvent(res, 'done', {
      messageId: result.aiMessageId,
      conversationId: result.conversationId,
      content: result.finalContent,
      metadata: result.metadata,
    });
  } catch (error) {
    const mapped = toUserMessage(error);
    writeSseEvent(res, 'error', {
      message: mapped.message || 'AI đang gặp sự cố, mình sẽ chuyển bạn đến nhân viên hỗ trợ.',
    });
  } finally {
    closeSse(res);
  }
});

export const customerManualHandoff = asyncHandler(async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const conversationId = req.params.conversationId as string;
    const result = await handoffToStaffByCustomer(actor, conversationId);
    return sendSuccess(res, 200, 'Đã chuyển cuộc trò chuyện đến nhân viên.', result);
  } catch (error) {
    const mapped = toUserMessage(error);
    return sendError(res, mapped.statusCode, mapped.message);
  }
});

export const adminGetModelCatalog = asyncHandler(async (_req: Request, res: Response) => {
  const staticCatalog = getEnabledCatalog().filter((entry) => entry.provider !== 'ollama');
  const dynamicOllamaCatalog = (await listOllamaModelTags()).map((model) => createOllamaCatalogEntry(model.name));
  const fallbackOllamaCatalog = getEnabledCatalog().filter((entry) => entry.provider === 'ollama');
  const ollamaCatalog = dynamicOllamaCatalog.length > 0 ? dynamicOllamaCatalog : fallbackOllamaCatalog;
  return sendSuccess(res, 200, 'OK', { items: [...ollamaCatalog, ...staticCatalog] });
});

export const adminCheckAiHealth = asyncHandler(async (req: Request, res: Response) => {
  const provider = typeof req.query.provider === 'string' ? req.query.provider : undefined;
  const modelId = typeof req.query.modelId === 'string' ? req.query.modelId : undefined;
  const mode = req.query.mode === 'chat_preflight' ? 'chat_preflight' : 'full';
  const runtime = await getEffectiveAiRuntime({ provider, modelId });
  const health = await checkActiveProviderHealth(runtime, { mode });
  const statusCode = health.ok ? 200 : 503;
  return sendSuccess(res, statusCode, health.message, health);
});

export const publicCheckAiHealth = asyncHandler(async (_req: Request, res: Response) => {
  const runtime = await getEffectiveAiRuntime();
  const health = await checkActiveProviderHealth(runtime);
  const statusCode = health.ok ? 200 : 503;
  return sendSuccess(res, statusCode, health.ok ? 'AI service ready.' : 'AI service unavailable.', {
    ok: health.ok,
  });
});

/** @deprecated Use publicCheckAiHealth */
export const publicCheckOllamaHealth = publicCheckAiHealth;

/** @deprecated Use adminCheckAiHealth */
export const adminCheckOllamaHealth = adminCheckAiHealth;
