# CafeThu6 - Tài liệu hướng dẫn

## Giới thiệu

CafeThu6 là ứng dụng web giúp nhóm bạn hoặc đồng nghiệp dễ dàng chia sẻ chi phí, theo dõi số dư của từng thành viên, và quản lý quỹ nhóm hiệu quả.

## Tài liệu kỹ thuật

### Đặc tả kỹ thuật

- [Luồng nộp tiền và chi tiêu](specs/flow_architecture.md) - Chi tiết luồng nộp tiền và chi tiêu, cấu trúc dữ liệu và API
- [Thiết lập Supabase](specs/SUPABASE_SETUP.md) - Hướng dẫn thiết lập cơ sở dữ liệu Supabase
- [Thay đổi quyền hạn người dùng](specs/apply_role_changes.md) - Cách thức quản lý quyền hạn của người dùng
- [Biểu đồ thu chi](specs/thu_chi_chart.md) - Thông tin về biểu đồ trực quan hóa thu chi

### Mã nguồn

- JavaScript: Thư mục `/js` chứa tất cả mã nguồn JavaScript
  - Controllers: `/js/controllers` quản lý logic nghiệp vụ
  - Models: `/js/models` chứa các đối tượng dữ liệu 
  - Utils: `/js/utils` chứa các tiện ích và kết nối Supabase
- CSS: Thư mục `/css` chứa CSS styles

## Hướng dẫn sử dụng

- [Hướng dẫn sử dụng](guides/huong_dan_su_dung.md) - Hướng dẫn chi tiết cách sử dụng CafeThu6

## SQL Scripts

- [insert_default_members.sql](../insert_default_members.sql) - Script để thêm thành viên mặc định
- [alter_members_table.sql](../alter_members_table.sql) - Script để thay đổi cấu trúc bảng members

## Chạy ứng dụng

Để chạy ứng dụng, sử dụng lệnh:

```bash
python3 -m http.server 8000
```

Sau đó truy cập: http://localhost:8000/CafeThu6.html 