# Hướng dẫn Migrate Database CafeThu6

Tài liệu này hướng dẫn cách sử dụng script `db-migration.js` để migrate toàn bộ dữ liệu từ database Supabase hiện tại sang một môi trường mới.

## Các bước thực hiện

### 1. Chuẩn bị

Đầu tiên, bạn cần cài đặt các thư viện cần thiết:

```bash
npm install @supabase/supabase-js
```

### 2. Cấu hình script

Mở file `db-migration.js` và cập nhật thông tin của Supabase mới:

```javascript
// Destination database credentials (new environment)
const DEST_SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL';
const DEST_SUPABASE_KEY = 'YOUR_NEW_SUPABASE_ANON_KEY';
```

Thay thế `YOUR_NEW_SUPABASE_URL` và `YOUR_NEW_SUPABASE_ANON_KEY` bằng thông tin từ project Supabase mới của bạn.

### 3. Cài đặt cấu trúc database ở môi trường đích

Trước khi chạy script, bạn cần đảm bảo database đích (mới) đã có cấu trúc bảng giống với database nguồn. Tạo các bảng sau trong project Supabase mới:

1. **members** - Bảng lưu thông tin thành viên:
   - `id` (uuid, primary key, default: uuid_generate_v4())
   - `name` (text, not null)
   - `bank_account` (text)
   - `role` (text, default: 'member')
   - `created_at` (timestamp with time zone, default: now())

2. **expenses** - Bảng lưu chi tiêu:
   - `id` (uuid, primary key, default: uuid_generate_v4())
   - `name` (text, not null)
   - `amount` (integer, not null)
   - `date` (date, not null)
   - `payer` (text, not null)
   - `participants` (text[], not null)
   - `equal_split` (boolean, default: true)
   - `splits` (jsonb)
   - `location` (jsonb)
   - `created_at` (timestamp with time zone, default: now())

3. **fund_transactions** - Bảng lưu giao dịch quỹ:
   - `id` (uuid, primary key, default: uuid_generate_v4())
   - `type` (text, not null)
   - `amount` (integer, not null)
   - `date` (date, not null)
   - `member` (text)
   - `expense_id` (uuid, references expenses(id) on delete cascade)
   - `expense_name` (text)
   - `note` (text)
   - `created_at` (timestamp with time zone, default: now())

4. **fund_balance** - Bảng lưu số dư quỹ:
   - `id` (uuid, primary key, default: uuid_generate_v4())
   - `amount` (integer, not null, default: 0)
   - `last_updated` (timestamp with time zone, default: now())
   - `last_transaction_id` (uuid, references fund_transactions(id) on delete set null)
   - `created_at` (timestamp with time zone, default: now())

5. **member_balances** - Bảng lưu số dư các thành viên:
   - `id` (uuid, primary key, default: uuid_generate_v4())
   - `member` (text, not null)
   - `amount` (integer, not null, default: 0)
   - `last_updated` (timestamp with time zone, default: now())
   - `last_transaction_id` (uuid, references fund_transactions(id) on delete set null)
   - `notification_threshold` (integer, default: 0)
   - `last_notified` (timestamp with time zone)
   - `created_at` (timestamp with time zone, default: now())

### 4. Chạy script

Chạy script bằng Node.js:

```bash
node db-migration.js
```

Script sẽ:

1. Tạo một file backup JSON trước khi thực hiện migrate
2. Hỏi xác nhận trước khi tiến hành migrate
3. Migrate dữ liệu từ database nguồn sang database đích

### 5. Kiểm tra kết quả

Sau khi script chạy xong, kiểm tra console để đảm bảo không có lỗi, và kiểm tra database đích để đảm bảo dữ liệu đã được migrate đầy đủ.

## Các chức năng bổ sung

Script này cung cấp một số chức năng bổ sung:

### Migrate từng bảng riêng biệt

Nếu bạn muốn migrate từng bảng riêng:

```javascript
const { migrateMembers, migrateExpenses, migrateFundTransactions, migrateFundBalance, migrateMemberBalances } = require('./db-migration.js');

// Migrate thành viên
migrateMembers()
  .then(() => console.log('Đã migrate thành viên thành công'))
  .catch(err => console.error('Lỗi:', err));
```

### Migrate batch-wise cho dữ liệu lớn

Đối với dữ liệu lớn, bạn có thể sử dụng hàm `migrateInBatches`:

```javascript
const { migrateInBatches } = require('./db-migration.js');

// Migrate bảng expenses theo lô, mỗi lô 50 bản ghi
migrateInBatches('expenses', 50)
  .then(() => console.log('Đã migrate bảng expenses theo lô thành công'))
  .catch(err => console.error('Lỗi:', err));
```

### Chỉ backup dữ liệu

Nếu bạn chỉ muốn tạo backup:

```javascript
const { exportToJson } = require('./db-migration.js');

exportToJson()
  .then(filename => console.log(`Đã tạo backup: ${filename}`))
  .catch(err => console.error('Lỗi:', err));
```

### Import từ file backup

Nếu bạn muốn import từ file backup đã tạo:

```javascript
const { importFromJson } = require('./db-migration.js');

importFromJson('cafethu6_backup_2023-05-15T12-30-45-678Z.json')
  .then(() => console.log('Đã import từ backup thành công'))
  .catch(err => console.error('Lỗi:', err));
```

## Xử lý sự cố

### Timeout khi migrate dữ liệu lớn

Nếu bạn gặp timeout khi migrate dữ liệu lớn, hãy sử dụng phương pháp batch-wise như đã mô tả ở trên.

### Xung đột ID

Nếu có xung đột ID (ví dụ: trùng primary key), script sẽ hiển thị lỗi. Trong trường hợp này, bạn có thể:

1. Xóa dữ liệu trong database đích trước khi migrate
2. Sửa đổi script để tạo ID mới cho các bản ghi khi migrate

### Khác phiên bản Supabase

Nếu phiên bản Supabase nguồn và đích khác nhau, có thể có sự khác biệt về API. Trong trường hợp này, hãy kiểm tra [tài liệu Supabase](https://supabase.io/docs) để biết thêm chi tiết. 