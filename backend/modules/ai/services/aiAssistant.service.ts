import mongoose from 'mongoose';
import { aiConfig } from '../../../config/ai.js';
import Conversation from '../../chat/models/Conversation.js';
import Message, { type IMessage } from '../../chat/models/Message.js';
import { truncateChatMessageContent } from '../../chat/utils/messageContent.util.js';
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
  isSensitivePass1Handoff,
} from './aiHandoff.service.js';
import {
  checkActiveProviderHealth,
  completeActiveProviderResponse,
  streamActiveProviderResponse,
} from '../providers/aiProvider.router.js';
import { getEffectiveAiRuntime, buildAiMessageMetadata } from './aiRuntimeConfig.service.js';
import {
  buildProductAdviceFromSuggestions,
  detectProductSearchIntentFromHistory,
  EMPTY_PRODUCT_SEARCH_REPLY,
  intentToSearchToolArguments,
  PRODUCT_SEARCH_FAILED_REPLY,
  type ProductSuggestionCard,
} from './aiProductIntent.service.js';
import type { EffectiveAiRuntime } from '../types/ai.types.js';
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
  finalContent: string;
  metadata: Record<string, unknown> | null;
}

interface ManualHandoffResult {
  conversation: any;
  message: IMessage;
}

interface StreamLockState {
  startedAt: number;
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
  const safeContent = truncateChatMessageContent(content);
  const aiMessage = await Message.create({
    conversationId: conversation._id,
    senderType: 'ai',
    senderId: null,
    clientMessageId: null,
    messageType: 'text',
    content: safeContent,
    metadata,
  });
  const updatedConversation = await updateConversationForAiMessage(conversation, safeContent, handoffReason);
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
  runtime: EffectiveAiRuntime,
  historyRows: IMessage[],
  abortSignal?: AbortSignal
): Promise<{
  parsed: ParsedPass1Decision;
  decision: AiPass1Decision;
  usedModelId?: string;
  wasFallback?: boolean;
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
  const pass1Result = await completeActiveProviderResponse(runtime, decisionPrompt, {
    temperature: runtime.toolDecisionTemperature,
    maxPredictTokens: runtime.toolDecisionMaxPredictTokens,
    signal: abortSignal,
  });
  const parsed = parsePass1Decision(pass1Result.fullText);
  if (!parsed.ok || !parsed.decision) {
    return {
      parsed,
      decision: buildFallbackDecision(FALLBACK_HANDOFF_REASON),
      usedModelId: pass1Result.usedModelId,
      wasFallback: pass1Result.wasFallback,
    };
  }
  return {
    parsed,
    decision: parsed.decision,
    usedModelId: pass1Result.usedModelId,
    wasFallback: pass1Result.wasFallback,
  };
};

const getRecentCustomerTexts = (historyRows: IMessage[], limit = 5): string[] =>
  historyRows
    .filter((row) => row.senderType === 'customer')
    .map((row) => row.content)
    .slice(-limit);

const shouldAutoSearchProducts = (decision: AiPass1Decision, historyRows: IMessage[]) => {
  if (!aiConfig.enabledToolNames.includes('searchProducts')) return false;
  const recentCustomerTexts = getRecentCustomerTexts(historyRows);
  if (!detectProductSearchIntentFromHistory(recentCustomerTexts)) return false;
  if (decision.type === 'tool_call' && decision.toolName === 'searchProducts') return false;
  if (decision.type === 'tool_call' && decision.toolName === 'handoffToStaff') return true;
  if (decision.type === 'handoff') {
    return !isSensitivePass1Handoff(decision.reason);
  }
  return decision.type === 'no_tool';
};

const applyAutoSearchOverride = (
  decision: AiPass1Decision,
  parsed: ParsedPass1Decision,
  historyRows: IMessage[]
): { decision: AiPass1Decision; parsed: ParsedPass1Decision } => {
  if (!shouldAutoSearchProducts(decision, historyRows)) {
    return { decision, parsed };
  }
  const autoDecision = buildAutoSearchDecision(historyRows);
  if (!autoDecision) return { decision, parsed };
  return {
    decision: autoDecision,
    parsed: {
      ok: true,
      strategy: 'strict_json',
      decision: autoDecision,
      error: null,
      rawText: JSON.stringify(autoDecision),
    },
  };
};

