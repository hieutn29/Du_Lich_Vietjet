// Navbar, footer và các mẩu giao diện dùng chung.
import { getCount } from './cart.js';
import { escapeHtml, icon } from './utils.js';

const NAV_ITEMS = [
  { key: 'home', href: 'index.html', label: 'Trang chủ' },
  { key: 'flights', href: 'flights.html', label: 'Chuyến bay' },
  { key: 'tours', href: 'tours.html', label: 'Tour' },
  { key: 'cart', href: 'cart.html', label: 'Giỏ hàng' },
];

function renderHeader(activeKey) {
  const header = document.getElementById('site-header');
  if (!header) return;
  header.className = 'navbar';
  const links = NAV_ITEMS.map((item) => {
    const active = item.key === activeKey;
    const badge = item.key === 'cart' ? ' <span class="cart-badge" data-cart-badge aria-label="Số mục trong giỏ">0</span>' : '';
    return `<li><a class="navbar__link${active ? ' is-active' : ''}" href="${item.href}"${active ? ' aria-current="page"' : ''}>${item.label}${badge}</a></li>`;
  }).join('');

  header.innerHTML = `
    <nav class="container navbar__inner" aria-label="Điều hướng chính">
      <a class="navbar__brand" href="index.html">
        <img src="assets/images/logo-vietjet.jpg" alt="Logo Vietjet" width="40" height="40">
        <span>Vietjet</span>
      </a>
      <button class="navbar__toggle" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="nav-menu">${icon('menu')}</button>
      <ul class="navbar__menu" id="nav-menu">${links}</ul>
    </nav>`;

  const toggle = header.querySelector('.navbar__toggle');
  const menu = header.querySelector('.navbar__menu');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  });
  updateCartBadge();
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <section>
          <h3>Giới thiệu</h3>
          <p class="muted">Website demo đặt vé máy bay và tour du lịch. Tìm chuyến bay, chọn tour, thêm vào giỏ hàng và đăng ký nhanh chóng.</p>
        </section>
        <section>
          <h3>Liên kết</h3>
          <ul>
            ${NAV_ITEMS.map((i) => `<li><a href="${i.href}">${i.label}</a></li>`).join('')}
          </ul>
        </section>
        <section>
          <h3>Liên hệ</h3>
          <ul>
            <li>Email: <a href="mailto:tnhieu2992000@gmail.com">tnhieu2992000@gmail.com</a></li>
            <li class="muted">Hỗ trợ 8:00 – 22:00 hằng ngày</li>
          </ul>
        </section>
      </div>
      <p class="footer__copy">© ${new Date().getFullYear()} Vietjet. Website demo, không phải trang chính thức của hãng.</p>
    </div>`;
}

export function updateCartBadge() {
  const count = getCount();
  document.querySelectorAll('[data-cart-badge]').forEach((el) => {
    el.textContent = String(count);
    el.dataset.count = String(count);
  });
}

/** Gọi ở đầu mỗi trang */
export function initLayout(activeKey) {
  renderHeader(activeKey);
  renderFooter();
  window.addEventListener('cart:changed', updateCartBadge);
  // Đồng bộ badge khi giỏ hàng đổi ở tab khác
  window.addEventListener('storage', (e) => { if (e.key === 'vietjet_cart') updateCartBadge(); });
}

/** Logo hãng bay; nếu chưa có file logo → placeholder chữ (mã hãng trong khung) */
export function airlineHtml(code, name, logo) {
  const mark = logo
    ? `<img class="airline__logo" src="${escapeHtml(logo)}" alt="" width="32" height="32" loading="lazy">`
    : `<span class="airline__mark" aria-hidden="true">${escapeHtml(code)}</span>`;
  return `<span class="airline">${mark}<span>${escapeHtml(name)}</span></span>`;
}

export function emptyStateHtml(title, message, actionsHtml = '') {
  return `
    <div class="empty">
      ${icon('search')}
      <h3>${escapeHtml(title)}</h3>
      <p class="muted">${escapeHtml(message)}</p>
      ${actionsHtml ? `<div class="empty__actions">${actionsHtml}</div>` : ''}
    </div>`;
}

export function notFoundHtml(message) {
  return emptyStateHtml('Không tìm thấy', message, '<a class="btn btn--primary" href="index.html">Về trang chủ</a>');
}

export function errorHtml(err) {
  console.error(err);
  const isFileProtocol = window.location.protocol === 'file:';
  return `<div class="notice notice--error" role="alert">
    <strong>Không tải được dữ liệu từ data/db.db.</strong>
    ${isFileProtocol
    ? 'Hãy chạy website qua static server (ví dụ <code>python -m http.server 8000</code>) thay vì mở trực tiếp file.'
    : `<br><span class="muted">${escapeHtml(err?.message || err)}</span>`}
  </div>`;
}

export function skeletonHtml(count, variant = 'row') {
  return Array.from({ length: count }, () => `<div class="skeleton skeleton--${variant}" aria-hidden="true"></div>`).join('');
}

/** Drawer bộ lọc trên mobile */
export function setupFilterDrawer(filtersEl, toggleBtn) {
  let backdrop = null;
  const close = () => {
    filtersEl.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    backdrop?.remove();
    backdrop = null;
  };
  const open = () => {
    filtersEl.classList.add('is-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.addEventListener('click', close);
    document.body.append(backdrop);
  };
  toggleBtn.addEventListener('click', open);
  filtersEl.querySelector('.filters__close')?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
