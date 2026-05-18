# **UTESHOP Admin Design System - "Deep Space" Dark Mode UI (2026)**

## **1. Visual Theme & Atmosphere**

Giao diện Admin của UTESHOP được thiết kế dựa trên ngôn ngữ **"Deep Space" Dark Mode** — một không gian làm việc tối màu, tĩnh lặng và chuyên nghiệp, giúp tập trung tối đa vào dữ liệu. Không giống như phần Storefront mang phong cách "Lavender Dream" thơ mộng và ngập tràn cảm xúc, khu vực quản trị là "trung tâm điều khiển" (Command Center) với sự sắc sảo, chính xác và hiệu suất cao.

Điểm nhấn đặc trưng là nền tối sâu thẩm kết hợp với các bề mặt nổi (surface) màu xanh đen, và các đường viền siêu mỏng (1px border với opacity thấp). Để giữ giao diện không bị nhàm chán, chúng ta sử dụng ánh sáng neon tinh tế (Glow effects) ở những điểm tương tác quan trọng thay vì sử dụng mảng màu lớn.

**Đặc điểm cốt lõi:**
* Hệ thống màu nền Dark Navy / Deep Space (#050a14) giảm mỏi mắt khi làm việc với dữ liệu thời gian dài.
* Kiểu chữ công nghệ: "DM Sans" cho mức độ dễ đọc cao trong UI và "JetBrains Mono" cho dữ liệu, mã số, kỹ thuật.
* Các hiệu ứng phát sáng mờ (Glow) thay thế cho shadow truyền thống trên giao diện tối.
* Hệ thống viền mỏng (Thin transparent borders) giúp phân tách không gian một cách thanh lịch mà không làm giao diện bị "nặng".

## **2. Color Palette & Roles**

### **Background & Surface (Nền và Bề mặt)**

* **Deep Space (Nền chính)** (`--adm-bg`: `#050a14`): Nền thấp nhất của toàn bộ hệ thống.
* **Surface Level 1** (`--adm-surface`: `#0d1526`): Dùng cho Sidebar, Topbar và nền các Card (Widget).
* **Surface Level 2** (`--adm-surface-2`: `#111d36`): Dùng cho các Input, ô dữ liệu nổi bật hoặc khi hover vào danh sách.
* **Borders (Viền)**: 
  * Cấp 1 (`--adm-border`): `rgba(255, 255, 255, 0.07)` - Các đường chia cắt cơ bản.
  * Cấp 2 (`--adm-border-2`): `rgba(255, 255, 255, 0.12)` - Khung viền cho input, button outline.

### **Text & Typography (Màu chữ)**

* **Primary Text** (`--adm-text`: `#e2e8f0`): Chữ chính, tiêu đề, số liệu. Không dùng trắng tinh (white) để tránh chói.
* **Muted Text** (`--adm-text-muted`: `#64748b`): Nhãn, mô tả phụ, text placeholder.
* **Dim Text** (`--adm-text-dim`: `#94a3b8`): Chữ thông tin hỗ trợ, navigation links.

### **Accent & Functional (Màu nhấn và Chức năng)**

* **Indigo Accent** (`--adm-accent`: `#6366f1`): Màu thương hiệu chính của phần Admin, dùng cho nút bấm chính, viền focus, các active state.
* **Accent Glow** (`--adm-accent-glow`: `rgba(99, 102, 241, 0.25)`): Hiệu ứng bóng phát sáng cho các thành phần quan trọng.
* **Semantic Colors**:
  * **Success** (`#10b981`): Đơn hàng thành công, tăng trưởng.
  * **Warning** (`#f59e0b`): Chờ xử lý, tồn kho thấp.
  * **Danger** (`#f43f5e`): Hủy đơn, cảnh báo lỗi.

## **3. Typography Rules**

### **Font Family**

* **UI / Body**: `DM Sans`, sans-serif — Sạch sẽ, hình dáng chữ học thuật và rất dễ đọc trên nền tối.
* **Data / Code / IDs**: `JetBrains Mono`, monospace — Sử dụng cho số liệu (Doanh thu, số lượng), mã đơn hàng (ID), bảng dữ liệu cần căn chỉnh chính xác.

### **Hierarchy (Hệ thống phân cấp)**

| Role | Font | Size | Weight | Line Height | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Page Title | DM Sans | 24px | 600 | 1.20 | Tiêu đề lớn của trang quản trị |
| Card Title | DM Sans | 15px | 500 | 1.40 | Tên của các Widget, biểu đồ |
| Metric Value | JetBrains Mono | 24px - 32px | 600 | 1.20 | Giá trị thống kê lớn (VD: 84.5M ₫) |
| UI Body | DM Sans | 14px | 400 | 1.50 | Nội dung bảng, chữ mô tả thông thường |
| Meta / Label | DM Sans | 12px | 500 | 1.40 | Nhãn phụ, thời gian, tên cột (uppercase) |
| Data ID | JetBrains Mono | 13px | 400 | 1.50 | Mã sản phẩm, mã đơn hàng (Ví dụ: #ORD-123) |

## **4. Component Stylings**

### **Buttons (Nút bấm)**

* **Primary Button**: Nền `#6366f1`, chữ trắng, bo góc `6px` (`--adm-radius-sm`), hover có hiệu ứng glow `box-shadow: 0 0 12px rgba(99, 102, 241, 0.4)`.
* **Outline Button**: Nền trong suốt, viền `rgba(255,255,255,0.12)`, khi hover nền chuyển thành `rgba(255,255,255,0.05)`.
* **Ghost Button / Icon Action**: Không viền, không nền, hover nền đổi thành `rgba(255,255,255,0.08)`.

### **Cards & Widgets**

* Background: `--adm-surface` (`#0d1526`).
* Border: `1px solid var(--adm-border)`.
* Radius: `--adm-radius` (`10px`).
* Shadow: Thường không có shadow trong trạng thái tĩnh (flat dark mode), chỉ dùng shadow khi hover hoặc nổi bật widget.

### **Inputs & Form Controls**

* Background: Nửa trong suốt `rgba(255, 255, 255, 0.03)` hoặc `--adm-surface-2`.
* Border: `1px solid var(--adm-border-2)`.
* Radius: `6px` (`--adm-radius-sm`).
* Trạng thái Focus: Viền sáng lên màu `#6366f1` kèm theo hiệu ứng glow `box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2)`.

### **Tags & Badges**

* Hình thức: Bo góc nhẹ (4px) hoặc bo tròn (pill).
* Background: Luôn dùng màu nền có độ mờ (ví dụ: `rgba(16, 185, 129, 0.12)` cho Success) kết hợp với chữ màu sáng rõ (`#10b981`). Không sử dụng màu solid rực rỡ để làm nền tag.

## **5. Layout & Space (Cấu trúc & Không gian)**

### **Grid & Spacing**

* Sử dụng hệ thống padding/margin chẵn (8px, 16px, 24px, 32px).
* Khoảng cách giữa các Widget (Gap) thường là `20px` hoặc `24px`.

### **Sidebar & Topbar**

* **Sidebar**: Chiều rộng mở rộng là `240px`, chiều rộng thu gọn (collapsed) là `72px`. Có viền bên phải `1px solid var(--adm-border)`.
* **Topbar**: Chiều cao cố định `64px` (`--adm-topbar-h`), có dải viền mỏng phía dưới. Chứa thanh tìm kiếm toàn cục, thông báo, và công cụ tiện ích.

## **6. Do's and Don'ts**

### **Nên (Do)**

* Tận dụng tối đa typography (`JetBrains Mono`) để làm cho các bảng biểu và dữ liệu thống kê nhìn "pro" và dễ theo dõi.
* Dùng các đường line mỏng `rgba(255,255,255,0.07)` để phân tách các khu vực chức năng thay vì đổ nền khác màu.
* Sử dụng bộ icon SVG thống nhất (nét mảnh 1.5px - 2px, đầu bo tròn lincap round) thay vì dùng emoji hay icon mix nhiều style.

### **Không nên (Don't)**

* Không sử dụng shadow đen lớn — trên nền tối nó sẽ trông giống như các mảng bẩn. Hãy dùng viền mỏng hoặc glow shadow màu.
* Không sử dụng thiết kế kính mờ (Backdrop-blur glassmorphism) diện rộng ở khu vực Admin vì nó làm giảm hiệu năng khi render bảng dữ liệu lớn và gây mất tập trung.
* Tuyệt đối tránh sử dụng các emoji text (`🌸`, `📦`) vào giao diện chuẩn hóa.

## **7. Agent Prompt Guide cho Admin UI**

### **Quick Reference**

* Base Background: Deep Space (`#050a14`)
* Surface: (`#0d1526`)
* Primary Action: Indigo (`#6366f1`)
* Fonts: `DM Sans` (UI) / `JetBrains Mono` (Data)
* Radius: 10px (Card), 6px (Button/Input)

### **Example Prompt**

"Tạo một bảng dữ liệu (Data Table) cho trang Admin. Bảng được bọc trong một thẻ Card có nền `--adm-surface`, viền `--adm-border`, bo góc 10px. Các tiêu đề cột (th) dùng font DM Sans chữ nhỏ (12px) in hoa màu `--adm-text-muted`. Dữ liệu số (giá, ID) trong các ô (td) bắt buộc dùng font JetBrains Mono màu `--adm-text`."
