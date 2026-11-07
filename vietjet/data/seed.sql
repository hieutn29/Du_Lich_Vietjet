-- DEMO DATA
-- Toàn bộ dữ liệu dưới đây là DỮ LIỆU MẪU (demo) phục vụ học tập/thử nghiệm.
-- Giá vé, giờ bay, số hiệu chuyến, tour... KHÔNG phải dữ liệu thật của bất kỳ hãng hàng không nào.
-- Ngày bay được sinh tương đối theo ngày hiện tại (60 ngày tới) bằng truy vấn đệ quy.

-- ===== Hãng hàng không (demo) =====
-- logo = NULL: giao diện hiển thị placeholder chữ. Thêm file vào assets/airlines/ rồi cập nhật cột logo.
INSERT INTO airlines (id, code, name, logo) VALUES
  (1,  'VJ', 'VietJet Air',        'assets/images/logo-vietjet.jpg'),
  (2,  'VN', 'Vietnam Airlines',   NULL),
  (3,  'QH', 'Bamboo Airways',     NULL),
  (4,  'SQ', 'Singapore Airlines', NULL),
  (5,  'TG', 'Thai Airways',       NULL),
  (6,  'KE', 'Korean Air',         NULL),
  (7,  'JL', 'Japan Airlines',     NULL),
  (8,  'CX', 'Cathay Pacific',     NULL),
  (9,  'AK', 'AirAsia',            NULL),
  (10, 'QR', 'Qatar Airways',      NULL);

-- ===== Sân bay (demo) =====
INSERT INTO airports (id, code, city, name, country) VALUES
  (1,  'SGN', 'Hồ Chí Minh', 'Sân bay quốc tế Tân Sơn Nhất', 'Việt Nam'),
  (2,  'HAN', 'Hà Nội',      'Sân bay quốc tế Nội Bài',      'Việt Nam'),
  (3,  'DAD', 'Đà Nẵng',     'Sân bay quốc tế Đà Nẵng',      'Việt Nam'),
  (4,  'PQC', 'Phú Quốc',    'Sân bay quốc tế Phú Quốc',     'Việt Nam'),
  (5,  'CXR', 'Nha Trang',   'Sân bay quốc tế Cam Ranh',     'Việt Nam'),
  (6,  'HUI', 'Huế',         'Sân bay quốc tế Phú Bài',      'Việt Nam'),
  (7,  'DLI', 'Đà Lạt',      'Sân bay Liên Khương',          'Việt Nam'),
  (8,  'SIN', 'Singapore',   'Sân bay Changi',               'Singapore'),
  (9,  'BKK', 'Bangkok',     'Sân bay Suvarnabhumi',         'Thái Lan'),
  (10, 'ICN', 'Seoul',       'Sân bay quốc tế Incheon',      'Hàn Quốc'),
  (11, 'NRT', 'Tokyo',       'Sân bay quốc tế Narita',       'Nhật Bản'),
  (12, 'HKG', 'Hồng Kông',   'Sân bay quốc tế Hồng Kông',    'Trung Quốc'),
  (13, 'DOH', 'Doha',        'Sân bay quốc tế Hamad',        'Qatar');

-- ===== Loại máy bay =====
INSERT INTO aircraft (id, model) VALUES
  (1, 'Airbus A320'),
  (2, 'Airbus A321'),
  (3, 'Airbus A330'),
  (4, 'Airbus A350'),
  (5, 'Boeing 737'),
  (6, 'Boeing 787-9'),
  (7, 'Boeing 777');

