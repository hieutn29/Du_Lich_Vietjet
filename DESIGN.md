# DESIGN.md — Thiết kế giao diện

## 1. Nguyên tắc
Giao diện **sáng, sạch, nền trắng**, màu chủ đạo **đỏ Vietjet `#ee1d23`**. Tham khảo phong cách các trang đặt vé (Vietjet, Traveloka): thẻ bo góc, đổ bóng nhẹ, nhiều khoảng trắng.

## 2. Biến CSS (`css/variables.css`)
```css
:root {
  --color-primary: #ee1d23;
  --color-primary-dark: #c8141a;
  --color-primary-light: #fdeaea;   /* nền nhẹ cho badge, hover */
  --color-accent: #ffc20e;          /* vàng, dùng tiết chế (nhãn giá tốt) */
  --color-bg: #ffffff;
  --color-surface: #f7f7f8;         /* nền section xen kẽ, sidebar */
  --color-border: #e5e7eb;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-success: #16a34a;
  --color-error: #dc2626;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.08);
  --shadow-md: 0 6px 20px rgba(0,0,0,.10);

  --font-main: "Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif;
  --container: 1200px;
}
```
Font tải từ Google Fonts (`Be Vietnam Pro`, weight 400/500/600/700) có fallback hệ thống.

## 3. Quy tắc dùng màu
- Nút chính (Tìm kiếm, Chọn, Thêm vào giỏ, Đăng ký): nền `--color-primary`, chữ trắng, hover `--color-primary-dark`.
- Nút phụ: viền đỏ, nền trắng, chữ đỏ.
- Giá tiền: chữ đỏ, đậm.
- Nền trang luôn trắng; section xen kẽ dùng `--color-surface`.
- Không dùng nền tối. Không dùng quá 2 màu nhấn ngoài đỏ.

## 4. Thành phần dùng chung
- **Navbar** (sticky): logo Vietjet (`logo-vietjet.jpg`, cao 40px) bên trái; menu: Trang chủ, Chuyến bay, Tour, Giỏ hàng (kèm badge số lượng đỏ). Mobile: menu hamburger.
- **Footer**: nền `--color-surface`, 3 cột (Giới thiệu, Liên kết, Liên hệ), dòng bản quyền "Website demo, không phải trang chính thức của hãng".
- **Button**: cao 44px, bo `--radius-md`.
- **Card**: nền trắng, viền `--color-border`, bo `--radius-md`, hover nâng nhẹ + `--shadow-md`.
- **Badge**: bo tròn, nền `--color-primary-light`, chữ đỏ.
- **Form input**: cao 44px, viền xám, focus viền đỏ.
- **Toast** thông báo (thêm giỏ hàng thành công, lỗi).
- **Skeleton/Loading** đơn giản khi sql.js đang khởi tạo.
- **Empty state** khi lọc không có kết quả hoặc giỏ hàng trống.

## 5. Bố cục chung
- Container tối đa 1200px, padding ngang 16px (mobile) / 24px.
- Trang Flights và Tours: grid 2 cột `280px | 1fr`, gap 24px. Mobile: bộ lọc thu gọn thành nút "Bộ lọc" mở drawer.
- Lưới tour: 4 cột desktop, 2 cột tablet, 1 cột mobile.

## 6. Hình ảnh
- Banner trang chủ dùng `hero-crew.jpg` (phủ lớp gradient trắng mờ bên trái để chữ và form dễ đọc).
- `hero-plane.jpg` dùng làm banner trang Flights/Detail (chiều cao 200–260px, `object-fit: cover`).
- Thumbnail tour: **600x400**. Nếu chưa có ảnh thật, dùng ảnh placeholder đúng kích thước 600x400 (SVG hoặc `picsum`-like local), không dùng hotlink từ trang khác.
- Logo hãng bay: ô vuông/ngang 140x60, nền trắng, viền nhạt, grayscale mặc định, hover hiện màu.

## 6.1 Responsive
Breakpoints: `640px`, `900px`, `1200px`. Thiết kế mobile-first.

## 7. Trợ năng
- Tương phản chữ/nền đạt WCAG AA.
- Focus ring rõ ràng (`outline: 2px solid var(--color-primary)`).
- Mọi nút/icon có `aria-label` nếu không có chữ.
