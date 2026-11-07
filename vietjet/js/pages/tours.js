import { query } from '../db.js';
import {
  initLayout, airlineHtml, emptyStateHtml, errorHtml, skeletonHtml, setupFilterDrawer,
} from '../components.js';
import {
  escapeHtml, formatVnd, formatDate, formatTime, formatDuration, formatDayNight,
  getParams, hourBucket, parseJsonArray, TIME_BUCKETS, icon,
} from '../utils.js';

initLayout('tours');

const filterForm = document.getElementById('filter-form');
const listEl = document.getElementById('tour-list');
const countEl = document.getElementById('result-count');
let tours = [];

function readFilters() {
  const data = new FormData(filterForm);
  return {
    sort: data.get('sort'),
    airlines: data.getAll('airline'),
    times: data.getAll('time').map(Number),
  };
}

function applyFilters(list, flt) {
  return list
    .filter((t) => !flt.airlines.length || flt.airlines.includes(t.airline_code))
    .filter((t) => !flt.times.length || flt.times.includes(hourBucket(t.depart_at)))
    .sort((a, b) => (flt.sort === 'desc' ? b.price - a.price : a.price - b.price));
}

function tourRowHtml(t) {
  const services = parseJsonArray(t.services).slice(0, 5);
  return `
    <article class="card card--hover tour-row">
      <a href="tour-detail.html?id=${t.id}" tabindex="-1" aria-hidden="true">
        <img class="tour-row__thumb" src="${escapeHtml(t.thumbnail)}" alt="" width="600" height="400" loading="lazy">
      </a>
      <div class="tour-row__body">
        <div class="tour-row__head">
          <div>
            <h2><a href="tour-detail.html?id=${t.id}">${escapeHtml(t.name)}</a></h2>
            <span class="tour-row__dest">${icon('pin')} ${escapeHtml(t.destination)} · khởi hành từ ${escapeHtml(t.from_city)}</span>
          </div>
          <span class="badge">${formatDayNight(t.days, t.nights)}</span>
        </div>
        <div class="tour-row__flight">
          ${airlineHtml(t.airline_code, t.airline_name, t.airline_logo)}
          <span>${icon('calendar')} ${formatDate(t.depart_at)}</span>
          <span>${icon('plane')} Cất cánh ${formatTime(t.depart_at)}</span>
          <span>${icon('clock')} Bay ${formatDuration(t.duration_min)}</span>
        </div>
        <ul class="svc-list">
          ${services.map((s) => `<li>${icon('check')} ${escapeHtml(s)}</li>`).join('')}
        </ul>
        <div class="tour-row__foot">
          <p class="tour-row__price">Từ <strong>${formatVnd(t.price)}</strong> /khách</p>
          <a class="btn btn--primary" href="tour-detail.html?id=${t.id}">Chọn tour</a>
        </div>
      </div>
    </article>`;
}

function render() {
  const results = applyFilters(tours, readFilters());
  countEl.textContent = `Tìm thấy ${results.length} tour`;
  listEl.innerHTML = results.length
    ? results.map(tourRowHtml).join('')
    : emptyStateHtml('Không tìm thấy tour phù hợp', 'Hãy thử bỏ bớt bộ lọc.',
      '<button type="button" class="btn btn--primary" data-clear>Xoá bộ lọc</button>');
}

function clearFilters() {
  filterForm.reset();
  filterForm.querySelectorAll('input[name="airline"]').forEach((el) => { el.checked = false; });
  render();
}

async function setupFilters() {
  const airlines = await query(
    'SELECT DISTINCT a.code, a.name FROM airlines a JOIN tours t ON t.airline_id = a.id ORDER BY a.name');
  const preselected = getParams().get('airline');
  document.getElementById('airline-filters').innerHTML = airlines.map((a) => `
    <label class="check"><input type="checkbox" name="airline" value="${escapeHtml(a.code)}"${a.code === preselected ? ' checked' : ''}> ${escapeHtml(a.name)}</label>`).join('');
  document.getElementById('time-filters').innerHTML = TIME_BUCKETS.map((label, i) => `
    <label class="check"><input type="checkbox" name="time" value="${i}"> ${label}</label>`).join('');
}

async function init() {
  listEl.innerHTML = skeletonHtml(3);
  filterForm.addEventListener('change', render);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  listEl.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) clearFilters(); });
  setupFilterDrawer(document.getElementById('filters'), document.getElementById('filters-toggle'));
  try {
    await setupFilters();
    tours = await query(`
      SELECT t.id, t.name, t.destination, t.thumbnail, t.days, t.nights, t.price,
             t.depart_at, t.duration_min, t.services,
             a.code AS airline_code, a.name AS airline_name, a.logo AS airline_logo,
             fa.city AS from_city
      FROM tours t
      JOIN airlines a ON a.id = t.airline_id
      JOIN airports fa ON fa.id = t.from_airport_id`);
    render();
  } catch (err) {
    countEl.textContent = '';
    listEl.innerHTML = errorHtml(err);
  }
}

init();
