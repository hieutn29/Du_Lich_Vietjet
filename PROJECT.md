# PROJECT.md — Website Du lịch & Vé máy bay "Vietjet"

> Đọc file này đầu tiên. Các file liên quan: `AGENTS.md`, `DESIGN.md`, `PAGES.md`, `DATABASE.md`, `CART_CHECKOUT.md`, `TASKS.md`.

## 1. Mục tiêu
Website đặt vé máy bay và tour du lịch tên **Vietjet**. Người dùng tìm chuyến bay, xem tour, thêm vào giỏ hàng, nhập thông tin cá nhân, đăng ký và nhận email xác nhận.

## 2. Công nghệ (bắt buộc)
- **HTML, CSS, JavaScript thuần (ES6+ modules)**. Không framework, không bundler, không backend.
- **Database: SQLite chạy trong trình duyệt bằng `sql.js` (WASM)**. Xem `DATABASE.md`.
- **Email: EmailJS** (gọi từ JavaScript thuần), gửi từ tài khoản `tnhieu2992000@gmail.com` đến email khách hàng. Xem `CART_CHECKOUT.md`.
- Lưu giỏ hàng bằng `localStorage`.
- Chạy bằng static server (ví dụ `python -m http.server 8000` hoặc VS Code Live Server). Không mở bằng `file://` vì cần `fetch` file `.sql` và `.wasm`.

## 3. Phạm vi trang
| Trang | File | Mô tả ngắn |
|---|---|---|
| Trang chủ | `index.html` | Form tìm chuyến bay, 8 tour nổi bật, logo hãng bay |
| Chuyến bay | `flights.html` | Bộ lọc trái, danh sách chuyến bay phải |
| Chi tiết chuyến bay | `flight-detail.html` | Thông tin chuyến, chọn hạng vé, thêm giỏ hàng |
| Tour | `tours.html` | Bộ lọc trái, danh sách tour phải |
| Chi tiết tour | `tour-detail.html` | Thông tin chuyến bay của tour, lịch trình, thêm giỏ hàng |
| Giỏ hàng | `cart.html` | Xem, xoá mục, xoá toàn bộ giỏ hàng |
| Thanh toán/Đăng ký | `checkout.html` | Nhập thông tin cá nhân, đăng ký, thông báo hoàn thành, gửi email |

## 4. Cấu trúc thư mục
```
vietjet/
├── index.html
├── flights.html
├── flight-detail.html
├── tours.html
├── tour-detail.html
├── cart.html
├── checkout.html
├── css/
│   ├── variables.css      # màu, font, spacing
│   ├── base.css           # reset, typography
│   ├── components.css     # button, card, form, badge, navbar, footer
│   └── pages/             # home.css, flights.css, ...
├── js/
│   ├── db.js              # khởi tạo sql.js, query helper, lưu DB
│   ├── cart.js            # giỏ hàng (localStorage)
│   ├── email.js           # EmailJS
│   ├── utils.js           # format tiền, ngày, giờ, đọc query string
│   ├── components.js      # render navbar/footer dùng chung
│   └── pages/             # home.js, flights.js, flight-detail.js, tours.js, tour-detail.js, cart.js, checkout.js
├── data/
│   ├── schema.sql
│   └── seed.sql
├── lib/
│   └── sql-wasm.js, sql-wasm.wasm   # sql.js
└── assets/
    ├── images/            # hero, logo, tour thumbnails
    └── airlines/          # logo các hãng bay
```

## 5. Tài nguyên hình ảnh do người dùng cung cấp
Đặt vào `assets/images/` với tên sau:
- `hero-crew.jpg`: ảnh phi hành đoàn chào, dùng làm banner trang chủ.
- `logo-vietjet.jpg`: logo vuông màu đỏ, dùng cho navbar/favicon và hãng VietJet Air.
- `hero-plane.jpg`: ảnh máy bay trên trời, dùng làm banner phụ hoặc trang chi tiết chuyến bay.

## 6. Quy ước dữ liệu
- Toàn bộ giá, giờ bay, tour là **dữ liệu mẫu (demo)** trong `seed.sql`. Không ghi là dữ liệu thật của hãng.
- Tiền tệ: VND, định dạng `1.250.000 ₫`.
- Ngày: `dd/MM/yyyy`; giờ 24h `HH:mm`.
- Ngôn ngữ giao diện: tiếng Việt.

## 7. Tiêu chí hoàn thành
- Luồng đầy đủ chạy được: Trang chủ → Flights → Detail → Giỏ hàng → Checkout → Hoàn thành + email.
- Mọi bộ lọc hoạt động và kết hợp được với nhau.
- Giao diện responsive (mobile ≥ 360px, tablet, desktop).
- Không lỗi console.
