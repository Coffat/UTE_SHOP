# **CHI TIẾT TÍNH NÀNG HỆ THỐNG SHOP HOA 2026 (PHÂN LOẠI THEO ROLE)**

**Các Role trong hệ thống:**

* **Guest (Khách vãng lai):** Người dùng chưa đăng nhập.  
* **User (Khách hàng):** Người dùng đã đăng nhập.  
* **Florist (Thợ cắm hoa):** Nhận đơn cắm, cập nhật tiến độ sản xuất, chụp ảnh bó hoa thành phẩm đối chứng.  
* **Shipper (Nhân viên giao hàng):** Nhận chuyến/lộ trình, cập nhật trạng thái giao, GPS, ảnh bàn giao / giao thất bại tại hiện trường.  
* **Sales (Chốt đơn / Tư vấn):** Xác nhận đơn, tư vấn & báo giá, đổi thông tin khách/slot, xử lý hủy theo rule, hỗ trợ tranh chấp sơ bộ.  
* **Warehouse (Kho / Nguyên liệu):** Phiếu nhập/xuất kho, kiểm tồn, hao hụt; phối hợp BOM khi chốt đơn.  
* **Admin (Quản lý/Chủ shop):** Toàn quyền kiểm soát hệ thống, phê duyệt ngoại lệ, cấu hình chính sách.  
* **AI (Hệ thống Trí tuệ nhân tạo):** Chạy ngầm (background jobs/services) hoặc tương tác trực tiếp.

## **1\. Module Xác Thực & Phân Quyền (Auth & Authorization)**

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Đăng nhập / Đăng ký cơ bản** | Guest, User | Hỗ trợ Email/Password và SĐT (OTP qua maill). |
| **Social Login (SSO)** | Guest, User | Đăng nhập nhanh qua Google, Facebook,. Tự động lấy thông tin cơ bản. |
| **Quên mật khẩu** | Guest | Reset mật khẩu qua email. |
| **Quản lý Role & Phân quyền (RBAC)** | Admin | Cấp quyền chi tiết (View, Edit, Delete, Approve) cho từng module đối với Florist, Shipper, Sales, Warehouse. |
| **Đăng xuất** | User, Florist, Shipper, Sales, Warehouse, Admin | Xóa token/session. |

## **2\. Module Trải Nghiệm Mua Sắm (Shopping Experience)**

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Duyệt Danh mục & Sản phẩm** | Guest, User | Xem danh sách hoa theo Chủ đề (Sinh nhật, Khai trương), Loại hoa, Ngân sách. Lọc & Sắp xếp đa chiều. |
| **Tìm kiếm ngữ nghĩa (Semantic Search)** | Guest, User, AI | **\[Tích hợp AI\]** Tìm kiếm không cần đúng từ khóa. VD: "Hoa màu vàng tặng mẹ", AI tự map ra Hướng dương, Lan hồ điệp... |
| **Xem chi tiết sản phẩm** | Guest, User | Xem hình ảnh chất lượng cao, mô tả nguyên liệu (bao nhiêu cành, loại giấy gói), chính sách giao hàng. |
| **Quản lý Giỏ hàng (Cart)** | Guest, User | Thêm, sửa số lượng, xóa sản phẩm. Lưu trữ giỏ hàng qua session (Guest) hoặc DB (User). |
| **Tư vấn viên AI (AI Assistant)** | Guest, User, AI | **\[Đột phá AI\]** Chat/Voice bot tư vấn mẫu, chốt đơn, giải đáp thắc mắc realtime. Nhận diện ý định (Intent) để điều hướng. |

## **3\. Module Quản Lý Đơn Hàng & Giao Nhận (Order & Logistics)**

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Thanh toán (Checkout)** | Guest, User | Tính tổng tiền, phí ship (dựa trên khoảng cách API Maps), áp dụng mã giảm giá. Hỗ trợ COD, VNPay, Momo, Chuyển khoản (quét mã QR động). |
| **Gắn thông điệp/Thiệp** | User | Nhập nội dung thiệp. **\[Tích hợp AI\]** AI gợi ý lời chúc hay dựa trên dịp tặng và đối tượng. Tạo QR code chứa video/voice. |
| **Theo dõi trạng thái đơn (Order Tracking)** | User | Xem tiến trình: Chờ xác nhận \-\> Đang cắm \-\> Đang giao \-\> Hoàn thành. Hiển thị vị trí Shipper (nếu có tích hợp GPS). |
| **Quản lý vòng đời đơn hàng** | Sales, Florist, Shipper, Admin | Sales xác nhận/chốt; Florist cập nhật đang cắm/hoàn thành sản xuất; Shipper cập nhật đang giao/hoàn tất; Admin ghi đè khi cần. Logic khóa đơn (không cho hủy khi đã cắm). In hóa đơn, phiếu xuất kho. |
| **Giao việc & Chụp ảnh đối chứng** | Florist, Shipper | Florist nhận đơn cắm, chụp ảnh thành phẩm trước bàn giao kho/giao; Shipper nhận chuyến, ảnh đối chứng khi giao (nếu quy trình yêu cầu). |
| **Tối ưu lộ trình giao hàng** | Shipper, Admin | Thuật toán ghép đơn cùng tuyến/cùng khung giờ (Batching); Shipper thực hiện chuyến, Admin cấu hình rule và giám sát. |
| **Lịch sử đơn hàng & Đánh giá** | User | Xem lại đơn cũ, Re-order (đặt lại). Đánh giá (Rating & Review) sản phẩm/dịch vụ. |

