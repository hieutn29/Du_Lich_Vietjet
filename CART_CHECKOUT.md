# CART_CHECKOUT.md — Giỏ hàng, Thông tin cá nhân, Đăng ký, Email

## 1. Giỏ hàng (`cart.html`, `js/cart.js`)

### Lưu trữ
`localStorage['vietjet_cart']` = mảng mục:
```json
[
  { "key": "flight-12-economy", "type": "flight", "refId": 12, "fareClass": "economy", "pax": 2 },
  { "key": "tour-3", "type": "tour", "refId": 3, "pax": 2 }
]
```
Giỏ hàng **chỉ lưu id và số lượng**; tên, giá, giờ bay lấy lại từ SQLite khi hiển thị, để giá luôn đúng nguồn.

### API trong `cart.js`
`getCart()`, `addItem(item)`, `removeItem(key)`, `updatePax(key, pax)`, `clearCart()`, `getCount()`. Mỗi thay đổi phát sự kiện `cart:changed` để navbar cập nhật badge.

### Giao diện
- Danh sách mục: loại (Chuyến bay/Tour), mô tả (tuyến, ngày giờ, hãng, hạng vé, hoặc tên tour), số khách (± 1–9), đơn giá, thành tiền, nút **Xoá** từng mục.
- Nút **Xoá giỏ hàng** (xoá tất cả) có hộp xác nhận "Bạn chắc chắn muốn xoá toàn bộ giỏ hàng?".
- Tổng tiền cập nhật tức thì.
- Giỏ trống: thông báo + nút về Chuyến bay / Tour.
- Nút **Tiếp tục: Nhập thông tin** → `checkout.html` (vô hiệu khi giỏ trống).

## 2. Nhập thông tin cá nhân & Đăng ký (`checkout.html`)

### Form
| Trường | Bắt buộc | Kiểm tra |
|---|---|---|
| Họ và tên | có | ≥ 2 ký tự |
| Email | có | đúng định dạng email |
| Số điện thoại | có | số VN: `^(0|\+84)\d{9}$` |
| CCCD/Hộ chiếu | không | 9–12 ký tự chữ-số |
| Ghi chú | không | tối đa 500 ký tự |
| Đồng ý điều khoản | có | checkbox |

Bên phải hiển thị **tóm tắt đơn hàng** (các mục + tổng tiền). Giỏ trống thì chuyển về `cart.html`.

### Luồng khi bấm **Đăng ký**
1. Validate; lỗi hiện dưới từng trường.
2. Ghi DB trong một transaction: `customers` → `orders` (tạo `order_code`) → `order_items`; lưu DB (`saveDb()`).
3. Gửi email xác nhận (mục 3). Cập nhật `orders.email_status` = `sent` hoặc `failed`.
4. Xoá giỏ hàng.
5. Hiện màn hình **"Đăng ký hoàn thành"**: dấu tích xanh, mã đơn, tóm tắt, dòng "Chúng tôi đã gửi email xác nhận tới <email>" (hoặc cảnh báo nếu gửi thất bại + nút "Gửi lại email"), nút "Về trang chủ".
- Chống bấm đúp: vô hiệu nút khi đang xử lý, hiện spinner.

## 3. Gửi email (`js/email.js`, `js/config.js`)

### Yêu cầu
Một email gửi **từ `tnhieu2992000@gmail.com`** đến **email khách hàng** vừa nhập.

### Cách làm: EmailJS
1. Người dùng tự tạo tài khoản EmailJS, kết nối dịch vụ **Gmail** bằng tài khoản `tnhieu2992000@gmail.com`.
2. Tạo template với các biến: `{{to_email}}`, `{{to_name}}`, `{{order_code}}`, `{{order_items}}`, `{{total}}`, `{{created_at}}`.
   - Trong cài đặt template: **To email** = `{{to_email}}`; **From name** = `Vietjet`.
3. `js/config.js` (placeholder, người dùng tự điền):
```js
export const EMAILJS_CONFIG = {
  publicKey: "YOUR_PUBLIC_KEY",
  serviceId: "YOUR_SERVICE_ID",
  templateId: "YOUR_TEMPLATE_ID",
  senderEmail: "tnhieu2992000@gmail.com"
};
```
4. Gọi `emailjs.send(serviceId, templateId, params)` bằng SDK `@emailjs/browser` (CDN).
5. Nếu key còn là placeholder: bỏ qua gửi, ghi log cảnh báo trên console, đánh dấu `failed`, và hiện thông báo "Chưa cấu hình EmailJS" trên màn hình hoàn thành. Không được làm hỏng luồng đăng ký.

### Nội dung email (tiếng Việt)
- Tiêu đề: `[Vietjet] Xác nhận đăng ký – Mã đơn {{order_code}}`
- Nội dung: lời chào theo tên khách, mã đơn, danh sách mục đã chọn (chuyến bay/tour, ngày giờ, số khách, giá), tổng tiền, ghi chú "Đây là website demo".
- Nội dung HTML đơn giản, tông đỏ `#ee1d23`.

### Lưu ý an toàn
- Public Key của EmailJS nằm ở phía client là bình thường, nhưng nên bật giới hạn domain và giới hạn số email trong dashboard EmailJS để tránh bị lạm dụng.
- Không bao giờ để mật khẩu Gmail trong code.
- Tài khoản EmailJS gói miễn phí có giới hạn số email mỗi tháng.

## 4. Kiểm thử luồng
- Thêm 1 chuyến bay + 1 tour → giỏ có 2 mục, badge = 2.
- Xoá 1 mục, đổi số khách → tổng tiền đúng.
- Xoá giỏ hàng → giỏ trống.
- Đăng ký với dữ liệu sai → hiện lỗi, không ghi DB.
- Đăng ký đúng → có bản ghi trong `customers`, `orders`, `order_items`; giỏ hàng trống; email tới hộp thư khách (khi đã cấu hình EmailJS).
