// Page counters backed by the D1 database bound as env.DB.
//   GET  /api/counts?keys=a,b        -> { a: 12, b: 3 }
//   POST /api/hit  {"key":"a","n":1} -> { key: "a", n: 13, ... }
// POST bodies may arrive as text/plain (navigator.sendBeacon), so parse the raw text.
//
// Anti-refresh: visitors are identified by a salted hash of their IP (the raw IP is never stored).
//   - "once" keys count each IP a single time per group; a repeat returns that IP's original number.
//   - "quota" keys count at most `cap` steps per IP per day (China time); extra clicks are ignored.

const ONCE = {
  '91_visit': '91_visit',
  '91_enter': '91_choice', // enter / leave share a group: one choice per IP
  '91_leave': '91_choice',
  event_visit: 'event_visit',
};
const QUOTA = { event_v50: 20 };
const KEYS = new Set([...Object.keys(ONCE), ...Object.keys(QUOTA)]);
const MAX_STEP = 20;

// Create tables and the hashing salt on first use, so a fresh database needs no manual setup.
let ready;
const init = (db) =>
  (ready ??= (async () => {
    for (const sql of [
      'CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)',
      'CREATE TABLE IF NOT EXISTS visitors (grp TEXT NOT NULL, who TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (grp, who))',
      'CREATE TABLE IF NOT EXISTS quota (grp TEXT NOT NULL, who TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (grp, who))',
      'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
    ]) await db.prepare(sql).run();
    const fresh = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
    await db.prepare("INSERT INTO meta (k, v) VALUES ('salt', ?) ON CONFLICT(k) DO NOTHING").bind(fresh).run();
    const { v } = await db.prepare("SELECT v FROM meta WHERE k = 'salt'").first();
    return crypto.subtle.importKey('raw', new TextEncoder().encode(v), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  })().catch((e) => { ready = undefined; throw e; }));

async function visitorId(request, key) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  return [...new Uint8Array(sig, 0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const bump = (db, key, step) =>
  db.prepare('INSERT INTO counters (key, n) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET n = n + ? RETURNING n')
    .bind(key, step, step).first().then((r) => r.n);

const current = (db, key) =>
  db.prepare('SELECT n FROM counters WHERE key = ?').bind(key).first().then((r) => (r ? r.n : 0));

async function hitOnce(db, key, who) {
  const grp = ONCE[key];
  // Claim the (group, visitor) slot first; only the request that wins the insert may count.
  const claimed = await db
    .prepare('INSERT INTO visitors (grp, who, key) VALUES (?, ?, ?) ON CONFLICT(grp, who) DO NOTHING RETURNING who')
    .bind(grp, who, key).first();
  if (!claimed) {
    const prev = await db.prepare('SELECT key, n FROM visitors WHERE grp = ? AND who = ?').bind(grp, who).first();
    return { key: prev.key, n: prev.n, dup: true };
  }
  const n = await bump(db, key, 1);
  await db.prepare('UPDATE visitors SET n = ? WHERE grp = ? AND who = ?').bind(n, grp, who).run();
  return { key, n, dup: false };
}

async function hitQuota(db, key, who, step) {
  const cap = QUOTA[key];
  // UTC+8 calendar day, so the daily quota resets at midnight China time.
  const grp = `${key}:${new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10)}`;
  await db.prepare('INSERT INTO quota (grp, who) VALUES (?, ?) ON CONFLICT(grp, who) DO NOTHING').bind(grp, who).run();
  const { used } = await db.prepare('SELECT used FROM quota WHERE grp = ? AND who = ?').bind(grp, who).first();
  const allow = Math.min(step, cap - used);
  const took = allow > 0 && await db
    .prepare('UPDATE quota SET used = used + ? WHERE grp = ? AND who = ? AND used + ? <= ? RETURNING used')
    .bind(allow, grp, who, allow, cap).first();
  if (!took) return { key, n: await current(db, key), counted: 0, left: Math.max(cap - used, 0) };
  return { key, n: await bump(db, key, allow), counted: allow, left: cap - took.used };
}

export async function handleCounter(request, env, url) {
  const salt = await init(env.DB);

  if (request.method === 'GET' && url.pathname === '/api/counts') {
    const keys = (url.searchParams.get('keys') || '').split(',').filter((k) => KEYS.has(k));
    if (!keys.length) return json({ error: 'unknown key' }, 400);
    const { results } = await env.DB
      .prepare(`SELECT key, n FROM counters WHERE key IN (${keys.map(() => '?').join(',')})`)
      .bind(...keys)
      .all();
    const out = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const r of results) out[r.key] = r.n;
    return json(out);
  }

  if (request.method === 'POST' && url.pathname === '/api/hit') {
    let body;
    try { body = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400); }
    const key = body && body.key;
    const step = Math.floor(Number(body && body.n) || 1);
    if (!KEYS.has(key)) return json({ error: 'unknown key' }, 400);
    if (step < 1 || step > MAX_STEP) return json({ error: 'bad n' }, 400);
    const who = await visitorId(request, salt);
    return json(ONCE[key] ? await hitOnce(env.DB, key, who) : await hitQuota(env.DB, key, who, step));
  }

  return json({ error: 'not found' }, 404);
}
