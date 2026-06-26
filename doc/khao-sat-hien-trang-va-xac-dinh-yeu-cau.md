# KHẢO SÁT HIỆN TRẠNG VÀ XÁC ĐỊNH YÊU CẦU

## 1.1. Phân tích hiện trạng

Hiện nay, các cửa hàng hoa truyền thống thường bán trực tiếp tại cửa hàng; khách hàng phải đến tận nơi để chọn và mua. Điều này gây bất tiện trong những trường hợp cần đặt hoa gấp, gửi hoa cho người thân ở xa hoặc muốn tham khảo nhiều mẫu mã trước khi quyết định. Một số cửa hàng đã triển khai bán hàng qua mạng xã hội (Facebook, Zalo), nhưng chưa có hệ thống quản lý tập trung, dẫn đến tình trạng:

- Khó theo dõi đơn hàng, tiến độ cắm hoa và tồn kho nguyên liệu theo thời gian thực.
- Thông tin sản phẩm rời rạc, thiếu hình ảnh, mô tả nguyên liệu và công thức định mức (BOM).
- Chưa có tích hợp thanh toán trực tuyến (VNPay, MoMo) và quy trình giao nhận có phân vai (Sales – Store Staff – Shipper).
- Thiếu tính năng chăm sóc khách hàng như đánh giá, khuyến mãi, điểm thưởng, thông báo đa kênh và tư vấn trực tuyến.

Vì vậy, việc xây dựng hệ thống website thương mại điện tử chuyên biệt cho cửa hàng hoa **UTESHOP** là cần thiết nhằm nâng cao trải nghiệm mua sắm, quản lý hiệu quả toàn bộ chuỗi vận hành (từ kho nguyên liệu, cắm hoa, giao hàng đến chăm sóc khách hàng) và mở rộng kinh doanh trên nền tảng số.

---

## 1.2. Phân tích yêu cầu

### 1.2.1. Yêu cầu chức năng

Hệ thống UTESHOP phân quyền theo các vai trò: **Guest** (khách vãng lai), **CUSTOMER** (khách hàng), **SALES** (chốt đơn/tư vấn), **STORE_STAFF** (chuẩn bị hàng/cắm hoa), **WAREHOUSE_STAFF** (quản lý kho), **SHIPPER** (giao hàng) và **ADMIN** (quản trị viên).

#### A. Đối với Khách hàng (Guest / Customer)

**Xác thực và quản lý tài khoản**

- Đăng ký, đăng nhập, đăng xuất; xác thực email bằng mã OTP gửi qua email.
- Đăng nhập nhanh qua Google, Facebook (Social Login).
- Quên mật khẩu và đặt lại mật khẩu qua OTP email.
- Cập nhật hồ sơ: họ tên, số điện thoại, avatar; đổi mật khẩu.

**Quản lý địa chỉ giao hàng**

- Thêm, sửa, xóa nhiều địa chỉ; gắn nhãn (Nhà, Văn phòng…); đặt một địa chỉ mặc định.
- Tách thông tin người nhận (tên, SĐT, ghi chú giao hàng) khi gửi hoa tặng người khác.

**Duyệt – tìm kiếm – lọc sản phẩm hoa**

- Xem danh sách sản phẩm theo danh mục, chủ đề; lọc theo khoảng giá, trạng thái; sắp xếp đa chiều.
- Tìm kiếm theo từ khóa có hỗ trợ tiếng Việt không dấu; xem chi tiết sản phẩm (hình ảnh, mô tả, biến thể, giá).
- Tư vấn qua **Trợ lý AI** (chat): gợi ý sản phẩm, tra cứu đơn hàng, chuyển giao cho nhân viên khi cần.

**Giỏ hàng và đặt hàng**

- Thêm, cập nhật số lượng, xóa sản phẩm trong giỏ; lưu giỏ theo phiên (Guest) hoặc theo tài khoản (Customer).
- Tạo đơn hàng từ giỏ: chọn địa chỉ giao, thông tin người nhận, phương thức thanh toán, ghi chú/thiệp.
- Áp dụng mã giảm giá (voucher) và điểm thưởng (loyalty points) khi thanh toán.

**Thanh toán**

- Hỗ trợ **COD** (thanh toán khi nhận hàng), **VNPay**, **MoMo** và **CASH** (thanh toán tại quầy).
- Tạo giao dịch thanh toán, xử lý callback/IPN từ cổng thanh toán; hiển thị kết quả thanh toán.

