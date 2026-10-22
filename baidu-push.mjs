// Push every URL in sitemap.xml to Baidu's 普通收录 API. Token lives in .env (gitignored).
import { readFileSync } from 'node:fs';

const SITE = 'https://www.lolgeng.com';
const env = Object.fromEntries(
  readFileSync(new URL('.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => l.split(/=(.*)/s).slice(0, 2).map(s => s.trim()))
);
const token = process.env.BAIDU_PUSH_TOKEN || env.BAIDU_PUSH_TOKEN;
if (!token) throw new Error('BAIDU_PUSH_TOKEN missing from .env');

const sitemap = readFileSync(new URL('sitemap.xml', import.meta.url), 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)].map(m => m[1]);

const res = await fetch(`http://data.zz.baidu.com/urls?site=${SITE}&token=${token}`, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: urls.join('\n'),
});
console.log(`pushed ${urls.length} urls → ${res.status}`, await res.text());