## **4\. Module Quản Lý Sản Phẩm & Kho (Catalog & Inventory)**

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Quản lý danh mục & Sản phẩm** | Admin, Sales | Thêm/Sửa/Xóa (CRUD) sản phẩm. Cập nhật giá, hình ảnh, tag. (Sales thường được quyền hạn chế theo RBAC.) |
| **Quản lý Định mức nguyên liệu (BOM)** | Admin | Thiết lập công thức: 1 lẵng A \= 10 hồng \+ 2 baby \+ 1 giỏ. Khi bán 1 lẵng A, kho tự động trừ các nguyên liệu con. |
| **Quản lý Nhập/Xuất kho** | Admin, Warehouse | Ghi nhận phiếu nhập kho (nhập nguyên liệu thô), xuất kho (bán hàng hoặc hao hụt). Cảnh báo tồn kho tối thiểu. |
| **Định giá động (Dynamic Pricing)** | Admin | AI tự động đề xuất giảm giá (Flash sale) cho các lô hoa đã nhập kho quá 2-3 ngày để đẩy hàng nhanh, giảm tỷ lệ vứt bỏ. |

## **5\. Module Marketing & CRM (Customer Relationship Management)**

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Quản lý Khuyến mãi (Voucher/Coupon)** | Admin | Tạo mã giảm giá theo %, số tiền, freeship. Giới hạn số lượng, thời gian, điều kiện áp dụng (đơn tối thiểu). |
| **Sổ tay Sự kiện Cá nhân** | User | User tự lưu các ngày quan trọng (Sinh nhật vợ, kỷ niệm...). Hệ thống tự động nhắc nhở trước X ngày. |
| **CRM Tự động hóa & Dự đoán** | Admin, AI | **\[Đột phá AI\]** AI phân tích lịch sử mua hàng, tự động chạy chiến dịch Email gợi ý mẫu hoa mới cho khách cũ khi sắp đến dịp kỷ niệm của họ. |
| **Chương trình Khách hàng thân thiết (Loyalty)** | User, Admin | Tích điểm sau mỗi đơn hàng thành công. Đổi điểm lấy voucher hoặc trừ thẳng vào tiền thanh toán. Hệ thống hạng thành viên (Bạc, Vàng, Kim Cương). |
| **Đăng ký hoa định kỳ (Subscription)** | User | Cài đặt gói giao hoa tự động hàng tuần/tháng. Thanh toán recurring (tự động trừ tiền nếu thẻ hỗ trợ hoặc nhắc nhở chuyển khoản). |

## **6\. Module Báo Cáo & Thống Kê (Analytics & Reporting)**

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Dashboard Tổng quan** | Admin, Sales, Florist, Shipper, Warehouse | Theo phân quyền: doanh thu/đơn (Sales, Admin), hàng đợi cắm (Florist), chuyến giao (Shipper), tồn nhập xuất (Warehouse). Realtime. |
| **Báo cáo Doanh thu & Lợi nhuận** | Admin | Báo cáo chi tiết theo ngày/tuần/tháng. Phân tích lợi nhuận dựa trên giá vốn hàng bán (COGS \- tính từ BOM). |
| **Báo cáo Hao hụt Kho** | Admin | Thống kê số lượng nguyên liệu phải hủy bỏ (hoa héo, lỗi). Đánh giá hiệu quả của kho. |
| **AI Phân tích Xu hướng (Trend Analysis)** | Admin, AI | **\[Tích hợp AI\]** Dự đoán nhu cầu nguyên liệu cho tháng tới/dịp lễ tới dựa trên dữ liệu lịch sử và xu hướng tìm kiếm, giúp Admin lên kế hoạch nhập hàng chính xác. |

## **7\. Module Wishlist / Yêu thích & Lưu trữ cá nhân**