**Theo dõi đơn hàng**

- Xem tiến trình đơn: `PENDING` → `CONFIRMED` → `READY` → `DELIVERING` → `COMPLETED`.
- Hỗ trợ các trạng thái ngoại lệ: `CANCELLED`, `DELIVERY_FAILED`, `RETURNED`.
- Mã đơn hàng theo định dạng `UTE{ngày}-{số thứ tự}-{phương thức thanh toán}`.

**Đánh giá sản phẩm**

- Chỉ được đánh giá sản phẩm đã mua; thang điểm 1–5 sao kèm nội dung bình luận.

**Sản phẩm yêu thích (Wishlist / Favorites)**

- Thêm, xóa sản phẩm yêu thích; đồng bộ khi đăng nhập.

**Tin nhắn hỗ trợ**

- Chat trực tiếp với nhân viên hỗ trợ qua Socket.io; nhận thông báo tin nhắn mới theo thời gian thực.

**Trung tâm thông báo**

- Xem danh sách thông báo in-app (đơn hàng, khuyến mãi…); đánh dấu đã đọc; cấu hình kênh nhận thông báo (IN_APP, EMAIL, PUSH, SMS).

#### B. Đối với Nhân viên (Staff)

Hệ thống phân nhân viên theo vai trò chuyên môn:

**SALES (Chốt đơn / Tư vấn)**

- Duyệt, lọc danh sách đơn hàng theo trạng thái; xác nhận/chốt đơn.
- Cập nhật tiến trình đơn hàng; ghi chú xử lý; hủy đơn theo quy tắc nghiệp vụ.
- Quản lý khách hàng, voucher, điểm thưởng (theo phân quyền RBAC).
- Hỗ trợ khách hàng qua module Chat.

**STORE_STAFF (Chuẩn bị hàng / Cắm hoa)**

- Xem dashboard đơn cần xử lý; cập nhật trạng thái chuẩn bị hàng (`CONFIRMED` → `READY`).
- Tạo đơn hàng tại quầy (POS); hủy đơn trong phạm vi cho phép.

**WAREHOUSE_STAFF (Kho / Nguyên liệu)**

- Quản lý tồn kho nguyên liệu; phiếu nhập kho, xuất kho.
- Quản lý công thức định mức (BOM/Recipe): ánh xạ sản phẩm → nguyên liệu; tự động trừ kho khi chốt đơn.
- Xem lịch sử giao dịch kho.

**SHIPPER (Giao hàng)**

- Nhận đơn giao; cập nhật trạng thái `DELIVERING` → `COMPLETED`.
- Báo cáo giao thất bại (`DELIVERY_FAILED`); xử lý giao lại hoặc hoàn hàng (`RETURNED`).

**Chung cho nhân viên**

- Quản lý ca làm việc (Shift): Admin phân ca, gán nhân viên theo ngày/giờ.
- Xem và cấu hình thông báo cá nhân; cập nhật hồ sơ.

#### C. Đối với Quản trị viên (Admin)

**Quản trị người dùng và phân quyền (RBAC)**

- Tạo, sửa, khóa/mở khóa tài khoản nhân viên và khách hàng.
- Gán vai trò: `CUSTOMER`, `SALES`, `STORE_STAFF`, `WAREHOUSE_STAFF`, `SHIPPER`, `ADMIN`.
- Phân quyền truy cập theo module (View, Edit, Delete, Approve).

**Quản lý sản phẩm và danh mục**

- CRUD sản phẩm, danh mục, biến thể (variant); upload hình ảnh.
- Quản lý công thức BOM gắn với biến thể sản phẩm.

**Quản lý khuyến mãi và marketing**

- CRUD voucher (giảm %, giảm tiền, freeship); giới hạn số lượng, thời hạn, điều kiện áp dụng.
- Quản lý chương trình điểm thưởng, chiến dịch marketing.
- Quản lý đánh giá sản phẩm (duyệt/ẩn).

**Quản lý nội dung**

- Quản lý blog/tin tức; cấu hình thông tin website, giờ làm việc cửa hàng.
- Cấu hình trợ lý AI (provider Ollama/OpenRouter, model, prompt).

**Thống kê – báo cáo**