-- ===== Chuyến bay (demo, sinh tự động) =====
-- Mỗi tuyến 3 chuyến/ngày (slot sáng sớm, trưa, tối) trong 60 ngày tới.
CREATE TEMP TABLE seed_routes (
  r INTEGER, from_code TEXT, to_code TEXT, base_min INTEGER,
  a1 TEXT, a2 TEXT, a3 TEXT, stop_city TEXT, intl INTEGER
);
INSERT INTO seed_routes VALUES
  (1,  'SGN', 'HAN', 130, 'VJ', 'VN', 'QH', 'Đà Nẵng', 0),
  (2,  'HAN', 'SGN', 130, 'VJ', 'VN', 'QH', 'Đà Nẵng', 0),
  (3,  'SGN', 'DAD',  85, 'VJ', 'VN', 'QH', NULL, 0),
  (4,  'DAD', 'SGN',  85, 'VJ', 'VN', 'QH', NULL, 0),
  (5,  'SGN', 'PQC',  60, 'VJ', 'VN', 'QH', NULL, 0),
  (6,  'PQC', 'SGN',  60, 'VJ', 'VN', 'QH', NULL, 0),
  (7,  'HAN', 'DAD',  80, 'VJ', 'VN', 'QH', NULL, 0),
  (8,  'DAD', 'HAN',  80, 'VJ', 'VN', 'QH', NULL, 0),
  (9,  'HAN', 'PQC', 130, 'VJ', 'VN', 'QH', 'Hồ Chí Minh', 0),
  (10, 'PQC', 'HAN', 130, 'VJ', 'VN', 'QH', 'Hồ Chí Minh', 0),
  (11, 'SGN', 'CXR',  65, 'VJ', 'VN', 'VJ', NULL, 0),
  (12, 'CXR', 'SGN',  65, 'VJ', 'VN', 'VJ', NULL, 0),
  (13, 'SGN', 'HUI',  85, 'VJ', 'VN', 'QH', NULL, 0),
  (14, 'HUI', 'SGN',  85, 'VJ', 'VN', 'QH', NULL, 0),
  (15, 'HAN', 'DLI', 110, 'VJ', 'VN', 'QH', NULL, 0),
  (16, 'DLI', 'HAN', 110, 'VJ', 'VN', 'QH', NULL, 0),
  (17, 'SGN', 'SIN', 125, 'VJ', 'SQ', 'VN', 'Kuala Lumpur', 1),
  (18, 'SIN', 'SGN', 125, 'VJ', 'SQ', 'VN', 'Kuala Lumpur', 1),
  (19, 'SGN', 'BKK',  95, 'VJ', 'AK', 'TG', 'Kuala Lumpur', 1),
  (20, 'BKK', 'SGN',  95, 'VJ', 'AK', 'TG', 'Kuala Lumpur', 1),
  (21, 'HAN', 'ICN', 280, 'VJ', 'KE', 'VN', 'Hồng Kông', 1),
  (22, 'ICN', 'HAN', 280, 'VJ', 'KE', 'VN', 'Hồng Kông', 1),
  (23, 'SGN', 'NRT', 360, 'VJ', 'JL', 'VN', 'Đài Bắc', 1),
  (24, 'NRT', 'SGN', 360, 'VJ', 'JL', 'VN', 'Đài Bắc', 1),
  (25, 'SGN', 'HKG', 165, 'VJ', 'CX', 'VN', NULL, 1),
  (26, 'HKG', 'SGN', 165, 'VJ', 'CX', 'VN', NULL, 1),
  (27, 'SGN', 'DOH', 540, 'QR', 'QR', 'VN', 'Bangkok', 1),
  (28, 'DOH', 'SGN', 540, 'QR', 'QR', 'VN', 'Bangkok', 1);

INSERT INTO flights (flight_no, airline_id, aircraft_id, from_airport_id, to_airport_id,
                     depart_at, arrive_at, duration_min, stops, stop_city, trip_type, carry_on_kg, has_meal)
WITH RECURSIVE
  days(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM days WHERE n < 59),
  slots(s) AS (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2),
  base AS (
    SELECT rt.*, d.n, sl.s,
      CASE sl.s WHEN 0 THEN rt.a1 WHEN 1 THEN rt.a2 ELSE rt.a3 END AS al,
      CASE sl.s WHEN 0 THEN (rt.r * 5) % 11 WHEN 1 THEN 11 + (rt.r % 6) ELSE 17 + (rt.r % 7) END AS hh,
      ((rt.r * 3 + sl.s * 7) % 12) * 5 AS mm,
      CASE WHEN sl.s = 1 AND rt.stop_city IS NOT NULL THEN 1 ELSE 0 END AS st
    FROM seed_routes rt, days d, slots sl
  ),
  timed AS (
    SELECT base.*,
      base_min + st * (CASE intl WHEN 1 THEN 120 ELSE 90 END) + ((n + s) % 3) * 5 AS dur,
      date('now', 'localtime', '+' || n || ' days') || ' ' || printf('%02d:%02d', hh, mm) AS dep
    FROM base
  )
