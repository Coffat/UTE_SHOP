# **UTESHOP Design System \- Neo-Glassmorphism Pastel Edition (2026)**

## **1\. Visual Theme & Atmosphere**

Giao diện của UTESHOP được định vị như một "Digital Floral Boutique" (Cửa hàng hoa kỹ thuật số) — nhẹ nhàng, thơ mộng và tràn đầy cảm xúc. Toàn bộ trải nghiệm được xây dựng trên nền tảng "Lavender Dream" (\#fbf8ff), gợi lên cảm giác về những cánh hoa mềm mại thay vì một trang thương mại điện tử khô khan. UTESHOP không chạy theo sự rực rỡ của công nghệ truyền thống mà chọn sự tĩnh lặng đầy tinh tế, mang lại cảm giác tin tưởng như một người bạn tâm giao am hiểu về cái đẹp.

Điểm nhấn đặc trưng là sự kết hợp giữa hiệu ứng **Neo-glassmorphism** (kính mờ hiện đại) và bảng màu Tím Pastel. Các thành phần giao diện không chỉ đơn thuần là các khối màu, mà là những lớp kính mờ ảo có độ nhòe (backdrop-blur) cao, tạo cảm giác về chiều sâu và sự xuyên thấu như những giọt sương trên cánh hoa. Kết hợp với kiểu chữ Serif cổ điển cho tiêu đề, UTESHOP truyền tải thông điệp "Trao gửi chân tình" một cách sâu sắc và sang trọng.

Điều làm nên sự khác biệt của UTESHOP chính là hệ màu trung tính ấm (Warm Neutrals). Mọi sắc xám đều có ánh tím nhẹ (\#4a3b52, \#7e6e8c) — tuyệt đối không sử dụng xám xanh lạnh. Các đường viền có màu kem oải hương nhạt với độ trong suốt, tạo nên một không gian sống động, hiện đại nhưng vẫn mang hơi thở cổ điển của năm 2026\.

**Đặc điểm cốt lõi:**

* Nền Lavender Dream (\#fbf8ff) thay thế cho màu trắng tinh khiết, giảm mỏi mắt và tăng tính thẩm mỹ.  
* Kiểu chữ UTESHOP: Serif (Cormorant Garamond) cho cảm xúc, Sans (Quicksand) cho tiện dụng.  
* Hiệu ứng Kính (Glassmorphism): Độ mờ 70%, độ nhòe 20px-40px, viền trắng mỏng 1px.  
* Sắc tím Pastel (\#c084fc) làm điểm nhấn thương hiệu — nhẹ nhàng nhưng rực rỡ.  
* Hệ thống bóng đổ dạng vòng (Ring-based shadow) kết hợp với khuếch tán mềm (Soft diffusion).  
* Nhịp độ tạp chí (Magazine pacing) với khoảng cách các phần rộng rãi, thoáng đãng.

## **2\. Color Palette & Roles**

### **Primary (Màu chính)**

* **Deep Plum (Tím Mận)** (\#311b92): Màu chữ chính và tiêu đề — không phải đen thuần túy mà là một sắc tím cực đậm, mang lại sự sang trọng và độ tương phản tuyệt vời.  
* **Dreamy Purple (Tím Pastel)** (\#c084fc): Màu thương hiệu cốt lõi — dùng cho các nút CTA chính, các khoảnh khắc quan trọng.  
* **Soft Amethyst** (\#e9d5ff): Biến thể nhạt của màu thương hiệu, dùng cho các nút phụ và vùng nhấn yếu.

### **Secondary & Accent (Màu phụ & Điểm nhấn)**

* **Petal Pink (Hồng Cánh Hoa)** (\#fbcfe8): Dùng cho các trạng thái khuyến mãi hoặc các loài hoa đặc biệt.  
* **Safe Mint (Xanh Mint)** (\#d1fae5): Màu cho trạng thái thành công hoặc hoa tươi nhập mới — duy trì sự cân bằng tự nhiên.

### **Surface & Background (Bề mặt & Nền)**

* **Lavender Mist** (\#fbf8ff): Nền trang chính — màu kem tím cực nhạt.  
* **Glass Surface** (rgba(255, 255, 255, 0.7)): Bề mặt kính mờ cho thẻ và container.  
* **Pure Ivory** (\#ffffff): Dùng cho các thành phần cần độ tương phản cao nhất.  
* **Plum Surface** (\#2d1b4b): Nền cho các section chế độ tối (dark mode) hoặc footer.

### **Neutrals & Text (Màu trung tính & Chữ)**

* **Midnight Purple** (\#4a3b52): Chữ body text chính trên nền sáng.  
* **Dusk Gray** (\#7e6e8c): Chữ phụ, ghi chú và metadata.  
* **Crystal Border** (rgba(243, 232, 255, 0.5)): Đường viền kính mờ ảo.

## **3. Typography Rules**

### **Font Family**

* **Headline (Tiêu đề)**: Cormorant Garamond — Mang tính biểu tượng, thơ mộng, nghệ thuật và gần gũi.  
* **Body / UI (Nội dung)**: Quicksand — Thân thiện, nét chữ bo tròn gọn gàng, ấm áp.  
* **Label / Price**: Inter — Chuẩn xác cho các con số và nhãn kỹ thuật, độ hiển thị cao.

### **Hierarchy (Hệ thống phân cấp)**

| Role | Font | Size | Weight | Line Height | Notes |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Hero Display | Cormorant Garamond | 64px | 500 hoặc 600 | 1.10 | Tiêu đề chính quyền lực |
| Section Title | Cormorant Garamond | 48px | 500 hoặc 600 | 1.20 | Tiêu đề các mục lớn |
| Sub-heading | Cormorant Garamond | 24px | 600 hoặc 700 | 1.30 | Tên các sản phẩm/danh mục |
| Body Standard | Quicksand | 17px | 400 | 1.60 | Nội dung mô tả (rộng rãi) |
| UI Label | Quicksand | 14px | 600 hoặc 700 | 1.00 | Nhãn nút, menu điều hướng |
| Price Display | Inter | 20px | 600 | 1.20 | Giá tiền nổi bật |

## **4\. Component Stylings**

### **Buttons (Nút)**

**Primary CTA (Pill-shaped)**

* Background: \#c084fc (Dreamy Purple)  
* Text: \#311b92 (Deep Plum)  
* Radius: 9999px  
* Effect: Bóng đổ màu tím nhạt tỏa đều.

**Glass Secondary**

* Background: rgba(255, 255, 255, 0.4)  
* Backdrop-blur: 10px  
* Border: 1px solid rgba(255, 255, 255, 0.5)  
* Text: \#311b92  
* Radius: 16px

### **Cards (Thẻ sản phẩm)**

* Background: rgba(255, 255, 255, 0.7) (Glassmorphism)  
* Backdrop-blur: 20px  
* Radius: 24px (Bo góc rộng)  
* Border: 1px solid rgba(255, 255, 255, 0.6)  
* Shadow: rgba(168, 85, 247, 0.05) 0px 10px 40px  
* Interaction: Khi hover, thẻ lướt nhẹ lên và độ mờ kính tăng lên.

### **Inputs (Ô nhập liệu)**

* Background: rgba(255, 255, 255, 0.8)  
* Radius: 12px  
* Focus: Ring 2px màu \#c084fc.

## **5\. Layout & Spacing**

### **Spacing System**

* Base unit: 8px.  
* Section Spacing: 120px (Tạo sự thông thoáng tối đa).  
* Grid: 4 cột cho Desktop, 1 cột cho Mobile.

### **Principles**

* **Organic Pacing**: Luân chuyển giữa các section nền Lavender Mist và các khối kính mờ để tạo nhịp điệu.  
* **Emotional Whitespace**: Để cho hình ảnh hoa có không gian "thở", không nhồi nhét nội dung.

## **6\. Depth & Elevation (Chiều sâu)**

| Level | Treatment | Use |
| :---- | :---- | :---- |
| Base (L0) | Nền Lavender Mist | Nền tảng hệ thống |
| Layer (L1) | Glass Surface (Blur 20px) | Các thẻ nội dung, Sidebar |
| Float (L2) | Glass Surface (Blur 40px) \+ Shadow | Modals, Tooltips, AI Widget |
| Active (L3) | Ring Shadow 1px | Trạng thái hover/active |

## **7\. Do's and Don'ts**

### **Nên (Do)**

* Sử dụng màu chữ Tím Mận đậm thay cho màu Đen thuần.  
* Duy trì độ nhòe (Backdrop-blur) từ 10px trở lên cho các thành phần kính.  
* Sử dụng bo góc lớn (16px+) để tạo sự mềm mại.  
* Ưu tiên hình ảnh hoa phong cách nghệ thuật, ánh sáng tự nhiên.

### **Không nên (Don't)**

* Không dùng màu xám lạnh hoặc xanh biển đậm.  
* Không dùng góc nhọn 90 độ.  
* Không dùng Gradient quá gắt; chỉ dùng Mesh Gradient mờ ảo.  
* Không để chữ chồng lên vùng ảnh quá phức tạp mà không có lớp kính đệm.

## **8\. Responsive Behavior**

* **Mobile**: Giảm kích thước tiêu đề xuống 32px, chuyển Grid sang 1 cột, các nút bấm giữ kích thước lớn (44px+) để dễ thao tác chạm.  
* **Tablet**: Bố cục 2 cột, duy trì hiệu ứng Glassmorphism.

## **9\. Agent Prompt Guide**

### **Quick Reference**

* Background: Lavender Mist (\#fbf8ff)  
* Brand Accent: Dreamy Purple (\#c084fc)  
* Text: Deep Plum (\#311b92)  
* Style: Neo-glassmorphism (Blur 20px, 1px white border)

### **Example Prompt**

"Tạo một thẻ sản phẩm theo phong cách Neo-glassmorphism trên nền Lavender Mist (\#fbf8ff). Thẻ có độ nhòe backdrop 20px, bo góc 24px, viền trắng mờ. Tiêu đề hoa dùng font Cormorant Garamond màu Deep Plum (\#311b92), giá tiền dùng font Inter."