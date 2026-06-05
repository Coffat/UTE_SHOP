import { io } from "socket.io-client";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const CUSTOMER_EMAIL = process.env.SMOKE_CUSTOMER_EMAIL || "vuthang@uteshop.vn";
const CUSTOMER_PASSWORD = process.env.SMOKE_CUSTOMER_PASSWORD || "password123";
const STAFF_EMAIL = process.env.SMOKE_STAFF_EMAIL || "staff1@uteshop.vn";
const STAFF_PASSWORD = process.env.SMOKE_STAFF_PASSWORD || "123456";
const CUSTOMER_COOKIE_ENV = process.env.SMOKE_CUSTOMER_COOKIE || "";
const STAFF_COOKIE_ENV = process.env.SMOKE_STAFF_COOKIE || "";

const nowIso = () => new Date().toISOString();

const must = (condition, message) => {
  if (!condition) throw new Error(message);
};

const parseSetCookie = (setCookieValues) => {
  return setCookieValues.map((item) => item.split(";")[0]).join("; ");
};

const extractAccessToken = (cookieHeader) => {
  const segments = String(cookieHeader || "").split(";").map((item) => item.trim());
  const match = segments.find((item) => item.startsWith("accessToken="));
  return match ? match.replace("accessToken=", "") : "";
};

const loginAndGetCookie = async (email, password) => {
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  must(response.ok && body?.success, `Login failed for ${email}: ${body?.message ?? response.statusText}`);
  const setCookie = response.headers.getSetCookie?.() ?? [];
  must(setCookie.length > 0, `No auth cookie returned for ${email}`);
  return parseSetCookie(setCookie);
};

const apiWithCookie = async (path, cookie, init = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(init.headers || {}),
    },
  });
  const body = await response.json();
  return { response, body };
};

const readSse = async (path, cookie, { timeoutMs = 60000 } = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { Cookie: cookie },
    signal: controller.signal,
  });
  must(response.ok, `SSE request failed: HTTP ${response.status}`);
  must(response.body, "SSE body is empty");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  const events = [];
  let fullToken = "";
  let doneMessageId = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        const eventLine = lines.find((line) => line.startsWith("event:"));
        const dataLine = lines.find((line) => line.startsWith("data:"));
        if (!eventLine || !dataLine) continue;
        const event = eventLine.replace("event:", "").trim();
        const payload = JSON.parse(dataLine.replace("data:", "").trim());
        events.push({ event, payload });
        if (event === "token" && typeof payload.text === "string") {
          fullToken += payload.text;
        }
        if (event === "done" && typeof payload.messageId === "string") {
          doneMessageId = payload.messageId;
          return { events, fullToken, doneMessageId };
        }
        if (event === "error") {
          throw new Error(`SSE error event: ${payload.message || "unknown"}`);
        }
      }
    }
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }

  return { events, fullToken, doneMessageId };
};

const waitForStaffAiMessage = (socket, conversationId, { timeoutMs = 60000 } = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("new_message", onNewMessage);
      reject(new Error("Timed out waiting for staff realtime AI message"));
    }, timeoutMs);

    const onNewMessage = (payload) => {
      const payloadConversationId = String(payload?.conversationId ?? "");
      const senderType = String(payload?.message?.senderType ?? "").toLowerCase();
      console.log(`[${nowIso()}] staff socket new_message`, {
        conversationId: payloadConversationId,
        senderType,
        messageId: payload?.message?._id ?? payload?.message?.id,
      });
      if (payloadConversationId !== String(conversationId)) return;
      if (senderType !== "ai") return;
      clearTimeout(timeout);
      socket.off("new_message", onNewMessage);
      resolve(payload.message);
    };

    socket.on("new_message", onNewMessage);
  });
};

