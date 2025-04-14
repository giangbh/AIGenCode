# CafeThu6 - Ứng dụng chia tiền nhóm

## Giới thiệu

CafeThu6 là ứng dụng web giúp quản lý chi tiêu nhóm, tính toán và chia đều khoản tiền giữa các thành viên. Với giao diện đơn giản, trực quan, CafeThu6 giúp việc quản lý tài chính nhóm trở nên dễ dàng và minh bạch.

## Các tính năng chính

### 1. Quản lý chi tiêu
- Thêm, sửa, xóa các khoản chi tiêu
- Chia đều hoặc tùy chỉnh số tiền cho từng người tham gia
- Hiển thị chi tiết chi tiêu với người trả và người tham gia
- Tự động tính toán kết quả chia tiền

### 2. Quản lý quỹ nhóm
- Theo dõi số dư quỹ nhóm hiện tại
- Thêm khoản nộp quỹ từ các thành viên
- Hiển thị lịch sử giao dịch quỹ
- Biểu đồ trực quan hóa tình hình thu chi quỹ

### 3. Quản lý số dư thành viên
- Theo dõi số dư của từng thành viên
- Hiệu năng cao với bảng lưu trữ số dư riêng
- Thiết lập ngưỡng nhắc nhở khi số dư giảm
- Chức năng gửi thông báo nhắc nhở nộp tiền

### 4. Quản lý thành viên
- Thêm, sửa, xóa thành viên trong nhóm
- Lưu trữ thông tin tài khoản ngân hàng
- Tạo mã QR chuyển tiền nhanh
- Phân quyền người dùng (admin/member)

### 5. Chức năng phân quyền người dùng
- **Admin**: Có toàn quyền quản lý hệ thống
- **Member**: Có quyền hạn chế, không thể xóa dữ liệu

### 6. Tích hợp cơ sở dữ liệu đám mây
- Lưu trữ dữ liệu trên Supabase
- Đồng bộ hóa dữ liệu tự động
- Truy cập dữ liệu từ nhiều thiết bị

## Cài đặt và cấu hình

### Yêu cầu hệ thống
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)
- Kết nối internet để truy cập Supabase
- Tài khoản Supabase (miễn phí)

### Cài đặt Supabase
1. Đăng ký tài khoản tại [Supabase](https://supabase.com/)
2. Tạo dự án mới
3. Thực hiện các bước trong [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
4. Cập nhật thông tin kết nối trong file `js/utils/supabase.js`

### Cài đặt phân quyền (Role)
1. Thực hiện các bước trong [apply_role_changes.md](apply_role_changes.md)
2. Chạy file SQL `alter_members_table.sql` trong SQL Editor của Supabase

### Cài đặt quản lý số dư
1. Thực hiện các bước trong [js/migrations/README.md](js/migrations/README.md)
2. Chạy file SQL `js/migrations/create_fund_tables.sql` trong SQL Editor của Supabase

## Sử dụng ứng dụng

### Đăng nhập
- Sử dụng tên thành viên làm tên đăng nhập
- Mật khẩu mặc định: `Cafe` (phân biệt chữ hoa/thường)

### Quản lý chi tiêu
1. Thêm chi tiêu mới với tên, số tiền, ngày và người trả
2. Chọn người tham gia và phương thức chia tiền
3. Xem kết quả tính toán ở phần "Kết quả chia tiền"

### Quản lý quỹ
1. Theo dõi số dư quỹ hiện tại
2. Thêm khoản nộp quỹ từ thành viên
3. Thiết lập ngưỡng nhắc nhở nộp tiền
4. Gửi thông báo nhắc nhở tới thành viên

### Quản lý thành viên
1. Thêm thành viên mới với tên và thông tin tài khoản
2. Chỉnh sửa thông tin tài khoản
3. Xóa thành viên (chỉ admin)

## Đóng góp và phát triển

Dự án mã nguồn mở, chào đón mọi đóng góp. Vui lòng tạo Pull Request hoặc báo cáo lỗi qua mục Issues.

## Giấy phép

CafeThu6 được phát hành dưới giấy phép MIT. 