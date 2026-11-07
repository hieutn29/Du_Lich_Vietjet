import { query } from '../db.js';
import {
  initLayout, airlineHtml, emptyStateHtml, errorHtml, skeletonHtml, setupFilterDrawer,
} from '../components.js';
import {
  escapeHtml, formatVnd, formatDate, formatTime, formatDuration, formatWeekday,
  getParams, getIntParam, todayIso, hourBucket, TIME_BUCKETS, icon,
} from '../utils.js';

initLayout('flights');

const PAGE_SIZE = 20;
const params = getParams();
const pax = getIntParam(params, 'pax', 1, 1, 9);
const filterForm = document.getElementById('filter-form');
const listEl = document.getElementById('flight-list');
const countEl = document.getElementById('result-count');
const loadMoreEl = document.getElementById('load-more');
const tabsEl = document.getElementById('leg-tabs');

// Lưu lại trang tìm kiếm để nút "Tiếp tục tìm chuyến bay" ở trang chi tiết quay về đúng chỗ
sessionStorage.setItem('vietjet_last_search', window.location.href);

const state = { legs: [], activeLeg: 0, shown: PAGE_SIZE, airportMap: new Map() };

/** Xác định các chiều bay cần tìm từ query string */
function buildLegs() {
  const from = params.get('from');
  const to = params.get('to');
  const depart = params.get('depart');
  const ret = params.get('return');
  if (from && to && depart) {
    const legs = [{ label: 'Chuyến đi', from, to, date: depart }];
    if (params.get('trip') === 'roundtrip' && ret) legs.push({ label: 'Chuyến về', from: to, to: from, date: ret });
    return legs;
  }
  // Không có tìm kiếm cụ thể: hiển thị các chuyến trong 3 ngày tới
  return [{ label: 'Tất cả', from, to, dateFrom: todayIso(), dateTo: todayIso(2) }];
}

const FLIGHT_SELECT = `
  SELECT f.id, f.flight_no, f.depart_at, f.arrive_at, f.duration_min, f.stops, f.stop_city,
         f.trip_type, f.carry_on_kg, f.has_meal,
         a.code AS airline_code, a.name AS airline_name, a.logo AS airline_logo,
         fa.code AS from_code, ta.code AS to_code,
         (SELECT price FROM fares WHERE flight_id = f.id AND class = 'economy') AS eco_price,
         (SELECT checked_kg FROM fares WHERE flight_id = f.id AND class = 'economy') AS eco_checked,
         (SELECT price FROM fares WHERE flight_id = f.id AND class = 'business') AS bus_price
  FROM flights f
  JOIN airlines a ON a.id = f.airline_id
  JOIN airports fa ON fa.id = f.from_airport_id
  JOIN airports ta ON ta.id = f.to_airport_id`;

async function fetchLeg(leg) {
  const where = [];
  const values = [];
  if (leg.from) { where.push('fa.code = ?'); values.push(leg.from); }
  if (leg.to) { where.push('ta.code = ?'); values.push(leg.to); }
  if (leg.date) { where.push('date(f.depart_at) = ?'); values.push(leg.date); }
  else { where.push('date(f.depart_at) BETWEEN ? AND ?'); values.push(leg.dateFrom, leg.dateTo); }
  const sql = `${FLIGHT_SELECT} WHERE ${where.join(' AND ')} ORDER BY f.depart_at`;
  return query(sql, values);
}

function readFilters() {
  const data = new FormData(filterForm);
  return {
    sort: data.get('sort'),
    trip: data.get('trip'),
    stops: data.getAll('stops').map(Number),
    airlines: data.getAll('airline'),
    times: data.getAll('time').map(Number),
    classes: data.getAll('class'),
  };
}

/** Giá hiển thị: thấp nhất trong các hạng đang chọn (mặc định: mọi hạng) */
function displayPrice(f, classes) {
  const wanted = classes.length ? classes : ['economy', 'business'];
  const prices = [];
  if (wanted.includes('economy') && f.eco_price != null) prices.push(f.eco_price);
  if (wanted.includes('business') && f.bus_price != null) prices.push(f.bus_price);
  return prices.length ? Math.min(...prices) : null;
}

