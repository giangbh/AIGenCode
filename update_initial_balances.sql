-- Script SQL để cập nhật số dư ban đầu của quỹ nhóm và các thành viên
-- Sử dụng trong SQL Editor của Supabase
-- Dữ liệu được cập nhật theo báo cáo số dư hiện tại

BEGIN;

-- Tính toán tổng số dư quỹ nhóm: 2.115.000 VNĐ
UPDATE fund_balance
SET current_balance = 2115000,
    last_updated = NOW(),
    version = version + 1;

-- Cập nhật số dư của từng thành viên
-- Chuyển đổi số dương thành số dư quỹ dương (người đã đóng nhiều hơn chi tiêu)
-- Chuyển đổi số âm thành số dư quỹ âm (người chi tiêu nhiều hơn đóng góp)

-- Toan.LV: -154.666,67
UPDATE member_balances
SET current_balance = -154667,
    last_updated = NOW(),
    version = version + 1
WHERE member_name = 'Toan.LV';

-- QuanTrH: 724.666,67
UPDATE member_balances
SET current_balance = 724667,
    last_updated = NOW(),
    version = version + 1
WHERE member_name = 'QuanTrH';

-- GiangBH: 509.166,67
UPDATE member_balances
SET current_balance = 509167,
    last_updated = NOW(),
    version = version + 1
WHERE member_name = 'GiangBH';

-- NhatNH: 536.750,00
UPDATE member_balances
SET current_balance = 536750,
    last_updated = NOW(),
    version = version + 1
WHERE member_name = 'NhatNH';

-- QuangTV: -12.166,67
UPDATE member_balances
SET current_balance = -12167,
    last_updated = NOW(),
    version = version + 1
WHERE member_name = 'QuangTV';

-- TrungVV: 511.250,00
UPDATE member_balances
SET current_balance = 511250,
    last_updated = NOW(),
    version = version + 1
WHERE member_name = 'TrungVV';

-- Kiểm tra xem tất cả thành viên đã có bản ghi balance chưa
INSERT INTO member_balances (member_name, current_balance, last_updated, version)
SELECT 'Toan.LV', -154667, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM member_balances WHERE member_name = 'Toan.LV');

INSERT INTO member_balances (member_name, current_balance, last_updated, version)
SELECT 'QuanTrH', 724667, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM member_balances WHERE member_name = 'QuanTrH');

INSERT INTO member_balances (member_name, current_balance, last_updated, version)
SELECT 'GiangBH', 509167, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM member_balances WHERE member_name = 'GiangBH');

INSERT INTO member_balances (member_name, current_balance, last_updated, version)
SELECT 'NhatNH', 536750, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM member_balances WHERE member_name = 'NhatNH');

INSERT INTO member_balances (member_name, current_balance, last_updated, version)
SELECT 'QuangTV', -12167, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM member_balances WHERE member_name = 'QuangTV');

INSERT INTO member_balances (member_name, current_balance, last_updated, version)
SELECT 'TrungVV', 511250, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM member_balances WHERE member_name = 'TrungVV');

-- Cập nhật số tài khoản của Toan.LV cho QR chuyển tiền
UPDATE members
SET bank_account = '1240067256'
WHERE name = 'Toan.LV';

-- Kiểm tra xem thành viên có trong bảng members không và thêm nếu cần
INSERT INTO members (name, bank_account)
SELECT 'Toan.LV', '1240067256'
WHERE NOT EXISTS (SELECT 1 FROM members WHERE name = 'Toan.LV');

INSERT INTO members (name)
SELECT 'QuanTrH'
WHERE NOT EXISTS (SELECT 1 FROM members WHERE name = 'QuanTrH');

INSERT INTO members (name)
SELECT 'GiangBH'
WHERE NOT EXISTS (SELECT 1 FROM members WHERE name = 'GiangBH');

INSERT INTO members (name)
SELECT 'NhatNH'
WHERE NOT EXISTS (SELECT 1 FROM members WHERE name = 'NhatNH');

INSERT INTO members (name)
SELECT 'QuangTV'
WHERE NOT EXISTS (SELECT 1 FROM members WHERE name = 'QuangTV');

INSERT INTO members (name)
SELECT 'TrungVV'
WHERE NOT EXISTS (SELECT 1 FROM members WHERE name = 'TrungVV');

-- Kiểm tra kết quả
SELECT 'fund_balance' as table_name, current_balance FROM fund_balance
UNION ALL
SELECT 'member_balance: ' || member_name, current_balance FROM member_balances
ORDER BY table_name;

-- Hiển thị thông tin tài khoản ngân hàng
SELECT name, bank_account FROM members ORDER BY name;

COMMIT; 