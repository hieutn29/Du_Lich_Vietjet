import { removeItem, updatePax, clearCart } from '../cart.js';
import { resolveCartItems, cartTotal } from '../order.js';
import { initLayout, emptyStateHtml, errorHtml, skeletonHtml } from '../components.js';
import { escapeHtml, formatVnd, showToast, icon } from '../utils.js';

initLayout('cart');

const root = document.getElementById('cart-root');

function itemHtml(it) {
  const typeLabel = it.type === 'flight' ? 'Chuyến bay' : 'Tour';
  const media = it.thumbnail
    ? `<img class="cart-item__media" src="${escapeHtml(it.thumbnail)}" alt="" loading="lazy">`
    : `<span class="cart-item__media">${icon('plane')}</span>`;

  if (it.missing) {
    return `
      <article class="card cart-item cart-item--missing">
        ${media}
        <div class="cart-item__main">
          <span class="badge badge--neutral" style="justify-self:start">${typeLabel}</span>
          <p class="cart-item__title">${escapeHtml(it.title)}</p>
          <p class="cart-item__sub">Mục này sẽ không được tính vào đơn. Hãy xoá khỏi giỏ hàng.</p>
        </div>
        <div class="cart-item__controls">
          <span></span>
          <button type="button" class="icon-btn" data-remove="${escapeHtml(it.key)}">${icon('trash')} Xoá</button>
        </div>
      </article>`;
  }

  return `
    <article class="card cart-item">
      ${media}
      <div class="cart-item__main">
        <span class="badge" style="justify-self:start">${typeLabel}</span>
        <p class="cart-item__title"><a href="${escapeHtml(it.link)}">${escapeHtml(it.title)}</a></p>
        <p class="cart-item__sub">${escapeHtml(it.subtitle)}</p>
      </div>
      <div class="cart-item__controls">
        <div class="stepper" role="group" aria-label="Số khách">
          <button type="button" data-pax="${escapeHtml(it.key)}" data-delta="-1" aria-label="Giảm số khách"${it.pax <= 1 ? ' disabled' : ''}>−</button>
          <output>${it.pax} khách</output>
          <button type="button" data-pax="${escapeHtml(it.key)}" data-delta="1" aria-label="Tăng số khách"${it.pax >= 9 ? ' disabled' : ''}>+</button>
        </div>
        <span class="cart-item__unit">${formatVnd(it.unitPrice)} × ${it.pax}</span>
        <span class="cart-item__total">${formatVnd(it.unitPrice * it.pax)}</span>
        <button type="button" class="icon-btn" data-remove="${escapeHtml(it.key)}" aria-label="Xoá mục ${escapeHtml(it.title)}">${icon('trash')} Xoá</button>
      </div>
    </article>`;
}

function summaryHtml(items) {
  const valid = items.filter((it) => !it.missing);
  const paxTotal = valid.reduce((s, it) => s + it.pax, 0);
  return `
    <aside class="card summary" aria-labelledby="summary-title">
      <h2 id="summary-title">Tóm tắt</h2>
      <div class="summary__row"><span>Số mục</span><span>${valid.length}</span></div>
      <div class="summary__row"><span>Tổng số khách</span><span>${paxTotal}</span></div>
      <div class="summary__total"><span>Tổng tiền</span><strong>${formatVnd(cartTotal(items))}</strong></div>
      <a class="btn btn--primary btn--block" href="checkout.html"${valid.length ? '' : ' aria-disabled="true" tabindex="-1"'}>Tiếp tục: Nhập thông tin</a>
      <button type="button" class="btn btn--ghost btn--block" id="clear-cart">${icon('trash')} Xoá giỏ hàng</button>
    </aside>`;
}

async function render() {
  try {
    const items = await resolveCartItems();
    if (!items.length) {
      root.innerHTML = emptyStateHtml('Giỏ hàng trống', 'Bạn chưa chọn chuyến bay hay tour nào.',
        '<a class="btn btn--primary" href="flights.html">Tìm chuyến bay</a><a class="btn btn--secondary" href="tours.html">Xem tour</a>');
      return;
    }
    root.innerHTML = `
      <div class="cart-layout">
        <section class="cart-list" aria-label="Các mục trong giỏ">${items.map(itemHtml).join('')}</section>
        ${summaryHtml(items)}
      </div>`;
  } catch (err) {
    root.innerHTML = errorHtml(err);
  }
}

root.addEventListener('click', (e) => {
  const paxBtn = e.target.closest('[data-pax]');
  if (paxBtn) {
    const current = parseInt(paxBtn.parentElement.querySelector('output').textContent, 10);
    updatePax(paxBtn.dataset.pax, current + Number(paxBtn.dataset.delta));
    return;
  }
  const removeBtn = e.target.closest('[data-remove]');
  if (removeBtn) {
    removeItem(removeBtn.dataset.remove);
    showToast('Đã xoá mục khỏi giỏ hàng');
    return;
  }
  if (e.target.closest('#clear-cart')) {
    // eslint-disable-next-line no-alert
    if (window.confirm('Bạn chắc chắn muốn xoá toàn bộ giỏ hàng?')) {
      clearCart();
      showToast('Đã xoá toàn bộ giỏ hàng');
    }
  }
});

window.addEventListener('cart:changed', render);
root.innerHTML = skeletonHtml(2);
render();
