// Đọc lại thông tin + giá của các mục trong giỏ hàng từ DB (giá luôn đúng nguồn).
import { query } from './db.js';
import { getCart } from './cart.js';
import { formatDate, formatTime, formatDayNight, FARE_CLASS_LABEL } from './utils.js';

const FLIGHT_SQL = `
  SELECT f.id, f.flight_no, f.depart_at, f.arrive_at,
         a.name AS airline_name, fa.code AS from_code, fa.city AS from_city,
         ta.code AS to_code, ta.city AS to_city, fr.price
  FROM flights f
  JOIN airlines a ON a.id = f.airline_id
  JOIN airports fa ON fa.id = f.from_airport_id
  JOIN airports ta ON ta.id = f.to_airport_id
  JOIN fares fr ON fr.flight_id = f.id AND fr.class = ?
  WHERE f.id = ?`;

const TOUR_SQL = `
  SELECT t.id, t.name, t.days, t.nights, t.price, t.depart_at, t.thumbnail, a.name AS airline_name
  FROM tours t JOIN airlines a ON a.id = t.airline_id
  WHERE t.id = ?`;

async function resolveFlight(item) {
  const [f] = await query(FLIGHT_SQL, [item.fareClass, item.refId]);
  if (!f) return { ...item, missing: true, title: 'Chuyến bay không còn tồn tại' };
  return {
    ...item,
    title: `Chuyến bay ${f.from_city} (${f.from_code}) → ${f.to_city} (${f.to_code}) · ${f.flight_no}`,
    subtitle: `${formatDate(f.depart_at)} ${formatTime(f.depart_at)} – ${formatTime(f.arrive_at)} · ${f.airline_name} · Hạng ${FARE_CLASS_LABEL[item.fareClass]}`,
    unitPrice: f.price,
    link: `flight-detail.html?id=${f.id}&pax=${item.pax}&class=${item.fareClass}`,
  };
}

async function resolveTour(item) {
  const [t] = await query(TOUR_SQL, [item.refId]);
  if (!t) return { ...item, missing: true, title: 'Tour không còn tồn tại' };
  return {
    ...item,
    title: `Tour ${t.name}`,
    subtitle: `Khởi hành ${formatDate(t.depart_at)} ${formatTime(t.depart_at)} · ${formatDayNight(t.days, t.nights)} · ${t.airline_name}`,
    unitPrice: t.price,
    thumbnail: t.thumbnail,
    link: `tour-detail.html?id=${t.id}`,
  };
}

/** Trả về các mục giỏ hàng kèm title/subtitle/unitPrice lấy từ DB */
export async function resolveCartItems() {
  const items = getCart();
  return Promise.all(items.map((it) => (it.type === 'flight' ? resolveFlight(it) : resolveTour(it))));
}

export function cartTotal(resolvedItems) {
  return resolvedItems.filter((it) => !it.missing).reduce((sum, it) => sum + it.unitPrice * it.pax, 0);
}