*Ngành hoa: khách thường xem trước vài ngày, so sánh nhiều mẫu, quay lại dịp khác — wishlist tăng conversion mạnh.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Wishlist / Sản phẩm yêu thích** | User | Lưu sản phẩm yêu thích vào danh sách; đồng bộ đa thiết bị khi đăng nhập. |
| **Wishlist (phiên bản Guest)** | Guest | Lưu tạm theo session/local; gợi ý đăng nhập để đồng bộ. |
| **Bộ sưu tập (Collection)** | User | Gom nhiều sản phẩm vào album/collection (vd: “Sinh nhật”, “Khai trương”) để so sánh và quay lại. |
| **Nhắc khi sản phẩm giảm giá** | User, AI | Theo dõi giá wishlist; push/email/SMS khi có flash sale hoặc giảm theo ngưỡng. |
| **Đã từng xem (Recently viewed)** | Guest, User | Lịch sử xem sản phẩm; hiển thị trên trang chủ/profile để quay lại nhanh. |

## **8\. Module Chọn khung giờ giao & Năng lực giao (Delivery Time Slot)**

*Shop hoa: thời điểm giao cực kỳ quan trọng; cần vượt tracking đơn thuần — có chọn slot, ưu tiên gấp, và chống overbooking.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Chọn ngày & khung giờ giao** | User | Checkout: chọn ngày + slot (vd: 9–11h, 14–16h); hiển thị phí theo slot nếu có. |
| **Giao trong 2h / giao gấp** | User | Tùy chọn ưu tiên giao nhanh (có phụ phí); chỉ hiện khi shop/shipper còn capacity. |
| **Giao đúng giờ sự kiện** | User | Mốc giờ cụ thể (vd: trước 18h tiệc); gắn với đơn và nhắc nội bộ. |
| **Giao ẩn danh (Anonymous delivery)** | User | Không hiện tên người gửi trên thiệp/bó (theo chính sách); ghi chú cho shipper. |
| **Giới hạn đơn theo khung giờ & chống overbooking** | Admin, Sales | Cấu hình capacity tối đa mỗi slot/khu vực; hệ thống từ chối slot đã đầy. (Sales có thể được quyền chỉnh slot theo ca vận hành.) |
| **Tự khóa slot đầy (Auto block)** | AI, Admin | Slot đạt ngưỡng tự ẩn hoặc disable; có thể chờ hàng chờ (waitlist) tùy cấu hình. |

## **9\. Module Sổ địa chỉ đa điểm (Address Book)**

*Người mua hoa hay gửi tặng người khác — cần nhiều địa chỉ và gắn nhãn.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Lưu nhiều địa chỉ** | User | CRUD địa chỉ; chọn nhanh khi checkout. |
| **Giao cho người khác** | User | Tách thông tin người nhận (tên, SĐT) khác người đặt; lưu template. |
| **Tag địa chỉ** | User | Nhãn: Nhà, Công ty, Người yêu, Bố mẹ… để chọn và tìm nhanh. |

## **10\. Module Upload ảnh tham chiếu (Reference Image)**

*Phù hợp ngành hoa + hệ AI: khách gửi mẫu Pinterest/TikTok, shop/AI hiểu tone.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Upload ảnh mẫu tham chiếu** | User | Gắn ảnh vào đơn hoặc yêu cầu báo giá; giới hạn định dạng/kích thước. |
| **Yêu cầu “bó giống ~80%”** | User, Sales, Florist | Ghi chú mức độ tương đồng mong muốn; Sales/Florist xác nhận khả thi và báo giá. |
| **AI phân tích tone / style** | AI, Sales, Florist | **\[Tích hợp AI\]** Gợi ý palette, loại hoa, style gói; hỗ trợ Sales/Florist báo giá và chốt thiết kế. |

## **11\. Module Tự thiết kế bó hoa (Build Your Bouquet / Custom Bouquet Builder)**

*Killer feature nếu làm tốt: user cấu hình, hệ thống tính BOM và giá.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Builder: loại hoa, số lượng, giấy gói, tone màu, phụ kiện, thiệp** | User | UI step-by-step hoặc canvas; rule hợp lệ (vd: tối thiểu số cành). |
| **Preview realtime** | User | Render preview (ảnh/ghép layer) khi đổi lựa chọn. |
| **Tự tính BOM từ cấu hình** | AI, Admin | Map lựa chọn user → danh mục nguyên liệu; trừ kho theo BOM khi chốt đơn. |
| **Tự tính giá** | Admin, AI | Giá theo BOM + phụ kiện + phí thiết kế; Admin chỉnh margin/rule. |

## **12\. Module Hiển thị tồn kho thời gian thực (Real-time Stock Visibility)**

