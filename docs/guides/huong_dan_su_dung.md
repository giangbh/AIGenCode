# Hướng dẫn sử dụng CafeThu6

## Giới thiệu

CafeThu6 là ứng dụng quản lý chi tiêu nhóm, giúp các thành viên dễ dàng theo dõi, chia sẻ và tính toán chi phí chung. Ứng dụng hỗ trợ quản lý quỹ nhóm, theo dõi chi tiêu và tự động tính toán số tiền cần thanh toán giữa các thành viên.

## Mục lục

1. [Đăng nhập và phân quyền](#1-đăng-nhập-và-phân-quyền)
2. [Quản lý chi tiêu](#2-quản-lý-chi-tiêu)
3. [Quản lý quỹ nhóm](#3-quản-lý-quỹ-nhóm)
4. [Quản lý thành viên](#4-quản-lý-thành-viên)
5. [Kết quả chia tiền](#5-kết-quả-chia-tiền)
6. [Các tính năng khác](#6-các-tính-năng-khác)

## 1. Đăng nhập và phân quyền

### Đăng nhập

1. Khi mở ứng dụng, hệ thống sẽ hiển thị màn hình đăng nhập
2. Nhập tên đăng nhập (tên thành viên của bạn trong nhóm)
3. Nhập mật khẩu (mật khẩu mặc định là "Cafe")
4. Nhấn nút "Đăng nhập"

### Vai trò người dùng

Ứng dụng có hai vai trò người dùng:

- **Admin**: Có toàn quyền trên hệ thống, bao gồm xóa chi tiêu, xóa thành viên và xóa tất cả dữ liệu
- **Member**: Có quyền hạn chế, không thể xóa chi tiêu, xóa thành viên hoặc xóa tất cả dữ liệu

### Đăng xuất

- Để đăng xuất, nhấn vào biểu tượng đăng xuất (biểu tượng log-out) bên cạnh tên người dùng hiện tại

## 2. Quản lý chi tiêu

### Thêm chi tiêu mới

1. Chọn tab "Chi tiêu"
2. Điền thông tin chi tiêu:
   - **Tên chi tiêu**: Nhập tên mô tả chi tiêu (VD: Ăn trưa Bún Chả)
   - **Số tiền (VNĐ)**: Nhập số tiền chi tiêu (VD: 350,000)
   - **Ngày chi tiêu**: Chọn ngày phát sinh chi tiêu
   - **Người trả**: Chọn thành viên đã thanh toán chi tiêu này
   - **Người tham gia**: Chọn những thành viên tham gia chi tiêu này
3. Chọn cách chia chi phí:
   - **Chia đều chi phí**: Bật công tắc này để chia đều chi phí cho tất cả người tham gia
   - **Chia theo số tiền tùy chỉnh**: Tắt công tắc chia đều và nhập số tiền cụ thể cho từng người
4. Nhấn nút "Lưu chi tiêu"

### Sử dụng gợi ý tự động (Autocomplete)

Ứng dụng cung cấp tính năng gợi ý thông minh dựa trên lịch sử chi tiêu:

1. **Gợi ý tên chi tiêu**:
   - Khi nhập tên chi tiêu, hệ thống sẽ hiển thị danh sách gợi ý dưới ô nhập liệu
   - Các gợi ý dựa trên các chi tiêu trước đây trong ứng dụng
   - Bạn có thể nhấp vào một gợi ý để tự động điền tên chi tiêu

2. **Gợi ý số tiền**:
   - Khi nhập số tiền, hệ thống sẽ hiển thị các chi tiêu có số tiền tương tự
   - Mỗi gợi ý hiển thị cả tên chi tiêu và số tiền
   - Khi chọn một gợi ý số tiền và tên chi tiêu đang trống, tên chi tiêu sẽ được tự động điền

3. **Các gợi ý chi tiêu phổ biến**:
   - Phía trên form thêm chi tiêu sẽ hiển thị các chi tiêu phổ biến gần đây
   - Nhấp vào một gợi ý để tự động điền cả tên và số tiền

### Danh sách chi tiêu nâng cao

Danh sách chi tiêu có các tính năng quản lý nâng cao:

1. **Sắp xếp chi tiêu**:
   - Nhấn vào các nút sắp xếp để sắp xếp theo Ngày, Số tiền hoặc Tên chi tiêu
   - Nhấn lần nữa vào cùng một nút để đảo ngược thứ tự sắp xếp

2. **Mở rộng/Thu gọn tất cả**:
   - Sử dụng nút "Mở rộng tất cả" để hiển thị chi tiết của tất cả chi tiêu
   - Nhấn "Thu gọn tất cả" để ẩn các chi tiết

3. **Phân trang**:
   - Danh sách chi tiêu được phân trang để dễ dàng xem khi có nhiều dữ liệu
   - Sử dụng các nút điều hướng trang để di chuyển giữa các trang

### Sửa chi tiêu

1. Trong danh sách chi tiêu, nhấn vào nút "Sửa" (biểu tượng bút chì) trên chi tiêu muốn sửa
2. Thay đổi thông tin chi tiêu theo nhu cầu
3. Nhấn nút "Cập nhật chi tiêu" để lưu thay đổi
4. Hoặc nhấn "Hủy sửa" để hủy thao tác

### Sao chép chi tiêu

1. Trong danh sách chi tiêu, nhấn vào nút "Sao chép" (biểu tượng copy) trên chi tiêu muốn sao chép
2. Một cửa sổ xác nhận sẽ hiển thị với thông tin chi tiêu sẽ được sao chép
3. Bạn có thể chọn sử dụng ngày hôm nay hoặc giữ ngày của chi tiêu gốc
4. Nhấn "Sao chép" để xác nhận và điền thông tin vào form
5. Kiểm tra lại thông tin và thực hiện điều chỉnh nếu cần
6. Nhấn "Lưu chi tiêu" để tạo một chi tiêu mới từ thông tin đã sao chép

Tính năng sao chép chi tiêu đặc biệt hữu ích trong các trường hợp:
- Chi tiêu lặp lại định kỳ (ví dụ: tiền cà phê hàng tuần)
- Chi tiêu tương tự với chi tiêu trước đó nhưng cần điều chỉnh nhỏ
- Muốn tạo nhanh chi tiêu mà không cần nhập lại tất cả thông tin

### Xóa chi tiêu

*Lưu ý: Chỉ người dùng có vai trò Admin mới có thể xóa chi tiêu*

1. Trong danh sách chi tiêu, nhấn vào nút "Xóa" (biểu tượng thùng rác) trên chi tiêu muốn xóa
2. Xác nhận việc xóa khi được hỏi

### Xem danh sách chi tiêu

- Tất cả chi tiêu đã thêm sẽ hiển thị trong phần "Danh sách chi tiêu"
- Mỗi chi tiêu hiển thị thông tin: tên, số tiền, ngày, người trả và người tham gia

## 3. Quản lý quỹ nhóm

### Xem số dư quỹ nhóm

1. Chọn tab "Quỹ nhóm"
2. Số dư quỹ nhóm hiển thị ở phần đầu trang

### Nộp quỹ nhóm

1. Chọn tab "Quỹ nhóm"
2. Trong phần "Nộp quỹ nhóm", điền thông tin:
   - **Thành viên**: Chọn thành viên nộp tiền
   - **Số tiền**: Nhập số tiền nộp
   - **Ngày**: Chọn ngày nộp tiền
   - **Ghi chú**: Nhập ghi chú (không bắt buộc)
3. Nhấn nút "Lưu khoản nộp"

### Xem thông tin quỹ

1. Chọn tab "Quỹ nhóm"
2. Chọn "Thông tin quỹ" để xem:
   - Số dư hiện tại
   - Nhắc nhở nộp tiền
   - Số dư của từng thành viên

### Thiết lập nhắc nhở

1. Chọn tab "Quỹ nhóm"
2. Chọn "Cài đặt nhắc nhở"
3. Chọn thành viên và nhập ngưỡng nhắc nhở (số âm, VD: -50,000)
4. Nhấn "Lưu thiết lập"

### Xem biểu đồ quỹ

1. Chọn tab "Quỹ nhóm"
2. Cuộn xuống để xem:
   - Biểu đồ tròn thể hiện tỷ lệ đóng góp của thành viên
   - Biểu đồ cột thể hiện thu chi theo thời gian

### Xem lịch sử giao dịch quỹ

1. Chọn tab "Quỹ nhóm"
2. Cuộn xuống phần "Lịch sử giao dịch quỹ" để xem danh sách các giao dịch

### Tạo mã QR thanh toán

1. Nhấn nút "Mã QR" trên trang Chi tiêu hoặc Quỹ nhóm
2. Mã QR sẽ được tạo để người khác có thể quét và thanh toán

## 4. Quản lý thành viên

### Xem danh sách thành viên

1. Chọn tab "Thành viên"
2. Danh sách thành viên được hiển thị với thông tin tài khoản ngân hàng

### Thêm thành viên mới

1. Chọn tab "Thành viên"
2. Nhấn nút "Thêm thành viên"
3. Nhập tên thành viên và thông tin tài khoản ngân hàng (nếu có)
4. Nhấn "Lưu thành viên"

### Sửa thông tin thành viên

1. Trong danh sách thành viên, nhấn vào nút "Sửa" trên thành viên muốn sửa
2. Thay đổi thông tin thành viên
3. Nhấn "Cập nhật thành viên" để lưu thay đổi

### Xóa thành viên

*Lưu ý: Chỉ người dùng có vai trò Admin mới có thể xóa thành viên*

1. Trong danh sách thành viên, nhấn vào nút "Xóa" trên thành viên muốn xóa
2. Xác nhận việc xóa khi được hỏi

## 5. Kết quả chia tiền

### Xem tổng kết cá nhân

1. Chọn tab "Chi tiêu"
2. Cuộn xuống phần "Kết quả chia tiền"
3. Trong phần "Tổng kết cá nhân", xem thông tin chi tiêu của từng thành viên:
   - Tổng chi tiêu đã trả
   - Tổng chi tiêu được hưởng
   - Số dư (dương là đang cho mượn, âm là đang nợ)

### Xem giao dịch cần thực hiện

1. Chọn tab "Chi tiêu"
2. Cuộn xuống phần "Kết quả chia tiền"
3. Trong phần "Giao dịch cần thực hiện", xem các giao dịch thanh toán giữa các thành viên
4. Các giao dịch này đã được tối ưu để giảm thiểu số lần thanh toán

### Tạo mã QR thanh toán

1. Bên cạnh mỗi giao dịch chuyển tiền sẽ có nút "QR"
2. Nhấn vào nút "QR" để hiển thị mã QR cho giao dịch đó
3. Mã QR chứa thông tin:
   - Tài khoản người nhận
   - Số tiền cần chuyển
   - Nội dung chuyển khoản
4. Người cần thanh toán có thể quét mã QR bằng ứng dụng ngân hàng để thực hiện chuyển khoản nhanh chóng

## 6. Các tính năng khác

### Làm mới dữ liệu

- Nhấn nút "Làm mới" ở góc trên bên phải để cập nhật dữ liệu từ Supabase
- Sử dụng khi có thành viên khác thực hiện thay đổi trên ứng dụng

### Xóa tất cả dữ liệu

*Lưu ý: Chỉ người dùng có vai trò Admin mới có thể xóa tất cả dữ liệu*

1. Cuộn xuống cuối trang
2. Nhấn nút "Xóa tất cả dữ liệu"
3. Xác nhận việc xóa khi được hỏi

### Chạy máy chủ cục bộ

Để chạy ứng dụng CafeThu6 trên máy tính cá nhân:

1. Cài đặt Python nếu bạn chưa có
2. Mở terminal hoặc command prompt
3. Di chuyển đến thư mục chứa mã nguồn của CafeThu6
4. Chạy lệnh sau để khởi động máy chủ HTTP đơn giản:
   ```
   python -m http.server 8000
   ```
   hoặc
   ```
   python3 -m http.server 8000
   ```
5. Mở trình duyệt web và truy cập địa chỉ: `http://localhost:8000`

*Lưu ý: Nếu gặp lỗi "Address already in use", hãy thử sử dụng cổng khác, ví dụ:*
```
python3 -m http.server 8080
```

### Thiết lập Supabase

Nếu bạn muốn sử dụng cơ sở dữ liệu Supabase riêng:

1. Đăng ký tài khoản tại [Supabase](https://supabase.com/)
2. Tạo dự án mới
3. Thiết lập các bảng cần thiết theo hướng dẫn trong tệp SUPABASE_SETUP.md
4. Cập nhật thông tin kết nối trong file js/utils/supabase.js

## Lưu ý

- Dữ liệu được lưu trữ trong cơ sở dữ liệu Supabase
- Mật khẩu mặc định cho tất cả người dùng là "Cafe"
- Thành viên "Giang" được thiết lập làm Admin mặc định
- Ứng dụng yêu cầu kết nối internet để đồng bộ dữ liệu 

## Xử lý sự cố

### Vấn đề về gợi ý tự động

1. **Gợi ý không hiển thị**
   - Kiểm tra xem đã có chi tiêu trong lịch sử chưa
   - Làm mới trang và thử lại
   - Đảm bảo không có lỗi JavaScript trong console

2. **Gợi ý hiển thị sai vị trí**
   - Nếu gợi ý hiển thị ở phía dưới trang thay vì dưới ô nhập liệu, hãy làm mới trang
   - Nếu vẫn tiếp tục, xóa cache trình duyệt và thử lại

### Vấn đề về đồng bộ dữ liệu

1. **Không thấy cập nhật mới**
   - Nhấn nút "Làm mới" ở góc trên bên phải
   - Kiểm tra kết nối internet
   - Đăng xuất và đăng nhập lại

2. **Lỗi khi lưu dữ liệu**
   - Kiểm tra kết nối internet
   - Kiểm tra quyền truy cập của người dùng
   - Thử lại sau vài phút (có thể Supabase đang bảo trì)

### Vấn đề chạy máy chủ cục bộ

1. **Lỗi "Address already in use"**
   - Sử dụng cổng khác: `python3 -m http.server 8080`
   - Kiểm tra và tắt các máy chủ khác đang chạy

2. **Không thể truy cập trang web**
   - Kiểm tra URL: `http://localhost:8000`
   - Đảm bảo máy chủ đang chạy
   - Thử sử dụng trình duyệt khác

### Liên hệ hỗ trợ

Nếu bạn gặp vấn đề khác không được đề cập ở trên, vui lòng liên hệ với quản trị viên hoặc tạo issue trên kho mã nguồn của dự án. 