SELECT
  printf('%s%d', al, 100 + (r * 37 + s * 11) % 850),
  (SELECT id FROM airlines WHERE code = al),
  CASE WHEN intl = 1
       THEN CASE (r + s) % 4 WHEN 0 THEN 3 WHEN 1 THEN 4 WHEN 2 THEN 6 ELSE 7 END
       ELSE CASE (r + s) % 3 WHEN 0 THEN 1 WHEN 1 THEN 2 ELSE 5 END END,
  (SELECT id FROM airports WHERE code = from_code),
  (SELECT id FROM airports WHERE code = to_code),
  dep,
  strftime('%Y-%m-%d %H:%M', dep, '+' || dur || ' minutes'),
  dur,
  st,
  CASE st WHEN 1 THEN stop_city END,
  CASE (n + r + s) % 7 WHEN 0 THEN 'oneway' WHEN 1 THEN 'roundtrip' ELSE 'both' END,
  CASE WHEN intl = 1 THEN 10 ELSE 7 END,
  CASE WHEN intl = 1 OR al IN ('VN', 'QH') THEN 1 ELSE 0 END
FROM timed
ORDER BY n, r, s;

DROP TABLE seed_routes;

-- ===== Giá vé (demo) =====
-- Hạng Phổ thông cho mọi chuyến; giá tính theo thời gian bay, làm tròn nghìn đồng.
INSERT INTO fares (flight_id, class, price, checked_kg, change_policy, refund_policy, seats_left)
SELECT f.id, 'economy',
  ((500 + f.duration_min * 10 + f.duration_min * f.duration_min / 50 + (f.id * 7919 % 13) * 40)
     * (CASE f.stops WHEN 1 THEN 9 ELSE 10 END) / 10) * 1000,
  CASE WHEN a.code IN ('VJ', 'AK') THEN 0 ELSE 23 END,
  'Có phí',
  'Có phí',
  1 + (f.id * 7 % 9)
FROM flights f JOIN airlines a ON a.id = f.airline_id;

-- Hạng Thương gia cho khoảng 50% chuyến (giá gấp 2–4 lần phổ thông); một số chuyến hết chỗ.
INSERT INTO fares (flight_id, class, price, checked_kg, change_policy, refund_policy, seats_left)
SELECT fa.flight_id, 'business',
  fa.price * (2 + fa.flight_id % 3),
  40,
  'Linh hoạt',
  'Có điều kiện',
  fa.flight_id % 5
FROM fares fa
WHERE fa.class = 'economy' AND fa.flight_id % 2 = 0;

