/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Nếu set: gọi thẳng API này (bỏ qua proxy dev). Để trống khi dev: dùng proxy Vite → /api */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
