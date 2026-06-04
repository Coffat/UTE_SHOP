import { api } from "@/lib/api";

interface StartAiStreamInput {
  conversationId: string;
  messageId: string;
  onToken: (text: string) => void;
  onDone: (payload: { messageId: string; conversationId: string }) => void;
  onHandoff: (payload: { required: true; reason: string }) => void;
  onError: (message: string) => void;
}

const toAbsoluteUrl = (path: string) => {
  const base = (api.defaults.baseURL as string | undefined) ?? "";
  if (!base || base.startsWith("/")) {
    return path;
  }
  const normalizedBase = base.replace(/\/+$/, "");
  return `${normalizedBase}${path}`;
};

export const startCustomerAiStream = ({
  conversationId,
  messageId,
  onToken,
  onDone,
  onHandoff,
  onError,
}: StartAiStreamInput) => {
  const endpointPath = `/api/v1/customer/chat/conversations/${conversationId}/ai/stream?messageId=${encodeURIComponent(
    messageId
  )}`;
  const eventSource = new EventSource(toAbsoluteUrl(endpointPath), { withCredentials: true });

  const parsePayload = (event: MessageEvent) => {
    try {
      return JSON.parse(event.data) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  eventSource.addEventListener("token", (event) => {
    const payload = parsePayload(event as MessageEvent);
    const text = typeof payload.text === "string" ? payload.text : "";
    if (text) onToken(text);
  });

  eventSource.addEventListener("handoff", (event) => {
    const payload = parsePayload(event as MessageEvent);
    const reason = typeof payload.reason === "string" ? payload.reason : "handoff_required";
    onHandoff({ required: true, reason });
  });

  eventSource.addEventListener("done", (event) => {
    const payload = parsePayload(event as MessageEvent);
    const doneMessageId = typeof payload.messageId === "string" ? payload.messageId : "";
    const doneConversationId =
      typeof payload.conversationId === "string" ? payload.conversationId : conversationId;
    if (!doneMessageId) {
      onError("AI stream hoàn tất nhưng thiếu messageId.");
      eventSource.close();
      return;
    }
    onDone({ messageId: doneMessageId, conversationId: doneConversationId });
    eventSource.close();
  });

  eventSource.addEventListener("error", (event) => {
    const payload = parsePayload(event as MessageEvent);
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "AI đang gặp sự cố, mình sẽ chuyển bạn đến nhân viên hỗ trợ.";
    onError(message);
    eventSource.close();
  });

  return () => eventSource.close();
};

