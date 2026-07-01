# UTE SHOP - E-Commerce Platform Architecture

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</div>

<br/>

Dự án UTE_SHOP là một hệ thống thương mại điện tử toàn diện, được xây dựng theo hướng tiếp cận **Modular Monolith** kết hợp với **Strangler Fig Pattern**. Dự án được thiết kế chuyên sâu về mặt kiến trúc phần mềm, khả năng mở rộng (scalability) và hiệu suất cơ sở dữ liệu, phục vụ cho các yêu cầu khắt khe của một đồ án tốt nghiệp/dự án học thuật chuyên nghiệp.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Hệ thống được thiết kế không theo nguyên khối (monolithic) truyền thống mà phân rã thành các phân hệ (modules) độc lập ngay bên trong lõi Backend (Modular Monolith). Điều này mang lại sự cân bằng giữa việc dễ dàng triển khai của Monolith và khả năng mở rộng của Microservices.

- **Modular Monolith**: Các nghiệp vụ như `Catalog`, `Inventory`, `Order`, `Marketing`, `Logistics` và `Finance` được đặt trong các namespace riêng biệt. Mỗi module tự quản lý logic nghiệp vụ và đôi khi là dữ liệu của riêng nó, giao tiếp với nhau qua các interface được định nghĩa rõ ràng.
- **Strangler Fig Pattern**: Cấu trúc Routing được thiết kế để dễ dàng bóc tách từng phần. Mọi requests đi qua API Gateway nội bộ (`/api/v1`) và điều hướng tới các modules, cho phép sau này dễ dàng chuyển đổi một module bất kỳ thành một microservice độc lập (ví dụ: chuyển `Finance` thành service riêng) mà không phá vỡ cấu trúc tổng thể.
- **Event-Driven Architecture**: Các tác vụ bất đồng bộ và theo thời gian thực (như thông báo đơn hàng mới, cập nhật tồn kho, chat hỗ trợ) được xử lý thông qua **Redis** và **Socket.io**.

---

## 2. Công Nghệ Trọng Tâm (Tech Stack)

### Lõi Xử Lý Backend
- **Node.js & Express.js**: Nền tảng thực thi và web framework tốc độ cao.
- **TypeScript**: Cung cấp static typing, giảm thiểu lỗi runtime và tối ưu quá trình làm việc nhóm, bảo trì mã nguồn (maintainability).

### Hệ Quản Trị Cơ Sở Dữ Liệu & Bộ Nhớ Tạm
- **MongoDB (Mongoose)**: Database NoSQL với schema được thiết kế cẩn thận, tận dụng cơ chế Indexing để tối ưu hóa truy vấn dữ liệu lớn (sản phẩm, đơn hàng).
- **Redis**: Caching dữ liệu thường xuyên truy cập, lưu trữ Session, quản lý Rate Limit, và đóng vai trò như Message Broker cho các sự kiện nội bộ.

### An Ninh & Bảo Mật (Security)
- **JWT & Passport.js**: Quản lý phiên làm việc và xác thực đa nền tảng (bao gồm Google/Facebook OAuth2).
- **CORS, Helmet, Rate Limit**: Bảo vệ hệ thống khỏi các cuộc tấn công DDoS, XSS và các lỗ hổng HTTP headers.
- **Zod & Express-Validator**: Kiểm chứng dữ liệu đầu vào (Data Validation) nghiêm ngặt từ phía client trước khi đưa vào xử lý nghiệp vụ.

### Tích Hợp & Dịch Vụ Mở Rộng
- **VNPay Gateway**: Xử lý giao dịch thanh toán trực tuyến an toàn.
- **Nodemailer**: Dịch vụ thông báo tự động qua email (đơn hàng, xác thực).
- **Socket.io**: Đồng bộ hóa dữ liệu thời gian thực (Real-time).

---

## 3. Cấu Trúc Các Phân Hệ Chức Năng (Modules Breakdown)

Dự án được phân rã thành 8 phân hệ cốt lõi, bao phủ toàn bộ vòng đời của một nền tảng E-Commerce.

### 3.1. Quản Lý Người Dùng & Phân Quyền (User & Auth Module)
- Cung cấp cơ chế đăng ký, đăng nhập và khôi phục mật khẩu mã hóa an toàn (Bcrypt).
- Triển khai xác thực qua mạng xã hội (SSO - Single Sign-On).
- Phân quyền theo mô hình RBAC (Role-Based Access Control) với các cấp độ: Customer, Staff, Admin.

