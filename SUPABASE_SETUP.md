# Hướng dẫn cài đặt Supabase cho CafeThu6

Tài liệu này hướng dẫn cách cài đặt và cấu hình Supabase để sử dụng làm cơ sở dữ liệu đám mây cho ứng dụng CafeThu6.

## 1. Đăng ký tài khoản Supabase

1. Truy cập [Supabase](https://supabase.com/)
2. Nhấn vào nút "Start for Free" để đăng ký tài khoản
3. Đăng ký bằng GitHub, Google hoặc tạo tài khoản mới với email và mật khẩu
4. Xác nhận email nếu cần

## 2. Tạo dự án mới

1. Sau khi đăng nhập, nhấn vào nút "New Project"
2. Nhập tên dự án: "CafeThu6"
3. Tạo mật khẩu cho database (lưu lại mật khẩu này cho trường hợp cần truy cập trực tiếp vào database)
4. Chọn region gần với vị trí của bạn (ví dụ: Singapore hoặc Tokyo cho khu vực Việt Nam)
5. Chọn Free tier
6. Nhấn "Create new project" và đợi khoảng 1-2 phút để Supabase khởi tạo dự án

## 3. Cấu hình bảng dữ liệu

Sau khi dự án được tạo, bạn cần tạo các bảng dữ liệu:

### Tạo bảng members

1. Trong dashboard của dự án, click vào mục "Table Editor" trong sidebar
2. Nhấn "New Table"
3. Nhập thông tin bảng:
   - Name: `members`
   - Enable Row Level Security (RLS): Tạm thời **không** tích
4. Tạo các cột:
   - `id`: uuid, Primary Key, Default value: `gen_random_uuid()`
   - `name`: text, Unique, Not Null
   - `bank_account`: text, Nullable
   - `created_at`: timestamp with time zone, Default value: `now()`
5. Nhấn "Save" để tạo bảng

### Tạo bảng expenses

1. Nhấn "New Table"
2. Nhập thông tin bảng:
   - Name: `expenses`
   - Enable Row Level Security (RLS): Tạm thời **không** tích
3. Tạo các cột:
   - `id`: uuid, Primary Key, Default value: `gen_random_uuid()`
   - `name`: text, Not Null
   - `amount`: integer, Not Null
   - `date`: date, Not Null
   - `payer`: text, Not Null
   - `participants`: jsonb, Not Null
   - `equal_split`: boolean, Not Null
   - `splits`: jsonb, Nullable
   - `created_at`: timestamp with time zone, Default value: `now()`
4. Nhấn "Save" để tạo bảng

### Tạo bảng fund_transactions

1. Nhấn "New Table"
2. Nhập thông tin bảng:
   - Name: `fund_transactions`
   - Enable Row Level Security (RLS): Tạm thời **không** tích
3. Tạo các cột:
   - `id`: uuid, Primary Key, Default value: `gen_random_uuid()`
   - `type`: text, Not Null
   - `amount`: integer, Not Null
   - `date`: date, Not Null
   - `member`: text, Nullable
   - `note`: text, Nullable
   - `expense_id`: uuid, Nullable
   - `expense_name`: text, Nullable
   - `created_at`: timestamp with time zone, Default value: `now()`
4. Nhấn "Save" để tạo bảng

## 4. Lấy thông tin API của Supabase

1. Trong dashboard Supabase, click vào mục "Project Settings" (biểu tượng bánh răng) ở sidebar
2. Click vào "API" trong menu
3. Ở trang API, bạn sẽ thấy phần "Project URL" và "anon public" key
4. Sao chép hai giá trị này để sử dụng trong ứng dụng

## 5. Cập nhật thông tin API trong ứng dụng

Mở file `js/utils/supabase.js` và cập nhật thông tin kết nối:

```javascript
// Thay đổi các giá trị này bằng thông tin từ dự án Supabase của bạn
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

Thay `'https://your-project-url.supabase.co'` bằng Project URL bạn đã sao chép.
Thay `'your-anon-key'` bằng anon public key bạn đã sao chép.

## 6. Cấu hình quyền truy cập (nếu cần)

Mặc định, Supabase cho phép truy cập ẩn danh các bảng dữ liệu khi không bật Row Level Security (RLS). Đây là cách đơn giản nhất để bắt đầu.

Nếu bạn muốn bảo mật dữ liệu hơn trong tương lai:

1. Bật Row Level Security cho từng bảng
2. Tạo các chính sách (Policies) để cho phép truy cập
3. Triển khai xác thực người dùng

Tuy nhiên, đây là các bước nâng cao và không cần thiết cho việc bắt đầu sử dụng Supabase với CafeThu6.

## 7. Chạy và kiểm tra ứng dụng

1. Sau khi cập nhật thông tin kết nối, mở ứng dụng CafeThu6 trong trình duyệt
2. Ứng dụng sẽ khởi tạo kết nối đến Supabase và tự động tạo dữ liệu mặc định nếu cần
3. Thực hiện các thao tác với ứng dụng và kiểm tra trên dashboard Supabase để xác nhận dữ liệu đã được lưu trữ

## Xử lý sự cố

**Lỗi kết nối:**  
Nếu bạn gặp lỗi "Không thể kết nối đến cơ sở dữ liệu Supabase", hãy:
- Kiểm tra lại URL và key đã cập nhật trong file supabase.js
- Kiểm tra kết nối internet
- Xem console của trình duyệt để biết chi tiết lỗi

**Lỗi CORS:**  
Nếu gặp lỗi CORS, hãy cấu hình trong Project Settings > API > API Settings > Allowed Origins để thêm domain của bạn (hoặc thêm * cho phép tất cả origin trong môi trường phát triển)

**Data không hiển thị:**  
- Kiểm tra trong Database > Table Editor xem dữ liệu đã được lưu đúng chưa
- Xem console của trình duyệt để kiểm tra lỗi khi truy vấn dữ liệu

## Công cụ quản lý dữ liệu

Supabase cung cấp nhiều công cụ hữu ích để quản lý dữ liệu:

- **Table Editor**: Xem và sửa đổi dữ liệu trực tiếp
- **SQL Editor**: Viết và thực thi truy vấn SQL tùy chỉnh
- **Database**: Xem cấu trúc database và quản lý các bảng
- **Storage**: Quản lý tập tin nếu cần
- **Authentication**: Quản lý xác thực người dùng (nếu triển khai)

## Lưu ý về dữ liệu

- Dữ liệu trên kết nối đám mây sẽ được giữ lại ngay cả khi xóa ứng dụng khỏi máy tính
- Để xóa hoàn toàn dữ liệu, hãy sử dụng SQL Editor hoặc Table Editor của Supabase
- Tier miễn phí của Supabase có giới hạn về lưu lượng và dung lượng, nên theo dõi mức sử dụng trong phần Project Settings > Usage 