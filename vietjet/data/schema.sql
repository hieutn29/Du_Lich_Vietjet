-- Schema SQLite cho website demo Vietjet (chạy bằng sql.js trong trình duyệt)
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
