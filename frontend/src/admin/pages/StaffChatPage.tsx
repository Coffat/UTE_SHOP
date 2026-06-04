import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  assignStaffConversation,
  getStaffMessages,
  listStaffConversations,
  sendStaffMessage,
  updateStaffConversationStatus,
} from "../services/staffChat.api";
import type { Conversation, Message, ConversationStatus } from "@/features/chat/shared/chat.types";
import { chatSocket } from "@/features/chat/shared/chat.socket";

const STATUS_OPTIONS: Array<{ id: ConversationStatus | "all"; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "waiting_staff", label: "Chờ nhận" },
  { id: "staff_handling", label: "Đang xử lý" },
  { id: "resolved", label: "Đã xử lý" },
  { id: "closed", label: "Đã đóng" },
];

const createClientMessageId = () => `smsg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const shouldDisplayMessage = (message: Message) => message.messageType !== "system_event";

function getUserDisplayName(user: Conversation["customerId"]) {
  if (!user || typeof user === "string") return "Khách hàng";
  return user.fullName || user.email || "Khách hàng";
}

export function StaffChatPage() {
  const { user } = useAdminAuth();
  const [status, setStatus] = useState<ConversationStatus | "all">("waiting_staff");
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item._id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const refreshConversations = useCallback(async () => {
    setLoadingConversations(true);
    setConversationError(null);
    try {
      const result = await listStaffConversations({
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
        page: 1,
        limit: 50,
      });
      setConversations(result.items);
      setActiveConversationId((prev) => prev ?? result.items[0]?._id ?? null);
    } catch {
      setConversationError("Không thể tải danh sách hội thoại.");
    } finally {
      setLoadingConversations(false);
    }
  }, [status, search]);

  const scrollToBottom = useCallback(() => {
    if (!messagesRef.current) return;
    const container = messagesRef.current;
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

  const loadMessages = useCallback(
    async (conversationId: string, before?: string) => {
      setLoadingMessages(true);
      setMessageError(null);
      try {
        const result = await getStaffMessages(conversationId, before, 30);
        if (before) {
          setMessages((prev) => [
            ...result.items
              .filter(shouldDisplayMessage)
              .map((msg) => ({ ...msg, deliveryState: "sent" as const })),
            ...prev,
          ]);
        } else {
          setMessages(
            result.items
              .filter(shouldDisplayMessage)
              .map((msg) => ({ ...msg, deliveryState: "sent" as const }))
          );
        }
        setHasMore(result.pagination.hasMore);
        setNextBefore(result.pagination.nextBefore);
        scrollToBottom();
      } catch {
        setMessageError("Không thể tải tin nhắn. Vui lòng thử lại.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [scrollToBottom]
  );

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    void loadMessages(activeConversationId);
    chatSocket.emit("join_conversation", { conversationId: activeConversationId });
    return () => {
      chatSocket.emit("leave_conversation", { conversationId: activeConversationId });
    };
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    const handleConversationUpdated = (payload: { conversation?: Conversation }) => {
      if (!payload.conversation) return;
      setConversations((prev) => {
        const idx = prev.findIndex((item) => item._id === payload.conversation!._id);
        if (idx < 0) return [payload.conversation!, ...prev];
        const next = [...prev];
        next[idx] = payload.conversation!;
        next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return next;
      });
    };

    const handleNewMessage = (payload: { conversationId: string; message: Message }) => {
      setConversations((prev) =>
        prev.map((item) => {
          if (item._id !== payload.conversationId) return item;
          return {
            ...item,
            lastMessageAt: payload.message.createdAt,
            lastMessagePreview: payload.message.content,
            lastMessageSenderType: payload.message.senderType,
          };
        })
      );
      if (payload.conversationId !== activeConversationId) return;
      upsertMessage(payload.message);
      scrollToBottom();
    };

    chatSocket.on("conversation_updated", handleConversationUpdated);
    chatSocket.on("new_message", handleNewMessage);
    return () => {
      chatSocket.off("conversation_updated", handleConversationUpdated);
      chatSocket.off("new_message", handleNewMessage);
    };
  }, [activeConversationId, scrollToBottom, upsertMessage]);

  const handleAssign = useCallback(async () => {
    if (!activeConversationId) return;
    await assignStaffConversation(activeConversationId);
    await refreshConversations();
    await loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages, refreshConversations]);

  const handleUpdateStatus = useCallback(
    async (nextStatus: "resolved" | "closed") => {
      if (!activeConversationId) return;
      await updateStaffConversationStatus(activeConversationId, nextStatus);
      await refreshConversations();
    },
    [activeConversationId, refreshConversations]
  );

  const send = useCallback(async () => {
    if (!activeConversationId || !input.trim()) return;
    const content = input.trim();
    const clientMessageId = createClientMessageId();
    const optimistic: Message = {
      _id: `tmp_${clientMessageId}`,
      conversationId: activeConversationId,
      senderType: "staff",
      senderId: user?.id,
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
      const response = await sendStaffMessage(activeConversationId, { content, clientMessageId });
      upsertMessage(response.message);
      setConversations((prev) =>
        prev.map((item) => (item._id === activeConversationId ? response.conversation : item))
      );
    } catch {
      setMessages((prev) =>
        prev.map((item) =>
          item.clientMessageId === clientMessageId || item._id === optimistic._id
            ? { ...item, deliveryState: "failed" }
            : item
        )
      );
    } finally {
      setSending(false);
    }
  }, [activeConversationId, input, user?.id, scrollToBottom, upsertMessage]);

  const retryMessage = useCallback(
    async (message: Message) => {
      if (!activeConversationId) return;
      try {
        const response = await sendStaffMessage(activeConversationId, {
          content: message.content,
          clientMessageId: message.clientMessageId ?? createClientMessageId(),
        });
        upsertMessage(response.message);
      } catch {
        setMessages((prev) =>
          prev.map((item) => (item._id === message._id ? { ...item, deliveryState: "failed" } : item))
        );
      }
    },
    [activeConversationId, upsertMessage]
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr 280px",
        gap: 16,
        minHeight: "calc(100vh - 180px)",
      }}
    >
      <section className="admin-card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ color: "#fff", margin: 0, fontSize: 16 }}>Hội thoại</h3>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên/email"
          style={{
            border: "1px solid var(--adm-border)",
            borderRadius: 8,
            background: "rgba(13,21,38,0.4)",
            color: "#fff",
            padding: "8px 10px",
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              style={{
                border: "1px solid var(--adm-border)",
                borderRadius: 999,
                background: item.id === status ? "#4f46e5" : "rgba(255,255,255,0.03)",
                color: "#e2e8f0",
                fontSize: 12,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {conversationError ? (
            <p style={{ color: "#f43f5e", fontSize: 13 }}>{conversationError}</p>
          ) : loadingConversations ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Đang tải...</p>
          ) : (
            conversations.map((item) => {
              const active = item._id === activeConversationId;
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setActiveConversationId(item._id)}
                  style={{
                    border: active ? "1px solid #6366f1" : "1px solid var(--adm-border)",
                    borderRadius: 10,
                    padding: 10,
                    textAlign: "left",
                    background: active ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.02)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{getUserDisplayName(item.customerId)}</strong>
                    {item.hasUnreadForStaff && (
                      <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700 }}>Mới</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    {item.lastMessagePreview || "Chưa có tin nhắn"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{item.status}</div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="admin-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--adm-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong style={{ color: "#fff", fontSize: 14 }}>
            {activeConversation ? getUserDisplayName(activeConversation.customerId) : "Chọn hội thoại"}
          </strong>
          <div style={{ display: "flex", gap: 8 }}>
            {activeConversation?.status === "waiting_staff" && (
              <button
                type="button"
                onClick={() => void handleAssign()}
                style={{ border: "none", borderRadius: 8, background: "#0ea5e9", color: "#fff", padding: "6px 10px", cursor: "pointer" }}
              >
                Nhận xử lý
              </button>
            )}
            {activeConversation?.status === "staff_handling" && (
              <button
                type="button"
                onClick={() => void handleUpdateStatus("resolved")}
                style={{ border: "none", borderRadius: 8, background: "#10b981", color: "#fff", padding: "6px 10px", cursor: "pointer" }}
              >
                Đánh dấu đã xử lý
              </button>
            )}
            {activeConversation?.status === "resolved" && (
              <button
                type="button"
                onClick={() => void handleUpdateStatus("closed")}
                style={{ border: "none", borderRadius: 8, background: "#f43f5e", color: "#fff", padding: "6px 10px", cursor: "pointer" }}
              >
                Đóng hội thoại
              </button>
            )}
          </div>
        </div>

        <div ref={messagesRef} style={{ flex: 1, overflowY: "auto", padding: 12, background: "rgba(2,6,23,0.35)" }}>
          {!activeConversationId ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Chọn một hội thoại để bắt đầu.</p>
          ) : messageError ? (
            <p style={{ color: "#f43f5e", fontSize: 13 }}>{messageError}</p>
          ) : loadingMessages ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Đang tải tin nhắn...</p>
          ) : (
            <>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => {
                    if (!activeConversationId || !nextBefore) return;
                    void loadMessages(activeConversationId, nextBefore);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#6366f1",
                    display: "block",
                    margin: "0 auto 8px",
                    cursor: "pointer",
                  }}
                >
                  Tải tin cũ hơn
                </button>
              )}
              {messages.map((msg) => {
                const mine = msg.senderType === "staff";
                return (
                  <div
                    key={msg._id}
                    style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 8 }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        borderRadius: 10,
                        padding: "8px 10px",
                        background: mine ? "#4f46e5" : msg.senderType === "system" ? "#334155" : "#1e293b",
                        color: "#fff",
                        fontSize: 13,
                      }}
                    >
                      {msg.content}
                      {mine && msg.deliveryState === "sending" && (
                        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>Đang gửi...</div>
                      )}
                      {mine && msg.deliveryState === "failed" && (
                        <button
                          type="button"
                          onClick={() => void retryMessage(msg)}
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: "#fecaca",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: 0,
                          }}
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

        <div style={{ borderTop: "1px solid var(--adm-border)", padding: 10, display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="Nhập phản hồi..."
            disabled={!activeConversationId || activeConversation?.status === "closed"}
            style={{
              flex: 1,
              border: "1px solid var(--adm-border)",
              borderRadius: 8,
              background: "rgba(13,21,38,0.45)",
              color: "#fff",
              padding: "8px 10px",
            }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!activeConversationId || !input.trim() || sending || activeConversation?.status === "closed"}
            style={{
              border: "none",
              borderRadius: 8,
              background: "#4f46e5",
              color: "#fff",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Gửi
          </button>
        </div>
      </section>

      <section className="admin-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ color: "#fff", margin: 0, fontSize: 15 }}>Thông tin khách hàng</h3>
        {!activeConversation ? (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa chọn hội thoại.</p>
        ) : (
          <>
            <div style={{ color: "#e2e8f0", fontSize: 13 }}>
              <strong>Tên:</strong> {getUserDisplayName(activeConversation.customerId)}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 13 }}>
              <strong>Email:</strong>{" "}
              {typeof activeConversation.customerId === "string"
                ? "-"
                : activeConversation.customerId.email || "-"}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 13 }}>
              <strong>SĐT:</strong>{" "}
              {typeof activeConversation.customerId === "string"
                ? "-"
                : activeConversation.customerId.phone || "-"}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 13 }}>
              <strong>Trạng thái:</strong> {activeConversation.status}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