// AND giữa các nhóm, OR trong cùng một nhóm
function applyFilters(flights, flt) {
  return flights
    .filter((f) => flt.trip === 'all' || f.trip_type === 'both' || f.trip_type === flt.trip)
    .filter((f) => !flt.stops.length || flt.stops.includes(f.stops > 0 ? 1 : 0))
    .filter((f) => !flt.airlines.length || flt.airlines.includes(f.airline_code))
    .filter((f) => !flt.times.length || flt.times.includes(hourBucket(f.depart_at)))
    .map((f) => ({ ...f, price: displayPrice(f, flt.classes) }))
    .filter((f) => f.price != null)
    .sort((a, b) => (flt.sort === 'desc' ? b.price - a.price : a.price - b.price));
}

function stopLabel(f) {
  if (!f.stops) return '<span class="flight-card__stop flight-card__stop--direct">Bay thẳng</span>';
  return `<span class="flight-card__stop">${f.stops} điểm dừng (${escapeHtml(f.stop_city || '')})</span>`;
}

function flightCardHtml(f, classes) {
  const nextDay = f.arrive_at.slice(0, 10) !== f.depart_at.slice(0, 10);
  const fareClass = classes.length === 1 ? classes[0] : 'economy';
  const chosenClass = fareClass === 'business' && f.bus_price == null ? 'economy' : fareClass;
  const checked = f.eco_checked ? `Ký gửi ${f.eco_checked}kg` : 'Ký gửi: mua thêm';
  return `
    <article class="card card--hover flight-card">
      <div class="flight-card__info">
        <div class="flight-card__top">
          ${airlineHtml(f.airline_code, f.airline_name, f.airline_logo)}
          <span class="badge badge--neutral">${escapeHtml(f.flight_no)}</span>
        </div>
        <div class="flight-card__route">
          <div class="flight-card__point"><strong>${formatTime(f.depart_at)}</strong><span>${escapeHtml(f.from_code)}</span></div>
          <div class="flight-card__line">
            <span>${formatDuration(f.duration_min)}</span>
            <hr>
            ${stopLabel(f)}
          </div>
          <div class="flight-card__point flight-card__point--end"><strong>${formatTime(f.arrive_at)}${nextDay ? '<sup>+1</sup>' : ''}</strong><span>${escapeHtml(f.to_code)}</span></div>
        </div>
        <span class="flight-card__date">${icon('calendar')} ${formatWeekday(f.depart_at)}, ${formatDate(f.depart_at)}</span>
        <ul class="svc-list">
          <li>${icon('bag')} Xách tay ${f.carry_on_kg}kg</li>
          <li>${icon('suitcase')} ${checked}</li>
          <li>${icon('meal')} ${f.has_meal ? 'Có suất ăn' : 'Không suất ăn'}</li>
          ${f.bus_price != null ? '<li><span class="badge">Có hạng Thương gia</span></li>' : ''}
        </ul>
      </div>
      <div class="flight-card__buy">
        <p class="flight-card__price">Từ <strong>${formatVnd(f.price)}</strong>/khách</p>
        <a class="btn btn--primary" href="flight-detail.html?id=${f.id}&pax=${pax}&class=${chosenClass}">Chọn</a>
      </div>
    </article>`;
}

function render() {
  const leg = state.legs[state.activeLeg];
  if (!leg?.flights) return;
  const flt = readFilters();
  const results = applyFilters(leg.flights, flt);
  countEl.textContent = `Tìm thấy ${results.length} chuyến bay`;

  if (!results.length) {
    listEl.innerHTML = emptyStateHtml(
      'Không tìm thấy chuyến bay phù hợp',
      'Hãy thử bỏ bớt bộ lọc hoặc đổi ngày bay.',
      '<button type="button" class="btn btn--primary" data-clear>Xoá bộ lọc</button><a class="btn btn--secondary" href="index.html#search">Đổi tìm kiếm</a>');
    loadMoreEl.hidden = true;
    return;
  }
  listEl.innerHTML = results.slice(0, state.shown).map((f) => flightCardHtml(f, flt.classes)).join('');
  loadMoreEl.hidden = results.length <= state.shown;
}

