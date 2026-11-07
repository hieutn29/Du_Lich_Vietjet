# TASKS.md — Danh sách công việc cho Antigravity

Làm tuần tự. Hoàn thành xong tích `[x]`. Sau mỗi giai đoạn chạy thử bằng static server và kiểm tra console.

## Giai đoạn 0 — Khởi tạo
- [x] Tạo cấu trúc thư mục theo `PROJECT.md`.
- [x] Đặt `sql-wasm.js` và `sql-wasm.wasm` vào `lib/` (tải từ gói npm `sql.js` hoặc CDN, ghi chú nguồn trong README).
- [x] Tạo `README.md`: cách chạy (`python -m http.server 8000`), cách điền khoá EmailJS, cách reset DB.
- [x] Copy 3 ảnh người dùng cung cấp vào `assets/images/` (`hero-crew.jpg`, `logo-vietjet.jpg`, `hero-plane.jpg`).

## Giai đoạn 1 — Nền tảng giao diện
- [x] `css/variables.css`, `base.css`, `components.css` theo `DESIGN.md`.
- [x] `js/components.js`: navbar (badge giỏ hàng) + footer dùng chung.
- [x] `js/utils.js`: format tiền VND, ngày giờ, đọc query string, `escapeHtml`, toast.

## Giai đoạn 2 — Database
- [x] Viết `data/schema.sql` theo `DATABASE.md`.
- [x] Viết `data/seed.sql`: airlines, airports, aircraft, ≥ 40 flights + fares, ≥ 8 tour nổi bật + lịch trình.
- [x] `js/db.js`: khởi tạo sql.js, nạp/lưu `localStorage`, `query()`, `run()`, `saveDb()`, `resetDb()`.
- [x] Trang thử nghiệm in ra vài truy vấn để kiểm tra dữ liệu.

## Giai đoạn 3 — Trang chủ
- [x] Banner + form tìm chuyến bay (khứ hồi/một chiều, validate, chuyển sang `flights.html` kèm query).
- [x] Mục 8 tour nổi bật (thumbnail 600x400, hãng, ngày/đêm, giá) → `tour-detail.html`.
- [x] Mục logo hãng bay → `flights.html?airline=...`.

## Giai đoạn 4 — Chuyến bay
- [x] `flights.html`: đọc tham số tìm kiếm, tóm tắt tìm kiếm.
- [x] Bộ lọc trái: sắp xếp giá, loại vé, bay thẳng/nhiều thành phố, hãng, giờ cất cánh, hạng dịch vụ, xoá bộ lọc.
- [x] Danh sách chuyến bay bên phải + trạng thái rỗng.
- [x] `flight-detail.html`: thông tin chuyến, loại máy bay, hai thẻ hạng vé, nút Chọn → giỏ hàng.

## Giai đoạn 5 — Tour
- [x] `tours.html`: bộ lọc (sắp xếp giá, hãng, giờ cất cánh) + danh sách tour.
- [x] `tour-detail.html`: thông tin chuyến bay, lịch trình accordion, dịch vụ, nút Chọn tour → giỏ hàng.

## Giai đoạn 6 — Giỏ hàng & Đăng ký
- [x] `js/cart.js` + `cart.html` (xem, đổi số khách, xoá mục, xoá giỏ hàng).
- [x] `checkout.html`: form thông tin cá nhân, validate, tóm tắt đơn.
- [x] Ghi DB (transaction) khi đăng ký + màn hình hoàn thành.
- [x] `js/email.js` + `js/config.js`: gửi email EmailJS từ `tnhieu2992000@gmail.com` đến khách; xử lý lỗi/gửi lại.

## Giai đoạn 7 — Hoàn thiện
- [x] Responsive (360px / 640px / 900px / 1200px), drawer bộ lọc trên mobile.
- [x] Trạng thái loading, empty, lỗi; trợ năng cơ bản.
- [x] Rà soát: không còn dữ liệu hard-code trong HTML, không lỗi console, mọi liên kết đúng.
- [x] Chạy kiểm thử luồng ở `CART_CHECKOUT.md` mục 4 và báo cáo kết quả.

## Câu hỏi cần hỏi lại người dùng nếu gặp
- Có ảnh bố cục riêng cho trang chi tiết chuyến bay không (hiện dùng bố cục chuẩn hai thẻ hạng vé)?
- Logo các hãng bay ngoài VietJet: người dùng tự cung cấp hay dùng placeholder chữ?
- Ảnh thumbnail 8 tour: người dùng cung cấp hay dùng placeholder 600x400?
