import mongoose from 'mongoose';
import { aiConfig } from '../../../config/ai.js';
import Conversation from '../../chat/models/Conversation.js';
import Message, { type IMessage } from '../../chat/models/Message.js';
import { ChatHttpError } from '../../chat/services/chat.errors.js';
import {
  emitConversationUpdated,
  emitNewMessage,
  emitStaffInboxConversationUpdated,
} from '../../chat/socket/chat.socket.js';
import {
  buildAiPromptMessages,
  buildPass1DecisionPromptMessages,
  buildPass2AnswerPromptMessages,
} from './aiPromptBuilder.js';
import {
  buildSafeHandoffMessage,
  evaluatePrecheckHandoff,
  extractHandoffMarker,
} from './aiHandoff.service.js';
import { checkOllamaHealth, completeOllamaResponse, streamOllamaResponse } from '../providers/ollama.provider.js';
import { parsePass1Decision } from '../tools/toolParser.js';
import { executeToolFromDecision } from '../tools/toolRegistry.js';
import { recordAiToolCall } from './aiToolCall.service.js';
import type { AiPass1Decision, ParsedPass1Decision } from '../tools/tool.types.js';

interface Actor {
  id: string;
  role: string;
}

interface StreamAiReplyInput {
  actor: Actor;
  conversationId: string;
  messageId: string;
  onToken: (text: string) => void;
  onHandoff: (reason: string) => void;
  abortSignal?: AbortSignal;
}

interface StreamAiReplyResult {
  aiMessageId: string;
  conversationId: string;
  handoffReason: string | null;
}

interface ManualHandoffResult {
  conversation: any;
  message: IMessage;
}

interface StreamLockState {
  startedAt: number;
}

interface ProductSuggestionCard {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  mainImageUrl?: string;
  priceFrom?: number;
  inStock?: boolean;
}

const streamLocks = new Map<string, StreamLockState>();
const MAX_CONVERSATION_PREVIEW_LENGTH = 300;
const FALLBACK_HANDOFF_REASON = 'invalid_tool_protocol';

const toObjectId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ChatHttpError(400, 'ID không hợp lệ');
  }
  return new mongoose.Types.ObjectId(id);
};

const getParticipantUserIds = (conversation: any) => {
  const ids = new Set<string>();
  const customerId =
    typeof conversation.customerId === 'string'
      ? conversation.customerId
      : conversation.customerId?._id?.toString();
  const staffId =
    typeof conversation.assignedStaffId === 'string'
      ? conversation.assignedStaffId
      : conversation.assignedStaffId?._id?.toString();
  if (customerId) ids.add(customerId);
  if (staffId) ids.add(staffId);
  return [...ids];
};

const ensureCustomerAccess = (actor: Actor, conversation: any) => {
  if (actor.role !== 'CUSTOMER') {
    throw new ChatHttpError(403, 'Chỉ customer mới có quyền gọi AI stream.');
  }
  const customerId = conversation.customerId?.toString?.() ?? conversation.customerId;
  if (customerId !== actor.id) {
    throw new ChatHttpError(403, 'Bạn không có quyền truy cập hội thoại này.');
  }
};

const acquireConversationStreamLock = (conversationId: string) => {
  const current = streamLocks.get(conversationId);
  if (current && Date.now() - current.startedAt < aiConfig.streamLockMaxMs) {
    throw new ChatHttpError(409, 'Cuộc trò chuyện đang có AI stream hoạt động. Vui lòng thử lại sau.');
  }
  streamLocks.set(conversationId, { startedAt: Date.now() });
};

const releaseConversationStreamLock = (conversationId: string) => {
  streamLocks.delete(conversationId);
};

