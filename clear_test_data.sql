-- Script SQL để xóa toàn bộ dữ liệu test trước khi golive
-- Sử dụng trong SQL Editor của Supabase
-- Lưu ý: Script này sẽ xóa MỌI dữ liệu trong các bảng, hãy đảm bảo bạn đã sao lưu dữ liệu cần thiết

-- Bật chế độ an toàn để thực hiện các thao tác xóa
BEGIN;

-- Xóa tất cả dữ liệu từ bảng fund_transactions (bảng có các ràng buộc foreign key)
TRUNCATE fund_transactions CASCADE;

-- Xóa tất cả dữ liệu từ bảng expenses
TRUNCATE expenses CASCADE;

-- Kiểm tra và đảm bảo bảng fund_balance có bản ghi
INSERT INTO fund_balance (current_balance, last_updated, version)
SELECT 0, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM fund_balance);

-- Reset số dư quỹ nhóm về 0
UPDATE fund_balance
SET current_balance = 0,
    last_transaction_id = NULL,
    last_updated = NOW(),
    version = version + 1;

-- Reset số dư của tất cả thành viên về 0
UPDATE member_balances
SET current_balance = 0,
    last_transaction_id = NULL,
    last_updated = NOW(),
    notified_at = NULL,
    version = version + 1;

-- Kiểm tra lại và đảm bảo các bản ghi tồn tại cho tất cả thành viên
INSERT INTO member_balances (member_name, current_balance, version)
SELECT name, 0, 1
FROM members m
WHERE NOT EXISTS (
    SELECT 1 FROM member_balances mb
    WHERE mb.member_name = m.name
);

-- Thống kê số lượng bản ghi còn lại trong các bảng sau khi xóa
SELECT 'expenses' as table_name, COUNT(*) as record_count FROM expenses
UNION ALL 
SELECT 'fund_transactions', COUNT(*) FROM fund_transactions
UNION ALL
SELECT 'fund_balance', COUNT(*) FROM fund_balance
UNION ALL
SELECT 'member_balances', COUNT(*) FROM member_balances
UNION ALL
SELECT 'members', COUNT(*) FROM members;

-- Commit để áp dụng các thay đổi
COMMIT;

-- Lưu ý: Nếu bạn không muốn thực sự xóa dữ liệu ngay lập tức mà chỉ muốn xem trước kết quả,
-- bạn có thể đổi COMMIT thành ROLLBACK 