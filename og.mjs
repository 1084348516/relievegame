// Renders the 1200×630 share images (og:image) into og/*.png with headless Chrome.
// Run `node og.mjs` after changing a card below, then commit the PNGs — the build only copies them.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const base = `
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: "PingFang SC", "Hiragino Sans GB", sans-serif;
    display: flex; flex-direction: column; justify-content: center;
    padding: 40px 96px 110px; position: relative;
  }
  .emoji { position: absolute; right: 96px; top: 50%; transform: translateY(-50%); font-size: 260px; line-height: 1; }
  .site { position: absolute; left: 96px; bottom: 56px; font-size: 28px; font-weight: 600; letter-spacing: .04em; opacity: .7; }
`;

const home = (brand, tagline) => `
  <style>${base}
    body { background: #fff8ec; color: #1d0f0a; }
    h1 { font-size: 168px; font-weight: 800; letter-spacing: .01em; line-height: 1; }
    h1 span { color: #d62718; }
    p { margin-top: 32px; font-size: 36px; font-weight: 500; color: #7a6a60; max-width: 800px; line-height: 1.4; }
    .emoji { font-size: 120px; display: grid; gap: 24px; }
  </style>
  <h1>${brand}</h1>
  <p>${tagline}</p>
  <div class="emoji"><span>🍗</span><span>😏</span><span>🤣</span></div>
  <div class="site">lolgeng.com</div>`;

const cards = {
  'home-zh': home('LOL<span>梗</span>', '收集中外互联网上好笑的梗，一个梗一个页面。'),
  'home-en': home('LOL<span>geng</span>', 'Funny internet memes from China and around the world.'),
  event: `
    <style>${base}
      body { background: radial-gradient(ellipse at 80% 50%, #e0392b 0%, #c8251a 55%, #9e1a11 100%); color: #fff3dc; }
      .kicker { font-size: 30px; font-weight: 600; letter-spacing: .2em; color: #ffc23d; }
      h1 { margin-top: 16px; font-size: 130px; font-weight: 900; line-height: 1.05; }
      h2 { margin-top: 16px; font-size: 68px; font-weight: 800; color: #ffc23d; }
    </style>
    <div class="kicker">CRAZY THURSDAY · V ME 50</div>
    <h1>疯狂<br>星期四</h1>
    <h2>V 我 50</h2>
    <div class="emoji">🍗</div>
    <div class="site">lolgeng.com/event</div>`,
  wenan: `
    <style>${base}
      body { background: radial-gradient(ellipse at 80% 50%, #e0392b 0%, #c8251a 55%, #9e1a11 100%); color: #fff3dc; }
      .kicker { font-size: 30px; font-weight: 600; letter-spacing: .2em; color: #ffc23d; }
      h1 { margin-top: 16px; font-size: 112px; font-weight: 900; line-height: 1.1; }
      h1 em { font-style: normal; color: #ffc23d; }
      p { margin-top: 24px; font-size: 38px; font-weight: 600; }
    </style>
    <div class="kicker">V 我 50 · 一键复制</div>
    <h1>疯狂星期四<br><em>文案大全</em></h1>
    <p>100+ 条 · 搞笑 / 霸总 / 古风 / 伤感</p>
    <div class="emoji">🍗</div>
    <div class="site">lolgeng.com/event/wenan</div>`,
  // The bait, not the punchline: this card shows up wherever the /91 prank link is shared.
  91: `
    <style>${base}
      body { background: radial-gradient(ellipse at 50% -10%, #2a1124 0%, #0c0b10 65%); color: #f1edf7; }
      h1 { font-size: 200px; font-weight: 900; line-height: 1; color: #ff3d7f; }
      h2 { margin-top: 24px; font-size: 72px; font-weight: 800; }
      p { margin-top: 20px; font-size: 38px; color: #8f88a0; }
      .emoji { right: 150px; }
    </style>
    <h1>91</h1>
    <h2>内容已加密</h2>
    <p>点开验证后查看</p>
    <div class="emoji"><svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#ff3d7f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
    <div class="site">lolgeng.com/91</div>`,
};

const tmp = mkdtempSync(join(tmpdir(), 'og-'));
mkdirSync('og', { recursive: true });
try {
  for (const [name, body] of Object.entries(cards)) {
    const html = join(tmp, `${name}.html`);
    writeFileSync(html, `<!DOCTYPE html><meta charset="UTF-8">${body}`);
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--window-size=1200,630', `--screenshot=${resolve('og', `${name}.png`)}`, `file://${html}`,
    ], { stdio: 'ignore' });
    console.log(`og/${name}.png`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