- Dashboard tổng quan: doanh thu, số đơn, tỷ lệ hủy, sản phẩm bán chạy.
- Báo cáo theo kỳ (ngày/tuần/tháng/năm); biểu đồ doanh thu, phân bổ danh mục, nguồn đơn hàng.
- Xuất dữ liệu báo cáo (Excel).

**Quản lý nhân viên và ca làm**

- CRUD nhân viên; phân ca làm việc (Shift) theo ngày, gán nhân viên vào ca.
- Theo dõi hoạt động nhân viên trong hệ thống.

**Nền tảng dữ liệu chính:** `users`, `products`, `productvariants`, `orders`, `carts`, `payments`, `paymenttransactions`, `reviews`, `vouchers`, `materials`, `recipes`, `stocktransactions`, `notifications`, `conversations`, `messages`, `addresses`, `shifts`.

#### D. Yêu cầu liên quan đến Quy tắc ràng buộc và Ràng buộc dữ liệu

- Giá sản phẩm, phí vận chuyển, tổng tiền đơn hàng, số lượng phải ≥ 0; số lượng đặt hàng tối thiểu = 1.
- Đánh giá sản phẩm: rating từ 1 đến 5.
- Mật khẩu đăng ký tối thiểu 6 ký tự; mật khẩu mới khi đổi mật khẩu tối thiểu 8 ký tự.
- OTP xác thực: đúng 6 chữ số, có thời hạn.
- Giờ kết thúc ca làm (`endTime`) phải sau giờ bắt đầu (`startTime`).
- Ràng buộc duy nhất (MongoDB indexes): `email`; `orderCode`; mỗi khách hàng chỉ có một địa chỉ mặc định (`customer + isDefault`); mỗi biến thể sản phẩm chỉ gắn một công thức BOM.
- Chuyển trạng thái đơn hàng tuân theo máy trạng thái (state machine) đã định nghĩa; không cho phép chuyển trạng thái tùy ý.
- Tham chiếu: business rules trong `orderStatusGroups`, schema Mongoose và tài liệu `mongodb_schema_design.md`.

---

### 1.2.2. Yêu cầu phi chức năng

#### 1. Hiệu năng

- Thời gian phản hồi của các API cốt lõi (danh sách sản phẩm, giỏ hàng, đặt hàng) dưới 500ms trong điều kiện tải bình thường.
- Các trang giao diện người dùng phải tải và hiển thị hoàn chỉnh trong vòng dưới 3 giây trên mạng 4G.
- Tối ưu truy vấn MongoDB: sử dụng indexes, embedding dữ liệu đơn hàng (items, statusHistory) để giảm số lần truy vấn.
- Sử dụng **Redis** làm bộ nhớ đệm (cache) và lưu refresh token, giảm tải database.
- Tối ưu tải tài nguyên Frontend: Vite build, lazy loading hình ảnh, Tailwind CSS tree-shaking.
- Rate limiting toàn cục: 200 request/phút cho API; giới hạn riêng cho đăng nhập (5 lần/15 phút) và quên mật khẩu (3 lần/15 phút).

#### 2. Bảo mật

- **Xác thực API:** JWT Access Token và Refresh Token lưu trong httpOnly cookie; refresh token quản lý qua Redis với TTL.
- **Mã hóa mật khẩu:** Sử dụng `bcryptjs` (salt rounds = 10).
- **Phân quyền (RBAC):** Middleware `authenticate` + `authorize` kiểm tra vai trò trước khi truy cập endpoint.
- **Chống tấn công:** Helmet (HTTP security headers), CORS whitelist, `express-mongo-sanitize` (chống NoSQL injection), `express-rate-limit`, giới hạn kích thước payload (10KB).
- **Quản lý Token:** Cơ chế Refresh Token với rotation; lưu trữ trong Redis theo từng phiên.
- **Xác thực OTP:** Hỗ trợ xác thực đăng ký và đặt lại mật khẩu bằng mã OTP gửi qua email (Nodemailer).
- **Thanh toán:** Xác minh chữ ký IPN/callback từ VNPay và MoMo trước khi cập nhật trạng thái thanh toán.

#### 3. Khả dụng và Tin cậy

