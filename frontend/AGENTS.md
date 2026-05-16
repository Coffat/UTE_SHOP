# Frontend stack

Vite 7 + React 19 + React Router DOM v7 + TypeScript 5 + Tailwind CSS v4 (CSS-first via `@theme` in `src/index.css`).

Path alias `@/*` resolves to `./src/*`. Public assets live in `public/` and are referenced by absolute path (e.g. `/images/hero/hero_section_background.png`).

Icons: [`MaterialIcon`](src/components/ui/MaterialIcon.tsx) dùng **SVG** (Iconify `material-symbols` / `ic`), không còn font Material Symbols — tránh chữ ligature (`favorite`, `shopping_bag`) khi import Figma html-to-design.

## Figma pixel capture (profile without login)

Trang `/user/profile` thường cần API đăng nhập. Để chụp UI đầy đủ (Figma MCP `generate_figma_design`, v.v.) **chỉ trong dev**:

1. Tạo `frontend/.env.local` (đã nằm trong `.gitignore`) hoặc chạy một lần với biến môi trường:
   - `VITE_PROFILE_CAPTURE_MOCK=true`
2. `npm run dev` → mở `http://localhost:5173/user/profile` — không redirect về login; `fetchProfile` / `updateProfile` dùng dữ liệu mẫu từ [`profileSlice`](src/features/profile/profileSlice.ts).
3. **Tắt** mock sau khi xong: xóa dòng trong `.env.local` hoặc không truyền biến khi chạy lệnh.

Xem gợi ý biến trong [`.env.example`](.env.example).

### Pixel capture đã import (Figma MCP)

Các frame HTML-to-design được thêm vào file [UTE_SHOP - UI Export](https://www.figma.com/design/lUMPdeLnBMz6K7TphRBsIm) (cùng `file_key` nếu bạn giữ file đó), node gốc khoảng:

- `10:2` — Home (`/`)
- `11:2` — Login
- `12:2` — Register
- `13:2` — Forgot password
- `14:2` — User profile (cần `VITE_PROFILE_CAPTURE_MOCK=true` khi chạy dev lúc capture)

Khi chạy capture: `index.html` có script `mcp.figma.com/.../capture.js`. Có thể **gỡ script** trước khi build production nếu không muốn tải script bên thứ ba trên mọi phiên bản (chỉ cần cho quy trình import Figma).
