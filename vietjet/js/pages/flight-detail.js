import { query } from '../db.js';
import { addItem } from '../cart.js';
import { initLayout, airlineHtml, notFoundHtml, errorHtml, skeletonHtml } from '../components.js';
import {
  escapeHtml, formatVnd, formatDate, formatTime, formatDuration, formatWeekday,
  getParams, getIntParam, paxOptions, showToast, icon, FARE_CLASS_LABEL,
} from '../utils.js';

initLayout('flights');

const root = document.getElementById('flight-detail');
const params = getParams();
const flightId = getIntParam(params, 'id', null);
const preferredClass = params.get('class') === 'business' ? 'business' : 'economy';
let pax = getIntParam(params, 'pax', 1, 1, 9);
let fares = [];

const lastSearch = sessionStorage.getItem('vietjet_last_search');
const backUrl = lastSearch && lastSearch.includes('/flights.html') ? lastSearch : 'flights.html';
document.getElementById('back-to-search').href = backUrl;

async function loadFlight(id) {
  const [flight] = await query(`
    SELECT f.*, a.code AS airline_code, a.name AS airline_name, a.logo AS airline_logo,
           ac.model AS aircraft,
           fa.code AS from_code, fa.city AS from_city, fa.name AS from_name,
           ta.code AS to_code, ta.city AS to_city, ta.name AS to_name
    FROM flights f
    JOIN airlines a ON a.id = f.airline_id
    JOIN aircraft ac ON ac.id = f.aircraft_id
    JOIN airports fa ON fa.id = f.from_airport_id
    JOIN airports ta ON ta.id = f.to_airport_id
    WHERE f.id = ?`, [id]);
  return flight;
}

function journeyHtml(f) {
  const stops = f.stops ? `${f.stops} điểm dừng (${escapeHtml(f.stop_city)})` : 'Bay thẳng';
  return `
    <div class="detail__title">
      <h2>${escapeHtml(f.from_city)} → ${escapeHtml(f.to_city)}</h2>
      ${airlineHtml(f.airline_code, f.airline_name, f.airline_logo)}
    </div>
    <article class="card journey">
      <div class="journey__route">
        <div class="journey__point">
          <strong>${formatTime(f.depart_at)}</strong>
          <span class="code">${escapeHtml(f.from_code)}</span> · ${escapeHtml(f.from_city)}
          <small>${escapeHtml(f.from_name)}</small>
        </div>
        <div class="journey__mid">
          ${formatDuration(f.duration_min)}
          ${icon('plane')}
          ${stops}
        </div>
        <div class="journey__point journey__point--end">
          <strong>${formatTime(f.arrive_at)}</strong>
          <span class="code">${escapeHtml(f.to_code)}</span> · ${escapeHtml(f.to_city)}
          <small>${escapeHtml(f.to_name)}</small>
        </div>
      </div>
      <dl class="facts">
        <div><dt>Ngày bay</dt><dd>${formatWeekday(f.depart_at)}, ${formatDate(f.depart_at)}</dd></div>
        <div><dt>Ngày đến</dt><dd>${formatDate(f.arrive_at)}</dd></div>
        <div><dt>Thời gian bay</dt><dd>${formatDuration(f.duration_min)}</dd></div>
        <div><dt>Điểm dừng</dt><dd>${stops}</dd></div>
        <div><dt>Số hiệu chuyến</dt><dd>${escapeHtml(f.flight_no)}</dd></div>
        <div><dt>Loại máy bay</dt><dd>${escapeHtml(f.aircraft)}</dd></div>
      </dl>
    </article>`;
}

