# PAGES.md — Đặc tả từng trang

Truyền tham số giữa các trang bằng **query string**. Dữ liệu lấy từ SQLite (xem `DATABASE.md`).

---

## 1. Trang chủ — `index.html`

### 1.1 Banner + Form tìm chuyến bay
Hero dùng `hero-crew.jpg`, form nằm trong thẻ trắng nổi lên trên banner.

Trường trong form:
- **Loại vé**: radio `Khứ hồi` / `Một chiều` (mặc định Khứ hồi).
- **Điểm xuất phát**: select/autocomplete từ bảng `airports` (hiển thị `Thành phố (MÃ)`).
- **Điểm đến**: tương tự; có nút đảo chiều ⇄.
- **Ngày đi**: `input type=date`, tối thiểu là hôm nay.
- **Ngày về**: chỉ hiện khi chọn Khứ hồi; phải ≥ ngày đi.
- **Số hành khách**: người lớn (1–9) — tuỳ chọn, mặc định 1.
- Nút **Tìm kiếm**.

Validate: bắt buộc điểm đi, điểm đến, ngày đi; điểm đi ≠ điểm đến; hiện lỗi dưới từng trường.

Khi bấm Tìm kiếm chuyển đến:
`flights.html?trip=roundtrip|oneway&from=SGN&to=HAN&depart=2026-12-01&return=2026-12-05&pax=1`

### 1.2 Tour nổi bật
- Tiêu đề "Tour du lịch nổi bật", **8 tour** (lấy `tours WHERE is_featured=1 LIMIT 8`).
- Lưới 4 cột. Mỗi thẻ gồm:
  - Thumbnail **600x400**
  - Tên tour
  - Hãng bay (tên + logo nhỏ) — theo `airline_id` của tour
  - Số ngày/đêm (vd `4 ngày 3 đêm`)
  - Giá từ (đỏ, đậm): `Từ 5.990.000 ₫`
- Click cả thẻ → `tour-detail.html?id=<tour_id>`.
- Link "Xem tất cả tour" → `tours.html`.

### 1.3 Hãng hàng không
- Hàng/lưới logo: VietJet Air, Vietnam Airlines, Singapore Airlines, Bamboo Airways, Thai Airways, Korean Air, Japan Airlines, Cathay Pacific, AirAsia, Qatar Airways (lấy từ bảng `airlines`).
- Click logo → `flights.html?airline=<airline_code>` (trang Flights tự tick sẵn hãng đó).

---

## 2. Chuyến bay — `flights.html`

Banner nhỏ (hero-plane) + thanh tóm tắt tìm kiếm (điểm đi → điểm đến, ngày, số khách) có nút "Đổi tìm kiếm".

### 2.1 Cột trái — Bộ lọc
| Bộ lọc | Kiểu | Giá trị |
|---|---|---|
| Sắp xếp giá | radio | Giá tăng dần / Giá giảm dần |
| Loại vé | radio | Tất cả / Khứ hồi / Một chiều |
| Số điểm dừng | checkbox | Bay thẳng / Nhiều thành phố (có điểm dừng) |
| Hãng hàng không | checkbox (danh sách từ DB) | |
| Giờ cất cánh | checkbox | 00:00–06:00, 06:00–12:00, 12:00–18:00, 18:00–24:00 |
| Hạng dịch vụ | checkbox | Phổ thông, Thương gia |
| Nút | | "Xoá bộ lọc" |

- Lọc cập nhật kết quả ngay (không reload trang), hiện "Tìm thấy N chuyến bay".
- Các bộ lọc kết hợp theo AND giữa các nhóm, OR trong một nhóm.
- Mặc định sắp xếp giá tăng dần.

### 2.2 Cột phải — Danh sách chuyến bay
Mỗi thẻ chuyến bay gồm:
- Logo + tên hãng, số hiệu chuyến (vd `VJ123`)
- Giờ cất cánh → giờ hạ cánh, mã sân bay đi/đến
- Thời gian bay (vd `2h 05m`), nhãn `Bay thẳng` hoặc `1 điểm dừng (Đà Nẵng)`
- Ngày cất cánh `dd/MM/yyyy`
- Dịch vụ: hành lý xách tay, hành lý ký gửi, suất ăn (icon + chữ ngắn)
- Giá thấp nhất `Từ 1.250.000 ₫ /khách` (giá hạng Phổ thông)
- Nút **Chọn** → `flight-detail.html?id=<flight_id>&pax=<n>&class=economy`