-- ===== Tour (demo) =====
INSERT INTO tours (id, name, destination, thumbnail, days, nights, price, airline_id, aircraft_id,
                   from_airport_id, to_airport_id, depart_at, duration_min, services, excludes, is_featured) VALUES
  (1, 'Đà Nẵng – Hội An – Bà Nà Hills', 'Đà Nẵng', 'assets/images/tours/tour-1.svg', 4, 3, 5990000, 1, 2, 1, 3,
     date('now','localtime','+12 days') || ' 06:40', 85,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Ăn sáng","Xe đưa đón","Hướng dẫn viên","Vé Bà Nà Hills"]',
     '["Chi phí cá nhân","Đồ uống trong bữa ăn","Tiền tip HDV"]', 1),
  (2, 'Phú Quốc – Đảo Ngọc nghỉ dưỡng', 'Phú Quốc', 'assets/images/tours/tour-2.svg', 3, 2, 4490000, 1, 1, 2, 4,
     date('now','localtime','+9 days') || ' 08:15', 130,
     '["Vé máy bay khứ hồi","Resort 5*","Ăn sáng buffet","Tour 4 đảo cano","Xe đưa đón"]',
     '["Chi phí cá nhân","Vé cáp treo Hòn Thơm"]', 1),
  (3, 'Nha Trang – Vinpearl – Đảo Hòn Mun', 'Nha Trang', 'assets/images/tours/tour-3.svg', 4, 3, 5290000, 2, 2, 2, 5,
     date('now','localtime','+15 days') || ' 13:20', 115,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Ăn sáng","Lặn ngắm san hô","Hướng dẫn viên"]',
     '["Chi phí cá nhân","Vé VinWonders"]', 1),
  (4, 'Đà Lạt – Thành phố ngàn hoa', 'Đà Lạt', 'assets/images/tours/tour-4.svg', 3, 2, 3890000, 3, 1, 2, 7,
     date('now','localtime','+7 days') || ' 19:05', 110,
     '["Vé máy bay khứ hồi","Khách sạn 3*","Ăn sáng","Xe đưa đón","Hướng dẫn viên"]',
     '["Chi phí cá nhân","Bữa trưa ngày 3"]', 1),
  (5, 'Hà Nội – Hạ Long – Sapa', 'Hà Nội', 'assets/images/tours/tour-5.svg', 5, 4, 8990000, 1, 2, 1, 2,
     date('now','localtime','+20 days') || ' 05:30', 130,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Du thuyền Hạ Long 1 đêm","Ăn 3 bữa","Hướng dẫn viên","Xe limousine"]',
     '["Vé cáp treo Fansipan","Chi phí cá nhân"]', 1),
  (6, 'Singapore – Sentosa – Gardens by the Bay', 'Singapore', 'assets/images/tours/tour-6.svg', 4, 3, 12990000, 4, 4, 1, 8,
     date('now','localtime','+25 days') || ' 09:45', 125,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Ăn sáng","Vé Gardens by the Bay","Hướng dẫn viên","Bảo hiểm du lịch"]',
     '["Phí visa (nếu có)","Chi phí cá nhân","Tiền tip"]', 1),
  (7, 'Bangkok – Pattaya', 'Bangkok', 'assets/images/tours/tour-7.svg', 5, 4, 9490000, 5, 3, 1, 9,
     date('now','localtime','+18 days') || ' 14:10', 95,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Ăn 3 bữa","Show Alcazar","Hướng dẫn viên"]',
     '["Chi phí cá nhân","Tiền tip HDV và tài xế"]', 1),
  (8, 'Seoul – Đảo Nami – Everland', 'Seoul', 'assets/images/tours/tour-8.svg', 5, 4, 15990000, 6, 6, 2, 10,
     date('now','localtime','+30 days') || ' 23:30', 280,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Ăn 3 bữa","Vé Everland","Hướng dẫn viên","Bảo hiểm du lịch"]',
     '["Phí visa","Chi phí cá nhân"]', 1),
  (9, 'Huế – Cố đô trầm mặc', 'Huế', 'assets/images/tours/tour-9.svg', 3, 2, 3590000, 2, 1, 1, 6,
     date('now','localtime','+11 days') || ' 07:50', 85,
     '["Vé máy bay khứ hồi","Khách sạn 3*","Ăn sáng","Thuyền rồng sông Hương","Hướng dẫn viên"]',
     '["Chi phí cá nhân"]', 0),
  (10, 'Tokyo – Phú Sĩ – Kyoto', 'Tokyo', 'assets/images/tours/tour-10.svg', 6, 5, 28990000, 7, 7, 1, 11,
     date('now','localtime','+40 days') || ' 00:20', 360,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Ăn 3 bữa","Tàu cao tốc Shinkansen","Hướng dẫn viên"]',
     '["Phí visa","Chi phí cá nhân"]', 0),
  (11, 'Hồng Kông – Disneyland', 'Hồng Kông', 'assets/images/tours/tour-11.svg', 4, 3, 13490000, 8, 4, 1, 12,
     date('now','localtime','+22 days') || ' 10:35', 165,
     '["Vé máy bay khứ hồi","Khách sạn 4*","Ăn sáng","Vé Disneyland","Hướng dẫn viên"]',
     '["Chi phí cá nhân","Tiền tip"]', 0),
  (12, 'Côn Đảo – Phú Quốc combo biển', 'Phú Quốc', 'assets/images/tours/tour-12.svg', 4, 3, 6290000, 9, 1, 1, 4,
     date('now','localtime','+14 days') || ' 16:25', 60,
     '["Vé máy bay khứ hồi","Resort 4*","Ăn sáng","Xe đưa đón"]',
     '["Hướng dẫn viên","Chi phí cá nhân"]', 0);

