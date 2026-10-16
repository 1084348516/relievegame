// Page counters backed by the D1 database bound as env.DB.
//   GET  /api/counts?keys=a,b        -> { a: 12, b: 3 }
//   POST /api/hit  {"key":"a","n":1} -> { key: "a", n: 13 }
// POST bodies may arrive as text/plain (navigator.sendBeacon), so parse the raw text.

const KEYS = new Set(['91_visit', '91_enter', '91_leave', 'event_visit', 'event_v50']);
const MAX_STEP = 20;

// Create the table on first use so a fresh database needs no manual setup.
let ready;
const init = (db) =>
  (ready ??= db
    .prepare('CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)')
    .run()
    .catch((e) => { ready = undefined; throw e; }));

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function handleCounter(request, env, url) {
  await init(env.DB);

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
    const row = await env.DB
      .prepare('INSERT INTO counters (key, n) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET n = n + ? RETURNING n')
      .bind(key, step, step)
      .first();
    return json({ key, n: row.n });
  }

  return json({ error: 'not found' }, 404);
}
