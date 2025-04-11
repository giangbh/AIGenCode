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

-- Kiểm tra kết quả
SELECT * FROM members ORDER BY name; 