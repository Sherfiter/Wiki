import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 访客统计：全站访问量 / 独立访客 / 今日访问。
// 数据落在本机 .cache/visitors.json（已 gitignore），重启不丢；
// 如果文件系统只读写不进去，就退回进程内存，至少本次运行还能正常计数。
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'visitors.json');

const MAX_VISITORS = 200000; // 最多记 20 万个访客指纹，防止文件无限长
const VISITOR_TTL = 365 * 24 * 3600 * 1000; // 一年没来就忘掉
const PRUNE_INTERVAL = 24 * 3600 * 1000; // 每天最多清理一次

// 统一按北京时间切日，和「每日速览」保持一致
const DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function today() {
  const parts = DAY.formatToParts(new Date());
  const value = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function emptyDb() {
  return { total: 0, unique: 0, today: 0, todayDate: today(), visitors: {}, prunedAt: 0 };
}

function normalizeDb(data) {
  const db = emptyDb();
  if (!data || typeof data !== 'object') return db;

  db.total = Math.max(0, Math.floor(Number(data.total) || 0));
  db.unique = Math.max(0, Math.floor(Number(data.unique) || 0));
  db.today = Math.max(0, Math.floor(Number(data.today) || 0));
  db.todayDate = typeof data.todayDate === 'string' ? data.todayDate : db.todayDate;
  db.prunedAt = Math.max(0, Number(data.prunedAt) || 0);

  if (data.visitors && typeof data.visitors === 'object') {
    for (const [key, ts] of Object.entries(data.visitors)) {
      const time = Number(ts);
      if (key && Number.isFinite(time)) db.visitors[key] = time;
    }
  }
  return db;
}

// 同一个进程里以内存为准，磁盘只是持久化；这样文件写不进去也不会每次从零开始
let memory = null;

function load() {
  if (memory) return memory;
  try {
    memory = normalizeDb(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
  } catch {
    memory = emptyDb();
  }
  return memory;
}

function save(db) {
  memory = db;
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const tmp = `${CACHE_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, CACHE_FILE);
  } catch {
    // 写不进去就只保留内存计数
  }
}

// 只存 hash，不落原始 cookie 值
function fingerprint(id) {
  return crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 32);
}

function prune(db, now) {
  if (Object.keys(db.visitors).length <= MAX_VISITORS && now - db.prunedAt < PRUNE_INTERVAL) {
    return;
  }

  const cutoff = now - VISITOR_TTL;
  let kept = Object.entries(db.visitors).filter(([, ts]) => ts >= cutoff);

  if (kept.length > MAX_VISITORS) {
    kept.sort((a, b) => b[1] - a[1]);
    kept.length = MAX_VISITORS;
  }

  db.visitors = Object.fromEntries(kept);
  db.prunedAt = now;
}

function snapshot(db) {
  const date = today();
  return {
    total: db.total,
    unique: db.unique,
    today: db.todayDate === date ? db.today : 0,
    date,
  };
}

// 文件读改写串行化，避免并发请求互相覆盖
let queue = Promise.resolve();

function withLock(task) {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function getVisitorStats() {
  return withLock(() => snapshot(load()));
}

export async function recordVisit({ visitorId = '', fallback = '' } = {}) {
  return withLock(() => {
    const db = load();
    const now = Date.now();
    const date = today();

    if (db.todayDate !== date) {
      db.todayDate = date;
      db.today = 0;
    }

    db.total += 1;
    db.today += 1;

    const id = visitorId || fallback || crypto.randomBytes(12).toString('hex');
    const key = fingerprint(id);
    if (!db.visitors[key]) db.unique += 1;
    db.visitors[key] = now;

    prune(db, now);
    save(db);
    return snapshot(db);
  });
}