### 3.2. Quản Lý Danh Mục Bán Hàng (Catalog Module)
- Xử lý các thực thể về Sản phẩm, Danh mục, Biến thể sản phẩm (Variants).
- Tối ưu hóa truy vấn tìm kiếm sản phẩm theo nhiều tiêu chí (Filter, Sort, Pagination).
- Hệ thống đánh giá sản phẩm (Reviews) và nội dung mở rộng (Recipes/Hướng dẫn).

### 3.3. Quản Lý Tồn Kho (Inventory Module)
- Kiểm soát số lượng hàng hóa tại các kho (Warehouse).
- Tách biệt logic Tồn kho và Sản phẩm để đảm bảo tính nhất quán (Consistency) khi có biến động mua hàng lớn.

### 3.4. Xử Lý Giao Dịch & Đơn Hàng (Order Module)
- Quản lý vòng đời đơn hàng: Khởi tạo, Chờ xử lý, Đã giao, Hủy bỏ.
- Cập nhật tự động trạng thái tồn kho và kích hoạt thông báo khi trạng thái thay đổi.

### 3.5. Tài Chính & Thanh Toán (Finance Module)
- Chịu trách nhiệm khởi tạo phiên giao dịch VNPay, mã hóa checksum bảo mật.
- Cung cấp Webhook / IPN Listener để lắng nghe và xác nhận giao dịch từ cổng thanh toán đẩy về hệ thống.

### 3.6. Tiếp Thị (Marketing Module)
- Quản trị các chiến dịch khuyến mãi (Campaigns), logic cấp phát và áp dụng Mã giảm giá (Vouchers).
- Tính toán chi phí giảm trừ vào tổng đơn hàng một cách chính xác.

### 3.7. Vận Chuyển (Logistics Module)
- Quản lý danh bạ địa chỉ của người dùng.
- Ước tính chi phí vận chuyển dựa trên các đơn vị vận chuyển được tích hợp.

### 3.8. Hệ Thống Thông Báo & Tương Tác (Notification & System Module)
- Xử lý luồng Chat trực tuyến giữa Customer và Staff.
- Trợ lý thông minh (AI Integration) hỗ trợ trả lời tự động hoặc gợi ý sản phẩm.
- Quản lý nội dung nền tảng (Blog, CMS).

---

## 4. Hướng Dẫn Cài Đặt (Installation & Setup)

Dự án cung cấp 2 phương thức cài đặt tùy thuộc vào môi trường triển khai. Khuyến nghị sử dụng **Docker** để giảm thiểu cấu hình môi trường.

### 4.1. Triển Khai Bằng Docker (Khuyến Nghị)

Yêu cầu hệ thống: Docker và Docker Compose.

**Bước 1: Tải mã nguồn**
```bash
git clone https://github.com/Coffat/BaiTap2.git UTE_SHOP
cd UTE_SHOP
```

**Bước 2: Khởi động hệ thống Services**
Môi trường Docker Compose đã được cấu hình sẵn cho MongoDB, Redis và Node.js server.
```bash
cd backend
docker-compose up -d
```
Hệ thống sẽ tiến hành pull các images cần thiết, build ứng dụng và khởi chạy ở chế độ nền (detached).

### 4.2. Triển Khai Trực Tiếp (Local Development)

Yêu cầu hệ thống: Node.js (v18+), MongoDB, Redis.

**Bước 1: Cài đặt thư viện phụ thuộc**
```bash
cd backend
npm install
```

**Bước 2: Cấu hình biến môi trường (Environment Variables)**
Sao chép tập tin mẫu và thiết lập các thông số bảo mật, chuỗi kết nối Database.
```bash
cp .env.example .env
```
Đảm bảo khai báo chính xác `MONGO_URI`, `REDIS_URL`, và thông tin cấu hình `VNPAY`.

**Bước 3: Chạy ứng dụng**
Khởi động ứng dụng trong môi trường phát triển với tính năng hot-reload:
```bash
npm run dev
```
Dịch vụ API sẽ được lắng nghe tại: `http://localhost:3000`

**Lưu ý khi tích hợp VNPay Webhook (IPN)**:
Trong môi trường local, để VNPay có thể gửi callback về máy của bạn, cần sử dụng Ngrok. Dự án đã cung cấp script tích hợp sẵn:
```bash
npm run ngrok:start-sync
```

---

## 5. Liên Hệ & Bản Quyền

Dự án UTE_SHOP được phát triển phục vụ mục đích giáo dục và nghiên cứu cấu trúc phần mềm. 
Mọi thông tin chi tiết về mã nguồn, vui lòng xem các quy định đóng góp (Contribution) và giấy phép (License) tại repository.