const main = async () => {
  console.log(`[${nowIso()}] Starting AI chat E2E smoke test`);

  const customerCookie =
    CUSTOMER_COOKIE_ENV.trim().length > 0
      ? CUSTOMER_COOKIE_ENV.trim()
      : await loginAndGetCookie(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  const staffCookie =
    STAFF_COOKIE_ENV.trim().length > 0
      ? STAFF_COOKIE_ENV.trim()
      : await loginAndGetCookie(STAFF_EMAIL, STAFF_PASSWORD);
  console.log(`[${nowIso()}] Authenticated customer and staff`);

  const currentConv = await apiWithCookie("/api/v1/customer/chat/conversations/current", customerCookie, {
    method: "POST",
  });
  must(currentConv.response.ok, "Failed to get current customer conversation");
  const conversationId = currentConv.body?.data?._id;
  must(Boolean(conversationId), "Conversation ID not found");
  console.log(`[${nowIso()}] Conversation ready: ${conversationId}`);

  const staffSocket = io(BASE_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: {
      accessToken: extractAccessToken(staffCookie),
    },
    transportOptions: {
      polling: { extraHeaders: { Cookie: staffCookie } },
      websocket: { extraHeaders: { Cookie: staffCookie } },
    },
  });

  staffSocket.on("disconnect", (reason) => {
    console.log(`[${nowIso()}] staff socket disconnected: ${reason}`);
  });
  staffSocket.on("chat_error", (payload) => {
    console.log(`[${nowIso()}] staff socket chat_error`, payload);
  });
  staffSocket.on("conversation_updated", (payload) => {
    console.log(`[${nowIso()}] staff socket conversation_updated`, {
      conversationId: payload?.conversationId,
      status: payload?.conversation?.status,
    });
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Staff socket connect timeout")), 10000);
    staffSocket.on("connect", () => {
      clearTimeout(timeout);
      resolve();
    });
    staffSocket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
  console.log(`[${nowIso()}] Staff socket connected: ${staffSocket.id}`);
  console.log(`[${nowIso()}] Staff socket currently connected: ${staffSocket.connected}`);
  staffSocket.emit("join_conversation", { conversationId });

  const aiRealtimePromise = waitForStaffAiMessage(staffSocket, conversationId);

  const clientMessageId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sendCustomer = await apiWithCookie(
    `/api/v1/customer/chat/conversations/${conversationId}/messages`,
    customerCookie,
    {
      method: "POST",
      body: JSON.stringify({
        content: "Shop mở cửa lúc mấy giờ vậy ạ?",
        clientMessageId,
      }),
    }
  );
  must(sendCustomer.response.status === 201, "Failed to send customer message");
  const customerMessageId = sendCustomer.body?.data?.message?._id;
  must(Boolean(customerMessageId), "Customer message ID missing");
  console.log(`[${nowIso()}] Customer message sent: ${customerMessageId}`);

  const sseResult = await readSse(
    `/api/v1/customer/chat/conversations/${conversationId}/ai/stream?messageId=${customerMessageId}`,
    customerCookie
  );
  must(Boolean(sseResult.doneMessageId), "SSE done messageId missing");
  must(sseResult.fullToken.trim().length > 0, "SSE token stream is empty");
  console.log(`[${nowIso()}] SSE stream done: ${sseResult.doneMessageId}`);

  const staffAiMessage = await aiRealtimePromise;
  must(staffAiMessage?._id, "Staff did not receive AI realtime message");
  console.log(`[${nowIso()}] Staff received realtime AI message: ${staffAiMessage._id}`);

  const customerMessages = await apiWithCookie(
    `/api/v1/customer/chat/conversations/${conversationId}/messages?limit=30`,
    customerCookie
  );
  must(customerMessages.response.ok, "Failed to read customer messages");
  const items = customerMessages.body?.data?.items ?? [];
  const persistedAi = items.find((msg) => msg._id === sseResult.doneMessageId && msg.senderType === "ai");
  must(Boolean(persistedAi), "Persisted AI message not found in conversation history");
  console.log(`[${nowIso()}] Persisted AI message verified in DB-backed API history`);

  staffSocket.disconnect();
  console.log(`[${nowIso()}] ✅ Smoke test PASS`);
};

main().catch((err) => {
  console.error(`[${nowIso()}] ❌ Smoke test FAILED`);
  console.error(err);
  process.exit(1);
});

