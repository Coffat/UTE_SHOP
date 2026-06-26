# CHƯƠNG 2: MÔ HÌNH HÓA YÊU CẦU

## 2.1. Sơ đồ Use case

### Bảng 2-1. Bảng tác nhân và chức năng trong sơ đồ Use case

| Tác nhân | Chức năng chính |
| :--- | :--- |
| **Khách (Guest)** | Đăng ký tài khoản; duyệt sản phẩm hoa; xem chi tiết sản phẩm; xem danh mục; tìm kiếm & lọc sản phẩm; xem blog; xem đánh giá sản phẩm; tư vấn qua Trợ lý AI; quản lý giỏ hàng (phiên tạm). |
| **Khách hàng (Customer)** | Đăng nhập / Đăng xuất (Email, Google, Facebook); quản lý tài khoản cá nhân & địa chỉ giao hàng; quản lý giỏ hàng – đặt hàng & thanh toán (COD, VNPay, MoMo); áp dụng voucher & điểm thưởng; theo dõi / hủy đơn hàng cá nhân; đánh giá sản phẩm đã mua; quản lý sản phẩm yêu thích (wishlist); chat hỗ trợ & nhận thông báo realtime. |
| **Nhân viên Sales** | Dashboard đơn hàng; xác nhận / chốt / hủy đơn theo quy tắc; quản lý khách hàng; quản lý voucher & điểm thưởng (theo RBAC); quản lý cuộc trò chuyện hỗ trợ khách hàng; quản lý sản phẩm, danh mục, đánh giá (theo phân quyền); xem báo cáo & thống kê (theo phân quyền). |
| **Nhân viên Store Staff** | Dashboard cửa hàng; xem & xử lý đơn chờ chuẩn bị; cập nhật trạng thái đơn (`CONFIRMED` → `READY`); tạo đơn hàng tại quầy (POS); xác nhận thanh toán thủ công; hủy đơn trong phạm vi cho phép. |
| **Nhân viên Warehouse** | Dashboard kho; quản lý tồn kho nguyên liệu; phiếu nhập / xuất kho; quản lý công thức định mức (BOM/Recipe); xem lịch sử giao dịch kho. |
| **Shipper** | Nhận đơn giao hàng; cập nhật trạng thái giao (`DELIVERING` → `COMPLETED`); báo cáo giao thất bại (`DELIVERY_FAILED`); xử lý hoàn hàng (`RETURNED`). |
| **Quản trị viên (Admin)** | Quản lý hệ thống (Dashboard tổng quan, biểu đồ báo cáo); quản lý sản phẩm (CRUD, danh mục, biến thể); quản lý kho & BOM; quản lý đơn hàng toàn hệ thống; quản lý người dùng & phân quyền RBAC; quản lý nhân viên & phân ca (Shift); quản lý tài chính (voucher, chiến dịch, điểm thưởng, báo cáo); quản lý nội dung (blog, cài đặt website, giờ làm việc); giám sát & cấu hình AI chat (Ollama/OpenRouter). |
| **Hệ thống AI** | Tư vấn sản phẩm; tra cứu trạng thái đơn hàng; nhận diện ý định (Intent); gọi tool nghiệp vụ; chuyển giao cuộc trò chuyện cho nhân viên (handoff). |

---

## 2.2. Mô tả chi tiết từng chức năng và từng tác nhân

### 2.2.1. Mô tả tác nhân