*Hoa biến động nhanh — UX phải nói rõ “còn bao nhiêu” / “hết hôm nay” / “đặt trước”.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Hiển thị số lượng còn (vd: “Chỉ còn 3 bó”)** | Guest, User | Badge/label theo ngưỡng; tránh oversell khi gần hết. |
| **Thông báo hết hàng theo ngày/nguyên liệu** | Guest, User | VD: “Tulip hôm nay đã hết”; gợi ý sản phẩm thay thế. |
| **Đặt trước cho ngày mai / slot sau** | User | Cho phép đặt khi đủ nguyên liệu dự kiến; gắn với module slot giao. |
| **Cấu hình ngưỡng hiển thị & message** | Admin | Bật/tắt hiện số lượng chính xác vs. dạng “còn ít/còn nhiều”. |

## **13\. Module Trung tâm thông báo (Notification Center)**

*Bổ sung cho reminder CRM: đa kênh + đa sự kiện vòng đời đơn.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Trung tâm thông báo in-app** | User | Danh sách thông báo, đã đọc/chưa đọc, deep link vào đơn/khuyến mãi. |
| **Push notification** | User | Web push / app push (nếu có app); user cấp quyền. |
| **Email thông báo** | User | Template theo sự kiện; unsubscribe theo loại. |
| **SMS** | User | OTP, trạng thái đơn, shipper đang tới (tuân thủ quy định spam). |
| **Zalo OA** | User, Admin | Gửi tin qua Official Account; template ZNS nếu tích hợp. |
| **Sự kiện kích hoạt** | AI, Admin | Đơn xác nhận; shipper đang tới; hoa sắp giao; voucher sắp hết hạn; reminder sự kiện (sinh nhật/kỷ niệm). |

## **14\. Module Hủy đơn, Đổi thông tin & Hoàn tiền (Refund / Cancellation)**

*Thực tế vận hành: hủy, đổi địa chỉ, hoàn tiền, giao thất bại, người nhận từ chối.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Hủy đơn theo trạng thái** | User, Sales, Florist, Admin | Rule theo mốc (chưa cắm: User/Sales; đã cắm: Florist/Admin tùy quy trình; ngoại lệ Admin). |
| **Đổi địa chỉ / thời gian giao** | User, Sales, Shipper | Trong khung cho phép; Sales cập nhật hệ thống; Shipper nhận đồng bộ lộ trình/slot. |
| **Luồng hoàn tiền (Refund)** | User, Admin | Trạng thái refund; tích hợp cổng thanh toán hoặc hoàn thủ công. |
| **Giao thất bại / Người nhận không nhận** | Shipper, Admin | Shipper ghi nhận tại hiện trường (lý do, ảnh); Admin áp chính sách hoàn/giao lại. |
| **Upload chứng cứ & xử lý tranh chấp** | User, Sales, Shipper, Admin | Ảnh/video, chat ticket; Sales hỗ trợ đối thoại; Shipper bổ sung chứng từ giao; Admin quyết định cuối. |

## **15\. Module CMS & Trang đích (Landing Page Builder)**

*Giảm phụ thuộc dev: banner, section homepage, campaign lễ, blog.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **Quản lý Banner & hero** | Admin | Kéo thả hoặc form: hình, link, thời gian hiển thị, thứ tự. |
| **Homepage sections (block builder)** | Admin | Section: sản phẩm nổi bật, collection, testimonial, countdown sale. |
| **Campaign lễ (20/10, Valentine, 8/3, Mother’s Day…)** | Admin | Trang landing riêng; gắn voucher và tracking UTM. |
| **Blog / tin tức** | Admin | Editor, tag, lên lịch publish. |

## **16\. Module SEO (Rất quan trọng cho traffic tự nhiên)**

*Từ khóa dạng “hoa sinh nhật”, “hoa khai trương”, “hoa tulip”, “shop hoa gần đây” — cần nền tảng SEO đầy đủ.*

| Tính năng | Role | Mô tả Business Logic & UX |
| :---- | :---- | :---- |
| **SEO meta (title, description, OG)** | Admin | Per page/sản phẩm/danh mục/blog; preview SERP. |
| **Schema markup (JSON-LD)** | AI, Admin | Product, BreadcrumbList, LocalBusiness (nếu có cửa hàng); validate. |
| **Sitemap & robots** | Admin, AI | Sinh sitemap XML định kỳ; robots.txt; ping search console nếu cấu hình. |
| **Canonical URL** | Admin | Tránh duplicate (filter, pagination, bản in). |
| **Blog SEO & internal linking** | Admin, AI | Slug, heading; gợi ý link nội bộ tới SP/danh mục liên quan. |

