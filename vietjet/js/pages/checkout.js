import { transaction, query, run, saveDb } from '../db.js';
import { getCart, clearCart } from '../cart.js';
import { resolveCartItems, cartTotal } from '../order.js';
import { sendOrderEmail, isEmailConfigured } from '../email.js';
import { initLayout, errorHtml } from '../components.js';
import { escapeHtml, formatVnd, showToast, icon } from '../utils.js';

initLayout('cart');

if (!getCart().length) window.location.replace('cart.html');

const form = document.getElementById('checkout-form');
const submitBtn = document.getElementById('submit-btn');
const summaryEl = document.getElementById('order-summary');
const noteInput = document.getElementById('note');

const RULES = {
  fullName: (v) => (v.trim().length >= 2 ? '' : 'Họ và tên phải có ít nhất 2 ký tự.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Email không đúng định dạng.'),
  phone: (v) => (/^(0|\+84)\d{9}$/.test(v.replace(/[\s.-]/g, '')) ? '' : 'Số điện thoại Việt Nam không hợp lệ (vd 0901234567 hoặc +84901234567).'),
  idNumber: (v) => (!v.trim() || /^[A-Za-z0-9]{9,12}$/.test(v.trim()) ? '' : 'CCCD/Hộ chiếu gồm 9–12 ký tự chữ hoặc số.'),
  note: (v) => (v.length <= 500 ? '' : 'Ghi chú tối đa 500 ký tự.'),
};

function setError(name, message) {
  const el = document.getElementById(`${name}-error`);
  el.textContent = message;
  el.closest('.field').classList.toggle('has-error', Boolean(message));
}

function validate() {
  let ok = true;
  Object.entries(RULES).forEach(([name, rule]) => {
    const msg = rule(form.elements[name].value);
    setError(name, msg);
    if (msg) ok = false;
  });
  const agreeMsg = form.elements.agree.checked ? '' : 'Bạn cần đồng ý với điều khoản để tiếp tục.';
  setError('agree', agreeMsg);
  return ok && !agreeMsg;
}

function readCustomer() {
  return {
    fullName: form.elements.fullName.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.replace(/[\s.-]/g, ''),
    idNumber: form.elements.idNumber.value.trim() || null,
    note: form.elements.note.value.trim(),
  };
}

function itemsListHtml(items) {
  return `<ul class="summary__items">${items.map((it) => `
    <li>
      <span>${escapeHtml(it.title)}<small>${escapeHtml(it.subtitle)} · ${it.pax} khách</small></span>
      <span>${formatVnd(it.unitPrice * it.pax)}</span>
    </li>`).join('')}</ul>`;
}

async function renderSummary() {
  try {
    const items = (await resolveCartItems()).filter((it) => !it.missing);
    if (!items.length) {
      window.location.replace('cart.html');
      return;
    }
    summaryEl.innerHTML = `
      <h2 id="summary-title">Tóm tắt đơn hàng</h2>
      ${itemsListHtml(items)}
      <div class="summary__total"><span>Tổng tiền</span><strong>${formatVnd(cartTotal(items))}</strong></div>
      <a href="cart.html" class="btn btn--ghost btn--sm">Sửa giỏ hàng</a>`;
  } catch (err) {
    summaryEl.innerHTML = errorHtml(err);
  }
}

function makeOrderCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => chars[b % chars.length]).join('');
  return `VJ-${ymd}-${rand}`;
}

