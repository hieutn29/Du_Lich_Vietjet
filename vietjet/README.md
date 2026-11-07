# Vietjet – Website demo đặt vé máy bay & tour du lịch

Website tĩnh (HTML, CSS, JavaScript thuần) với cơ sở dữ liệu SQLite chạy ngay trong trình duyệt bằng **sql.js**.
Toàn bộ giá vé, lịch bay và tour là **dữ liệu demo**, không phải dữ liệu thật của hãng.

## 1. Chạy website

Cần chạy qua static server (không mở bằng `file://`, vì trang phải `fetch` file `.sql` và `.wasm`):

```bash
cd vietjet
python -m http.server 8000
```

Mở <http://localhost:8000>. Hoặc dùng VS Code Live Server, mở thư mục `vietjet/`.

## 2. Cấu trúc

| Trang | File |
|---|---|
| Trang chủ | `index.html` |
| Chuyến bay | `flights.html` |
| Chi tiết chuyến bay | `flight-detail.html?id=...` |
| Tour | `tours.html` |
| Chi tiết tour | `tour-detail.html?id=...` |
| Giỏ hàng | `cart.html` |
| Nhập thông tin / Đăng ký | `checkout.html` |
| Kiểm tra DB (dev) | `dev.html` |

- `css/` – `variables.css` (màu, font), `base.css`, `components.css`, `pages/*.css`
- `js/` – `db.js` (sql.js), `cart.js` (giỏ hàng localStorage), `order.js` (tính giá giỏ hàng từ DB), `email.js` + `config.js` (EmailJS), `utils.js`, `components.js`; mỗi trang một file trong `js/pages/`
- `data/schema.sql`, `data/seed.sql` – schema và dữ liệu demo (chuyến bay sinh tự động cho 60 ngày kể từ ngày seed)
- `lib/sql-wasm.js`, `lib/sql-wasm.wasm` – **sql.js 1.10.3**, tải từ cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/`

## 3. Cấu hình gửi email (EmailJS)

1. Tạo tài khoản tại <https://www.emailjs.com>.
2. **Email Services → Add New Service → Gmail**, đăng nhập bằng `tnhieu2992000@gmail.com`. Ghi lại **Service ID**.
3. **Email Templates → Create New Template**:
   - **Subject**: `[Vietjet] Xác nhận đăng ký – Mã đơn {{order_code}}`
   - **To Email**: `{{to_email}}`
   - **From Name**: `Vietjet`
   - **Content** (chế độ HTML / Code editor), ví dụ:
     ```html
     <div style="font-family:Arial,sans-serif;color:#1f2937">
       <h2 style="color:#ee1d23">Xin chào {{to_name}},</h2>
       <p>Cảm ơn bạn đã đăng ký. Mã đơn: <strong style="color:#ee1d23">{{order_code}}</strong> ({{created_at}})</p>
       {{{order_items_html}}}
       <p style="font-size:18px">Tổng tiền: <strong style="color:#ee1d23">{{total}}</strong></p>
       <p>Ghi chú của bạn: {{note}}</p>
       <p style="color:#6b7280;font-size:12px">Đây là website demo, không phải trang chính thức của hãng.</p>
     </div>
     ```
     (Dùng `{{order_items}}` nếu muốn bản văn bản thuần.) Ghi lại **Template ID**.
4. **Account → General**: lấy **Public Key**.
5. Mở `js/config.js` và thay 3 giá trị `YOUR_PUBLIC_KEY`, `YOUR_SERVICE_ID`, `YOUR_TEMPLATE_ID`.

Biến template được gửi: `to_email`, `to_name`, `order_code`, `order_items`, `order_items_html`, `total`, `created_at`, `note`, `from_email`.

Khi chưa cấu hình, đăng ký vẫn hoàn thành bình thường; màn hình hoàn thành hiện thông báo “Chưa cấu hình EmailJS” và đơn được đánh dấu `email_status = 'failed'`.

**An toàn:** Public Key nằm phía client là bình thường, nhưng nên bật giới hạn domain (Allowed origins) và giới hạn số email trong dashboard EmailJS. Không bao giờ đặt mật khẩu Gmail trong code. Gói miễn phí có giới hạn số email mỗi tháng.

## 4. Database

- **Nguồn dữ liệu là file `data/db.db`** (tạo/sửa bằng DB Browser for SQLite, schema theo `DATABASE.md`). `js/db.js` tải file này bằng `fetch`, mở bằng sql.js và kiểm tra đủ 10 bảng.
- Sửa dữ liệu trong DB Browser → nhớ bấm **Write Changes (Ctrl+S)** → tải lại trang web. Website tự nhận ra `db.db` đã đổi (so dấu vân tay file) và nạp lại.
- Đơn hàng, khách hàng đăng ký trên web được ghi vào bản sao trong `localStorage['vietjet_db']` của trình duyệt (website tĩnh không ghi ngược được vào file trên server). Khi `db.db` thay đổi, bản sao này được làm mới.
- `dev.html`: xem nhanh dữ liệu, **Nạp lại từ db.db**, và **Tải DB (kèm đơn hàng)** để lấy file .db có các đơn đã đăng ký, mở được bằng DB Browser.
- `data/schema.sql` + `data/seed.sql` là dữ liệu demo gốc; `python data/build_db.py` tạo `data/export/vietjet.db` và `data/export/vietjet_import.sql` từ hai file này (để nhập vào DB Browser nếu muốn dùng dữ liệu demo).

## 5. Hình ảnh

- `assets/images/hero-crew.jpg`, `hero-plane.jpg`, `logo-vietjet.jpg` – ảnh do người dùng cung cấp.
- `assets/images/tours/tour-1.svg … tour-12.svg` – ảnh minh hoạ placeholder 600×400. Muốn dùng ảnh thật: đặt file 600×400 (vd `tour-1.jpg`) vào thư mục này và sửa cột `thumbnail` trong `data/seed.sql`, sau đó tăng `DB_VERSION`.
- Logo hãng bay khác: đặt file vào `assets/airlines/` (vd `vn.png`, khuyến nghị 140×60) và điền đường dẫn vào cột `logo` của bảng `airlines` trong `seed.sql`. Khi chưa có logo, giao diện hiển thị mã hãng trong khung.
