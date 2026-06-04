import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";

type ChatEventHandler = (payload: any) => void;

function resolveSocketBaseUrl(): string | undefined {
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (explicit && explicit.trim().length > 0) {
    return explicit.trim();
  }

  const apiBase = api.defaults.baseURL as string | undefined;
  if (apiBase && /^https?:\/\//.test(apiBase)) {
    return apiBase;
  }

  // Undefined => same origin. In dev, Vite proxies /socket.io to backend.
  return undefined;
}

class ChatSocketClient {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;
    if (this.socket) return this.socket;

    this.socket = io(resolveSocketBaseUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });
    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  on(event: string, handler: ChatEventHandler) {
    this.connect().on(event, handler);
  }

  off(event: string, handler: ChatEventHandler) {
    this.socket?.off(event, handler);
  }

  emit(event: string, payload: any) {
    this.connect().emit(event, payload);
  }
}

export const chatSocket = new ChatSocketClient();
