# Hướng dẫn sử dụng tính năng gợi ý chi tiêu thông minh

## Giới thiệu

Tính năng gợi ý chi tiêu thông minh giúp người dùng nhanh chóng tạo chi tiêu mới dựa trên lịch sử các chi tiêu trước đó. Hệ thống sẽ phân tích lịch sử giao dịch trong 3 tháng gần nhất để đề xuất tên chi tiêu và số tiền phù hợp, giúp tiết kiệm thời gian nhập liệu và đảm bảo tính nhất quán trong cách đặt tên và số tiền chi tiêu.

## Cách hoạt động

Khi bạn mở form tạo chi tiêu mới, hệ thống sẽ:

1. Phân tích dữ liệu chi tiêu trong 3 tháng gần nhất
2. Tính toán tần suất xuất hiện của các tên chi tiêu
3. Xác định số tiền phổ biến nhất cho mỗi loại chi tiêu
4. Hiển thị tối đa 5 gợi ý phổ biến nhất

Các gợi ý được sắp xếp theo:
- Tần suất sử dụng (chi tiêu thường xuyên xuất hiện đầu tiên)
- Thời gian sử dụng gần đây (nếu tần suất bằng nhau)

## Cách sử dụng

### Bước 1: Mở form tạo chi tiêu mới
- Truy cập tab "Chi tiêu"
- Nhấn nút "Thêm chi tiêu mới" hoặc "+" để mở form

### Bước 2: Xem các gợi ý
- Phần gợi ý xuất hiện phía trên form nhập liệu
- Mỗi gợi ý hiển thị tên chi tiêu và số tiền đề xuất
- Các gợi ý được sắp xếp theo mức độ phổ biến

### Bước 3: Chọn gợi ý phù hợp
- Nhấp vào gợi ý muốn sử dụng
- Form sẽ tự động điền tên chi tiêu và số tiền tương ứng
- Gợi ý được chọn sẽ có hiệu ứng được làm nổi bật

### Bước 4: Hoàn thiện chi tiêu
- Điền những thông tin còn lại (ngày, người trả, người tham gia...)
- Các thông tin khác không được điền tự động để đảm bảo tính chính xác
- Nhấn "Lưu" để hoàn tất tạo chi tiêu

## Giao diện chi tiêu mới

Giao diện hiển thị chi tiêu đã được cải tiến với các thay đổi sau:

### Cải tiến hiển thị danh sách chi tiêu
- **Thu gọn không gian**: Mỗi bản ghi chi tiêu đã được thiết kế gọn hơn, hiển thị nhiều thông tin hơn trong không gian nhỏ hơn
- **Thông tin tinh gọn**: Hiển thị ngắn gọn các thông tin quan trọng (tên, số tiền, ngày, người trả)
- **Nhận dạng nhanh**: Badge vị trí và icon chia tiền giúp dễ dàng phân biệt các loại chi tiêu

### Các nút tác vụ nhanh
- **Truy cập tức thì**: Các nút tương tác quan trọng (Sao chép, Sửa, Xóa, Xem vị trí) được hiển thị trực tiếp trên mỗi bản ghi
- **Không cần mở rộng**: Người dùng có thể tương tác với chi tiêu mà không cần mở rộng (expand) bản ghi
- **Nhận diện trực quan**: Các nút được thiết kế với màu sắc và icon trực quan:
  - **Xem vị trí**: Icon bản đồ màu xanh
  - **Sao chép**: Icon copy màu xanh lá
  - **Sửa**: Icon bút màu xanh dương
  - **Xóa**: Icon thùng rác màu đỏ

### Thông tin chi tiết
- Người dùng vẫn có thể xem thông tin chi tiết bằng cách nhấn nút mở rộng (expand)
- Thông tin chi tiết hiển thị danh sách người tham gia và số tiền chia

## Ví dụ thực tế

**Tình huống**: Nhóm thường xuyên ăn trưa văn phòng với chi phí 250.000 VND.

1. Sau khi tạo chi tiêu "Ăn trưa văn phòng" vài lần, hệ thống ghi nhận đây là chi tiêu thường xuyên
2. Khi tạo chi tiêu mới, "Ăn trưa văn phòng - 250.000 VND" sẽ xuất hiện trong danh sách gợi ý
3. Người dùng chỉ cần nhấp vào gợi ý này, form sẽ tự động điền thông tin
4. Người dùng chỉ cần chọn người trả, người tham gia và lưu chi tiêu
5. Sau khi lưu, người dùng có thể thao tác nhanh với chi tiêu này bằng các nút tác vụ được hiển thị trực tiếp

## Những điểm cần lưu ý

- Tính năng gợi ý chỉ hoạt động khi đã có lịch sử chi tiêu (tối thiểu 1 chi tiêu)
- Chỉ phân tích chi tiêu trong 3 tháng gần nhất để đảm bảo gợi ý phù hợp với thói quen chi tiêu hiện tại
- Khi có nhiều giá trị khác nhau cho cùng một tên chi tiêu, hệ thống sẽ đề xuất giá trị phổ biến nhất
- Các nút tác vụ nhanh giúp tiết kiệm thời gian khi quản lý chi tiêu

## Câu hỏi thường gặp

**Hỏi**: Tôi không thấy gợi ý nào hiển thị?  
**Đáp**: Vui lòng kiểm tra xem bạn đã có lịch sử chi tiêu trong 3 tháng gần đây chưa. Nếu chưa, hãy tạo một số chi tiêu trước.

**Hỏi**: Gợi ý hiển thị số tiền không chính xác?  
**Đáp**: Hệ thống chọn số tiền phổ biến nhất. Nếu chi tiêu thường xuyên thay đổi số tiền, hãy chỉnh sửa lại sau khi chọn gợi ý.

**Hỏi**: Làm sao để xóa gợi ý không còn phù hợp?  
**Đáp**: Gợi ý được tạo tự động dựa trên lịch sử gần đây, chúng sẽ tự động thay đổi theo thời gian. Các chi tiêu quá 3 tháng sẽ không còn ảnh hưởng đến gợi ý.

**Hỏi**: Tôi muốn tạo chi tiêu mới hoàn toàn không dựa trên gợi ý?  
**Đáp**: Bạn vẫn có thể điền thông tin trực tiếp vào form mà không cần chọn gợi ý nào.

**Hỏi**: Tại sao các nút tác vụ (sửa, xóa, v.v.) hiển thị ngay trên bản ghi?  
**Đáp**: Đây là cải tiến mới giúp người dùng tương tác nhanh chóng với chi tiêu mà không cần mở rộng bản ghi, tiết kiệm thời gian và thao tác.

## Phát triển tương lai

Trong các phiên bản tiếp theo, tính năng gợi ý thông minh và giao diện sẽ được cải tiến thêm:
- Gợi ý người tham gia dựa trên các chi tiêu tương tự trước đó
- Gợi ý phương thức chia tiền (đều/tùy chỉnh) theo lịch sử
- Tùy chọn cá nhân hóa thời gian phân tích (1-6 tháng)
- Tích hợp AI để nhận diện mẫu chi tiêu và đề xuất ngân sách
- Thêm tùy chọn sắp xếp và lọc danh sách chi tiêu 