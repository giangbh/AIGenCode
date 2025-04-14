# CafeThu6 - Ứng dụng chia tiền nhóm   

## Tính năng mới: Phân quyền người dùng

Ứng dụng CafeThu6 giờ đây đã có tính năng phân quyền người dùng với hai vai trò:

1. **Admin** - Có toàn quyền trên hệ thống, bao gồm:
   - Xem và quản lý tất cả chi tiêu
   - Thêm, sửa, xóa thành viên
   - Xóa chi tiêu
   - Xóa tất cả dữ liệu

2. **Member** - Có quyền hạn chế:
   - Xem và quản lý chi tiêu
   - Thêm và sửa thông tin thành viên
   - KHÔNG có quyền xóa chi tiêu, xóa thành viên, hoặc xóa tất cả dữ liệu

## Cài đặt vai trò Admin

Khi cài đặt lần đầu, hệ thống sẽ tự động gán vai trò "admin" cho thành viên "Giang" và vai trò "member" cho các thành viên khác. Để thay đổi hoặc thêm admin, hãy chạy lệnh SQL sau trong SQL Editor của Supabase:

```sql
-- Cấp quyền admin cho một thành viên
UPDATE members
SET role = 'admin'
WHERE name = 'TenThanhVien';
```

## Cách áp dụng thay đổi

1. Chạy file SQL `alter_members_table.sql` trong SQL Editor của Supabase để thêm cột role vào bảng members

2. Đăng nhập vào ứng dụng với tài khoản có vai trò admin để quản lý dữ liệu

## Mật khẩu

Tất cả người dùng đều sử dụng mật khẩu mặc định là `Cafe` (phân biệt chữ hoa/thường). 