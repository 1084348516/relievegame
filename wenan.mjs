// Renders /event/wenan, the 疯狂星期四文案大全 page, from wenan.json.
// Every line of copy is written into the HTML (not rendered by JS) so search engines can read it.
// To add copy: append to a category's "items" in wenan.json and bump "updated".

const SITE = 'https://www.lolgeng.com';
const PATH = '/event/wenan';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function wenanPage({ updated, categories }) {
  const total = categories.reduce((n, c) => n + c.items.length, 0);
  const count = `${Math.floor(total / 10) * 10}+`;
  const [y, m, d] = updated.split('-').map(Number);
  const title = `疯狂星期四文案大全（${count}条）搞笑、霸总、古风、伤感 V我50文案 - LOL梗`;
  const description = `${total} 条原创疯狂星期四文案，按身世反转、深情伤感、震惊体、古风、霸总、通知体、打工人、一句话短文案分类，每条一键复制，每周更新。`;

  const toc = categories
    .map((c) => `<a href="#${c.id}">${esc(c.name)} <small>${c.items.length}</small></a>`)
    .join('\n      ');

  const sections = categories
    .map((c) => `
  <section class="cat" id="${c.id}">
    <h2>${esc(c.name)}文案</h2>
    <p class="intro">${esc(c.intro)}</p>
    <ol>
${c.items.map((t) => `      <li><p>${esc(t)}</p><button class="copy" type="button">复制</button></li>`).join('\n')}
    </ol>
  </section>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${PATH}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}${PATH}">
<meta property="og:title" content="疯狂星期四文案大全（${count}条）">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}/og/wenan.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8D%97%3C/text%3E%3C/svg%3E">
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `疯狂星期四文案大全（${count}条）`,
    description,
    dateModified: updated,
    inLanguage: 'zh-CN',
    mainEntityOfPage: `${SITE}${PATH}`,
    publisher: { '@type': 'Organization', name: 'LOL梗', url: SITE },
  })}</script>
<style>
  :root {
    --red: #c8251a;
    --cream: #fff3dc;
    --soft: rgba(255, 243, 220, .72);
    --line: rgba(255, 243, 220, .18);
    --card: rgba(0, 0, 0, .12);
    --gold: #ffc23d;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--red);
    color: var(--cream);
    font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    line-height: 1.75;
  }
  main { max-width: 680px; margin: 0 auto; padding: 40px 16px 32px; }
  .crumbs { font-size: 13px; color: var(--soft); }
  .crumbs a { color: var(--soft); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; margin-right: 6px; }
  .crumbs a:hover { color: var(--cream); border-color: var(--cream); }
  h1 { margin: 28px 0 8px; font-size: clamp(32px, 8vw, 48px); line-height: 1.2; letter-spacing: .02em; }
  h1 em { font-style: normal; color: var(--gold); }
  .meta { margin: 0 0 16px; font-size: 13px; color: var(--soft); }
  .lead { margin: 0 0 20px; color: var(--soft); }
  .lead a, .outro a { color: var(--cream); text-underline-offset: 3px; }

  .random { display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 14px; background: var(--cream); color: #3a120d; margin-bottom: 24px; }
  .random p { margin: 0; font-size: 17px; min-height: 3.5em; }
  .random div { display: flex; gap: 8px; flex-wrap: wrap; }
  .random button { font: inherit; font-size: 14px; font-weight: 600; border: 0; border-radius: 999px; padding: 8px 18px; cursor: pointer; }
  .random .next { background: var(--red); color: var(--cream); }
  .random .copy-r { background: transparent; color: var(--red); box-shadow: inset 0 0 0 1.5px var(--red); }

  nav.toc { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
  nav.toc a { font-size: 14px; color: var(--cream); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; }
  nav.toc a:hover { border-color: var(--gold); color: var(--gold); }
  nav.toc small { color: var(--gold); margin-left: 2px; }

  .cat { padding-top: 16px; scroll-margin-top: 12px; }
  .cat h2 { margin: 24px 0 4px; font-size: 24px; }
  .cat .intro { margin: 0 0 12px; font-size: 14px; color: var(--soft); }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; counter-reset: n; }
  li { counter-increment: n; display: flex; gap: 12px; align-items: flex-start; padding: 14px 14px 14px 16px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; }
  li::before { content: counter(n, decimal-leading-zero); flex: none; font-size: 12px; font-weight: 600; color: var(--gold); padding-top: 4px; font-variant-numeric: tabular-nums; }
  li p { flex: 1; margin: 0; font-size: 16px; }
  .copy { flex: none; font: inherit; font-size: 13px; color: var(--cream); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 2px 12px; cursor: pointer; }
  .copy:hover { border-color: var(--cream); }
  .copy.done { color: var(--gold); border-color: var(--gold); }

  .outro { margin-top: 40px; padding-top: 8px; border-top: 1px solid var(--line); color: var(--soft); font-size: 15px; }
  .outro h2 { margin: 24px 0 8px; font-size: 22px; color: var(--cream); }
  footer { text-align: center; padding: 8px 16px 32px; font-size: 12px; color: var(--soft); }
  footer a { color: inherit; }
</style>
</head>
<body>
<main>
  <div class="crumbs"><a href="/">LOL梗</a><a href="/event">疯狂星期四</a></div>
  <h1>疯狂星期四<em>文案大全</em></h1>
  <p class="meta">共 ${total} 条 · 最后更新 ${y} 年 ${m} 月 ${d} 日 · 每周更新</p>
  <p class="lead">每到星期四就想发疯，却憋不出新段子？这里按套路整理了 ${total} 条原创疯狂星期四文案，从身世反转、霸总小说到官方通知体都有，点“复制”就能直接发到群里。想知道这个梗的来历，可以看<a href="/event">疯狂星期四是什么梗</a>。</p>

  <div class="random" aria-live="polite">
    <p id="pick">${esc(categories[0].items[1])}</p>
    <div><button class="next" id="next" type="button">换一条</button><button class="copy-r" id="copyPick" type="button">复制这条</button></div>
  </div>

  <nav class="toc" aria-label="文案分类">
      ${toc}
  </nav>
${sections}

  <section class="outro">
    <h2>怎么用这些文案？</h2>
    <p>每周四挑一条发到群聊、朋友圈或者私聊给好朋友就行。效果最好的发法是：前面认真铺垫，让对方以为你真的有大事要说，最后一句再亮出“V我50”。也可以把<a href="/event">疯狂星期四页面</a>的链接甩过去，让对方亲手点一下“V 我 50”按钮。</p>
    <h2>文案都是原创的吗？</h2>
    <p>本页文案都是 LOL梗 自己写的，欢迎复制使用。如果你有更好笑的疯四文学，欢迎发邮件到 <a href="mailto:ghdbright@gmail.com">ghdbright@gmail.com</a> 投稿。</p>
  </section>
</main>
<footer><a href="/">LOL梗</a> · <a href="/about">关于本站</a> · <a href="/privacy">隐私政策</a></footer>

<script>
(() => {
  const lines = [...document.querySelectorAll('li p')].map(p => p.textContent);
  const pick = document.getElementById('pick');

  function copy(text, btn, label) {
    const done = () => { btn.textContent = '已复制'; btn.classList.add('done'); setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 1500); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback(text) && done());
    } else if (fallback(text)) done();
  }
  function fallback(text) {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    t.remove();
    return ok;
  }

  document.querySelectorAll('li .copy').forEach(btn => {
    btn.addEventListener('click', () => copy(btn.previousElementSibling.textContent, btn, '复制'));
  });
  document.getElementById('next').addEventListener('click', () => {
    let next;
    do { next = lines[Math.floor(Math.random() * lines.length)]; } while (lines.length > 1 && next === pick.textContent);
    pick.textContent = next;
  });
  const copyPick = document.getElementById('copyPick');
  copyPick.addEventListener('click', () => copy(pick.textContent, copyPick, '复制这条'));
})();
</script>
</body>
</html>
`;
}