/** Ghi customers → orders → order_items trong một transaction. Giá tính lại từ DB. */
async function createOrder(customer) {
  const items = (await resolveCartItems()).filter((it) => !it.missing);
  if (!items.length) throw new Error('Giỏ hàng không còn mục hợp lệ.');
  const total = cartTotal(items);
  const code = makeOrderCode();

  const orderId = await transaction((tx) => {
    const customerId = tx.run(
      'INSERT INTO customers (full_name, email, phone, id_number) VALUES (?, ?, ?, ?)',
      [customer.fullName, customer.email, customer.phone, customer.idNumber]);
    const id = tx.run(
      'INSERT INTO orders (order_code, customer_id, total) VALUES (?, ?, ?)',
      [code, customerId, total]);
    items.forEach((it) => {
      tx.run(
        `INSERT INTO order_items (order_id, item_type, ref_id, fare_class, title, pax, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, it.type, it.refId, it.fareClass || null, `${it.title} (${it.subtitle})`, it.pax, it.unitPrice]);
    });
    return id;
  });

  const [row] = await query('SELECT created_at FROM orders WHERE id = ?', [orderId]);
  return { id: orderId, code, total, items, customer, note: customer.note, createdAt: row?.created_at || '' };
}

async function sendAndRecord(order) {
  const result = await sendOrderEmail(order);
  await run('UPDATE orders SET email_status = ? WHERE id = ?', [result.ok ? 'sent' : 'failed', order.id]);
  await saveDb();
  return result;
}

function emailStatusHtml(order, result) {
  if (result.ok) {
    return `<p class="email-ok">${icon('check')} Chúng tôi đã gửi email xác nhận tới ${escapeHtml(order.customer.email)}.</p>`;
  }
  const reason = result.reason === 'not-configured'
    ? '<strong>Chưa cấu hình EmailJS.</strong> Điền khoá trong <code>js/config.js</code> (xem README) để gửi email xác nhận.'
    : `<strong>Gửi email tới ${escapeHtml(order.customer.email)} thất bại.</strong> Đơn hàng vẫn đã được ghi nhận.`;
  return `
    <div class="notice" role="alert">
      <p style="margin:0 0 10px">${reason}</p>
      <button type="button" class="btn btn--secondary btn--sm" id="resend-btn">Gửi lại email</button>
    </div>`;
}

function renderDone(order, emailResult) {
  document.title = 'Đăng ký hoàn thành – Vietjet';
  const root = document.getElementById('checkout-root');
  root.innerHTML = `
    <section class="card done" aria-labelledby="done-title">
      <div class="done__icon">${icon('check')}</div>
      <h1 id="done-title">Đăng ký hoàn thành</h1>
      <p class="muted" style="margin:0">Cảm ơn ${escapeHtml(order.customer.fullName)}! Mã đơn của bạn:</p>
      <p class="done__code">${escapeHtml(order.code)}</p>
      ${itemsListHtml(order.items)}
      <div class="summary__total"><span>Tổng tiền</span><strong>${formatVnd(order.total)}</strong></div>
      <div id="email-status">${emailStatusHtml(order, emailResult)}</div>
      <div class="done__actions"><a class="btn btn--primary" href="index.html">Về trang chủ</a></div>
    </section>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('#resend-btn');
    if (!btn) return;
    if (!isEmailConfigured()) {
      showToast('Chưa cấu hình EmailJS trong js/config.js', 'error');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Đang gửi…';
    const result = await sendAndRecord(order);
    document.getElementById('email-status').innerHTML = emailStatusHtml(order, result);
    showToast(result.ok ? 'Đã gửi lại email xác nhận' : 'Gửi email thất bại', result.ok ? 'success' : 'error');
  });
}

function setBusy(busy) {
  submitBtn.disabled = busy;
  submitBtn.innerHTML = busy ? '<span class="spinner" aria-hidden="true"></span> Đang xử lý…' : 'Đăng ký';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (submitBtn.disabled) return; // chống bấm đúp
  if (!validate()) {
    form.querySelector('.has-error input, .has-error textarea')?.focus();
    return;
  }
  setBusy(true);
  try {
    const order = await createOrder(readCustomer());
    const emailResult = await sendAndRecord(order);
    clearCart();
    renderDone(order, emailResult);
  } catch (err) {
    console.error(err);
    showToast('Không thể tạo đơn hàng. Vui lòng thử lại.', 'error');
    setBusy(false);
  }
});

// Kiểm tra lại từng trường khi rời ô
form.addEventListener('focusout', (e) => {
  const rule = RULES[e.target.name];
  if (rule && e.target.value) setError(e.target.name, rule(e.target.value));
});
noteInput.addEventListener('input', () => {
  document.getElementById('note-count').textContent = `${noteInput.value.length}/500`;
});

renderSummary();