| STT | Tác nhân | Vai trò / Công việc |
| :---: | :--- | :--- |
| 1 | **Khách (Guest)** | Người dùng chưa đăng nhập. Được phép: đăng ký tài khoản; xem trang chủ; xem danh sách & chi tiết sản phẩm hoa; tìm kiếm & lọc theo danh mục, giá; xem đánh giá sản phẩm; xem blog; tư vấn qua Trợ lý AI; thêm sản phẩm vào giỏ hàng (lưu theo phiên). |
| 2 | **Khách hàng (Customer)** *(bao gồm quyền của Khách)* | Người dùng đã đăng nhập và xác thực email (OTP). Được phép: đăng nhập / đăng xuất (Email, Google, Facebook); quên mật khẩu / đổi mật khẩu; xem & sửa thông tin cá nhân (họ tên, SĐT, avatar); quản lý địa chỉ (xem danh sách, thêm, sửa, xóa, đặt mặc định); quản lý đơn hàng cá nhân (xem danh sách, chi tiết, hủy khi trạng thái `PENDING` hoặc `CONFIRMED`); giỏ hàng (thêm, xóa, đổi số lượng); thanh toán (COD, VNPay, MoMo); áp dụng voucher & điểm thưởng; đánh giá sản phẩm đã mua thành công (`COMPLETED`); quản lý wishlist; chat hỗ trợ; xem & cấu hình thông báo. |
| 3 | **Nhân viên Sales** | Chịu trách nhiệm chốt đơn và tư vấn khách hàng. Được phép: xem & lọc danh sách đơn hàng; xác nhận đơn (`PENDING` → `CONFIRMED`); cập nhật trạng thái & ghi chú xử lý; hủy đơn theo quy tắc nghiệp vụ; quản lý khách hàng; quản lý voucher, điểm thưởng; CRUD sản phẩm, danh mục, duyệt đánh giá (theo RBAC); chat hỗ trợ khách hàng; xem báo cáo thống kê (theo phân quyền); xem thông báo cá nhân. |
| 4 | **Nhân viên Store Staff** | Chịu trách nhiệm chuẩn bị hàng / cắm hoa tại cửa hàng. Được phép: xem dashboard đơn cần xử lý; cập nhật trạng thái chuẩn bị (`CONFIRMED` → `READY`); tạo đơn hàng tại quầy (POS) với thanh toán CASH/VNPay; xác nhận thanh toán thủ công; hủy đơn trong phạm vi cho phép; xem thông báo cá nhân. |
| 5 | **Nhân viên Warehouse** | Chịu trách nhiệm quản lý kho nguyên liệu. Được phép: xem dashboard kho; quản lý tồn kho nguyên liệu; ghi nhận phiếu nhập / xuất kho; thiết lập & chỉnh sửa công thức BOM (ánh xạ sản phẩm → nguyên liệu); xem lịch sử giao dịch kho; xem thông báo cá nhân. |
| 6 | **Shipper** | Chịu trách nhiệm giao hàng đến khách. Được phép: nhận đơn đã sẵn sàng (`READY`); cập nhật trạng thái đang giao (`DELIVERING`); xác nhận giao thành công (`COMPLETED`); báo cáo giao thất bại (`DELIVERY_FAILED`); xử lý hoàn hàng (`RETURNED`); xem thông báo cá nhân. |
| 7 | **Quản trị viên (Admin)** *(toàn quyền hệ thống)* | Người quản lý cao nhất. Được phép: thống kê tổng thể (doanh thu, đơn hàng, khách hàng, sản phẩm, voucher); CRUD người dùng, nhân viên; gán vai trò & phân quyền RBAC; quản lý sản phẩm, danh mục, biến thể; quản lý kho, BOM, đơn hàng toàn hệ thống; quản lý voucher, chiến dịch marketing, điểm thưởng; phân ca làm việc (Shift) cho nhân viên; quản lý blog & cài đặt hệ thống (thông tin shop, giờ làm việc, cổng thanh toán, cấu hình AI); giám sát cuộc trò chuyện chat; theo dõi hoạt động nhân viên. |
| 8 | **Hệ thống AI** | Tác nhân phụ (system actor). Tự động: phân tích câu hỏi khách hàng; gợi ý sản phẩm; tra cứu đơn hàng theo mã; thực thi tool nghiệp vụ; chuyển giao cho nhân viên khi vượt phạm vi xử lý; lọc nội dung thinking trước khi phản hồi. |

---

### 2.2.2. Mô tả chức năng

#### Bảng 2-2. Bảng mô tả chức năng (phần 1)

