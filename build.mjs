// Builds dist/: the zh homepage (/), the en homepage (/en/), and copies static files (incl. og/ share images from og.mjs).
// Memes are listed in memes.json — add an entry there to show it on both homepages.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const SITE = 'https://www.lolgeng.com';
const STATIC = ['event.html', '91.html', 'robots.txt', 'sitemap.xml', 'llms.txt', 'og'];

const text = {
  zh: {
    htmlLang: 'zh-CN',
    path: '/',
    title: 'LOL梗 - 好笑的网络梗合集',
    description: 'LOL梗收集中外互联网上好笑的梗，一个梗一个页面：疯狂星期四、V我50……点开就能玩。',
    brand: 'LOL<span>梗</span>',
    tagline: '收集中外互联网上好笑的梗，一个梗一个页面。',
    footer: '更多梗持续更新中 · lolgeng.com',
    switchLabel: 'EN',
    switchTo: 'en',
    switchTitle: 'Switch to English',
  },
  en: {
    htmlLang: 'en',
    path: '/en/',
    title: 'LOLgeng - Funny Internet Memes',
    description: 'LOLgeng collects funny internet memes from China and around the world, one playful page per meme.',
    brand: 'LOL<span>geng</span>',
    tagline: 'Funny internet memes from China and around the world, one page each.',
    footer: 'More memes coming soon · lolgeng.com',
    switchLabel: '中文',
    switchTo: 'zh',
    switchTitle: '切换到中文',
  },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function page(lang, memes) {
  const t = text[lang];
  const items = memes
    .map((m) => {
      const c = m[lang];
      return `      <li>
        <a class="item" href="${esc(m.url)}">
          <span class="emoji" aria-hidden="true">${m.emoji}</span>
          <div class="body">
            <h2 class="name">${esc(c.name)}</h2>
            <p class="desc">${esc(c.desc)}</p>
          </div>
          ${c.tag ? `<span class="tag">${esc(c.tag)}</span>` : ''}
        </a>
      </li>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}${t.path}">
<link rel="alternate" hreflang="zh" href="${SITE}/">
<link rel="alternate" hreflang="en" href="${SITE}/en/">
<link rel="alternate" hreflang="x-default" href="${SITE}/">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}${t.path}">
<meta property="og:title" content="${esc(t.title)}">
<meta property="og:description" content="${esc(t.description)}">
<meta property="og:image" content="${SITE}/og/home-${lang}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤣</text></svg>">
<style>
  :root {
    --bg: #fff8ec;
    --card: #ffffff;
    --ink: #1d0f0a;
    --muted: #7a6a60;
    --line: #f0e2cc;
    --accent: #d62718;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #17110e;
      --card: #221a16;
      --ink: #fbefe0;
      --muted: #a8968a;
      --line: #33281f;
      --accent: #ff5a47;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
    line-height: 1.6;
  }
  .wrap { max-width: 640px; margin: 0 auto; padding: 56px 16px 40px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  header h1 { margin: 0; font-size: 36px; letter-spacing: .02em; }
  header h1 span { color: var(--accent); }
  header p { margin: 6px 0 0; color: var(--muted); }
  .lang {
    flex: none; margin-top: 8px;
    font-size: 13px; color: var(--muted); text-decoration: none;
    border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px;
  }
  .lang:hover { color: var(--accent); border-color: var(--accent); }
  .list { list-style: none; margin: 36px 0 0; padding: 0; display: grid; gap: 12px; }
  .item {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 18px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 14px;
    color: inherit; text-decoration: none;
    transition: transform .15s ease, border-color .15s ease;
  }
  .item:hover { transform: translateY(-2px); border-color: var(--accent); }
  .emoji { font-size: 32px; line-height: 1; flex: none; }
  .body { flex: 1; min-width: 0; }
  .name { margin: 0; font-size: 18px; font-weight: 700; }
  .desc { margin: 2px 0 0; color: var(--muted); font-size: 14px; }
  .tag {
    flex: none; white-space: nowrap;
    font-size: 12px; color: var(--accent);
    border: 1px solid currentColor; border-radius: 999px; padding: 2px 10px;
  }
  footer { margin-top: 48px; color: var(--muted); font-size: 13px; text-align: center; }
  @media (max-width: 420px) { .tag { display: none; } }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>${t.brand}</h1>
        <p>${esc(t.tagline)}</p>
      </div>
      <a class="lang" href="/?lang=${t.switchTo}" hreflang="${t.switchTo}" title="${esc(t.switchTitle)}">${t.switchLabel}</a>
    </header>

    <ul class="list">
${items}
    </ul>

    <footer>${esc(t.footer)}</footer>
  </div>
</body>
</html>
`;
}

const memes = JSON.parse(readFileSync('memes.json', 'utf8'));

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/en', { recursive: true });
writeFileSync('dist/index.html', page('zh', memes));
writeFileSync('dist/en/index.html', page('en', memes));
for (const f of STATIC) cpSync(f, `dist/${f}`, { recursive: true });