Nếu `trip=roundtrip`, hiển thị hai tab "Chuyến đi" và "Chuyến về" hoặc hai khối kết quả. Dùng cách đơn giản nhất mà vẫn cho chọn được cả hai chiều.

Trạng thái rỗng: "Không tìm thấy chuyến bay phù hợp" + nút Xoá bộ lọc.

---

## 3. Chi tiết chuyến bay — `flight-detail.html?id=...`

Bố cục (theo bố cục chuẩn trang đặt vé; sẽ chỉnh lại nếu người dùng gửi ảnh tham khảo riêng):

### 3.1 Khối thông tin chuyến
- Điểm đi → Điểm đến (thành phố, mã sân bay, tên sân bay) kèm biểu tượng máy bay giữa.
- Ngày, giờ cất cánh, giờ hạ cánh, **thời gian bay**, điểm dừng.
- **Hãng bay** (logo + tên), số hiệu chuyến.
- **Loại máy bay** (Airbus A321, Boeing 787...).

### 3.2 Chọn giá vé (hai thẻ cạnh nhau)
| | Hạng Phổ Thông | Hạng Thương Gia |
|---|---|---|
| Giá | giá/khách | giá/khách |
| Hành lý xách tay | có | có |
| Hành lý ký gửi | theo bảng | nhiều hơn |
| Suất ăn | tuỳ | có |
| Đổi vé | có phí | linh hoạt |
| Hoàn vé | có phí | có điều kiện |
| Nút | **Chọn** | **Chọn** |

- Dữ liệu từ bảng `fares` (mỗi chuyến có 1–2 hạng).
- Hạng không có thì ẩn hoặc làm mờ ghi "Hết chỗ".
- Hiện tổng tạm tính = giá × số khách.

### 3.3 Hành động
- Bấm **Chọn** ở một hạng → lưu vào **Giỏ hàng** (`type: 'flight'`, kèm `fareClass`, `pax`) → toast "Đã thêm vào giỏ hàng" → hiện 2 nút: "Xem giỏ hàng" / "Tiếp tục tìm chuyến bay".
- Nếu mục đó đã có trong giỏ (cùng flightId + hạng), tăng số khách hoặc cập nhật, không nhân đôi dòng.

---

## 4. Tour — `tours.html`

### 4.1 Cột trái — Bộ lọc
| Bộ lọc | Kiểu |
|---|---|
| Sắp xếp giá | radio: Giá tăng dần / Giá giảm dần |
| Hãng hàng không | checkbox (từ DB) |
| Giờ cất cánh | checkbox khung giờ như trang Flights |
| Nút | "Xoá bộ lọc" |

### 4.2 Cột phải — Danh sách tour
Mỗi thẻ tour (bố cục ngang hoặc thẻ lớn) gồm:
- Thumbnail 600x400, tên tour, điểm đến
- Hãng bay (logo + tên), **ngày cất cánh**, **giờ cất cánh**, **thời gian bay**
- Số ngày/đêm
- Dịch vụ bao gồm (khách sạn, ăn sáng, xe đưa đón, HDV...)
- Giá tour `Từ x ₫ /khách`
- Nút **Chọn tour** → `tour-detail.html?id=<tour_id>`

---

## 5. Chi tiết tour — `tour-detail.html?id=...`
- Ảnh đại diện 600x400 (hoặc gallery nhỏ), tên tour, số ngày/đêm, giá.
- **Thông tin chuyến bay của tour**: điểm đi, điểm đến, thời gian bay, hãng bay, loại máy bay (Boeing, Airbus...), ngày giờ cất cánh.
- **Lịch trình chuyến đi**: danh sách Ngày 1, Ngày 2... (accordion), mỗi ngày có tiêu đề, mô tả, bữa ăn (sáng/trưa/tối), nơi nghỉ. Dữ liệu từ `tour_itineraries`.
- Dịch vụ bao gồm / không bao gồm.
- Chọn số khách + nút **Chọn tour / Thêm vào giỏ hàng** → lưu giỏ hàng (`type: 'tour'`) → toast + nút "Xem giỏ hàng".

---

## 6. Giỏ hàng & Đăng ký
Xem chi tiết ở `CART_CHECKOUT.md`.

---

## 7. Điều hướng & dùng chung
- Navbar/footer render bằng `js/components.js`, đánh dấu mục menu đang active.
- Badge giỏ hàng cập nhật khi thêm/xoá.
- Trang thiếu tham số hoặc id không tồn tại: hiện thông báo thân thiện + link về trang chủ.
- Tiêu đề `<title>` riêng cho từng trang.