const toProductSuggestionsFromToolPayload = (
  decision: AiPass1Decision,
  toolResultPayload: Record<string, unknown> | null
): ProductSuggestionCard[] => {
  if (decision.type !== 'tool_call' || !toolResultPayload) return [];
  if (toolResultPayload.status !== 'SUCCESS') return [];
  const payloadResult = toolResultPayload.result as Record<string, unknown> | undefined;
  if (!payloadResult) return [];

  if (decision.toolName === 'searchProducts') {
    const items = Array.isArray(payloadResult.items) ? payloadResult.items : [];
    return items
      .slice(0, 8)
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: String(row.id ?? ''),
          name: String(row.name ?? ''),
          slug: typeof row.slug === 'string' ? row.slug : undefined,
          description: typeof row.description === 'string' ? row.description : undefined,
          mainImageUrl: typeof row.mainImageUrl === 'string' ? row.mainImageUrl : undefined,
          priceFrom: typeof row.priceFrom === 'number' ? row.priceFrom : undefined,
          inStock: typeof row.inStock === 'boolean' ? row.inStock : undefined,
        };
      })
      .filter((item) => item.id && item.name);
  }

  if (decision.toolName === 'getProductDetail') {
    return [
      {
        id: String(payloadResult.id ?? ''),
        name: String(payloadResult.name ?? ''),
        slug: typeof payloadResult.slug === 'string' ? payloadResult.slug : undefined,
        description: typeof payloadResult.description === 'string' ? payloadResult.description : undefined,
        mainImageUrl:
          typeof payloadResult.mainImageUrl === 'string' ? payloadResult.mainImageUrl : undefined,
        priceFrom:
          Array.isArray(payloadResult.variants) && payloadResult.variants.length > 0
            ? (() => {
                const first = payloadResult.variants[0] as Record<string, unknown>;
                return typeof first.price === 'number' ? first.price : undefined;
              })()
            : undefined,
        inStock:
          Array.isArray(payloadResult.variants) && payloadResult.variants.length > 0
            ? true
            : undefined,
      },
    ].filter((item) => item.id && item.name);
  }

  return [];
};

const updateConversationForAiMessage = async (
  conversation: any,
  content: string,
  handoffReason: string | null
) => {
  const now = new Date();
  conversation.lastMessageAt = now;
  conversation.lastMessagePreview =
    content.length > MAX_CONVERSATION_PREVIEW_LENGTH
      ? `${content.slice(0, MAX_CONVERSATION_PREVIEW_LENGTH)}...`
      : content;
  conversation.lastMessageSenderType = 'ai';
  conversation.lastAiResponseAt = now;
  if (handoffReason) {
    conversation.handoffReason = handoffReason;
    conversation.status = 'waiting_staff';
    conversation.assignedStaffId = null;
  }
  await conversation.save();
  return conversation;
};

const persistAiMessage = async (
  conversation: any,
  content: string,
  metadata: Record<string, unknown> | null,
  handoffReason: string | null
) => {
  const aiMessage = await Message.create({
    conversationId: conversation._id,
    senderType: 'ai',
    senderId: null,
    clientMessageId: null,
    messageType: 'text',
    content,
    metadata,
  });
  const updatedConversation = await updateConversationForAiMessage(conversation, content, handoffReason);
  emitNewMessage(conversation._id.toString(), aiMessage, getParticipantUserIds(updatedConversation), {
    includeStaffInbox: updatedConversation.status === 'waiting_staff',
  });
  emitConversationUpdated(conversation._id.toString(), updatedConversation);
  emitStaffInboxConversationUpdated(updatedConversation);
  return aiMessage;
};

const incrementAiFailureCount = async (conversation: any, reason: string) => {
  conversation.aiFailureCount = (conversation.aiFailureCount ?? 0) + 1;
  conversation.handoffReason = reason;
  conversation.status = 'waiting_staff';
  conversation.assignedStaffId = null;
  await conversation.save();
  emitConversationUpdated(conversation._id.toString(), conversation);
  emitStaffInboxConversationUpdated(conversation);
};

const validateAutoReplyEligibility = (conversation: any) => {
  if (conversation.status === 'closed') {
    throw new ChatHttpError(409, 'Hội thoại đã đóng, không thể gọi AI.');
  }
  if (!conversation.aiEnabled) {
    throw new ChatHttpError(409, 'AI đang tắt cho hội thoại này.');
  }
  if (conversation.status === 'staff_handling') {
    throw new ChatHttpError(409, 'Nhân viên đang xử lý hội thoại, AI không tự động trả lời.');
  }
  if (!(conversation.status === 'waiting_staff' && conversation.assignedStaffId == null)) {
    throw new ChatHttpError(409, 'Hội thoại chưa sẵn sàng cho AI tự động phản hồi.');
  }
};

const getConversationAndMessage = async (conversationId: string, messageId: string) => {
  const conversation = await Conversation.findById(toObjectId(conversationId));
  if (!conversation) {
    throw new ChatHttpError(404, 'Không tìm thấy hội thoại');
  }
  const customerMessage = await Message.findById(toObjectId(messageId));
  if (!customerMessage || customerMessage.conversationId.toString() !== conversation._id.toString()) {
    throw new ChatHttpError(404, 'Không tìm thấy message để AI xử lý');
  }
  if (customerMessage.senderType !== 'customer') {
    throw new ChatHttpError(422, 'AI stream chỉ được gọi dựa trên message của customer.');
  }
  return { conversation, customerMessage };
};

