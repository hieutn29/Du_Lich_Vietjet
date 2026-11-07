// Tiện ích dùng chung: định dạng, query string, chống XSS, toast, icon.

const vndFormatter = new Intl.NumberFormat('vi-VN');

export function formatVnd(amount) {
  return `${vndFormatter.format(Number(amount) || 0)} ₫`;
}

/** 'YYYY-MM-DD HH:MM' hoặc 'YYYY-MM-DD' → 'dd/MM/yyyy' */
export function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** 'YYYY-MM-DD HH:MM' → 'HH:mm' */
export function formatTime(value) {
  return value ? String(value).slice(11, 16) : '';
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function formatDayNight(days, nights) {
  return `${days} ngày ${nights} đêm`;
}

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export function formatWeekday(value) {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

/** Ngày hôm nay theo giờ máy, dạng 'YYYY-MM-DD' */
export function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getParams() {
  return new URLSearchParams(window.location.search);
}

export function getIntParam(params, name, fallback, min = -Infinity, max = Infinity) {
  const n = parseInt(params.get(name), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

export function parseJsonArray(text) {
  try {
    const arr = JSON.parse(text || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Khung giờ cất cánh: 0 = 00–06, 1 = 06–12, 2 = 12–18, 3 = 18–24 */
export function hourBucket(dateTime) {
  const hour = parseInt(formatTime(dateTime).slice(0, 2), 10);
  return Math.min(3, Math.floor(hour / 6));
}

export const TIME_BUCKETS = ['00:00 – 06:00', '06:00 – 12:00', '12:00 – 18:00', '18:00 – 24:00'];

export const FARE_CLASS_LABEL = { economy: 'Phổ thông', business: 'Thương gia' };

export function showToast(message, type = 'success') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.append(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  stack.append(toast);
  setTimeout(() => toast.remove(), 3200);
}

/** Tạo <option> cho select số khách 1–9 */
export function paxOptions(selected) {
  return Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return `<option value="${n}"${n === selected ? ' selected' : ''}>${n} khách</option>`;
  }).join('');
}

/** Icon SVG nội tuyến (stroke = currentColor) */
const ICON_PATHS = {
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  bag: '<rect x="6" y="7" width="12" height="14" rx="2"/><path d="M9 7V4h6v3M10 21v1M14 21v1"/>',
  suitcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M8 12h8"/>',
  meal: '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  swap: '<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  hotel: '<path d="M3 21V7l9-4 9 4v14M9 21v-6h6v6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
export function icon(name, extraClass = '') {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}
