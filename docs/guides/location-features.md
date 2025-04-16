# Hướng dẫn sử dụng tính năng vị trí (Location) trong CafeThu6

## Giới thiệu

CafeThu6 cho phép người dùng lưu trữ và hiển thị thông tin vị trí cho các khoản chi tiêu, giúp dễ dàng theo dõi địa điểm đã chi tiêu. Tính năng này đặc biệt hữu ích cho việc quản lý chi tiêu nhóm khi các thành viên thường xuyên gặp gỡ ở nhiều địa điểm khác nhau.

## Cách hoạt động

Khi tạo một khoản chi tiêu mới, người dùng có thể:
1. Chọn lưu thông tin vị trí hiện tại
2. Hệ thống tự động lấy tọa độ GPS từ thiết bị
3. Hệ thống cố gắng lấy tên địa điểm dựa vào tọa độ (nếu có thể)
4. Thông tin vị trí được lưu trữ cùng với khoản chi tiêu

## Cách sử dụng

### Lưu vị trí khi tạo chi tiêu mới

1. Mở form "Thêm chi tiêu mới"
2. Điền thông tin chi tiêu như bình thường
3. Bật công tắc "Lưu vị trí chi tiêu?"
4. Nhấn nút "Lấy vị trí" để lấy tọa độ vị trí hiện tại
5. Hệ thống sẽ hiển thị tọa độ và cố gắng lấy tên địa điểm
6. Người dùng có thể nhập tên địa điểm thủ công nếu muốn
7. Hoàn tất tạo chi tiêu như bình thường

### Xem thông tin vị trí trong danh sách chi tiêu

Với giao diện mới, xem thông tin vị trí trở nên dễ dàng hơn:

1. **Nhận biết chi tiêu có vị trí**: Các chi tiêu có lưu vị trí sẽ hiển thị badge location đặc biệt ở góc tiêu đề
2. **Xem nhanh tên địa điểm**: Tên địa điểm được hiển thị ngay trong bản ghi chi tiêu
3. **Xem chi tiết vị trí**: Có hai cách để xem chi tiết vị trí:
   - Nhấn vào nút "Vị trí" (icon bản đồ) trong thanh công cụ của bản ghi
   - Nhấn vào tên địa điểm hiển thị trong bản ghi
4. **Xem trên bản đồ**: Khi bạn nhấn vào nút vị trí hoặc tên địa điểm, hệ thống sẽ mở một cửa sổ bản đồ hiển thị vị trí chi tiêu

### Nút tác vụ vị trí mới

Với cải tiến giao diện mới, nút "Xem vị trí" đã được đưa ra ngoài thanh công cụ của bản ghi thay vì ẩn trong phần mở rộng. Điều này giúp:

- Truy cập nhanh: Xem vị trí không cần mở rộng bản ghi
- Nhận diện trực quan: Icon map-pin màu xanh dễ dàng nhận biết
- Thao tác nhanh: Chỉ cần một lần nhấp để xem bản đồ

## Bản đồ và thông tin địa điểm

### Xem vị trí trên bản đồ

Khi bạn nhấn vào nút "Vị trí" hoặc tên địa điểm, hệ thống sẽ:

1. Mở cửa sổ modal hiển thị bản đồ
2. Đặt đánh dấu (marker) tại vị trí được lưu
3. Hiển thị tên chi tiêu và tên địa điểm (nếu có)
4. Hiển thị tọa độ chính xác của vị trí

### Thông tin hiển thị trên bản đồ

Cửa sổ bản đồ sẽ hiển thị:
- Tên chi tiêu ở phần tiêu đề
- Tên địa điểm ở phần dưới bản đồ
- Tọa độ vị trí (latitude, longitude)
- Nút đóng để quay lại danh sách chi tiêu

## Tìm hiểu thêm về tọa độ địa lý

Ứng dụng lưu trữ thông tin vị trí dưới dạng:
- **Latitude (vĩ độ)**: Tọa độ địa lý theo chiều Bắc-Nam
- **Longitude (kinh độ)**: Tọa độ địa lý theo chiều Đông-Tây
- **Name (tên địa điểm)**: Tên địa điểm được lấy tự động hoặc nhập thủ công

## Cải tiến tương lai

Trong các phiên bản sắp tới, chúng tôi dự định cải thiện tính năng vị trí với:

- **Lịch sử địa điểm**: Gợi ý các địa điểm đã từng chi tiêu trước đó
- **Thống kê theo địa điểm**: Phân tích chi tiêu theo khu vực hoặc địa điểm cụ thể
- **Bản đồ nhiệt**: Hiển thị các khu vực có nhiều chi tiêu
- **Nhóm chi tiêu theo địa điểm**: Tìm kiếm và lọc theo địa điểm
- **Tích hợp dịch vụ bản đồ nâng cao**: Chỉ đường, thông tin địa điểm chi tiết hơn

## Câu hỏi thường gặp

**Hỏi**: Thông tin vị trí có được chia sẻ với bên thứ ba không?  
**Đáp**: Không. Thông tin vị trí chỉ được lưu trữ trong cơ sở dữ liệu của ứng dụng và không được chia sẻ.

**Hỏi**: Ứng dụng có theo dõi vị trí của tôi liên tục không?  
**Đáp**: Không. Ứng dụng chỉ lấy vị trí khi bạn nhấn nút "Lấy vị trí" trong quá trình tạo chi tiêu.

**Hỏi**: Tôi có thể chỉnh sửa thông tin vị trí sau khi đã lưu không?  
**Đáp**: Có. Bạn có thể chỉnh sửa chi tiêu và cập nhật thông tin vị trí như bình thường.

**Hỏi**: Tại sao tên địa điểm không chính xác?  
**Đáp**: Tên địa điểm được lấy tự động dựa vào dịch vụ geocoding có thể không luôn chính xác. Bạn có thể nhập tên thủ công nếu cần.

**Hỏi**: Tính năng vị trí có hoạt động khi không có kết nối internet không?  
**Đáp**: Lấy tọa độ GPS có thể hoạt động mà không cần internet, nhưng việc lấy tên địa điểm tự động sẽ yêu cầu kết nối internet.

**Hỏi**: Tôi không thấy nút "Vị trí" trên bản ghi?  
**Đáp**: Nút này chỉ xuất hiện cho những chi tiêu có lưu thông tin vị trí. 