const buildFallbackDecision = (reason: string): AiPass1Decision => ({
  type: 'handoff',
  reason,
});

const resolvePass1Decision = async (
  historyRows: IMessage[],
  abortSignal?: AbortSignal
): Promise<{
  parsed: ParsedPass1Decision;
  decision: AiPass1Decision;
}> => {
  if (!aiConfig.toolCallingEnabled) {
    const decision: AiPass1Decision = { type: 'no_tool', reason: 'tool_calling_disabled' };
    return {
      parsed: {
        ok: true,
        strategy: 'strict_json',
        decision,
        error: null,
        rawText: JSON.stringify(decision),
      },
      decision,
    };
  }

  const decisionPrompt = buildPass1DecisionPromptMessages(historyRows);
  const pass1Result = await completeOllamaResponse(decisionPrompt, {
    temperature: aiConfig.toolDecisionTemperature,
    maxPredictTokens: aiConfig.toolDecisionMaxPredictTokens,
    signal: abortSignal,
  });
  const parsed = parsePass1Decision(pass1Result.fullText);
  if (!parsed.ok || !parsed.decision) {
    return {
      parsed,
      decision: buildFallbackDecision(FALLBACK_HANDOFF_REASON),
    };
  }
  return { parsed, decision: parsed.decision };
};

