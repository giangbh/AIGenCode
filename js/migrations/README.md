# Hướng dẫn cập nhật cơ sở dữ liệu cho quản lý số dư quỹ

File này hướng dẫn việc thực hiện migration để cải thiện quản lý số dư quỹ và số dư thành viên.

## Các thay đổi chính

1. **Tạo bảng fund_balance**: Lưu trữ số dư quỹ hiện tại 
2. **Tạo bảng member_balances**: Lưu trữ số dư của từng thành viên
3. **Tạo các function SQL**: Tính toán số dư quỹ và số dư thành viên

## Các bước thực hiện

1. Đăng nhập vào Supabase dashboard
2. Mở SQL Editor
3. Sao chép và dán nội dung từ file `create_fund_tables.sql` vào SQL Editor
4. Thực thi câu lệnh SQL
5. Kiểm tra trong bảng Database để đảm bảo các bảng mới đã được tạo

## Tính năng mới

Sau khi cập nhật, ứng dụng sẽ có các tính năng mới:

1. **Hiệu năng tốt hơn**: Không cần tính lại số dư từ tất cả giao dịch
2. **Theo dõi số dư thành viên**: Quản lý chi tiết số dư của từng thành viên
3. **Thông báo nộp tiền**: Gửi thông báo cho thành viên có số dư âm cần nộp tiền
4. **Cài đặt ngưỡng**: Tùy chỉnh ngưỡng để thông báo cho từng thành viên 