const isExplicitStaffHandoffDecision = (decision: AiPass1Decision) =>
  (decision.type === 'tool_call' && decision.toolName === 'handoffToStaff') ||
  (decision.type === 'handoff' && isSensitivePass1Handoff(decision.reason));

const buildAutoSearchDecision = (historyRows: IMessage[]): AiPass1Decision | null => {
  const intent = detectProductSearchIntentFromHistory(getRecentCustomerTexts(historyRows));
  if (!intent) return null;
  return {
    type: 'tool_call',
    toolName: 'searchProducts',
    arguments: intentToSearchToolArguments(intent),
  };
};

const isSearchProductsToolDecision = (decision: AiPass1Decision) =>
  decision.type === 'tool_call' && decision.toolName === 'searchProducts';

const getSearchDebugFromToolPayload = (toolResultPayload: Record<string, unknown> | null) => {
  if (!toolResultPayload || toolResultPayload.status !== 'SUCCESS') return null;
  const result = toolResultPayload.result as Record<string, unknown> | undefined;
  if (!result) return null;
  return {
    returnedCount: typeof result.returnedCount === 'number' ? result.returnedCount : 0,
    budgetRelaxed: result.budgetRelaxed === true,
    searchStrategy: typeof result.searchStrategy === 'string' ? result.searchStrategy : undefined,
    originalQuery: typeof result.originalQuery === 'string' ? result.originalQuery : undefined,
    normalizedQuery: typeof result.normalizedQuery === 'string' ? result.normalizedQuery : undefined,
    detectedStyle: typeof result.detectedStyle === 'string' ? result.detectedStyle : null,
    detectedBudget: typeof result.detectedBudget === 'number' ? result.detectedBudget : null,
    originalMaxPrice: typeof result.originalMaxPrice === 'number' ? result.originalMaxPrice : null,
    effectiveMaxPrice: typeof result.effectiveMaxPrice === 'number' ? result.effectiveMaxPrice : null,
  };
};

const streamDeterministicTokens = (content: string, onToken: (text: string) => void) => {
  if (!content) return;
  const chunks = content.split(/(?<=[.!?…\n])\s+/).filter(Boolean);
  if (chunks.length <= 1) {
    onToken(content);
    return;
  }
  for (const chunk of chunks) {
    onToken(chunk.endsWith('\n') ? chunk : `${chunk} `);
  }
};

const persistDeterministicSearchReply = async ({
  conversation,
  finalContent,
  handoffReason,
  buildChatMetadata,
  productSuggestions,
  searchDebug,
  latencyMs,
}: {
  conversation: any;
  finalContent: string;
  handoffReason: string | null;
  buildChatMetadata: (extra?: Record<string, unknown>) => Record<string, unknown>;
  productSuggestions: ProductSuggestionCard[];
  searchDebug: ReturnType<typeof getSearchDebugFromToolPayload>;
  latencyMs?: number;
}) => {
  const messageMetadata = buildChatMetadata({
    latencyMs,
    handoffReason,
    templateType: productSuggestions.length > 0 ? 'product_suggestions' : 'plain_text',
    productSuggestions: productSuggestions.length > 0 ? productSuggestions : undefined,
    searchStrategy: searchDebug?.searchStrategy,
    originalQuery: searchDebug?.originalQuery,
    normalizedQuery: searchDebug?.normalizedQuery,
    detectedStyle: searchDebug?.detectedStyle,
    detectedBudget: searchDebug?.detectedBudget,
    originalMaxPrice: searchDebug?.originalMaxPrice,
    effectiveMaxPrice: searchDebug?.effectiveMaxPrice,
    budgetRelaxed: searchDebug?.budgetRelaxed,
    returnedCount: searchDebug?.returnedCount,
  });
  const aiMessage = await persistAiMessage(
    conversation,
    finalContent,
    messageMetadata,
    handoffReason
  );
  return { aiMessage, messageMetadata };
};