-- ===== Lịch trình tour (demo) =====
INSERT INTO tour_itineraries (tour_id, day_no, title, description, meals, hotel) VALUES
  (1, 1, 'Hồ Chí Minh – Đà Nẵng – Bán đảo Sơn Trà', 'Đón khách tại sân bay Đà Nẵng, tham quan chùa Linh Ứng Sơn Trà, tắm biển Mỹ Khê buổi chiều.', 'Trưa, Tối', 'Khách sạn 4* Đà Nẵng'),
  (1, 2, 'Bà Nà Hills – Cầu Vàng', 'Đi cáp treo lên Bà Nà, check-in Cầu Vàng, vui chơi Fantasy Park.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Đà Nẵng'),
  (1, 3, 'Phố cổ Hội An', 'Tham quan chùa Cầu, nhà cổ Tấn Ký, thả đèn hoa đăng trên sông Hoài.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Đà Nẵng'),
  (1, 4, 'Đà Nẵng – Hồ Chí Minh', 'Tự do mua sắm chợ Hàn, xe đưa ra sân bay về lại Hồ Chí Minh.', 'Sáng', NULL),
  (2, 1, 'Hà Nội – Phú Quốc', 'Đón khách tại sân bay Phú Quốc, nhận phòng resort, ngắm hoàng hôn Sunset Town.', 'Tối', 'Resort 5* Phú Quốc'),
  (2, 2, 'Tour 4 đảo bằng cano', 'Khám phá Hòn Móng Tay, Hòn Gầm Ghì, lặn ngắm san hô, ăn trưa trên đảo.', 'Sáng, Trưa', 'Resort 5* Phú Quốc'),
  (2, 3, 'Chợ Dương Đông – Về Hà Nội', 'Mua đặc sản nước mắm, ngọc trai, xe đưa ra sân bay.', 'Sáng', NULL),
  (3, 1, 'Hà Nội – Nha Trang', 'Đến Cam Ranh, nhận phòng, dạo biển Trần Phú buổi tối.', 'Tối', 'Khách sạn 4* Nha Trang'),
  (3, 2, 'Đảo Hòn Mun – Lặn biển', 'Ngắm san hô tại khu bảo tồn biển Hòn Mun, tắm bùn khoáng buổi chiều.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Nha Trang'),
  (3, 3, 'Tháp Bà Ponagar – Tự do', 'Tham quan tháp Chăm cổ, buổi chiều tự do vui chơi VinWonders.', 'Sáng, Trưa', 'Khách sạn 4* Nha Trang'),
  (3, 4, 'Nha Trang – Hà Nội', 'Mua sắm chợ Đầm, ra sân bay Cam Ranh.', 'Sáng', NULL),
  (4, 1, 'Hà Nội – Đà Lạt', 'Đến Liên Khương, dạo hồ Xuân Hương, chợ đêm Đà Lạt.', 'Tối', 'Khách sạn 3* Đà Lạt'),
  (4, 2, 'Thung lũng Tình Yêu – Đồi chè Cầu Đất', 'Săn mây đồi chè sáng sớm, tham quan vườn dâu, thiền viện Trúc Lâm.', 'Sáng, Trưa, Tối', 'Khách sạn 3* Đà Lạt'),
  (4, 3, 'Đà Lạt – Hà Nội', 'Ga Đà Lạt cổ, mua mứt, atiso làm quà, ra sân bay.', 'Sáng', NULL),
  (5, 1, 'Hồ Chí Minh – Hà Nội', 'Đến Nội Bài, tham quan Hồ Gươm, phố cổ, xem múa rối nước.', 'Trưa, Tối', 'Khách sạn 4* Hà Nội'),
  (5, 2, 'Vịnh Hạ Long', 'Lên du thuyền, tham quan hang Sửng Sốt, chèo kayak, nghỉ đêm trên vịnh.', 'Sáng, Trưa, Tối', 'Du thuyền 4* Hạ Long'),
  (5, 3, 'Hạ Long – Sapa', 'Ngắm bình minh trên vịnh, di chuyển lên Sapa bằng xe limousine.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Sapa'),
  (5, 4, 'Bản Cát Cát – Fansipan', 'Khám phá bản Cát Cát, tự chọn cáp treo chinh phục Fansipan.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Sapa'),
  (5, 5, 'Sapa – Hà Nội – Hồ Chí Minh', 'Về Hà Nội, ra sân bay Nội Bài.', 'Sáng, Trưa', NULL),
  (6, 1, 'Hồ Chí Minh – Singapore', 'Đến Changi, tham quan Jewel, công viên Merlion, Marina Bay về đêm.', 'Tối', 'Khách sạn 4* Singapore'),
  (6, 2, 'Gardens by the Bay', 'Tham quan Flower Dome, Cloud Forest, xem show ánh sáng Supertree.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Singapore'),
  (6, 3, 'Đảo Sentosa', 'Tự do vui chơi Sentosa, Universal Studios (tự túc vé).', 'Sáng, Tối', 'Khách sạn 4* Singapore'),
  (6, 4, 'Singapore – Hồ Chí Minh', 'Mua sắm Orchard Road, ra sân bay.', 'Sáng', NULL),
  (7, 1, 'Hồ Chí Minh – Bangkok', 'Đến Suvarnabhumi, tham quan chùa Phật Vàng, du thuyền sông Chao Phraya.', 'Tối', 'Khách sạn 4* Bangkok'),
  (7, 2, 'Bangkok – Pattaya', 'Di chuyển Pattaya, xem show Alcazar, phố đi bộ Walking Street.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Pattaya'),
  (7, 3, 'Đảo Coral', 'Đi cano ra đảo Coral, tắm biển, các trò chơi trên biển.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Pattaya'),
  (7, 4, 'Pattaya – Bangkok', 'Về Bangkok, tham quan Hoàng cung, mua sắm Platinum.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Bangkok'),
  (7, 5, 'Bangkok – Hồ Chí Minh', 'Tự do, ra sân bay.', 'Sáng', NULL),
  (8, 1, 'Hà Nội – Seoul', 'Bay đêm đến Incheon.', NULL, NULL),
  (8, 2, 'Đảo Nami – Petite France', 'Tham quan đảo Nami, làng Pháp, nhận phòng tại Seoul.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Seoul'),
  (8, 3, 'Công viên Everland', 'Vui chơi cả ngày tại Everland.', 'Sáng, Tối', 'Khách sạn 4* Seoul'),
  (8, 4, 'Cung Gyeongbok – Myeongdong', 'Mặc hanbok tham quan cung điện, mua sắm Myeongdong.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Seoul'),
  (8, 5, 'Seoul – Hà Nội', 'Ghé cửa hàng sâm, mỹ phẩm, ra sân bay.', 'Sáng', NULL),
  (9, 1, 'Hồ Chí Minh – Huế', 'Đến Phú Bài, tham quan Đại Nội, đi thuyền rồng nghe ca Huế.', 'Trưa, Tối', 'Khách sạn 3* Huế'),
  (9, 2, 'Lăng tẩm – Chùa Thiên Mụ', 'Tham quan lăng Khải Định, lăng Tự Đức, chùa Thiên Mụ.', 'Sáng, Trưa, Tối', 'Khách sạn 3* Huế'),
  (9, 3, 'Huế – Hồ Chí Minh', 'Chợ Đông Ba, ra sân bay.', 'Sáng', NULL),
  (10, 1, 'Hồ Chí Minh – Tokyo', 'Bay đêm đến Narita, tham quan chùa Asakusa, tháp Tokyo Skytree.', 'Trưa, Tối', 'Khách sạn 4* Tokyo'),
  (10, 2, 'Núi Phú Sĩ', 'Tham quan trạm 5 núi Phú Sĩ, làng cổ Oshino Hakkai, tắm onsen.', 'Sáng, Trưa, Tối', 'Khách sạn onsen'),
  (10, 3, 'Shinkansen – Kyoto', 'Đi tàu cao tốc đến Kyoto, tham quan chùa Vàng Kinkakuji.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Kyoto'),
  (10, 4, 'Kyoto – Osaka', 'Đền Fushimi Inari, lâu đài Osaka.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Osaka'),
  (10, 5, 'Osaka – Tokyo', 'Về Tokyo, mua sắm Ginza, Shinjuku.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Tokyo'),
  (10, 6, 'Tokyo – Hồ Chí Minh', 'Ra sân bay Narita.', 'Sáng', NULL),
  (11, 1, 'Hồ Chí Minh – Hồng Kông', 'Đến sân bay, đi cáp treo Ngong Ping, tượng Phật Thiên Đàn.', 'Trưa, Tối', 'Khách sạn 4* Hồng Kông'),
  (11, 2, 'Disneyland', 'Vui chơi cả ngày tại Hong Kong Disneyland.', 'Sáng', 'Khách sạn 4* Hồng Kông'),
  (11, 3, 'Đỉnh Victoria – Đại lộ Ngôi sao', 'Đi tàu điện lên đỉnh Victoria, ngắm cảng Victoria về đêm.', 'Sáng, Trưa, Tối', 'Khách sạn 4* Hồng Kông'),
  (11, 4, 'Hồng Kông – Hồ Chí Minh', 'Tự do mua sắm, ra sân bay.', 'Sáng', NULL),
  (12, 1, 'Hồ Chí Minh – Phú Quốc', 'Đến Phú Quốc, nhận phòng resort, tự do tắm biển.', NULL, 'Resort 4* Phú Quốc'),
  (12, 2, 'Nam đảo Phú Quốc', 'Tự túc tham quan bãi Sao, nhà tù Phú Quốc.', 'Sáng', 'Resort 4* Phú Quốc'),
  (12, 3, 'Tự do nghỉ dưỡng', 'Nghỉ dưỡng tại resort, spa (tự túc).', 'Sáng', 'Resort 4* Phú Quốc'),
  (12, 4, 'Phú Quốc – Hồ Chí Minh', 'Trả phòng, ra sân bay.', 'Sáng', NULL);
