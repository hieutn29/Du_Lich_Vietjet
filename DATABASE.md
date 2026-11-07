# DATABASE.md — SQLite với sql.js (không backend)

## 1. Cách hoạt động
- Dùng thư viện **sql.js** (SQLite biên dịch sang WebAssembly) đặt trong `lib/` (`sql-wasm.js`, `sql-wasm.wasm`).
- Khi tải trang, `js/db.js`:
  1. Nếu `localStorage['vietjet_db']` có (base64 của DB đã lưu) → nạp DB từ đó.
  2. Nếu không → tạo DB mới, chạy `data/schema.sql` rồi `data/seed.sql` (dùng `fetch`).
  3. Xuất ra hàm `getDb()` (Promise, khởi tạo một lần) và `query(sql, params)` trả về mảng object.
- Sau mỗi lần **ghi** (tạo đơn hàng, khách hàng), gọi `saveDb()`: `db.export()` → base64 → `localStorage`.
- Nút/hàm `resetDb()` (chỉ cho dev) xoá `localStorage['vietjet_db']` để seed lại.
- Lưu ý: dữ liệu chỉ nằm trong trình duyệt của từng người dùng, đây là giới hạn của kiến trúc không backend.

## 2. Schema (`data/schema.sql`)
```sql
PRAGMA foreign_keys = ON;

CREATE TABLE airlines (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,        -- VJ, VN, SQ...
  name TEXT NOT NULL,
  logo TEXT                          -- đường dẫn assets/airlines/...
);

CREATE TABLE airports (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,        -- SGN, HAN, DAD...
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE aircraft (
  id INTEGER PRIMARY KEY,
  model TEXT NOT NULL               -- Airbus A321, Boeing 787-9...
);

CREATE TABLE flights (
  id INTEGER PRIMARY KEY,
  flight_no TEXT NOT NULL,
  airline_id INTEGER NOT NULL REFERENCES airlines(id),
  aircraft_id INTEGER NOT NULL REFERENCES aircraft(id),
  from_airport_id INTEGER NOT NULL REFERENCES airports(id),
  to_airport_id INTEGER NOT NULL REFERENCES airports(id),
  depart_at TEXT NOT NULL,          -- ISO 'YYYY-MM-DD HH:MM'
  arrive_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  stops INTEGER NOT NULL DEFAULT 0, -- 0 = bay thẳng
  stop_city TEXT,                   -- tên thành phố dừng nếu có
  trip_type TEXT NOT NULL DEFAULT 'both' CHECK (trip_type IN ('oneway','roundtrip','both')),
  carry_on_kg INTEGER DEFAULT 7,
  has_meal INTEGER DEFAULT 0
);

CREATE TABLE fares (
  id INTEGER PRIMARY KEY,
  flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  class TEXT NOT NULL CHECK (class IN ('economy','business')),
  price INTEGER NOT NULL,           -- VND
  checked_kg INTEGER NOT NULL DEFAULT 0,
  change_policy TEXT,
  refund_policy TEXT,
  seats_left INTEGER NOT NULL DEFAULT 9,
  UNIQUE (flight_id, class)
);

CREATE TABLE tours (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  thumbnail TEXT NOT NULL,          -- assets/images/tours/..., 600x400
  days INTEGER NOT NULL,
  nights INTEGER NOT NULL,
  price INTEGER NOT NULL,           -- VND /khách
  airline_id INTEGER NOT NULL REFERENCES airlines(id),
  aircraft_id INTEGER REFERENCES aircraft(id),
  from_airport_id INTEGER NOT NULL REFERENCES airports(id),
  to_airport_id INTEGER NOT NULL REFERENCES airports(id),
  depart_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  services TEXT,                    -- JSON array: ["Khách sạn 4*","Ăn sáng","HDV"]
  excludes TEXT,                    -- JSON array
  is_featured INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tour_itineraries (
  id INTEGER PRIMARY KEY,
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  day_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  meals TEXT,                       -- 'Sáng, Trưa, Tối'
  hotel TEXT
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT,                   -- CCCD/hộ chiếu, tuỳ chọn
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,  -- VJ-YYYYMMDD-XXXX
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  total INTEGER NOT NULL,
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending','sent','failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('flight','tour')),
  ref_id INTEGER NOT NULL,          -- flights.id hoặc tours.id
  fare_class TEXT,                  -- chỉ với flight
  title TEXT NOT NULL,              -- snapshot mô tả để gửi email
  pax INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL
);

CREATE INDEX idx_flights_route ON flights(from_airport_id, to_airport_id, depart_at);
CREATE INDEX idx_tours_featured ON tours(is_featured);
```