| STT | Chức năng | Mô tả |
| :---: | :--- | :--- |
| 1 | Đăng ký tài khoản | Cho phép người dùng tạo tài khoản mới với họ tên, email, mật khẩu, số điện thoại; xác thực email qua OTP. |
| 2 | Đăng nhập | Xác thực người dùng bằng email/mật khẩu hoặc Social Login (Google, Facebook); cấp JWT Access/Refresh Token qua httpOnly cookie. |
| 3 | Đăng xuất | Kết thúc phiên đăng nhập; xóa token và refresh token trong Redis. |
| 4 | Quên mật khẩu | Gửi mã OTP qua email để đặt lại mật khẩu. |
| 5 | Đổi mật khẩu | Cho phép người dùng đã đăng nhập thay đổi mật khẩu (tối thiểu 8 ký tự). |
| 6 | Phân quyền theo vai trò (RBAC) | Kiểm soát truy cập API và giao diện theo vai trò: CUSTOMER, SALES, STORE_STAFF, WAREHOUSE_STAFF, SHIPPER, ADMIN. |
| 7 | Quản lý profile | Cập nhật thông tin cá nhân: họ tên, email, số điện thoại, avatar. |
| 8 | Quản lý nhân viên | Admin tạo, sửa, xóa tài khoản nhân viên; gán vai trò và trạng thái hoạt động. |
| 9 | Quản lý khách hàng | Admin/Sales xem danh sách khách hàng, chi tiết, cập nhật trạng thái, khóa/mở tài khoản. |
| 10 | Duyệt sản phẩm | Hiển thị danh sách sản phẩm hoa với phân trang; tìm kiếm tiếng Việt không dấu; lọc theo danh mục, giá; sắp xếp đa chiều. |
| 11 | Chi tiết sản phẩm | Hiển thị hình ảnh, mô tả, biến thể (variant), giá, tồn kho, thống kê đánh giá. |
| 12 | Quản lý sản phẩm (Admin) | CRUD sản phẩm và biến thể; upload hình ảnh; cập nhật giá, trạng thái hiển thị. |
| 13 | Quản lý danh mục | Tạo, sửa, xóa danh mục sản phẩm; sắp xếp thứ tự hiển thị. |
| 14 | Quản lý giỏ hàng | Thêm, sửa số lượng, xóa sản phẩm trong giỏ; lưu theo phiên (Guest) hoặc theo tài khoản (Customer). |
| 15 | Thanh toán (Checkout) | Tạo đơn hàng từ giỏ; chọn địa chỉ & người nhận; áp dụng voucher/điểm thưởng; chọn phương thức COD, VNPay, MoMo hoặc CASH. |
| 16 | Quản lý đơn hàng (Khách hàng) | Xem lịch sử đơn hàng, chi tiết đơn, lịch sử trạng thái; hủy đơn khi còn trong trạng thái cho phép. |
| 17 | Quản lý đơn hàng (Admin/Staff) | Xem toàn bộ đơn hàng; lọc theo trạng thái; cập nhật vòng đời đơn theo state machine nghiệp vụ. |
| 18 | Tạo đơn tại quầy (POS) | Store Staff tạo đơn hàng trực tiếp tại cửa hàng; thanh toán CASH hoặc VNPay. |

#### Bảng 2-3. Bảng mô tả chức năng (phần 2)

| STT | Chức năng | Mô tả |
| :---: | :--- | :--- |
| 19 | Quản lý voucher | Tạo và quản lý mã giảm giá (% / số tiền / freeship); thiết lập điều kiện, hạn dùng, số lượng. |
| 20 | Quản lý điểm thưởng (Loyalty) | Tích điểm sau đơn thành công & đánh giá; Admin/Sales điều chỉnh điểm; khách dùng điểm khi thanh toán. |
| 21 | Đánh giá sản phẩm | Khách đánh giá sản phẩm đã mua (`COMPLETED`); chấm 1–5 sao, bình luận; Admin/Sales duyệt hiển thị. |
| 22 | Sản phẩm yêu thích (Wishlist) | Thêm/xóa sản phẩm yêu thích; đồng bộ khi đăng nhập. |
| 23 | Chat khách hàng | Giao diện chat realtime (Socket.io) cho khách liên hệ hỗ trợ; khách tạo cuộc trò chuyện. |
| 24 | Chat nhân viên | Giao diện chat cho Sales/Admin nhận và trả lời cuộc trò chuyện khách hàng. |
| 25 | AI Chat Assistant | Trợ lý AI tư vấn sản phẩm, tra cứu đơn hàng; nhận diện intent; tool calling; chuyển giao cho nhân viên. |
| 26 | Quản lý kho nguyên liệu | Warehouse Staff/Admin xem tồn kho; ghi nhận nhập/xuất; theo dõi biến động tồn. |
| 27 | Quản lý BOM (Recipe) | Thiết lập công thức định mức nguyên liệu cho biến thể sản phẩm; tự động trừ kho khi chốt đơn. |
| 28 | Phân ca làm việc (Shift) | Admin tạo, sửa, hủy ca làm; gán nhân viên theo ngày và khung giờ. |
| 29 | Dashboard tổng quan | Trang tổng quan theo vai trò: doanh thu/đơn (Admin, Sales), hàng đợi chuẩn bị (Store Staff), tồn kho (Warehouse). |
| 30 | Báo cáo doanh thu | Báo cáo doanh thu theo ngày/tuần/tháng/năm; biểu đồ tăng trưởng; xuất Excel. |
| 31 | Báo cáo đơn hàng | Thống kê số đơn theo trạng thái; tỷ lệ hủy; sản phẩm bán chạy; nguồn đơn hàng. |
| 32 | Trung tâm thông báo | Thông báo in-app realtime; đánh dấu đã đọc; cấu hình kênh nhận (IN_APP, EMAIL, PUSH, SMS). |
| 33 | Quản lý nội dung & cài đặt | Quản lý blog; cấu hình thông tin shop, giờ làm việc, cổng thanh toán, provider AI (Ollama/OpenRouter). |
