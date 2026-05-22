import axios, { isAxiosError } from "axios";
import { clearAuthSessionFlag } from "./authSession";
import { runUnauthorizedHandler } from "./unauthorizedHandler";

/**
 * Dev: để trống → gọi cùng origin (Vite), request `/api/*` được proxy tới backend → tránh CORS + Network Error khi quên bật CORS đúng origin.
 * Production: set `VITE_API_BASE_URL` (vd. https://api.example.com) hoặc để trống nếu reverse-proxy phục vụ `/api` cùng host.
 */
function resolveBaseURL(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && fromEnv !== "") {
    return fromEnv;
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return "http://localhost:3000";
}

export const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      // 403 = đã đăng nhập nhưng không đủ quyền (vd. staff gọi /favorites) — không logout
      if (status === 401) {
        clearAuthSessionFlag();
        runUnauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);