## 3. Dữ liệu mẫu (`data/seed.sql`)
Tất cả là **dữ liệu demo**, ghi comment `-- DEMO DATA` đầu file.

- **airlines (≥ 8)**: VietJet Air (VJ), Vietnam Airlines (VN), Bamboo Airways (QH), Singapore Airlines (SQ), Thai Airways (TG), Korean Air (KE), Japan Airlines (JL), Cathay Pacific (CX), AirAsia (AK), Qatar Airways (QR).
- **airports (≥ 10)**: SGN, HAN, DAD, PQC, CXR, HUI, DLI, SIN, BKK, ICN, NRT.
- **aircraft**: Airbus A320, A321, A330, A350, Boeing 737, 787-9, 777.
- **flights**: ≥ 40 chuyến, phủ các cặp tuyến chính (SGN↔HAN, SGN↔DAD, SGN↔PQC, HAN↔DAD, SGN↔SIN, SGN↔BKK, ...), mỗi tuyến ≥ 3 chuyến/ngày trong khoảng 60 ngày tới (sinh bằng script hoặc câu lệnh SQL đệ quy); trộn bay thẳng và có điểm dừng, nhiều khung giờ, nhiều hãng.
- **fares**: mọi chuyến có hạng `economy`; khoảng 50% chuyến có thêm `business` (giá cao hơn 2–4 lần).
- **tours**: đúng **8 tour nổi bật** (`is_featured=1`) cộng thêm vài tour thường để phân trang/lọc. Gợi ý: Đà Nẵng – Hội An, Phú Quốc, Nha Trang, Đà Lạt, Hà Nội – Hạ Long – Sapa, Singapore, Bangkok – Pattaya, Seoul – Nami. Mỗi tour 3–6 dòng lịch trình.
- Thumbnail tour: `assets/images/tours/tour-1.jpg` … kích thước **600x400**.

## 4. Truy vấn mẫu
```sql
-- Chuyến bay theo tuyến + ngày, kèm giá thấp nhất
SELECT f.*, a.name AS airline_name, a.code AS airline_code, a.logo,
       fa.name AS from_city, ta.name AS to_city,
       (SELECT MIN(price) FROM fares WHERE flight_id = f.id) AS min_price
FROM flights f
JOIN airlines a ON a.id = f.airline_id
JOIN airports fa ON fa.id = f.from_airport_id
JOIN airports ta ON ta.id = f.to_airport_id
WHERE fa.code = ? AND ta.code = ? AND date(f.depart_at) = ?
ORDER BY min_price ASC;
```
Lọc bổ sung (hãng, giờ cất cánh, bay thẳng, hạng) có thể thực hiện bằng SQL động có tham số hoặc lọc bằng JS sau khi lấy kết quả; chọn cách dễ bảo trì và vẫn dùng prepared statement.

## 5. Quy tắc
- Mọi truy vấn qua `query(sql, params)`; không nối chuỗi với dữ liệu người dùng.
- Khi tạo đơn: bọc trong transaction (`BEGIN`/`COMMIT`, `ROLLBACK` nếu lỗi), tính lại tổng tiền từ DB thay vì tin giá lưu trong giỏ hàng.
- Giá trị tiền là số nguyên VND, định dạng ở tầng hiển thị.
