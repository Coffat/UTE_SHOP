/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Nếu set: gọi thẳng API này (bỏ qua proxy dev). Để trống khi dev: dùng proxy Vite → /api */
  readonly VITE_API_BASE_URL?: string;
  /** Chỉ trong `npm run dev`: `true` thì fetchProfile/updateProfile dùng dữ liệu giả (Figma pixel capture, không cần đăng nhập). */
  readonly VITE_PROFILE_CAPTURE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
