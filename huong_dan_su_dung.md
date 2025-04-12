# Hướng dẫn sử dụng CafeThu6

## Giới thiệu

CafeThu6 là ứng dụng quản lý chi tiêu nhóm, giúp các thành viên dễ dàng theo dõi, chia sẻ và tính toán chi phí chung. Ứng dụng hỗ trợ quản lý quỹ nhóm, theo dõi chi tiêu và tự động tính toán số tiền cần thanh toán giữa các thành viên.

## Mục lục

1. [Đăng nhập và phân quyền](#1-đăng-nhập-và-phân-quyền)
2. [Quản lý chi tiêu](#2-quản-lý-chi-tiêu)
3. [Quản lý quỹ nhóm](#3-quản-lý-quỹ-nhóm)
4. [Quản lý thành viên](#4-quản-lý-thành-viên)
5. [Kết quả chia tiền](#5-kết-quả-chia-tiền)
6. [Các tính năng khác](#6-các-tính-năng-khác)

## 1. Đăng nhập và phân quyền

### Đăng nhập

1. Khi mở ứng dụng, hệ thống sẽ hiển thị màn hình đăng nhập
2. Nhập tên đăng nhập (tên thành viên của bạn trong nhóm)
3. Nhập mật khẩu (mật khẩu mặc định là "Cafe")
4. Nhấn nút "Đăng nhập"

### Vai trò người dùng

Ứng dụng có hai vai trò người dùng:

- **Admin**: Có toàn quyền trên hệ thống, bao gồm xóa chi tiêu, xóa thành viên và xóa tất cả dữ liệu
- **Member**: Có quyền hạn chế, không thể xóa chi tiêu, xóa thành viên hoặc xóa tất cả dữ liệu

### Đăng xuất

- Để đăng xuất, nhấn vào biểu tượng đăng xuất (biểu tượng log-out) bên cạnh tên người dùng hiện tại

## 2. Quản lý chi tiêu

### Thêm chi tiêu mới

1. Chọn tab "Chi tiêu"
2. Điền thông tin chi tiêu:
   - **Tên chi tiêu**: Nhập tên mô tả chi tiêu (VD: Ăn trưa Bún Chả)
   - **Số tiền (VNĐ)**: Nhập số tiền chi tiêu (VD: 350,000)
   - **Ngày chi tiêu**: Chọn ngày phát sinh chi tiêu
   - **Người trả**: Chọn thành viên đã thanh toán chi tiêu này
   - **Người tham gia**: Chọn những thành viên tham gia chi tiêu này
3. Chọn cách chia chi phí:
   - **Chia đều chi phí**: Bật công tắc này để chia đều chi phí cho tất cả người tham gia
   - **Chia theo số tiền tùy chỉnh**: Tắt công tắc chia đều và nhập số tiền cụ thể cho từng người
4. Nhấn nút "Lưu chi tiêu"

### Sửa chi tiêu

1. Trong danh sách chi tiêu, nhấn vào nút "Sửa" (biểu tượng bút chì) trên chi tiêu muốn sửa
2. Thay đổi thông tin chi tiêu theo nhu cầu
3. Nhấn nút "Cập nhật chi tiêu" để lưu thay đổi
4. Hoặc nhấn "Hủy sửa" để hủy thao tác

### Xóa chi tiêu

*Lưu ý: Chỉ người dùng có vai trò Admin mới có thể xóa chi tiêu*

1. Trong danh sách chi tiêu, nhấn vào nút "Xóa" (biểu tượng thùng rác) trên chi tiêu muốn xóa
2. Xác nhận việc xóa khi được hỏi

### Xem danh sách chi tiêu

- Tất cả chi tiêu đã thêm sẽ hiển thị trong phần "Danh sách chi tiêu"
- Mỗi chi tiêu hiển thị thông tin: tên, số tiền, ngày, người trả và người tham gia

## 3. Quản lý quỹ nhóm

### Xem số dư quỹ nhóm

1. Chọn tab "Quỹ nhóm"
2. Số dư quỹ nhóm hiển thị ở phần đầu trang

### Nộp quỹ nhóm

1. Chọn tab "Quỹ nhóm"
2. Trong phần "Nộp quỹ nhóm", điền thông tin:
   - **Thành viên**: Chọn thành viên nộp tiền
   - **Số tiền**: Nhập số tiền nộp
   - **Ngày**: Chọn ngày nộp tiền
   - **Ghi chú**: Nhập ghi chú (không bắt buộc)
3. Nhấn nút "Lưu khoản nộp"

### Xem thông tin quỹ

1. Chọn tab "Quỹ nhóm"
2. Chọn "Thông tin quỹ" để xem:
   - Số dư hiện tại
   - Nhắc nhở nộp tiền
   - Số dư của từng thành viên

### Thiết lập nhắc nhở

1. Chọn tab "Quỹ nhóm"
2. Chọn "Cài đặt nhắc nhở"
3. Chọn thành viên và nhập ngưỡng nhắc nhở (số âm, VD: -50,000)
4. Nhấn "Lưu thiết lập"

### Xem biểu đồ quỹ

1. Chọn tab "Quỹ nhóm"
2. Cuộn xuống để xem:
   - Biểu đồ tròn thể hiện tỷ lệ đóng góp của thành viên
   - Biểu đồ cột thể hiện thu chi theo thời gian

### Xem lịch sử giao dịch quỹ

1. Chọn tab "Quỹ nhóm"
2. Cuộn xuống phần "Lịch sử giao dịch quỹ" để xem danh sách các giao dịch

### Tạo mã QR thanh toán

1. Nhấn nút "Mã QR" trên trang Chi tiêu hoặc Quỹ nhóm
2. Mã QR sẽ được tạo để người khác có thể quét và thanh toán

## 4. Quản lý thành viên

### Xem danh sách thành viên

1. Chọn tab "Thành viên"
2. Danh sách thành viên được hiển thị với thông tin tài khoản ngân hàng

### Thêm thành viên mới

1. Chọn tab "Thành viên"
2. Nhấn nút "Thêm thành viên"
3. Nhập tên thành viên và thông tin tài khoản ngân hàng (nếu có)
4. Nhấn "Lưu thành viên"

### Sửa thông tin thành viên

1. Trong danh sách thành viên, nhấn vào nút "Sửa" trên thành viên muốn sửa
2. Thay đổi thông tin thành viên
3. Nhấn "Cập nhật thành viên" để lưu thay đổi

### Xóa thành viên

*Lưu ý: Chỉ người dùng có vai trò Admin mới có thể xóa thành viên*

1. Trong danh sách thành viên, nhấn vào nút "Xóa" trên thành viên muốn xóa
2. Xác nhận việc xóa khi được hỏi

## 5. Kết quả chia tiền

### Xem tổng kết cá nhân

1. Chọn tab "Chi tiêu"
2. Cuộn xuống phần "Kết quả chia tiền"
3. Trong phần "Tổng kết cá nhân", xem thông tin chi tiêu của từng thành viên:
   - Tổng chi tiêu đã trả
   - Tổng chi tiêu được hưởng
   - Số dư (dương là đang cho mượn, âm là đang nợ)

### Xem giao dịch cần thực hiện

1. Chọn tab "Chi tiêu"
2. Cuộn xuống phần "Kết quả chia tiền"
3. Trong phần "Giao dịch cần thực hiện", xem các giao dịch thanh toán giữa các thành viên
4. Các giao dịch này đã được tối ưu để giảm thiểu số lần thanh toán

## 6. Các tính năng khác

### Làm mới dữ liệu

- Nhấn nút "Làm mới" ở góc trên bên phải để cập nhật dữ liệu từ Supabase
- Sử dụng khi có thành viên khác thực hiện thay đổi trên ứng dụng

### Xóa tất cả dữ liệu

*Lưu ý: Chỉ người dùng có vai trò Admin mới có thể xóa tất cả dữ liệu*

1. Cuộn xuống cuối trang
2. Nhấn nút "Xóa tất cả dữ liệu"
3. Xác nhận việc xóa khi được hỏi

### Thiết lập Supabase

Nếu bạn muốn sử dụng cơ sở dữ liệu Supabase riêng:

1. Đăng ký tài khoản tại [Supabase](https://supabase.com/)
2. Tạo dự án mới
3. Thiết lập các bảng cần thiết theo hướng dẫn trong tệp SUPABASE_SETUP.md
4. Cập nhật thông tin kết nối trong file js/utils/supabase.js

## Lưu ý

- Dữ liệu được lưu trữ trong cơ sở dữ liệu Supabase
- Mật khẩu mặc định cho tất cả người dùng là "Cafe"
- Thành viên "Giang" được thiết lập làm Admin mặc định
- Ứng dụng yêu cầu kết nối internet để đồng bộ dữ liệu 