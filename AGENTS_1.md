# AGENTS.md — Quy tắc cho Antigravity

Bạn là lập trình viên frontend xây website **Vietjet** (du lịch + vé máy bay). Luôn đọc `PROJECT.md`, `DESIGN.md`, `PAGES.md`, `DATABASE.md`, `CART_CHECKOUT.md` trước khi viết code. Làm theo thứ tự trong `TASKS.md`.

## Quy tắc bắt buộc
1. Chỉ dùng **HTML, CSS, JavaScript thuần**. Không React/Vue/jQuery/Tailwind/Bootstrap, không backend, không Node server.
2. Database là **SQLite qua sql.js** chạy trên trình duyệt. Mọi dữ liệu chuyến bay, tour, hãng bay đọc bằng SQL từ DB, không hard-code trong HTML.
3. Màu chủ đạo `#ee1d23`, nền trắng, giao diện sáng. Dùng CSS variables trong `css/variables.css`, không viết mã màu rải rác.
4. Không tự bịa dữ liệu thật. Dữ liệu trong `seed.sql` là dữ liệu mẫu và phải ghi chú "demo" trong comment.
5. Không đưa khoá bí mật vào code. Khoá EmailJS để trong `js/config.js` với giá trị placeholder, ghi rõ trong README chỗ cần điền.
6. Không xoá file có sẵn của người dùng. Nếu cần thay thế, hỏi trước.
7. Mỗi trang có file JS riêng trong `js/pages/`. Logic dùng chung nằm trong `js/` gốc.
8. Dùng `type="module"` cho script. Không dùng biến toàn cục.
9. Chống XSS: dùng `textContent` hoặc hàm `escapeHtml()` khi chèn dữ liệu người dùng nhập vào DOM.
10. Truy vấn SQL dùng **prepared statement** (`db.prepare` + bind), không nối chuỗi với dữ liệu người dùng.

## Phong cách code
- Tên biến/hàm tiếng Anh `camelCase`; class CSS `kebab-case` theo BEM nhẹ (`flight-card__price`).
- Comment ngắn gọn bằng tiếng Việt ở chỗ khó hiểu.
- Mỗi hàm một việc. Tránh file JS dài hơn ~300 dòng.
- Semantic HTML (`header`, `nav`, `main`, `section`, `footer`), có `alt` cho ảnh, `label` cho input.
- Hình tour thumbnail đúng tỉ lệ **600x400** (`aspect-ratio: 3/2`, `object-fit: cover`), có `loading="lazy"`.

## Quy trình làm việc
- Làm từng task trong `TASKS.md`, xong task nào tích `[x]`.
- Sau mỗi task chạy thử trên static server, kiểm tra console không lỗi.
- Khi thiếu thông tin hoặc có mâu thuẫn giữa các file, **hỏi người dùng** thay vì đoán.

## Việc không được làm
- Không thêm thư viện ngoài ngoại trừ `sql.js` và SDK `@emailjs/browser` (qua CDN hoặc file local).
- Không dùng logo/hình có bản quyền ngoài những ảnh người dùng cung cấp. Logo các hãng bay khác dùng file người dùng tự thêm vào `assets/airlines/`; nếu chưa có, hiển thị placeholder chữ (tên hãng trong khung).
