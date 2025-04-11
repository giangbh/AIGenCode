-- Tạo bảng fund_balance để lưu số dư quỹ
CREATE TABLE IF NOT EXISTS fund_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_balance INTEGER NOT NULL DEFAULT 0,
    last_transaction_id UUID REFERENCES fund_transactions(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Thêm dòng dữ liệu đầu tiên nếu chưa có
INSERT INTO fund_balance (current_balance, version)
SELECT 0, 1
WHERE NOT EXISTS (SELECT 1 FROM fund_balance);

-- Tạo bảng member_balances để lưu số dư thành viên
CREATE TABLE IF NOT EXISTS member_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_name TEXT NOT NULL REFERENCES members(name) ON DELETE CASCADE,
    current_balance INTEGER NOT NULL DEFAULT 0,
    last_transaction_id UUID REFERENCES fund_transactions(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_threshold INTEGER DEFAULT -50000,
    notified_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    UNIQUE(member_name)
);

-- Tạo index cho member_name để truy vấn nhanh
CREATE INDEX IF NOT EXISTS idx_member_balances_member_name ON member_balances(member_name);

-- Tạo function để tăng version
CREATE OR REPLACE FUNCTION increment_version(row_id UUID)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  UPDATE fund_balance 
  SET version = version + 1 
  WHERE id = row_id
  RETURNING version;
$$;

-- Tạo function tính số dư quỹ
CREATE OR REPLACE FUNCTION calculate_fund_balance()
RETURNS INTEGER
LANGUAGE SQL
AS $$
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN type = 'deposit' THEN amount 
        WHEN type = 'expense' THEN -amount 
        ELSE 0
      END
    ), 0
  )::INTEGER
  FROM fund_transactions;
$$;

-- Tạo function tính số dư thành viên
CREATE OR REPLACE FUNCTION calculate_member_balance(member_name TEXT)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  SELECT COALESCE(
    SUM(
      CASE 
        -- Khi nộp tiền vào quỹ, cộng số dư
        WHEN type = 'deposit' AND member = member_name THEN amount
        -- Khi chi tiêu, chưa có expense_data field (sẽ thêm sau)
        ELSE 0
      END
    ), 0
  )::INTEGER
  FROM fund_transactions;
$$;

-- Tạo function cập nhật tất cả số dư thành viên
CREATE OR REPLACE FUNCTION update_all_member_balances()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  member_rec RECORD;
BEGIN
  FOR member_rec IN SELECT name FROM members LOOP
    INSERT INTO member_balances (member_name, current_balance)
    VALUES (member_rec.name, calculate_member_balance(member_rec.name))
    ON CONFLICT (member_name) 
    DO UPDATE SET 
      current_balance = calculate_member_balance(member_rec.name),
      last_updated = NOW(),
      version = member_balances.version + 1;
  END LOOP;
END;
$$; 