function fareCardHtml(cls, fare, flight) {
  const label = `Hạng ${FARE_CLASS_LABEL[cls]}`;
  if (!fare || fare.seats_left <= 0) {
    return `
      <article class="card fare-card is-soldout" aria-disabled="true">
        <div class="fare-card__head"><h3>${label}</h3><span class="badge badge--neutral">Hết chỗ</span></div>
        <p class="muted">Hạng vé này hiện không còn chỗ cho chuyến bay.</p>
        <button class="btn btn--primary btn--block" type="button" disabled>Chọn</button>
      </article>`;
  }
  const meal = cls === 'business' || flight.has_meal ? 'Có' : 'Không (mua thêm)';
  const lowSeats = fare.seats_left <= 3 ? `<span class="badge badge--accent">Còn ${fare.seats_left} chỗ</span>` : '';
  return `
    <article class="card fare-card${cls === preferredClass ? ' is-selected' : ''}" data-class="${cls}">
      <div class="fare-card__head">
        <div>
          <h3>${label}</h3>
          <p class="fare-card__price price">${formatVnd(fare.price)} <small>/khách</small></p>
        </div>
        ${lowSeats}
      </div>
      <ul>
        <li><span>Hành lý xách tay</span><span>${cls === 'business' ? flight.carry_on_kg + 5 : flight.carry_on_kg}kg</span></li>
        <li><span>Hành lý ký gửi</span><span>${fare.checked_kg ? `${fare.checked_kg}kg` : 'Không bao gồm'}</span></li>
        <li><span>Suất ăn</span><span>${meal}</span></li>
        <li><span>Đổi vé</span><span>${escapeHtml(fare.change_policy)}</span></li>
        <li><span>Hoàn vé</span><span>${escapeHtml(fare.refund_policy)}</span></li>
      </ul>
      <div class="fare-card__subtotal">
        <span class="muted">Tạm tính (<span data-pax-label>${pax}</span> khách)</span>
        <strong data-subtotal="${fare.price}">${formatVnd(fare.price * pax)}</strong>
      </div>
      <button class="btn btn--primary btn--block" type="button" data-choose="${cls}">Chọn</button>
    </article>`;
}

function render(flight) {
  document.title = `${flight.flight_no} ${flight.from_code} → ${flight.to_code} – Vietjet`;
  const byClass = Object.fromEntries(fares.map((f) => [f.class, f]));
  root.innerHTML = `
    ${journeyHtml(flight)}
    <section aria-labelledby="fare-title">
      <div class="fare-toolbar">
        <h2 id="fare-title">Chọn giá vé</h2>
        <div class="field">
          <label for="pax-select">Số khách</label>
          <select class="select" id="pax-select">${paxOptions(pax)}</select>
        </div>
      </div>
      <div class="fares">
        ${fareCardHtml('economy', byClass.economy, flight)}
        ${fareCardHtml('business', byClass.business, flight)}
      </div>
    </section>
    <div id="after-add" hidden></div>`;
}

function updateSubtotals() {
  root.querySelectorAll('[data-subtotal]').forEach((el) => {
    el.textContent = formatVnd(Number(el.dataset.subtotal) * pax);
  });
  root.querySelectorAll('[data-pax-label]').forEach((el) => { el.textContent = String(pax); });
}

function onChoose(cls) {
  const isNew = addItem({ type: 'flight', refId: flightId, fareClass: cls, pax });
  showToast(isNew ? 'Đã thêm vào giỏ hàng' : 'Đã cập nhật số khách trong giỏ hàng');
  root.querySelectorAll('.fare-card').forEach((c) => c.classList.toggle('is-selected', c.dataset.class === cls));
  const box = document.getElementById('after-add');
  box.hidden = false;
  box.innerHTML = `
    <div class="after-add">
      <p>${icon('check')} Đã thêm hạng ${FARE_CLASS_LABEL[cls]} (${pax} khách) vào giỏ hàng</p>
      <div>
        <a class="btn btn--primary" href="cart.html">Xem giỏ hàng</a>
        <a class="btn btn--secondary" href="${escapeHtml(backUrl)}">Tiếp tục tìm chuyến bay</a>
      </div>
    </div>`;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function init() {
  if (!flightId) {
    root.innerHTML = notFoundHtml('Thiếu mã chuyến bay. Hãy chọn chuyến bay từ trang tìm kiếm.');
    return;
  }
  root.innerHTML = skeletonHtml(2);
  try {
    const flight = await loadFlight(flightId);
    if (!flight) {
      root.innerHTML = notFoundHtml('Chuyến bay không tồn tại hoặc đã bị xoá.');
      return;
    }
    fares = await query('SELECT * FROM fares WHERE flight_id = ?', [flightId]);
    render(flight);
  } catch (err) {
    root.innerHTML = errorHtml(err);
    return;
  }

  root.addEventListener('change', (e) => {
    if (e.target.id !== 'pax-select') return;
    pax = Number(e.target.value);
    updateSubtotals();
  });
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-choose]');
    if (btn) onChoose(btn.dataset.choose);
  });
}

init();
