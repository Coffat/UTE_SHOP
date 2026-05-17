# UTE_SHOP MongoDB Schema Design

## 1. Understanding Summary
- **Mục tiêu:** Chuyển đổi kiến trúc cơ sở dữ liệu của UTE_SHOP từ mô hình Quan hệ (Relational ERD) sang mô hình Hướng tài liệu (Document-Oriented) cho MongoDB/Mongoose.
- **Lý do:** Tối ưu hóa hiệu suất đọc/ghi, tăng khả năng mở rộng và áp dụng các Best Practices của NoSQL trước khi implement backend Node.js.
- **Đối tượng:** Tài liệu dành cho đội ngũ phát triển Backend Node.js (Express) để xây dựng Mongoose Schemas.
- **Phạm vi (Constraints):** Không bê nguyên cấu trúc bảng nối (join tables) từ SQL sang. Tận dụng tối đa sức mạnh của Embedding và Referencing.
- **Không bao gồm (Non-goals):** Tài liệu này chỉ định hình cấu trúc dữ liệu, không bao gồm code logic chi tiết.

## 2. Assumptions
- **Mô hình hoạt động:** Single-vendor (Hệ thống do 1 chủ cửa hàng quản lý bán hàng).
- **Quy mô & Lưu lượng:** Lượng truy cập (Traffic) cao ở các trang xem sản phẩm, tỷ lệ Read/Write cao.
- **Tính nhất quán (Consistency):** 
  - Yêu cầu nhất quán nghiêm ngặt (Strict Consistency) đối với Tồn kho (Inventory), Giỏ hàng (Cart) và Đơn hàng (Orders).
  - Có thể chấp nhận nhất quán cuối (Eventual Consistency) cho Lượt xem, Đánh giá, Trạng thái hết hàng hiển thị trên UI.
- **Thiết kế phân quyền:** Ứng dụng tính năng Discriminators của Mongoose để xử lý tính đa hình (Polymorphism) cho Users (Customer, Admin, Staff) trong cùng 1 collection.

## 3. Decision Log
| Khu vực | Quyết định | Lý do (Trade-offs) |
| --- | --- | --- |
| **Users** | Sử dụng 1 collection duy nhất (`users`) kết hợp Mongoose Discriminators. Nhúng `loyalty` vào document của Customer. | Tránh join (lookup) không cần thiết, dễ quản lý session đăng nhập chung. Hạn chế phình collection phụ. |
| **Carts & Orders** | Nhúng toàn bộ `items`, `payments`, `status_histories` thẳng vào document của `carts` và `orders`. | Vòng đời của 1 đơn hàng bị giới hạn số lượng mục. Việc nhúng giúp lấy toàn bộ thông tin đơn hàng trong 1 lần query. |
| **Products & Variants** | **Hybrid Model:** Tách riêng collection `product_variants` (lưu kho, SKU). Nhưng nhúng mảng `minified_variants` và `tags` vào collection `products`. | Tối ưu hóa cực độ tốc độ load danh sách sản phẩm ở trang chủ (không cần join). Đồng thời giữ an toàn cho dữ liệu kho khi update. |
| **Inventory** | Tách riêng hoàn toàn `warehouses`, `stock_levels`, `stock_transactions`. Không nhúng vào Product. | Kho là dữ liệu High-Write. Nhúng vào Product sẽ gây lock document, dẫn đến sai lệch số lượng khi nhiều người mua cùng lúc. |
| **Reviews & Messages** | Tách collection riêng cho `reviews` và `chat_messages`. Nhúng cache (`total_reviews`, `avg_rating`) vào Product. | Đây là các dữ liệu có khả năng sinh trưởng vô hạn (Unbounded Growth). Nếu nhúng sẽ gây lỗi vượt mức 16MB/document của MongoDB. |
| **Notifications** | Tách collection `notifications` (Mẫu thông báo) và `user_notifications` (Trạng thái đọc). Bật TTL Index cho `user_notifications`. | Phù hợp với cơ chế Broadcast. TTL Index giúp tự động dọn rác DB. |

## 4. Final Design (Collection Mapping)

Dưới đây là sơ đồ ánh xạ từ ERD sang MongoDB Collections cho dự án:

### 4.1. Nhóm cấu hình và quản trị
- `shop_profiles`: Collection (Singleton - 1 document).

### 4.2. Nhóm Người dùng (Users)
- `users`: Collection gốc.
  - *Discriminators*: 
    - `Customer` (có thêm `is_email_verified`, `loyalty: {points, tier}`)
    - `Admin`
    - `Staff` (có thêm `staff_type`, `assigned_warehouse`...).

### 4.3. Nhóm Sản phẩm & Kho bãi (Catalog & Inventory)
- `categories`: Collection (Tree cấu trúc nếu cần).
- `products`: Collection.
  - *Fields nhúng*: `tags` (Array of ObjectId), `minified_variants` (Array of Objects: id, size, price, in_stock), `review_stats` (Object: avg_rating, count).
- `product_variants`: Collection độc lập (Quản lý chi tiết giá vốn, barcode...).
- `warehouses`: Collection.
- `stock_levels`: Collection.
- `stock_transactions`: Collection.
- `materials`: Collection.

### 4.4. Nhóm Bán hàng (Sales)
- `carts`: Collection.
  - *Fields nhúng*: `items` (Array of Objects).
- `orders`: Collection.
  - *Fields nhúng*: `items` (Array), `payments` (Array), `status_history` (Array), `shipping_address` (Object).
- `invoices`: Collection độc lập (Phục vụ xuất file PDF, lưu trữ pháp lý).
- `disputes`: Collection độc lập (Quản lý khiếu nại).

### 4.5. Nhóm Marketing & Giao tiếp (Marketing & Communication)
- `campaigns`: Collection.
- `vouchers`: Collection.
- `loyalty_transactions`: Collection độc lập (Lịch sử điểm).
- `reviews`: Collection độc lập.
- `chat_sessions`: Collection.
- `chat_messages`: Collection độc lập.
- `notifications`: Collection (Chứa template/nội dung).
- `user_notifications`: Collection (Chứa trạng thái đọc của user, có TTL Index).
- `blog_posts`: Collection.