const runToolCallDecision = async (
  decision: AiPass1Decision,
  context: {
    conversation: any;
    customerMessage: IMessage;
    actor: Actor;
    parsed: ParsedPass1Decision;
    runtime: EffectiveAiRuntime;
  }
): Promise<{
  toolResultPayload: Record<string, unknown> | null;
  handoffReason: string | null;
}> => {
  let handoffReason: string | null =
    decision.type === 'handoff'
      ? decision.reason
      : decision.type === 'tool_call' && decision.toolName === 'handoffToStaff'
        ? 'model_requested_handoff'
        : null;
  let toolResultPayload: Record<string, unknown> | null = null;

  if (decision.type !== 'tool_call') {
    return { toolResultPayload, handoffReason };
  }

  const toolStartedAt = Date.now();
  if (aiConfig.maxToolCallsPerResponse < 1) {
    toolResultPayload = {
      status: 'DENIED',
      errorCode: 'TOOL_CALL_LIMIT_REACHED',
      message: 'Tool calling limit reached.',
    };
    handoffReason = handoffReason ?? 'tool_call_limit_reached';
    await recordAiToolCall({
      conversationId: context.conversation._id.toString(),
      messageId: context.customerMessage._id.toString(),
      actorId: context.actor.id,
      actorRole: context.actor.role,
      toolName: decision.toolName,
      status: 'DENIED',
      parserStrategy: context.parsed.strategy,
      argumentsPayload: decision.arguments,
      resultPayload: null,
      errorCode: 'TOOL_CALL_LIMIT_REACHED',
      errorMessage: 'Tool calling limit reached.',
      durationMs: Date.now() - toolStartedAt,
      provider: context.runtime.provider,
      modelName: context.runtime.modelId,
    });
    return { toolResultPayload, handoffReason };
  }

  const toolResult = await executeToolFromDecision(decision, {
    actorId: context.actor.id,
    actorRole: context.actor.role,
    conversationId: context.conversation._id.toString(),
    messageId: context.customerMessage._id.toString(),
  });
  toolResultPayload = {
    status: toolResult.status,
    result: toolResult.result,
    errorCode: toolResult.errorCode,
    errorMessage: toolResult.errorMessage,
  };
  handoffReason = handoffReason ?? toolResult.handoffReason;
  await recordAiToolCall({
    conversationId: context.conversation._id.toString(),
    messageId: context.customerMessage._id.toString(),
    actorId: context.actor.id,
    actorRole: context.actor.role,
    toolName: decision.toolName,
    status: toolResult.status,
    parserStrategy: context.parsed.strategy,
    argumentsPayload: decision.arguments,
    resultPayload: toolResult.result,
    errorCode: toolResult.errorCode,
    errorMessage: toolResult.errorMessage,
    durationMs: Date.now() - toolStartedAt,
    provider: context.runtime.provider,
    modelName: context.runtime.modelId,
  });

  return { toolResultPayload, handoffReason };
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

  const runtime = await getEffectiveAiRuntime();
  const requestedModelId = runtime.modelId;
  let activeRuntime = runtime;
  const buildChatMetadata = (extra: Record<string, unknown> = {}) =>
    buildAiMessageMetadata(activeRuntime, {
      requestedModel: requestedModelId,
      isFallback: activeRuntime.modelId !== requestedModelId,
      ...extra,
    });

  try {
    const health = await checkActiveProviderHealth(activeRuntime, { mode: 'chat_preflight' });
    if (!health.ok) {
      await incrementAiFailureCount(conversation, 'provider_unavailable');
      const customerMessage =
        health.statusCode === 'rate_limited'
          ? 'AI tạm thời quá tải. Vui lòng thử lại sau vài phút hoặc bấm chuyển nhân viên.'
          : health.message;
      throw new ChatHttpError(503, customerMessage);
    }

    const precheck = evaluatePrecheckHandoff(customerMessage.content);
    const customerQuery = customerMessage.content;
    if (precheck.required) {
      const safeMessage = buildSafeHandoffMessage();
      onToken(safeMessage);
      onHandoff(precheck.reason!);
      const message = await persistAiMessage(
        conversation,
        safeMessage,
        buildChatMetadata({
          handoffReason: precheck.reason,
        }),
        precheck.reason
      );
      return {
        aiMessageId: message._id.toString(),
        conversationId: conversation._id.toString(),
        handoffReason: precheck.reason,
        finalContent: safeMessage,
        metadata: buildChatMetadata({ handoffReason: precheck.reason }),
      };
    }

    const historyRows = await Message.find({
      conversationId: conversation._id,
      messageType: { $ne: 'system_event' },
    })
      .sort({ _id: -1 })
      .limit(aiConfig.maxHistoryMessages);

    const orderedHistoryRows = [...historyRows].reverse();

    const pass1Outcome = await resolvePass1Decision(activeRuntime, orderedHistoryRows, abortSignal);
    if (pass1Outcome.usedModelId && pass1Outcome.usedModelId !== activeRuntime.modelId) {
      activeRuntime = { ...activeRuntime, modelId: pass1Outcome.usedModelId };
    }
    const overridden = applyAutoSearchOverride(
      pass1Outcome.decision,
      pass1Outcome.parsed,
      orderedHistoryRows
    );
    let { parsed, decision } = overridden;

    let handoffEmitted = false;
    const notifyHandoff = (reason: string) => {
      if (handoffEmitted) return;
      handoffEmitted = true;
      onHandoff(reason);
    };

    const toolOutcome = await runToolCallDecision(decision, {
      conversation,
      customerMessage,
      actor,
      parsed,
      runtime: activeRuntime,
    });
    let handoffReason = toolOutcome.handoffReason;
    let toolResultPayload = toolOutcome.toolResultPayload;

    if (isExplicitStaffHandoffDecision(decision) && handoffReason) {
      notifyHandoff(handoffReason);
      const safeMessage = buildSafeHandoffMessage();
      onToken(safeMessage);
      const handoffMetadata = buildChatMetadata({ handoffReason });
      const handoffMessage = await persistAiMessage(
        conversation,
        safeMessage,
        handoffMetadata,
        handoffReason
      );
      return {
        aiMessageId: handoffMessage._id.toString(),
        conversationId: conversation._id.toString(),
        handoffReason,
        finalContent: safeMessage,
        metadata: handoffMetadata,
      };
    }

    if (handoffReason) {
      handoffReason = null;
    }

    if (isSearchProductsToolDecision(decision) && toolResultPayload) {
      const toolStatus = toolResultPayload.status as string | undefined;
      if (toolStatus === 'FAILED') {
        const failedContent = PRODUCT_SEARCH_FAILED_REPLY;
        streamDeterministicTokens(failedContent, onToken);
        const failedMetadata = buildChatMetadata({ handoffReason: null });
        const failedMessage = await persistAiMessage(
          conversation,
          failedContent,
          failedMetadata,
          null
        );
        return {
          aiMessageId: failedMessage._id.toString(),
          conversationId: conversation._id.toString(),
          handoffReason: null,
          finalContent: failedContent,
          metadata: failedMetadata,
        };
      }

      if (toolStatus === 'SUCCESS') {
        const searchDebug = getSearchDebugFromToolPayload(toolResultPayload);
        const productSuggestions = toProductSuggestionsFromToolPayload(decision, toolResultPayload);
        const returnedCount = searchDebug?.returnedCount ?? productSuggestions.length;
        const finalContent =
          returnedCount > 0
            ? buildProductAdviceFromSuggestions(productSuggestions, customerQuery, {
                budgetRelaxed: searchDebug?.budgetRelaxed,
              })
            : EMPTY_PRODUCT_SEARCH_REPLY;
        streamDeterministicTokens(finalContent, onToken);
        const { aiMessage, messageMetadata } = await persistDeterministicSearchReply({
          conversation,
          finalContent,
          handoffReason: null,
          buildChatMetadata,
          productSuggestions,
          searchDebug,
        });
        return {
          aiMessageId: aiMessage._id.toString(),
          conversationId: conversation._id.toString(),
          handoffReason: null,
          finalContent,
          metadata: messageMetadata,
        };
      }
    }

    const promptMessages =
      aiConfig.toolCallingEnabled
        ? buildPass2AnswerPromptMessages(orderedHistoryRows, decision, toolResultPayload)
        : buildAiPromptMessages(orderedHistoryRows);

    let hasAnyToken = false;
    let accumulated = '';
    let latencyMs = 0;

    try {
      const result = await streamActiveProviderResponse(
        activeRuntime,
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
      if (result.usedModelId && result.usedModelId !== activeRuntime.modelId) {
        activeRuntime = { ...activeRuntime, modelId: result.usedModelId };
      }
    } catch (error) {
      if (!hasAnyToken) {
        await incrementAiFailureCount(conversation, 'provider_stream_error_no_token');
        const streamMessage =
          error instanceof Error && error.message.includes('rate limit')
            ? 'AI tạm thời quá tải. Vui lòng thử lại sau vài phút hoặc bấm chuyển nhân viên.'
            : 'AI đang gặp sự cố, mình sẽ chuyển bạn đến nhân viên hỗ trợ.';
        throw new ChatHttpError(503, streamMessage);
      }

      const fallbackTail = '\n\nTin nhắn AI bị gián đoạn, mình đã chuyển bạn tới nhân viên hỗ trợ.';
      const partialContent = `${accumulated}${fallbackTail}`.trim();
      handoffReason = 'partial_stream_error';
      onHandoff(handoffReason);
      const partialMessage = await persistAiMessage(
        conversation,
        partialContent,
        buildChatMetadata({
          latencyMs,
          handoffReason,
          isPartial: true,
        }),
        handoffReason
      );
      const partialMetadata = buildChatMetadata({
        latencyMs,
        handoffReason,
        isPartial: true,
      });
      return {
        aiMessageId: partialMessage._id.toString(),
        conversationId: conversation._id.toString(),
        handoffReason,
        finalContent: partialContent,
        metadata: partialMetadata,
      };
    }

    const markerParsed = extractHandoffMarker(accumulated);
    let finalContent = markerParsed.cleanedContent.trim();
    const productSuggestions = toProductSuggestionsFromToolPayload(decision, toolResultPayload);

    if (!finalContent) {
      if (productSuggestions.length > 0) {
        finalContent = buildProductAdviceFromSuggestions(
          productSuggestions,
          customerQuery
        );
        if (!hasAnyToken) {
          onToken(finalContent);
        }
      } else {
        try {
          const retry = await completeActiveProviderResponse(activeRuntime, promptMessages, {
            temperature: activeRuntime.temperature,
            maxPredictTokens: activeRuntime.maxPredictTokens,
            signal: abortSignal,
          });
          finalContent = retry.fullText.trim();
          if (finalContent && !hasAnyToken) {
            onToken(finalContent);
          }
          if (retry.usedModelId && retry.usedModelId !== activeRuntime.modelId) {
            activeRuntime = { ...activeRuntime, modelId: retry.usedModelId };
          }
        } catch {
          finalContent = '';
        }
      }
    }

    if (!finalContent) {
      finalContent =
        productSuggestions.length > 0
          ? buildProductAdviceFromSuggestions(productSuggestions, customerQuery)
          : 'Mình chưa tạo được câu trả lời đầy đủ. Bạn thử hỏi lại hoặc bấm Gặp nhân viên để được hỗ trợ trực tiếp nhé.';
      if (!hasAnyToken) {
        onToken(finalContent);
      }
    }

    handoffReason = handoffReason ?? markerParsed.reason;
    if (handoffReason) {
      notifyHandoff(handoffReason);
    }

    const messageMetadata = buildChatMetadata({
      latencyMs,
      handoffReason,
      templateType: productSuggestions.length > 0 ? 'product_suggestions' : 'plain_text',
      productSuggestions: productSuggestions.length > 0 ? productSuggestions : undefined,
    });

    const persistedContent = truncateChatMessageContent(finalContent);
    if (persistedContent !== finalContent && !hasAnyToken) {
      onToken(persistedContent);
    }

    const aiMessage = await persistAiMessage(
      conversation,
      persistedContent,
      messageMetadata,
      handoffReason
    );

    return {
      aiMessageId: aiMessage._id.toString(),
      conversationId: conversation._id.toString(),
      handoffReason,
      finalContent: persistedContent,
      metadata: messageMetadata,
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

  const runtime = await getEffectiveAiRuntime();
  const safeMessage = buildSafeHandoffMessage();
  const aiMessage = await persistAiMessage(
    conversation,
    safeMessage,
    buildAiMessageMetadata(runtime, { handoffReason: reason }),
    reason
  );

  return { conversation, message: aiMessage };
};

