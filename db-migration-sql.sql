-- CafeThu6 Database Schema
-- Use this script to create the required tables in your new Supabase environment
-- before running the migration script

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bank_account TEXT,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date DATE NOT NULL,
    payer TEXT NOT NULL,
    participants TEXT[] NOT NULL,
    equal_split BOOLEAN DEFAULT TRUE,
    splits JSONB,
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create fund transactions table
CREATE TABLE IF NOT EXISTS fund_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date DATE NOT NULL,
    member TEXT,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    expense_name TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create fund balance table
CREATE TABLE IF NOT EXISTS fund_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    last_transaction_id UUID REFERENCES fund_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create member balances table
CREATE TABLE IF NOT EXISTS member_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    last_transaction_id UUID REFERENCES fund_transactions(id) ON DELETE SET NULL,
    notification_threshold INTEGER DEFAULT 0,
    last_notified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_payer ON expenses(payer);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_member ON fund_transactions(member);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_date ON fund_transactions(date);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_expense_id ON fund_transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_member_balances_member ON member_balances(member);

-- Add any additional SQL setup you need below:
-- E.g., RLS policies, functions, triggers, etc.

-- Example RLS policies (uncomment and modify as needed):
/*
-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_balances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to members" 
    ON members FOR SELECT USING (true);

CREATE POLICY "Allow public read access to expenses" 
    ON expenses FOR SELECT USING (true);

CREATE POLICY "Allow public read access to fund_transactions" 
    ON fund_transactions FOR SELECT USING (true);

CREATE POLICY "Allow public read access to fund_balance" 
    ON fund_balance FOR SELECT USING (true);

CREATE POLICY "Allow public read access to member_balances" 
    ON member_balances FOR SELECT USING (true);

-- Add more restrictive policies for INSERT/UPDATE/DELETE as needed
*/ 



Dưới đây là ba cách phổ biến nhất để “clone” (sao chép) toàn bộ database Supabase từ một môi trường (project) này sang môi trường khác.

---

## 1. Dùng Supabase CLI (kể cả schema lẫn data)

Supabase CLI hiện tại đã hỗ trợ lệnh `db dump` và `db restore`:

1. **Cài đặt CLI** (nếu chưa):
   ```bash
   npm install -g supabase
   supabase --version
   ```
2. **Đăng nhập**:
   ```bash
   supabase login
   ```
3. **Dump database nguồn**:
   ```bash
   # Chạy trong thư mục chứa supabase/config.toml của môi trường nguồn
   supabase db dump --format plain --file dump.sql
   ```
   - `plain` cho file SQL thuần (có cả `CREATE EXTENSION`, `CREATE TABLE`, `INSERT …`).
   - Tùy chọn `--schema-only` nếu chỉ cần schema mà không cần data.

4. **Restore lên môi trường đích**:
   ```bash
   # Chuyển config.toml sang môi trường đích (thay PROJECT_REF, API_KEY…)
   supabase db restore --file dump.sql
   ```
   - Lệnh này sẽ kết nối tới database của project đích, xóa hết và chạy nguyên file `dump.sql`.

> **Lưu ý**: Bạn cần đảm bảo Supabase CLI đang trỏ đúng tới project nguồn/đích qua `supabase switch project_ref`.

---

## 2. Dùng `pg_dump` / `psql` (PostgreSQL tools)

Nếu bạn quen dùng công cụ dòng lệnh của PostgreSQL, có thể dùng `pg_dump`:

1. **Lấy connection string**  
   Vào **Settings → Database → Connection Pooling & Credentials** trong dashboard Supabase, copy `postgres://...`.

2. **Dump database (giả sử có cả schema+data)**:
   ```bash
   pg_dump \
     --format=custom \
     --no-acl \
     --no-owner \
     --file=backup.dump \
     "postgres://USER:PASS@HOST:PORT/DBNAME"
   ```
   - `--format=custom` giúp file nhỏ hơn và restore linh hoạt.

3. **Restore lên database đích**:
   ```bash
   pg_restore \
     --verbose \
     --clean \
     --no-acl \
     --no-owner \
     --dbname="postgres://USER2:PASS2@HOST2:PORT2/DBNAME2" \
     backup.dump
   ```
   - `--clean` sẽ drop các object trước khi tạo lại.
   - Thay `USER2`, `PASS2`… bằng thông tin connection của project đích.

---

## 3. Dùng tính năng Backup & Import trên Supabase Dashboard

1. **Export Snapshot**  
   - Vào **Settings → Backups** trên dashboard project nguồn.  
   - Tải về file `.dump` hoặc `.sql`.

2. **Import**  
   - Vào project đích, **Settings → Database → Restore** (nếu có tính năng này).  
   - Upload file dump bạn vừa tải.

> Hiện tại UI có hạn chế về kích thước file; với db lớn bạn nên dùng CLI hoặc `pg_restore`.

---

## 4. Sau khi copy: kiểm tra & tinh chỉnh

- **Extensions**: đảm bảo các extension (ví dụ `uuid-ossp`, `pg_cron`, `pg_stat_statements`) đã được bật trên project đích.  
- **Migrations**: nếu bạn dùng Supabase Migrations (SQL files trong folder `supabase/migrations`), hãy apply chúng lên môi trường đích để giữ lịch sử thay đổi.  
- **Environment Variables**: cập nhật `.env` hoặc `supabase/config.toml` nếu có bất kỳ secret nào thay đổi.  
- **Policies & RLS**: kiểm tra lại Row-Level Security (RLS), Policies, Webhooks… để chắc môi trường đích hoạt đúng như môi trường nguồn.

---

### Kết luận

- **Nếu muốn tự động hóa** (CI/CD), bạn có thể gói `pg_dump` + `pg_restore` hoặc Supabase CLI vào một pipeline (GitHub Actions, GitLab CI…).  
- **Với db nhỏ (< 100 MB)**, dashboard UI cũng đủ dùng.  
- **Với db lớn**, ưu tiên CLI hoặc tools PostgreSQL gốc để tránh timeout.

Bạn có thể thử theo phương án 1 hoặc 2, và nếu gặp lỗi cụ thể nào (authentication, timeout, extension missing…), cứ báo lại để mình hỗ trợ chi tiết thêm nhé!