export const streamAiReplyForCustomer = async ({
  actor,
  conversationId,
  messageId,
  onToken,
  onHandoff,
  abortSignal,
}: StreamAiReplyInput): Promise<StreamAiReplyResult> => {
  if (!aiConfig.enabled) {
    throw new ChatHttpError(503, 'AI service is currently disabled.');
  }
  const { conversation, customerMessage } = await getConversationAndMessage(conversationId, messageId);
  ensureCustomerAccess(actor, conversation);
  validateAutoReplyEligibility(conversation);
  acquireConversationStreamLock(conversationId);

  try {
    const health = await checkOllamaHealth();
    if (!health.ok) {
      await incrementAiFailureCount(conversation, 'provider_unavailable');
      throw new ChatHttpError(503, health.message);
    }

    const precheck = evaluatePrecheckHandoff(customerMessage.content);
    if (precheck.required) {
      const safeMessage = buildSafeHandoffMessage();
      onToken(safeMessage);
      onHandoff(precheck.reason!);
      const message = await persistAiMessage(
        conversation,
        safeMessage,
        {
          aiProvider: 'ollama',
          model: aiConfig.ollamaModel,
          handoffReason: precheck.reason,
          isFallback: true,
        },
        precheck.reason
      );
      return {
        aiMessageId: message._id.toString(),
        conversationId: conversation._id.toString(),
        handoffReason: precheck.reason,
      };
    }

    const historyRows = await Message.find({
      conversationId: conversation._id,
      messageType: { $ne: 'system_event' },
    })
      .sort({ _id: -1 })
      .limit(aiConfig.maxHistoryMessages);

    const orderedHistoryRows = [...historyRows].reverse();

    const { parsed, decision } = await resolvePass1Decision(orderedHistoryRows, abortSignal);

    let handoffReason: string | null =
      decision.type === 'handoff' ? decision.reason : decision.type === 'tool_call' && decision.toolName === 'handoffToStaff'
        ? 'model_requested_handoff'
        : null;
    let handoffEmitted = false;
    const notifyHandoff = (reason: string) => {
      if (handoffEmitted) return;
      handoffEmitted = true;
      onHandoff(reason);
    };
    let toolResultPayload: Record<string, unknown> | null = null;

    if (decision.type === 'tool_call') {
      const toolStartedAt = Date.now();
      if (aiConfig.maxToolCallsPerResponse < 1) {
        toolResultPayload = {
          status: 'DENIED',
          errorCode: 'TOOL_CALL_LIMIT_REACHED',
          message: 'Tool calling limit reached.',
        };
        handoffReason = handoffReason ?? 'tool_call_limit_reached';
        await recordAiToolCall({
          conversationId: conversation._id.toString(),
          messageId: customerMessage._id.toString(),
          actorId: actor.id,
          actorRole: actor.role,
          toolName: decision.toolName,
          status: 'DENIED',
          parserStrategy: parsed.strategy,
          argumentsPayload: decision.arguments,
          resultPayload: null,
          errorCode: 'TOOL_CALL_LIMIT_REACHED',
          errorMessage: 'Tool calling limit reached.',
          durationMs: Date.now() - toolStartedAt,
          provider: aiConfig.provider,
          modelName: aiConfig.ollamaModel,
        });
      } else {
        const toolResult = await executeToolFromDecision(decision, {
          actorId: actor.id,
          actorRole: actor.role,
          conversationId: conversation._id.toString(),
          messageId: customerMessage._id.toString(),
        });
        toolResultPayload = {
          status: toolResult.status,
          result: toolResult.result,
          errorCode: toolResult.errorCode,
          errorMessage: toolResult.errorMessage,
        };
        handoffReason = handoffReason ?? toolResult.handoffReason;
        await recordAiToolCall({
          conversationId: conversation._id.toString(),
          messageId: customerMessage._id.toString(),
          actorId: actor.id,
          actorRole: actor.role,
          toolName: decision.toolName,
          status: toolResult.status,
          parserStrategy: parsed.strategy,
          argumentsPayload: decision.arguments,
          resultPayload: toolResult.result,
          errorCode: toolResult.errorCode,
          errorMessage: toolResult.errorMessage,
          durationMs: Date.now() - toolStartedAt,
          provider: aiConfig.provider,
          modelName: aiConfig.ollamaModel,
        });
      }
    }

    if (handoffReason) {
      notifyHandoff(handoffReason);
    }

    const promptMessages =
      aiConfig.toolCallingEnabled
        ? buildPass2AnswerPromptMessages(orderedHistoryRows, decision, toolResultPayload)
        : buildAiPromptMessages(orderedHistoryRows);

    let hasAnyToken = false;
    let accumulated = '';
    let latencyMs = 0;

    try {
      const result = await streamOllamaResponse(
        promptMessages,
        (text) => {
          if (!text) return;
          hasAnyToken = true;
          accumulated += text;
          onToken(text);
        },
        abortSignal
      );
      latencyMs = result.latencyMs;
      accumulated = result.fullText || accumulated;
    } catch (error) {
      if (!hasAnyToken) {
        await incrementAiFailureCount(conversation, 'provider_stream_error_no_token');
        throw new ChatHttpError(503, 'AI đang gặp sự cố, mình sẽ chuyển bạn đến nhân viên hỗ trợ.');
      }

      const fallbackTail = '\n\nTin nhắn AI bị gián đoạn, mình đã chuyển bạn tới nhân viên hỗ trợ.';
      const partialContent = `${accumulated}${fallbackTail}`.trim();
      handoffReason = 'partial_stream_error';
      onHandoff(handoffReason);
      const partialMessage = await persistAiMessage(
        conversation,
        partialContent,
        {
          aiProvider: 'ollama',
          model: aiConfig.ollamaModel,
          latencyMs,
          handoffReason,
          isPartial: true,
          isFallback: true,
        },
        handoffReason
      );
      return {
        aiMessageId: partialMessage._id.toString(),
        conversationId: conversation._id.toString(),
        handoffReason,
      };
    }

    const markerParsed = extractHandoffMarker(accumulated);
    const finalContent = markerParsed.cleanedContent || 'Mình đã nhận được câu hỏi của bạn.';
    handoffReason = handoffReason ?? markerParsed.reason;
    if (handoffReason) {
      notifyHandoff(handoffReason);
    }

    const productSuggestions = toProductSuggestionsFromToolPayload(decision, toolResultPayload);

    const aiMessage = await persistAiMessage(
      conversation,
      finalContent,
      {
        aiProvider: 'ollama',
        model: aiConfig.ollamaModel,
        latencyMs,
        handoffReason,
        templateType: productSuggestions.length > 0 ? 'product_suggestions' : 'plain_text',
        productSuggestions: productSuggestions.length > 0 ? productSuggestions : undefined,
      },
      handoffReason
    );

    return {
      aiMessageId: aiMessage._id.toString(),
      conversationId: conversation._id.toString(),
      handoffReason,
    };
  } finally {
    releaseConversationStreamLock(conversationId);
  }
};

export const handoffToStaffByCustomer = async (
  actor: Actor,
  conversationId: string,
  reason = 'customer_requested_staff'
): Promise<ManualHandoffResult> => {
  const conversation = await Conversation.findById(toObjectId(conversationId));
  if (!conversation) {
    throw new ChatHttpError(404, 'Không tìm thấy hội thoại');
  }
  ensureCustomerAccess(actor, conversation);
  if (conversation.status === 'closed') {
    throw new ChatHttpError(409, 'Hội thoại đã đóng, không thể chuyển nhân viên.');
  }

  const safeMessage = buildSafeHandoffMessage();
  const aiMessage = await persistAiMessage(
    conversation,
    safeMessage,
    {
      aiProvider: 'ollama',
      model: aiConfig.ollamaModel,
      handoffReason: reason,
      isFallback: true,
    },
    reason
  );

  return { conversation, message: aiMessage };
};

