import { useCallback, useEffect, useRef, useState } from "react";
import { hasAuthSessionFlag } from "@/lib/authSession";
import { useAppSelector } from "@/store/hooks";
import {
  createOrGetCustomerConversation,
  getCustomerMessages,
  sendCustomerMessage,
} from "../shared/chat.api";
import type { Conversation, Message } from "../shared/chat.types";
import { chatSocket } from "../shared/chat.socket";

const createClientMessageId = () => `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const shouldDisplayMessage = (message: Message) => message.messageType !== "system_event";

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
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  const isCustomer = profile?.role === "CUSTOMER";
  const canUseChat = hasAuthSessionFlag() && isCustomer;

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
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

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

    chatSocket.on("connect", joinConversation);
    joinConversation();
    chatSocket.on("new_message", handleNewMessage);
    chatSocket.on("typing_started", handleTypingStarted);
    chatSocket.on("typing_stopped", handleTypingStopped);

    return () => {
      chatSocket.off("connect", joinConversation);
      chatSocket.off("new_message", handleNewMessage);
      chatSocket.off("typing_started", handleTypingStarted);
      chatSocket.off("typing_stopped", handleTypingStopped);
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

  const send = useCallback(async () => {
    if (!conversation || !input.trim()) return;
    const content = input.trim();
    const clientMessageId = createClientMessageId();
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
    setInput("");
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    scrollToBottom();
    try {
      const response = await sendCustomerMessage(conversation._id, { content, clientMessageId });
      setConversation(response.conversation);
      upsertMessage(response.message);
    } catch {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.clientMessageId === clientMessageId || msg._id === optimistic._id) {
            return { ...msg, deliveryState: "failed" };
          }
          return msg;
        })
      );
    } finally {
      setSending(false);
    }
  }, [conversation, input, profile?._id, scrollToBottom, upsertMessage]);

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
          <div className="flex items-start justify-between border-b border-crystal-border bg-white px-3 py-2.5">
            <div>
              <p className="font-home-heading text-sm font-bold text-midnight-purple">CSKH-UTESHOP</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="active-press rounded-full border border-crystal-border px-2 py-1 text-[11px] font-semibold text-dusk-gray hover:bg-lavender-mist"
            >
              Đóng
            </button>
          </div>

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
                  return (
                    <div
                      key={msg._id}
                      className={`mb-1.5 flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm ${
                          mine
                            ? "bg-primary text-pure-ivory"
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