- **Toàn vẹn giao dịch thanh toán:** Khi thanh toán MoMo/VNPay thất bại, hệ thống không xác nhận thanh toán; đơn hàng giữ trạng thái chờ xử lý theo quy trình nghiệp vụ.
- **Quản lý tồn kho:** Tự động trừ kho nguyên liệu theo BOM khi chốt đơn; kiểm tra tồn kho trước khi xác nhận.
- **Thông báo real-time:** Cung cấp thông báo trạng thái đơn hàng, tin nhắn chat qua **Socket.io**; event bus nội bộ (`AppEvent`) điều phối notification orchestrator.
- **Khả năng phục hồi:** Client Socket.io tự động kết nối lại khi mất kết nối.
- **Giám sát:** Endpoint health check (`GET /`) trả về trạng thái API; kết nối MongoDB và Redis được khởi tạo khi server start.

#### 4. Khả năng sử dụng

- **Tính nhất quán UI:** Giao diện tuân thủ hệ thống thiết kế thống nhất với bảng màu chủ đạo tím/lavender (Material Design 3 tokens) trên mọi trang.
- **Thiết kế đáp ứng (Responsive):** Giao diện hoạt động trên thiết bị di động, tablet và máy tính; sử dụng Tailwind CSS 4.
- **Ngôn ngữ:** Giao diện và nội dung chính bằng Tiếng Việt; hỗ trợ tìm kiếm tiếng Việt không dấu.
- **Phản hồi tức thì:** Toast notifications và loading states cho các hành động tương tác (thêm giỏ hàng, đặt hàng, cập nhật profile).
- **Trợ lý AI:** Widget chat tư vấn sản phẩm tích hợp trên storefront; hỗ trợ chuyển giao cho nhân viên khi cần.

#### 5. Bảo trì và kiểm thử

- **Kiến trúc mã nguồn:** Backend theo mô hình modular (Controller – Service – Repository); Frontend theo kiến trúc component-based kết hợp feature-based (Redux Toolkit slices).
- **Tài liệu hóa:** Tài liệu kiến trúc (`architecture.md`), schema MongoDB (`mongodb_schema_design.md`), sơ đồ ERD/Class Diagram và API docs.
- **Kiểm thử đơn vị:** Unit tests sử dụng Node.js Test Runner (`node --import tsx --test`) cho logic nghiệp vụ: chuyển trạng thái đơn hàng, AI intent, chat permissions, tìm kiếm sản phẩm, voucher, báo cáo…
- **Quản lý cấu hình:** Biến môi trường qua `.env` (database URI, JWT secret, API keys VNPay/MoMo, cấu hình AI provider).
- **Công nghệ triển khai:** Frontend (React 19 + Vite 7 + TypeScript); Backend (Node.js + Express.js + TypeScript); Database (MongoDB + Redis).

---

## 1.3. Quy trình tác nghiệp

### 1.3.1. Quy trình mua hoa của khách hàng

Khách hàng truy cập website UTESHOP, duyệt danh mục sản phẩm hoa theo chủ đề (sinh nhật, khai trương…), loại hoa hoặc ngân sách. Khách có thể tìm kiếm sản phẩm, nhận tư vấn qua Trợ lý AI hoặc chat với nhân viên. Sau khi chọn được sản phẩm ưng ý, khách thêm vào giỏ hàng và tiến hành thanh toán (checkout): nhập thông tin người nhận, chọn địa chỉ giao hàng, áp dụng mã giảm giá/điểm thưởng (nếu có), chọn phương thức thanh toán (COD, VNPay, MoMo) và xác nhận đơn hàng.

Hệ thống ghi nhận đơn ở trạng thái `PENDING`, tạo mã đơn hàng và gửi thông báo xác nhận. Nếu thanh toán online, khách được chuyển hướng đến cổng thanh toán; hệ thống xử lý callback để cập nhật trạng thái thanh toán. Nếu sản phẩm hết hàng hoặc nguyên liệu không đủ (theo BOM), hệ thống thông báo và gợi ý sản phẩm thay thế. Khách hàng có thể theo dõi tiến trình đơn hàng qua trang "Đơn hàng của tôi" hoặc hỏi Trợ lý AI bằng mã đơn.

### 1.3.2. Quy trình tra cứu thông tin đơn hàng của khách hàng

Khách hàng đăng nhập tài khoản và chọn chức năng "Đơn hàng của tôi" (hoặc tra cứu qua Trợ lý AI với mã đơn hàng). Hệ thống truy xuất từ MongoDB và hiển thị: mã đơn hàng, ngày đặt, danh sách sản phẩm (tên, số lượng, đơn giá), tổng tiền, khuyến mãi áp dụng, phương thức thanh toán, trạng thái thanh toán và trạng thái đơn hàng hiện tại (`PENDING` – Chờ xác nhận, `CONFIRMED` – Đã xác nhận, `READY` – Sẵn sàng giao, `DELIVERING` – Đang giao, `COMPLETED` – Hoàn tất, `CANCELLED` – Đã hủy). Lịch sử chuyển trạng thái được lưu trong `statusHistory` để khách theo dõi chi tiết từng bước.

