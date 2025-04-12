# Đặc tả kỹ thuật CafeThu6

Thư mục này chứa các tài liệu đặc tả kỹ thuật của ứng dụng CafeThu6.

## Danh sách tài liệu

- [Luồng nộp tiền và chi tiêu](flow_architecture.md) - Chi tiết về luồng xử lý nộp tiền và chi tiêu, bao gồm cấu trúc cơ sở dữ liệu, API và sơ đồ tuần tự
- [Thiết lập Supabase](SUPABASE_SETUP.md) - Hướng dẫn thiết lập và cấu hình cơ sở dữ liệu Supabase
- [Thay đổi quyền hạn người dùng](apply_role_changes.md) - Tài liệu về quản lý quyền hạn người dùng
- [Biểu đồ thu chi](thu_chi_chart.md) - Đặc tả kỹ thuật về biểu đồ thu chi

## Các SQL Script

Các SQL script liên quan có thể tìm thấy trong thư mục gốc của dự án:

- `insert_default_members.sql` - Script để thêm thành viên mặc định
- `alter_members_table.sql` - Script để thay đổi cấu trúc bảng members 