import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { hasAuthSessionFlag } from "@/lib/authSession";
import { useAppSelector } from "@/store/hooks";
import {
  createOrGetCustomerConversation,
  getCustomerMessages,
  requestCustomerHandoff,
  sendCustomerMessage,
} from "../shared/chat.api";
import type { Conversation, Message, ProductSuggestion } from "../shared/chat.types";
import { chatSocket } from "../shared/chat.socket";
import { startCustomerAiStream } from "../shared/chat.sse";

const createClientMessageId = () => `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const shouldDisplayMessage = (_message: Message) => true;

const toCurrency = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value.toLocaleString("vi-VN") + "đ";
};

/**
 * Extract clarifying questions from an AI message's metadata.
 * Returns an empty array if none present or invalid.
 */
const getClarifyingQuestions = (message: Message): string[] => {
  const qs = message.metadata?.clarifyingQuestions;
  if (!Array.isArray(qs)) return [];
  return qs.filter((q): q is string => typeof q === "string" && q.trim().length > 0);
};

/**
 * Lightweight analytics helper for clarify chip events.
 * Phase 1: structured console.info for easy querying.
 * Phase 2 (later): swap body to POST to an analytics endpoint.
 */
const logClarifyEvent = (
  event: "clarify_shown" | "clarify_clicked" | "clarify_ignored",
  messageId: string | null,
  chipText?: string,
) => {
  console.info("[clarify]", { event, messageId, chipText, ts: Date.now() });
};

const getProductSuggestions = (message: Message): ProductSuggestion[] => {
  const suggestions = message.metadata?.productSuggestions;
  if (!Array.isArray(suggestions)) return [];
  return suggestions
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      slug: typeof item.slug === "string" ? item.slug : undefined,
      description: typeof item.description === "string" ? item.description : undefined,
      mainImageUrl: typeof item.mainImageUrl === "string" ? item.mainImageUrl : undefined,
      priceFrom: typeof item.priceFrom === "number" ? item.priceFrom : undefined,
      inStock: typeof item.inStock === "boolean" ? item.inStock : undefined,
    }))
    .filter((item) => item.id && item.name);
};

export function CustomerChatWidget() {
  const profile = useAppSelector((state) => state.profile.profile);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ID of the AI message whose clarifying chips are currently visible (null = none)
  const [activeClarifyMessageId, setActiveClarifyMessageId] = useState<string | null>(null);
  // ID of the AI message whose chips are disabled while a chip send is in-flight
  const [sendingChipMessageId, setSendingChipMessageId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const aiStreamCloseRef = useRef<(() => void) | null>(null);
  const aiTempMessageIdRef = useRef<string | null>(null);

  const isCustomer = profile?.role === "CUSTOMER";
  const canUseChat = hasAuthSessionFlag() && isCustomer;

  const closeAiStream = useCallback(() => {
    if (aiStreamCloseRef.current) {
      aiStreamCloseRef.current();
      aiStreamCloseRef.current = null;
    }
    aiTempMessageIdRef.current = null;
  }, []);

  const shouldAutoAskAi = useCallback((conv: Conversation | null) => {
    if (!conv) return false;
    return conv.status === "waiting_staff" && conv.assignedStaffId == null && conv.aiEnabled !== false;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!listRef.current) return;
    const container = listRef.current;
    const performScroll = () => {
      container.scrollTop = container.scrollHeight;
    };
    performScroll();
    window.requestAnimationFrame(performScroll);
    window.setTimeout(performScroll, 60);
  }, []);

  const upsertMessage = useCallback((incoming: Message) => {
    if (!shouldDisplayMessage(incoming)) return;
    setMessages((prev) => {
      const byIdIndex = prev.findIndex((item) => item._id === incoming._id);
      if (byIdIndex >= 0) {
        const next = [...prev];
        next[byIdIndex] = { ...incoming, deliveryState: "sent" as const };
        return next;
      }

      // Handle optimistic entry replacement (same clientMessageId, different _id)
      if (incoming.clientMessageId) {
        const byClientIdIndex = prev.findIndex(
          (item) => item.clientMessageId != null && item.clientMessageId === incoming.clientMessageId
        );
        if (byClientIdIndex >= 0) {
          const next = [...prev];
          next[byClientIdIndex] = { ...incoming, deliveryState: "sent" as const };
          return next;
        }
      }

      return [...prev, { ...incoming, deliveryState: "sent" as const }];
    });
  }, []);

  const upsertAiTempToken = useCallback((token: string) => {
    const tempId = aiTempMessageIdRef.current;
    if (!tempId || !token) return;
    setMessages((prev) => {
      const idx = prev.findIndex((msg) => msg._id === tempId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], content: `${next[idx].content}${token}`, deliveryState: "sent" as const };
      return next;
    });
  }, []);

  const startAiStream = useCallback(
    (conversationId: string, customerMessageId: string) => {
      closeAiStream();
      const tempId = `tmp_ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      aiTempMessageIdRef.current = tempId;
      setMessages((prev) => [
        ...prev,
        {
          _id: tempId,
          conversationId,
          senderType: "ai",
          senderId: null,
          clientMessageId: null,
          messageType: "text",
          content: "",
          createdAt: new Date().toISOString(),
          deliveryState: "sending",
        },
      ]);

      aiStreamCloseRef.current = startCustomerAiStream({
        conversationId,
        messageId: customerMessageId,
        onToken: (text) => {
          upsertAiTempToken(text);
          scrollToBottom();
        },
        onHandoff: ({ reason }) => {
          setConversation((prev) =>
            prev
              ? {
                  ...prev,
                  handoffReason: reason,
                  status: "waiting_staff",
                }
              : prev
          );
          setTyping(false);
        },
        onDone: ({ messageId: aiMessageId, content, metadata }) => {
          setMessages((prev) => {
            const tempIdx = prev.findIndex((msg) => msg._id === tempId);
            if (tempIdx < 0) return prev;
            const existingIdx = prev.findIndex((msg) => msg._id === aiMessageId);
            if (existingIdx >= 0) {
              const next = [...prev];
              next[existingIdx] = {
                ...next[existingIdx],
                content: content ?? next[existingIdx].content,
                metadata: (metadata as Message["metadata"]) ?? next[existingIdx].metadata,
                deliveryState: "sent",
              };
              return next.filter((msg) => msg._id !== tempId);
            }
            const next = [...prev];
            next[tempIdx] = {
              ...next[tempIdx],
              _id: aiMessageId,
              content: content ?? next[tempIdx].content,
              metadata: (metadata as Message["metadata"]) ?? next[tempIdx].metadata,
              deliveryState: "sent",
            };
            return next;
          });
          aiTempMessageIdRef.current = aiMessageId;
          aiStreamCloseRef.current = null;
          // Show clarifying chips if Pass3 returned questions
          const clarifyingQuestions = metadata?.clarifyingQuestions;
          if (Array.isArray(clarifyingQuestions) && clarifyingQuestions.length > 0) {
            setActiveClarifyMessageId(aiMessageId);
            logClarifyEvent("clarify_shown", aiMessageId);
          }
          scrollToBottom();
        },
        onError: () => {
          const friendlyMessage =
            "Vui lòng chờ kết nối tới nhân viên nhé. Mình đã chuyển yêu cầu của bạn sang nhân viên hỗ trợ.";
          setConversation((prev) =>
            prev
              ? {
                  ...prev,
                  status: "waiting_staff",
                  handoffReason: "provider_unavailable",
                }
              : prev
          );
          setMessages((prev) => {
            const tempIdx = prev.findIndex((msg) => msg._id === tempId);
            if (tempIdx < 0) {
              return [
                ...prev,
                {
                  _id: `tmp_ai_error_${Date.now()}`,
                  conversationId,
                  senderType: "ai",
                  senderId: null,
                  clientMessageId: null,
                  messageType: "text",
                  content: friendlyMessage,
                  createdAt: new Date().toISOString(),
                  deliveryState: "sent",
                },
              ];
            }
            const next = [...prev];
            next[tempIdx] = { ...next[tempIdx], content: friendlyMessage, deliveryState: "sent" as const };
            return next;
          });
          aiStreamCloseRef.current = null;
          aiTempMessageIdRef.current = null;
          setTyping(false);
          scrollToBottom();
        },
      });
    },
    [closeAiStream, scrollToBottom, upsertAiTempToken]
  );

  const loadCurrentConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const conv = await createOrGetCustomerConversation();
      setConversation(conv);
      const page = await getCustomerMessages(conv._id, undefined, 30);
      setMessages(
        page.items
          .filter(shouldDisplayMessage)
          .map((item) => ({ ...item, deliveryState: "sent" as const }))
      );
      setHasMore(page.pagination.hasMore);
      setNextBefore(page.pagination.nextBefore);
      chatSocket.emit("join_conversation", { conversationId: conv._id });
      scrollToBottom();
    } catch {
      setError("Không thể tải cuộc trò chuyện. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (!open || !canUseChat) return;
    void loadCurrentConversation();
  }, [open, canUseChat, loadCurrentConversation]);

  useEffect(() => {
    return () => {
      closeAiStream();
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, [closeAiStream]);

  useEffect(() => {
    if (open) return;
    closeAiStream();
  }, [open, closeAiStream]);

  useEffect(() => {
    if (!open || !conversation) return;

    const joinConversation = () => {
      chatSocket.emit("join_conversation", { conversationId: conversation._id });
    };

    const handleNewMessage = (payload: { conversationId: string; message: Message }) => {
      if (payload.conversationId !== conversation._id) return;
      upsertMessage(payload.message);
      scrollToBottom();
    };

    const handleTypingStarted = (payload: { conversationId: string; role: string }) => {
      if (payload.conversationId !== conversation._id) return;
      if (payload.role === "CUSTOMER") return;
      setTyping(true);
    };

    const handleTypingStopped = (payload: { conversationId: string; role: string }) => {
      if (payload.conversationId !== conversation._id) return;
      if (payload.role === "CUSTOMER") return;
      setTyping(false);
    };

    const handleConversationUpdated = (payload: {
      conversationId: string;
      conversation: Conversation;
    }) => {
      if (payload.conversationId !== conversation._id) return;
      setConversation(payload.conversation);
    };

    chatSocket.on("connect", joinConversation);
    joinConversation();
    chatSocket.on("new_message", handleNewMessage);
    chatSocket.on("typing_started", handleTypingStarted);
    chatSocket.on("typing_stopped", handleTypingStopped);
    chatSocket.on("conversation_updated", handleConversationUpdated);

    return () => {
      chatSocket.off("connect", joinConversation);
      chatSocket.off("new_message", handleNewMessage);
      chatSocket.off("typing_started", handleTypingStarted);
      chatSocket.off("typing_stopped", handleTypingStopped);
      chatSocket.off("conversation_updated", handleConversationUpdated);
      chatSocket.emit("leave_conversation", { conversationId: conversation._id });
    };
  }, [open, conversation, scrollToBottom, upsertMessage]);

  const loadOlder = useCallback(async () => {
    if (!conversation || !hasMore || !nextBefore) return;
    const page = await getCustomerMessages(conversation._id, nextBefore, 30);
    setMessages((prev) => [
      ...page.items
        .filter(shouldDisplayMessage)
        .map((item) => ({ ...item, deliveryState: "sent" as const })),
      ...prev,
    ]);
    setHasMore(page.pagination.hasMore);
    setNextBefore(page.pagination.nextBefore);
  }, [conversation, hasMore, nextBefore]);

  /**
   * Core send logic, shared between manual input and chip clicks.
   * Returns true on success, throws on failure.
   */
  const sendMessage = useCallback(
    async (content: string, clientMessageId: string) => {
      if (!conversation) throw new Error("no_conversation");
      const optimistic: Message = {
        _id: `tmp_${clientMessageId}`,
        conversationId: conversation._id,
        senderType: "customer",
        senderId: profile?._id,
        clientMessageId,
        messageType: "text",
        content,
        createdAt: new Date().toISOString(),
        deliveryState: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      scrollToBottom();
      const response = await sendCustomerMessage(conversation._id, { content, clientMessageId });
      setConversation(response.conversation);
      upsertMessage(response.message);
      if (shouldAutoAskAi(response.conversation)) {
        startAiStream(conversation._id, response.message._id);
      }
      return { optimistic, clientMessageId };
    },
    [conversation, profile?._id, scrollToBottom, shouldAutoAskAi, startAiStream, upsertMessage],
  );

  const send = useCallback(async () => {
    if (!conversation || !input.trim()) return;
    const content = input.trim();
    const clientMessageId = createClientMessageId();
    setInput("");
    setSending(true);
    // Dismiss any active clarify chips when user sends a new message manually
    if (activeClarifyMessageId) {
      logClarifyEvent("clarify_ignored", activeClarifyMessageId);
      setActiveClarifyMessageId(null);
    }
    try {
      await sendMessage(content, clientMessageId);
    } catch {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.clientMessageId === clientMessageId) {
            return { ...msg, deliveryState: "failed" };
          }
          return msg;
        })
      );
    } finally {
      setSending(false);
    }
  }, [activeClarifyMessageId, conversation, input, sendMessage]);

  /**
   * Handle a clarifying chip click:
   * 1. Disable chips immediately (prevent double-click)
   * 2. Send the chip text as a customer message
   * 3. On success → dismiss chips
   * 4. On failure → re-enable chips so user can retry
   */
  const handleChipClick = useCallback(
    async (chipText: string, sourceMessageId: string) => {
      if (!conversation || sendingChipMessageId) return;
      setSendingChipMessageId(sourceMessageId); // disable all chips for this bubble
      try {
        await sendMessage(chipText, createClientMessageId());
        setActiveClarifyMessageId(null); // dismiss on success
        setSendingChipMessageId(null);
        logClarifyEvent("clarify_clicked", sourceMessageId, chipText);
      } catch {
        setSendingChipMessageId(null); // re-enable on failure
      }
    },
    [conversation, sendMessage, sendingChipMessageId],
  );

  const requestHandoff = useCallback(async () => {
    if (!conversation) return;
    closeAiStream();
    try {
      const response = await requestCustomerHandoff(conversation._id);
      setConversation(response.conversation);
      upsertMessage(response.message);
      scrollToBottom();
    } catch {
      setError("Không thể chuyển nhân viên lúc này. Vui lòng thử lại.");
    }
  }, [closeAiStream, conversation, scrollToBottom, upsertMessage]);

  const retryMessage = useCallback(
    async (msg: Message) => {
      if (!conversation) return;
      try {
        const response = await sendCustomerMessage(conversation._id, {
          content: msg.content,
          clientMessageId: msg.clientMessageId ?? createClientMessageId(),
        });
        setConversation(response.conversation);
        upsertMessage(response.message);
      } catch {
        setMessages((prev) =>
          prev.map((item) => (item._id === msg._id ? { ...item, deliveryState: "failed" } : item))
        );
      }
    },
    [conversation, upsertMessage]
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-5 md:right-5">
      {open && (
        <div
          className="mb-3 flex h-[min(72vh,500px)] w-[calc(100vw-1.5rem)] max-w-[340px] flex-col overflow-hidden rounded-2xl border border-crystal-border bg-pure-ivory shadow-[0_18px_36px_rgba(30,26,33,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-crystal-border bg-white px-3 py-2.5">
            <div className="flex items-center gap-2">
              <p className="font-home-heading text-sm font-bold text-midnight-purple">CSKH-UTESHOP</p>
              {conversation?.status === "waiting_staff" && (
                <button
                  type="button"
                  onClick={() => void requestHandoff()}
                  disabled={Boolean(conversation.handoffReason)}
                  className="active-press rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {conversation.handoffReason ? "Đã chuyển nhân viên" : "Gặp nhân viên"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="active-press rounded-full border border-crystal-border px-2 py-1 text-[11px] font-semibold text-dusk-gray hover:bg-lavender-mist"
            >
              Đóng
            </button>
          </div>
          {conversation?.status === "waiting_staff" && conversation?.handoffReason ? (
            <div className="border-b border-crystal-border bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
              Đang chờ nhân viên tiếp nhận cuộc trò chuyện. Trong lúc chờ, trợ lý chỉ hỗ trợ thông tin chung.
            </div>
          ) : null}
          {conversation?.status === "staff_handling" && (
            <div className="border-b border-crystal-border bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">
              Bạn đang được nhân viên hỗ trợ trực tiếp.
            </div>
          )}

          <div ref={listRef} className="flex-1 overflow-y-auto bg-surface-container-low/60 px-2.5 py-2.5">
            {loading ? (
              <p className="text-xs font-medium text-dusk-gray">Đang tải lịch sử chat...</p>
            ) : error ? (
              <p className="text-xs font-semibold text-rose-600">{error}</p>
            ) : messages.length === 0 ? (
              <div className="mx-auto mt-8 max-w-[240px] rounded-2xl border border-crystal-border bg-pure-ivory/80 p-3 text-center">
                <p className="text-xs font-semibold text-midnight-purple">Chưa có tin nhắn nào</p>
                <p className="mt-1 text-[11px] text-dusk-gray">Hãy gửi lời nhắn đầu tiên để nhân viên hỗ trợ bạn.</p>
              </div>
            ) : (
              <>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => void loadOlder()}
                    className="mx-auto mb-2 block rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-[11px] font-semibold text-primary transition hover:bg-white"
                  >
                    Tải tin nhắn cũ hơn
                  </button>
                )}
                {messages.map((msg) => {
                  const mine = msg.senderType === "customer";
                  const productSuggestions = msg.senderType === "ai" ? getProductSuggestions(msg) : [];

                  if (msg.messageType === "system_event") {
                    return (
                      <div key={msg._id} className="my-2 flex justify-center">
                        <span className="rounded-full border border-slate-200 bg-slate-100/80 px-3 py-0.5 text-[11px] text-slate-500 italic">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id}
                      className={`mb-1.5 flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm ${
                          mine
                            ? "bg-primary text-pure-ivory"
                            : msg.senderType === "ai"
                              ? "border border-indigo-200 bg-indigo-50 text-indigo-900"
                            : msg.senderType === "system"
                              ? "border border-slate-200 bg-slate-100 text-slate-700"
                              : "border border-crystal-border bg-white text-midnight-purple"
                        }`}
                      >
                        <div>{msg.content}</div>
                        {mine && msg.deliveryState === "sending" && (
                          <div className="mt-1 text-[10px] font-medium text-white/85">Đang gửi...</div>
                        )}
                        {mine && msg.deliveryState === "failed" && (
                          <button
                            type="button"
                            onClick={() => void retryMessage(msg)}
                            className="mt-1 border-none bg-transparent p-0 text-[10px] font-semibold text-rose-200 underline-offset-2 hover:underline"
                          >
                            Gửi lỗi, bấm để gửi lại
                          </button>
                        )}
                        {msg.senderType === "ai" && msg.deliveryState === "sending" && (
                          <div className="mt-1 text-[10px] font-medium text-indigo-700/80">AI đang trả lời...</div>
                        )}
                        {/* Clarifying question chips — Pass3 output */}
                        {msg.senderType === "ai" &&
                          msg._id === activeClarifyMessageId &&
                          getClarifyingQuestions(msg).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {getClarifyingQuestions(msg).map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  disabled={sendingChipMessageId === msg._id}
                                  onClick={() => void handleChipClick(q, msg._id)}
                                  className="chip-clarify"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          )}
                        {msg.senderType === "ai" && productSuggestions.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {productSuggestions.map((product) => (
                              <Link
                                key={`${msg._id}_${product.id}`}
                                to={`/product/${product.id}`}
                                className="block rounded-xl border border-indigo-200 bg-white p-2 transition hover:bg-indigo-50"
                              >
                                <div className="flex items-start gap-2">
                                  {product.mainImageUrl ? (
                                    <img
                                      src={product.mainImageUrl}
                                      alt={product.name}
                                      className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-500">
                                      Hoa
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-semibold text-indigo-900">
                                      {product.name}
                                    </p>
                                    {product.description ? (
                                      <p className="line-clamp-2 text-[10px] text-slate-600">{product.description}</p>
                                    ) : null}
                                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                                      {toCurrency(product.priceFrom) ? (
                                        <span className="font-semibold text-rose-600">
                                          Từ {toCurrency(product.priceFrom)}
                                        </span>
                                      ) : null}
                                      {product.inStock === false ? (
                                        <span className="font-medium text-slate-500">Tạm hết hàng</span>
                                      ) : product.inStock === true ? (
                                        <span className="font-medium text-emerald-600">Còn hàng</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {typing && (
            <div className="px-3 pb-1 text-[11px] font-medium text-dusk-gray">Nhân viên đang nhập...</div>
          )}

          <div className="border-t border-crystal-border bg-white px-2.5 py-2">
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant/50 bg-white p-1.5">
            <input
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (!conversation) return;
                chatSocket.emit("typing_start", { conversationId: conversation._id });
                if (typingTimerRef.current) {
                  window.clearTimeout(typingTimerRef.current);
                }
                typingTimerRef.current = window.setTimeout(() => {
                  chatSocket.emit("typing_stop", { conversationId: conversation._id });
                }, 1500);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void send();
                }
              }}
              onBlur={() => {
                if (conversation) chatSocket.emit("typing_stop", { conversationId: conversation._id });
              }}
              placeholder={canUseChat ? "Nhập tin nhắn..." : "Vui lòng đăng nhập để chat"}
              disabled={!canUseChat || conversation?.status === "closed"}
              className="flex-1 border-none bg-transparent px-2 py-1 text-[13px] text-midnight-purple outline-none placeholder:text-dusk-gray disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!canUseChat || !input.trim() || sending || conversation?.status === "closed"}
              className="active-press rounded-lg bg-primary px-3 py-2 text-[13px] font-bold text-pure-ivory shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Gửi
            </button>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="active-press size-14 rounded-full border border-white/70 bg-primary text-[15px] font-extrabold text-pure-ivory shadow-[0_10px_22px_rgba(99,102,241,0.4)] transition hover:brightness-105"
        >
          Chat
        </button>
      )}
    </div>
  );
}