function renderTabs() {
  if (state.legs.length < 2) return;
  tabsEl.hidden = false;
  tabsEl.innerHTML = state.legs.map((leg, i) => `
    <button type="button" class="leg-tab" role="tab" aria-selected="${i === state.activeLeg}" data-leg="${i}">
      <strong>${leg.label}: ${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</strong>
      <span>${formatWeekday(leg.date)}, ${formatDate(leg.date)}</span>
    </button>`).join('');
}

function cityLabel(code) {
  const a = state.airportMap.get(code);
  return a ? `${escapeHtml(a.city)} (${escapeHtml(code)})` : escapeHtml(code);
}

function renderSummary() {
  const box = document.getElementById('search-summary');
  const from = params.get('from');
  const to = params.get('to');
  const depart = params.get('depart');
  if (!(from && to && depart)) {
    box.innerHTML = `
      <div>
        <div class="search-summary__route">${icon('plane')} Tất cả chuyến bay</div>
        <div class="search-summary__meta"><span>Từ ${formatDate(todayIso())} đến ${formatDate(todayIso(2))}</span></div>
      </div>
      <a class="btn btn--primary btn--sm" href="index.html#search">Tìm chuyến bay</a>`;
    return;
  }
  const isRound = params.get('trip') === 'roundtrip' && params.get('return');
  const editUrl = `index.html?${params.toString()}#search`;
  box.innerHTML = `
    <div>
      <div class="search-summary__route">${cityLabel(from)} ${icon(isRound ? 'swap' : 'arrow')} ${cityLabel(to)}</div>
      <div class="search-summary__meta">
        <span>${isRound ? 'Khứ hồi' : 'Một chiều'}</span>
        <span>Đi: ${formatDate(depart)}</span>
        ${isRound ? `<span>Về: ${formatDate(params.get('return'))}</span>` : ''}
        <span>${pax} khách</span>
      </div>
    </div>
    <a class="btn btn--secondary btn--sm" href="${escapeHtml(editUrl)}">Đổi tìm kiếm</a>`;
}

async function setupFilters() {
  const airlines = await query('SELECT code, name FROM airlines ORDER BY name');
  const preselected = params.get('airline');
  document.getElementById('airline-filters').innerHTML = airlines.map((a) => `
    <label class="check"><input type="checkbox" name="airline" value="${escapeHtml(a.code)}"${a.code === preselected ? ' checked' : ''}> ${escapeHtml(a.name)}</label>`).join('');
  document.getElementById('time-filters').innerHTML = TIME_BUCKETS.map((label, i) => `
    <label class="check"><input type="checkbox" name="time" value="${i}"> ${label}</label>`).join('');

  const trip = params.get('trip');
  if (trip === 'roundtrip' || trip === 'oneway') filterForm.querySelector(`input[name="trip"][value="${trip}"]`).checked = true;
}

function clearFilters() {
  filterForm.reset();
  filterForm.querySelectorAll('input[name="airline"]').forEach((el) => { el.checked = false; });
  state.shown = PAGE_SIZE;
  render();
}

function bindEvents() {
  filterForm.addEventListener('change', () => { state.shown = PAGE_SIZE; render(); });
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  listEl.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) clearFilters(); });
  loadMoreEl.querySelector('button').addEventListener('click', () => { state.shown += PAGE_SIZE; render(); });
  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-leg]');
    if (!tab) return;
    state.activeLeg = Number(tab.dataset.leg);
    state.shown = PAGE_SIZE;
    renderTabs();
    render();
  });
  setupFilterDrawer(document.getElementById('filters'), document.getElementById('filters-toggle'));
}

async function init() {
  listEl.innerHTML = skeletonHtml(4);
  bindEvents();
  try {
    const airports = await query('SELECT code, city FROM airports');
    airports.forEach((a) => state.airportMap.set(a.code, a));
    renderSummary();
    await setupFilters();
    state.legs = buildLegs();
    for (const leg of state.legs) leg.flights = await fetchLeg(leg);
    renderTabs();
    render();
  } catch (err) {
    countEl.textContent = '';
    listEl.innerHTML = errorHtml(err);
  }
}

init();
