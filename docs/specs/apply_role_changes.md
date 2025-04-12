# Hướng dẫn áp dụng tính năng phân quyền trong CafeThu6

## Bước 1: Thêm cột role vào bảng members

1. Đăng nhập vào Supabase dashboard
2. Chuyển đến phần SQL Editor
3. Tạo một SQL Query mới
4. Dán đoạn mã trong file `alter_members_table.sql` vào editor và chạy

```sql
-- Add role column to members table
ALTER TABLE members 
ADD COLUMN role text NOT NULL DEFAULT 'member' 
CHECK (role IN ('member', 'admin'));

-- Set initial admin (Giang) - change as needed
UPDATE members
SET role = 'admin'
WHERE name = 'Giang';
```

## Bước 2: Cập nhật dữ liệu thành viên mặc định (nếu cần thiết)

Nếu bạn muốn reset dữ liệu và thêm lại các thành viên mặc định với vai trò mới, hãy sử dụng file `insert_default_members.sql`:

```sql
-- Script SQL để thêm các thành viên mặc định vào bảng members
-- Sử dụng trong SQL Editor của Supabase

-- Xóa dữ liệu hiện tại (nếu muốn reset)
-- DELETE FROM members;

-- Thêm các thành viên mặc định
INSERT INTO members (id, name, bank_account, role, created_at)
VALUES 
    (gen_random_uuid(), 'Giang', '9876543210', 'admin', NOW()),
    (gen_random_uuid(), 'Quân', '8765432109', 'member', NOW()),
    (gen_random_uuid(), 'Toàn', '1240067256', 'member', NOW()),
    (gen_random_uuid(), 'Quang', '6543210987', 'member', NOW()),
    (gen_random_uuid(), 'Trung', '5432109876', 'member', NOW()),
    (gen_random_uuid(), 'Nhật', '4321098765', 'member', NOW());
```

## Bước 3: Tải lên các file JavaScript đã được sửa đổi

Tải lên tất cả các file JavaScript đã được cập nhật để áp dụng tính năng phân quyền:

1. js/utils/auth.js
2. js/controllers/ExpenseUIController.js
3. js/controllers/MemberUIController.js
4. js/controllers/FundUIController.js
5. js/app.js
6. js/utils/supabase.js

## Bước 4: Kiểm tra

1. Đăng nhập với tài khoản Giang (admin) - Mật khẩu: `Cafe`
   - Bạn sẽ thấy nút "Xóa tất cả dữ liệu" và các nút xóa cho chi tiêu, thành viên, và giao dịch quỹ

2. Đăng nhập với tài khoản khác (member) - Mật khẩu: `Cafe`
   - Bạn sẽ không thấy nút "Xóa tất cả dữ liệu" và các nút xóa sẽ bị ẩn 