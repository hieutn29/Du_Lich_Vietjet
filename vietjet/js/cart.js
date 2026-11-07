// Giỏ hàng lưu trong localStorage. Chỉ lưu id + số khách; giá lấy lại từ DB khi hiển thị.

const CART_KEY = 'vietjet_cart';
const MAX_PAX = 9;

function clampPax(pax) {
  const n = parseInt(pax, 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(MAX_PAX, Math.max(1, n));
}

function isValidItem(item) {
  return item && (item.type === 'flight' || item.type === 'tour') && Number.isInteger(item.refId);
}

export function makeKey(type, refId, fareClass) {
  return type === 'flight' ? `flight-${refId}-${fareClass}` : `tour-${refId}`;
}

export function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(items) ? items.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: items.length } }));
}

/** Thêm mục; nếu đã có cùng key thì cập nhật số khách, không nhân đôi dòng. Trả về true nếu là mục mới. */
export function addItem({ type, refId, fareClass, pax }) {
  const items = getCart();
  const key = makeKey(type, refId, fareClass);
  const existing = items.find((it) => it.key === key);
  if (existing) {
    existing.pax = clampPax(pax);
    saveCart(items);
    return false;
  }
  const item = { key, type, refId, pax: clampPax(pax) };
  if (type === 'flight') item.fareClass = fareClass;
  items.push(item);
  saveCart(items);
  return true;
}

export function removeItem(key) {
  saveCart(getCart().filter((it) => it.key !== key));
}

export function updatePax(key, pax) {
  const items = getCart();
  const item = items.find((it) => it.key === key);
  if (!item) return;
  item.pax = clampPax(pax);
  saveCart(items);
}

export function clearCart() {
  saveCart([]);
}

export function getCount() {
  return getCart().length;
}
