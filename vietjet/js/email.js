// Gửi email xác nhận đơn qua EmailJS (SDK @emailjs/browser tải từ CDN khi cần).
import { EMAILJS_CONFIG } from './config.js';
import { escapeHtml, formatVnd } from './utils.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/+esm';
let sdkPromise = null;

export function isEmailConfigured() {
  const { publicKey, serviceId, templateId } = EMAILJS_CONFIG;
  return [publicKey, serviceId, templateId].every((v) => v && !String(v).startsWith('YOUR_'));
}

function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = import(SDK_URL).then((mod) => mod.default ?? mod);
  }
  return sdkPromise;
}

function itemsText(items) {
  return items.map((it, i) =>
    `${i + 1}. ${it.title} — ${it.pax} khách × ${formatVnd(it.unitPrice)} = ${formatVnd(it.unitPrice * it.pax)}`
  ).join('\n');
}

function itemsHtml(items) {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(it.title)}<br><small style="color:#6b7280">${escapeHtml(it.subtitle || '')}</small></td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.pax}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;color:#ee1d23;font-weight:700">${formatVnd(it.unitPrice * it.pax)}</td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
    <thead><tr style="background:#fdeaea"><th style="padding:8px;text-align:left">Mục</th><th style="padding:8px">Số khách</th><th style="padding:8px;text-align:right">Thành tiền</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/**
 * Gửi email xác nhận. Không bao giờ ném lỗi — trả về { ok, reason }.
 * order = { code, createdAt, total, customer: {fullName, email}, items: [...], note }
 */
export async function sendOrderEmail(order) {
  if (!isEmailConfigured()) {
    console.warn('[email] Chưa cấu hình EmailJS trong js/config.js — bỏ qua gửi email.');
    return { ok: false, reason: 'not-configured' };
  }
  try {
    const emailjs = await loadSdk();
    await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      to_email: order.customer.email,
      to_name: order.customer.fullName,
      from_email: EMAILJS_CONFIG.senderEmail,
      order_code: order.code,
      order_items: itemsText(order.items),
      order_items_html: itemsHtml(order.items),
      total: formatVnd(order.total),
      created_at: order.createdAt,
      note: order.note || '',
    }, { publicKey: EMAILJS_CONFIG.publicKey });
    return { ok: true };
  } catch (err) {
    console.error('[email] Gửi email thất bại:', err);
    return { ok: false, reason: 'send-failed' };
  }
}
