import { query } from '../db.js';
import {
  initLayout, airlineHtml, emptyStateHtml, errorHtml, skeletonHtml,
} from '../components.js';
import {
  escapeHtml, formatVnd, formatDayNight, getParams, todayIso, paxOptions, icon,
} from '../utils.js';

initLayout('home');

const form = document.getElementById('search-form');
const fromSel = document.getElementById('from');
const toSel = document.getElementById('to');
const departInput = document.getElementById('depart');
const returnInput = document.getElementById('return');
const returnField = document.getElementById('return-field');
const paxSel = document.getElementById('pax');

document.getElementById('swap-btn').innerHTML = icon('swap');

function getTrip() {
  return form.querySelector('input[name="trip"]:checked').value;
}

function syncReturnField() {
  const isRound = getTrip() === 'roundtrip';
  returnField.hidden = !isRound;
  returnInput.required = isRound;
}

function setError(id, message) {
  const el = document.getElementById(`${id}-error`);
  if (!el) return;
  el.textContent = message;
  el.closest('.field').classList.toggle('has-error', Boolean(message));
}

function validate() {
  const errors = {};
  const today = todayIso();
  if (!fromSel.value) errors.from = 'Vui lòng chọn điểm xuất phát.';
  if (!toSel.value) errors.to = 'Vui lòng chọn điểm đến.';
  if (fromSel.value && fromSel.value === toSel.value) errors.to = 'Điểm đến phải khác điểm xuất phát.';
  if (!departInput.value) errors.depart = 'Vui lòng chọn ngày đi.';
  else if (departInput.value < today) errors.depart = 'Ngày đi không được trước hôm nay.';
  if (getTrip() === 'roundtrip') {
    if (!returnInput.value) errors.return = 'Vui lòng chọn ngày về.';
    else if (departInput.value && returnInput.value < departInput.value) errors.return = 'Ngày về phải từ ngày đi trở đi.';
  }
  ['from', 'to', 'depart', 'return'].forEach((k) => setError(k, errors[k] || ''));
  return Object.keys(errors).length === 0;
}

function setupForm() {
  const params = getParams();
  const today = todayIso();
  departInput.min = today;
  returnInput.min = today;
  paxSel.innerHTML = paxOptions(parseInt(params.get('pax'), 10) || 1);

  if (params.get('trip') === 'oneway') form.querySelector('input[value="oneway"]').checked = true;
  departInput.value = params.get('depart') || todayIso(3);
  returnInput.value = params.get('return') || todayIso(6);
  syncReturnField();

  form.addEventListener('change', (e) => {
    if (e.target.name === 'trip') syncReturnField();
    if (e.target === departInput && departInput.value) {
      returnInput.min = departInput.value;
      if (returnInput.value && returnInput.value < departInput.value) returnInput.value = departInput.value;
    }
  });

  document.getElementById('swap-btn').addEventListener('click', () => {
    [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      form.querySelector('.has-error select, .has-error input')?.focus();
      return;
    }
    const q = new URLSearchParams({
      trip: getTrip(),
      from: fromSel.value,
      to: toSel.value,
      depart: departInput.value,
    });
    if (getTrip() === 'roundtrip') q.set('return', returnInput.value);
    q.set('pax', paxSel.value);
    window.location.href = `flights.html?${q}`;
  });
}

async function loadAirports() {
  const params = getParams();
  const airports = await query(
    `SELECT code, city, country FROM airports
     ORDER BY CASE country WHEN 'Việt Nam' THEN 0 ELSE 1 END, city`);
  const options = airports.map((a) =>
    `<option value="${escapeHtml(a.code)}">${escapeHtml(a.city)} (${escapeHtml(a.code)})</option>`).join('');
  fromSel.insertAdjacentHTML('beforeend', options);
  toSel.insertAdjacentHTML('beforeend', options);
  fromSel.value = params.get('from') || 'SGN';
  toSel.value = params.get('to') || 'HAN';
}

function tourCardHtml(t) {
  return `
    <a class="card card--hover tour-card" href="tour-detail.html?id=${t.id}">
      <img class="tour-card__thumb" src="${escapeHtml(t.thumbnail)}" alt="Ảnh tour ${escapeHtml(t.name)}" width="600" height="400" loading="lazy">
      <div class="tour-card__body">
        <h3 class="tour-card__name">${escapeHtml(t.name)}</h3>
        <div class="tour-card__meta">
          ${airlineHtml(t.airline_code, t.airline_name, t.airline_logo)}
          <span class="badge">${formatDayNight(t.days, t.nights)}</span>
        </div>
        <p class="tour-card__price price" style="margin-bottom:0">Từ ${formatVnd(t.price)} <small>/khách</small></p>
      </div>
    </a>`;
}

async function loadFeaturedTours() {
  const box = document.getElementById('featured-tours');
  box.innerHTML = skeletonHtml(4, 'card');
  const tours = await query(
    `SELECT t.id, t.name, t.thumbnail, t.days, t.nights, t.price,
            a.code AS airline_code, a.name AS airline_name, a.logo AS airline_logo
     FROM tours t JOIN airlines a ON a.id = t.airline_id
     WHERE t.is_featured = 1
     ORDER BY t.id LIMIT 8`);
  box.innerHTML = tours.length
    ? tours.map(tourCardHtml).join('')
    : `<div style="grid-column:1/-1">${emptyStateHtml('Chưa có tour nổi bật', 'Bảng tours trong data/db.db chưa có tour nào với is_featured = 1.')}</div>`;
}

async function loadAirlines() {
  const airlines = await query('SELECT code, name, logo FROM airlines ORDER BY id');
  document.getElementById('airline-grid').innerHTML = airlines.map((a) => `
    <a class="airline-tile" href="flights.html?airline=${encodeURIComponent(a.code)}" aria-label="Xem chuyến bay của ${escapeHtml(a.name)}">
      <span class="airline-tile__logo">
        ${a.logo ? `<img src="${escapeHtml(a.logo)}" alt="" loading="lazy">` : `<span aria-hidden="true">${escapeHtml(a.code)}</span>`}
      </span>
      ${escapeHtml(a.name)}
    </a>`).join('');
}

setupForm();
Promise.all([loadAirports(), loadFeaturedTours(), loadAirlines()]).catch((err) => {
  document.getElementById('featured-tours').innerHTML = errorHtml(err);
});
