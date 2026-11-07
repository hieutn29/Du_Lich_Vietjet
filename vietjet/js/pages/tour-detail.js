import { query } from '../db.js';
import { addItem } from '../cart.js';
import { initLayout, airlineHtml, notFoundHtml, errorHtml, skeletonHtml } from '../components.js';
import {
  escapeHtml, formatVnd, formatDate, formatTime, formatDuration, formatDayNight, formatWeekday,
  getParams, getIntParam, paxOptions, parseJsonArray, showToast, icon,
} from '../utils.js';

initLayout('tours');

const root = document.getElementById('tour-detail');
const tourId = getIntParam(getParams(), 'id', null);
let pax = 2;
let tour = null;

async function loadTour(id) {
  const [t] = await query(`
    SELECT t.*, a.code AS airline_code, a.name AS airline_name, a.logo AS airline_logo,
           ac.model AS aircraft,
           fa.code AS from_code, fa.city AS from_city, fa.name AS from_name,
           ta.code AS to_code, ta.city AS to_city, ta.name AS to_name
    FROM tours t
    JOIN airlines a ON a.id = t.airline_id
    LEFT JOIN aircraft ac ON ac.id = t.aircraft_id
    JOIN airports fa ON fa.id = t.from_airport_id
    JOIN airports ta ON ta.id = t.to_airport_id
    WHERE t.id = ?`, [id]);
  return t;
}

function flightPanelHtml(t) {
  return `
    <article class="card journey">
      <h2 style="margin:0;font-size:1.2rem">Thông tin chuyến bay của tour</h2>
      <div class="journey__route">
        <div class="journey__point">
          <strong>${formatTime(t.depart_at)}</strong>
          <span class="code">${escapeHtml(t.from_code)}</span> · ${escapeHtml(t.from_city)}
          <small>${escapeHtml(t.from_name)}</small>
        </div>
        <div class="journey__mid">${formatDuration(t.duration_min)} ${icon('plane')} Bay thẳng</div>
        <div class="journey__point journey__point--end">
          <strong>${escapeHtml(t.to_code)}</strong>
          ${escapeHtml(t.to_city)}
          <small>${escapeHtml(t.to_name)}</small>
        </div>
      </div>
      <dl class="facts">
        <div><dt>Ngày cất cánh</dt><dd>${formatWeekday(t.depart_at)}, ${formatDate(t.depart_at)}</dd></div>
        <div><dt>Giờ cất cánh</dt><dd>${formatTime(t.depart_at)}</dd></div>
        <div><dt>Thời gian bay</dt><dd>${formatDuration(t.duration_min)}</dd></div>
        <div><dt>Hãng bay</dt><dd>${escapeHtml(t.airline_name)}</dd></div>
        <div><dt>Loại máy bay</dt><dd>${escapeHtml(t.aircraft || 'Đang cập nhật')}</dd></div>
        <div><dt>Điểm đến</dt><dd>${escapeHtml(t.destination)}</dd></div>
      </dl>
    </article>`;
}

function itineraryHtml(days) {
  if (!days.length) return '<p class="muted">Lịch trình đang được cập nhật.</p>';
  return `<div class="itinerary">${days.map((d, i) => `
    <details${i === 0 ? ' open' : ''}>
      <summary><span class="itinerary__day">Ngày ${d.day_no}</span> ${escapeHtml(d.title)}</summary>
      <div class="itinerary__body">
        <p>${escapeHtml(d.description)}</p>
        <ul class="svc-list">
          <li>${icon('meal')} Bữa ăn: ${escapeHtml(d.meals || 'Tự túc')}</li>
          <li>${icon('hotel')} Nghỉ đêm: ${escapeHtml(d.hotel || 'Không')}</li>
        </ul>
      </div>
    </details>`).join('')}</div>`;
}

function listHtml(items, yes) {
  if (!items.length) return '<p class="muted">Không có.</p>';
  return `<ul class="check-list${yes ? '' : ' check-list--no'}">${items.map((s) =>
    `<li>${icon(yes ? 'check' : 'x')} ${escapeHtml(s)}</li>`).join('')}</ul>`;
}

function render(t, days) {
  document.title = `${t.name} – Tour Vietjet`;
  root.innerHTML = `
    <section class="tour-hero">
      <img class="tour-hero__img" src="${escapeHtml(t.thumbnail)}" alt="Ảnh tour ${escapeHtml(t.name)}" width="600" height="400">
      <div class="tour-hero__info">
        <span class="badge" style="align-self:flex-start">${formatDayNight(t.days, t.nights)}</span>
        <h1>${escapeHtml(t.name)}</h1>
        ${airlineHtml(t.airline_code, t.airline_name, t.airline_logo)}
        <p class="tour-hero__price price">${formatVnd(t.price)} <small>/khách</small></p>
        <div class="card book-box">
          <div class="book-box__row">
            <label for="pax-select"><strong style="color:inherit;font-size:1rem">Số khách</strong></label>
            <select class="select" id="pax-select" style="width:auto">${paxOptions(pax)}</select>
          </div>
          <div class="book-box__row">
            <span class="muted">Tạm tính</span>
            <strong id="tour-subtotal">${formatVnd(t.price * pax)}</strong>
          </div>
          <button class="btn btn--primary btn--block" type="button" id="add-tour">Chọn tour / Thêm vào giỏ hàng</button>
        </div>
        <div id="after-add" hidden></div>
      </div>
    </section>

    ${flightPanelHtml(t)}

    <div class="detail-grid">
      <section class="card panel" aria-labelledby="itinerary-title">
        <h2 id="itinerary-title">Lịch trình chuyến đi</h2>
        ${itineraryHtml(days)}
      </section>
      <section class="card panel" aria-labelledby="services-title">
        <h2 id="services-title">Dịch vụ bao gồm</h2>
        ${listHtml(parseJsonArray(t.services), true)}
        <h2>Không bao gồm</h2>
        ${listHtml(parseJsonArray(t.excludes), false)}
      </section>
    </div>`;
}

function onAdd() {
  const isNew = addItem({ type: 'tour', refId: tour.id, pax });
  showToast(isNew ? 'Đã thêm tour vào giỏ hàng' : 'Đã cập nhật số khách trong giỏ hàng');
  const box = document.getElementById('after-add');
  box.hidden = false;
  box.innerHTML = `
    <div class="after-add">
      <p>${icon('check')} Đã thêm ${pax} khách vào giỏ hàng</p>
      <div>
        <a class="btn btn--primary" href="cart.html">Xem giỏ hàng</a>
        <a class="btn btn--secondary" href="tours.html">Xem tour khác</a>
      </div>
    </div>`;
}

async function init() {
  if (!tourId) {
    root.innerHTML = notFoundHtml('Thiếu mã tour. Hãy chọn tour từ danh sách.');
    return;
  }
  root.innerHTML = skeletonHtml(2);
  try {
    tour = await loadTour(tourId);
    if (!tour) {
      root.innerHTML = notFoundHtml('Tour không tồn tại hoặc đã bị xoá.');
      return;
    }
    const days = await query('SELECT * FROM tour_itineraries WHERE tour_id = ? ORDER BY day_no', [tourId]);
    render(tour, days);
  } catch (err) {
    root.innerHTML = errorHtml(err);
    return;
  }

  root.addEventListener('change', (e) => {
    if (e.target.id !== 'pax-select') return;
    pax = Number(e.target.value);
    document.getElementById('tour-subtotal').textContent = formatVnd(tour.price * pax);
  });
  root.addEventListener('click', (e) => { if (e.target.closest('#add-tour')) onAdd(); });
}

init();
