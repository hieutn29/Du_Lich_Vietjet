// Khởi tạo SQLite (sql.js) trong trình duyệt từ file data/db.db,
// lưu bản sao (kèm đơn hàng mới) vào localStorage.

const DB_FILE = 'data/db.db';
const DB_KEY = 'vietjet_db';
const SOURCE_KEY = 'vietjet_db_source'; // dấu vân tay của db.db mà bản sao được tạo từ đó

const REQUIRED_TABLES = [
  'airlines', 'airports', 'aircraft', 'flights', 'fares', 'tours',
  'tour_itineraries', 'customers', 'orders', 'order_items',
];

let dbPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.initSqlJs) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Không tải được ${src}`));
    document.head.append(script);
  });
}

async function fetchDbFile() {
  // no-cache: luôn hỏi lại server để nhận bản db.db mới nhất sau khi sửa bằng DB Browser
  const res = await fetch(DB_FILE, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Không tải được ${DB_FILE} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Dấu vân tay nhanh (FNV-1a 32 bit + kích thước) để biết db.db có thay đổi không */
function fingerprint(bytes) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return `${bytes.length}-${(hash >>> 0).toString(16)}`;
}

function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function readSavedDb(sourceFp) {
  try {
    // Bản sao chỉ dùng được nếu được tạo từ đúng phiên bản db.db hiện tại
    if (localStorage.getItem(SOURCE_KEY) !== sourceFp) return null;
    const saved = localStorage.getItem(DB_KEY);
    return saved ? fromBase64(saved) : null;
  } catch {
    return null;
  }
}

function persist(db, sourceFp) {
  try {
    localStorage.setItem(DB_KEY, toBase64(db.export()));
    if (sourceFp) localStorage.setItem(SOURCE_KEY, sourceFp);
  } catch (err) {
    console.warn('[db] Không lưu được DB vào localStorage (có thể vượt dung lượng):', err);
  }
  // db.export() reset PRAGMA, bật lại khoá ngoại
  db.exec('PRAGMA foreign_keys = ON;');
}

/** Kiểm tra db.db có đủ bảng theo DATABASE.md; cảnh báo nếu chưa có dữ liệu */
function checkSchema(db) {
  const rows = db.exec("SELECT name FROM sqlite_master WHERE type = 'table'");
  const existing = new Set(rows.length ? rows[0].values.map((v) => v[0]) : []);
  const missing = REQUIRED_TABLES.filter((t) => !existing.has(t));
  if (missing.length) {
    throw new Error(`${DB_FILE} thiếu bảng: ${missing.join(', ')}. Xem DATABASE.md.`);
  }
  const counts = ['airlines', 'airports', 'flights', 'fares', 'tours'].map((t) =>
    [t, db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0]]);
  const empty = counts.filter(([, n]) => n === 0).map(([t]) => t);
  if (empty.length) console.warn(`[db] ${DB_FILE}: các bảng chưa có dữ liệu: ${empty.join(', ')}`);
}

async function createDb() {
  // sql-wasm.js là thư viện UMD, tự gắn initSqlJs vào window
  await loadScript('lib/sql-wasm.js');
  const SQL = await window.initSqlJs({ locateFile: (file) => `lib/${file}` });

  const fileBytes = await fetchDbFile();
  const sourceFp = fingerprint(fileBytes);

  const saved = readSavedDb(sourceFp);
  if (saved) {
    try {
      const db = new SQL.Database(saved);
      db.exec('PRAGMA foreign_keys = ON;');
      return db;
    } catch (err) {
      console.warn('[db] Bản sao trong localStorage bị hỏng, nạp lại từ db.db.', err);
    }
  } else if (localStorage.getItem(DB_KEY)) {
    console.info('[db] db.db đã thay đổi → nạp lại dữ liệu từ file (đơn hàng lưu trong trình duyệt được làm mới).');
  }

  const db = new SQL.Database(fileBytes);
  db.exec('PRAGMA foreign_keys = ON;');
  checkSchema(db);
  persist(db, sourceFp);
  return db;
}

/** Trả về Promise<Database>, chỉ khởi tạo một lần */
export function getDb() {
  if (!dbPromise) dbPromise = createDb();
  return dbPromise;
}

function selectRows(db, sql, params) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

function execute(db, sql, params) {
  const stmt = db.prepare(sql);
  try {
    stmt.run(params);
  } finally {
    stmt.free();
  }
  return db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
}

/** SELECT có tham số (prepared statement), trả về mảng object */
export async function query(sql, params = []) {
  return selectRows(await getDb(), sql, params);
}

/** INSERT/UPDATE/DELETE có tham số, trả về last_insert_rowid */
export async function run(sql, params = []) {
  return execute(await getDb(), sql, params);
}

/**
 * Chạy fn(tx) trong transaction; tx có query()/run() đồng bộ.
 * Lỗi → ROLLBACK và ném lại lỗi. Thành công → COMMIT + saveDb().
 */
export async function transaction(fn) {
  const db = await getDb();
  const tx = {
    query: (sql, params = []) => selectRows(db, sql, params),
    run: (sql, params = []) => execute(db, sql, params),
  };
  db.exec('BEGIN');
  try {
    const result = fn(tx);
    db.exec('COMMIT');
    persist(db);
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export async function saveDb() {
  persist(await getDb());
}

/** Xoá bản sao trong trình duyệt; lần tải sau đọc lại nguyên bản từ data/db.db */
export function resetDb() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(SOURCE_KEY);
}

/** Tải bản DB hiện tại (kèm đơn hàng đã đăng ký trên web) về máy dưới dạng file .db */
export async function downloadDb(filename = 'db-with-orders.db') {
  const db = await getDb();
  const blob = new Blob([db.export()], { type: 'application/x-sqlite3' });
  db.exec('PRAGMA foreign_keys = ON;');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
