# Kiến trúc Hệ thống UTE_SHOP (Architecture)

Tài liệu này mô tả tổng quan về kiến trúc của dự án UTE_SHOP, bao gồm cấu trúc thư mục, các công nghệ sử dụng, và chức năng của từng thành phần.

## 1. Tổng quan (Overview)

Dự án UTE_SHOP được xây dựng dựa trên mô hình **Client-Server** (Frontend - Backend tách biệt), sử dụng ngăn xếp công nghệ **MERN** (MongoDB, Express, React, Node.js) kết hợp với **Redis** để tối ưu hóa hiệu suất (caching).

*   **Frontend:** Giao diện người dùng (UI) tương tác trực tiếp với khách hàng và quản trị viên.
*   **Backend:** Máy chủ xử lý logic nghiệp vụ, giao tiếp cơ sở dữ liệu và cung cấp API (RESTful).
*   **Database & Cache:** Lưu trữ dữ liệu chính trên MongoDB và dùng Redis làm bộ nhớ đệm (cache/rate-limit).

## 2. Công nghệ sử dụng (Tech Stack)

### 2.1. Frontend
*   **Framework/Library:** React 19 (với Vite)
*   **Ngôn ngữ:** TypeScript
*   **Quản lý trạng thái (State Management):** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
*   **Routing:** React Router DOM v7
*   **HTTP Client:** Axios
*   **Styling:** Tailwind CSS v4
*   **Icon:** `@iconify/react`

### 2.2. Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Ngôn ngữ:** JavaScript (CommonJS)
*   **Cơ sở dữ liệu (Database):** MongoDB (thông qua thư viện `mongoose`)
*   **Bộ nhớ đệm (Caching/Session):** Redis (`redis`)
*   **Xác thực (Authentication):** JWT (`jsonwebtoken`), `bcryptjs` (mã hóa mật khẩu), `cookie-parser`
*   **Bảo mật & Validation:** `cors`, `express-rate-limit`, `express-validator`
*   **Gửi Email:** Nodemailer

## 3. Cấu trúc thư mục (Directory Structure)

Dự án chia làm hai phần chính `frontend` và `backend`:

### Backend Architecture
Được tổ chức theo mô hình MVC (Model-View-Controller) kết hợp Service Layer:
*   `config/`: Chứa các tệp cấu hình kết nối database (MongoDB, Redis), biến môi trường.
*   `models/`: Định nghĩa các schema của Mongoose tương tác với database.
*   `controllers/`: Xử lý logic request/response, gọi tới các service để xử lý nghiệp vụ.
*   `services/`: Lớp xử lý logic nghiệp vụ độc lập (VD: `auth.service.js`).
*   `routes/`: Định nghĩa các endpoint API và map tới các controller tương ứng.
*   `middlewares/`: Chứa các middleware như xác thực (auth), kiểm tra quyền, validation dữ liệu.
*   `utils/`: Các hàm tiện ích dùng chung (VD: cấu hình gửi email `email.js`).

### Frontend Architecture
Sử dụng kiến trúc Component-based kết hợp Feature-based:
*   `src/components/`: Các UI component có thể tái sử dụng (VD: layout, material icons).
*   `src/features/`: Các module tính năng chính (VD: `auth`, `profile`). Chứa slice của Redux và các component đặc thù của tính năng đó.
*   `src/store/`: Cấu hình Redux store.
*   `src/lib/`: Các cấu hình thư viện hoặc axios instance (`api.ts`).

## 4. Rà soát thư viện (Dependencies Review)

Đã tiến hành rà soát các tệp `package.json` ở cả frontend và backend nhằm tối ưu hóa dự án, tránh "lag" do thư viện dư thừa:

**Tại Backend:**
*   Các thư viện thiết yếu và nhẹ, được sử dụng đúng mục đích: `bcryptjs` (bảo mật), `express` (core API), `mongoose` (DB), `jsonwebtoken` (Auth), `redis` (Cache), `nodemailer` (Mail).
*   Không có thư viện nào dư thừa hay bị lạm dụng (đã kiểm tra qua depcheck & grep).

**Tại Frontend:**
*   Hệ sinh thái hiện đại, mỏng và tối ưu: `Vite` giúp build cực nhanh, `Tailwind CSS 4` tối giản dung lượng CSS, `Zustand` / `Redux Toolkit` chuẩn hóa state. 
*   Chỉ sử dụng `axios` cho việc gọi API thay vì nhiều bộ fetcher cồng kềnh.

**Kết luận đánh giá:** Dự án đang duy trì bộ thư viện rất "sạch" (clean) và nhẹ nhàng. Khuyến nghị tiếp tục giữ cấu trúc gọn gàng này để đảm bảo hiệu năng cao.