### 1.3.3. Quy trình quản lý sản phẩm và kho của nhân viên

**Quản lý sản phẩm (Admin / Sales):** Nhân viên đăng nhập portal quản trị, thực hiện CRUD sản phẩm và danh mục: tên, mô tả, hình ảnh, giá, biến thể. Sử dụng tìm kiếm để tránh trùng lặp khi nhập liệu.

**Quản lý kho (Warehouse Staff / Admin):** Khi lô nguyên liệu mới nhập về, nhân viên kho ghi nhận phiếu nhập, cập nhật số lượng tồn. Thiết lập công thức BOM cho từng biến thể sản phẩm (ví dụ: 1 bó hồng = 10 bông hồng + 2 bông baby + 1 giấy gói). Khi đơn hàng được chốt, hệ thống tự động trừ nguyên liệu theo BOM. Nhân viên kho theo dõi cảnh báo tồn kho tối thiểu và ghi nhận phiếu xuất/hao hụt.

### 1.3.4. Quy trình bán hàng và xử lý đơn của nhân viên

Khi có đơn hàng mới (`PENDING`), **Sales** kiểm tra thông tin, xác nhận đơn (`CONFIRMED`) hoặc hủy nếu không hợp lệ. **Store Staff** nhận đơn đã xác nhận, tiến hành cắm hoa/chuẩn bị hàng và cập nhật trạng thái `READY`. **Shipper** nhận hàng, giao đến địa chỉ khách (`DELIVERING`) và xác nhận hoàn tất (`COMPLETED`). Nếu giao thất bại (khách không nhận, sai địa chỉ), Shipper báo cáo `DELIVERY_FAILED`; Admin/Sales xử lý giao lại hoặc hoàn hàng (`RETURNED`) theo chính sách. Đối với đơn tại quầy, Store Staff có thể tạo đơn trực tiếp (POS) với thanh toán CASH/VNPay.

Quy tắc khóa đơn: không cho hủy khi đơn đã chuyển sang giai đoạn chuẩn bị/giao hàng (trừ Admin xử lý ngoại lệ). Mỗi lần chuyển trạng thái đều ghi vào `statusHistory` kèm người thực hiện và ghi chú.

### 1.3.5. Quy trình quản lý tài khoản của quản trị viên

**Admin** là vai trò quản lý cao nhất, có toàn quyền đối với hệ thống UTESHOP. Khi có nhân viên mới, Admin tạo tài khoản và phân quyền theo vai trò (`SALES`, `STORE_STAFF`, `WAREHOUSE_STAFF`, `SHIPPER`). Admin phân ca làm việc (Shift) cho nhân viên theo ngày. Để đảm bảo an toàn, Admin có thể khóa tài khoản hoặc đặt lại mật khẩu khi nhân viên nghỉ việc. Admin giám sát hoạt động qua dashboard, báo cáo và nhật ký hoạt động nhân viên; cấu hình chính sách cửa hàng (giờ làm việc, thông tin liên hệ, cài đặt AI, cổng thanh toán).

### 1.3.6. Quy trình thống kê tình hình hoạt động của cửa hàng

Chức năng thống kê giúp Admin và Sales nắm bắt tình hình kinh doanh. Hệ thống tự động tổng hợp: doanh thu theo ngày/tuần/tháng/năm; số đơn hàng theo trạng thái; sản phẩm bán chạy; phân bổ doanh thu theo danh mục; nguồn đơn hàng; tỷ lệ tăng trưởng so với kỳ trước. Admin truy cập trang Báo cáo (`/admin/reports`), chọn kỳ thống kê; hệ thống hiển thị kết quả dưới dạng bảng biểu, biểu đồ (Recharts) và cho phép xuất Excel. Dashboard tổng quan (`/admin/dashboard`) cung cấp số liệu realtime cho từng vai trò: doanh thu/đơn (Admin, Sales), hàng đợi chuẩn bị (Store Staff), tồn kho nhập xuất (Warehouse Staff).
