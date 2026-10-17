// Sends visitors of "/" to the English homepage unless their browser prefers Chinese.
// "/?lang=zh|en" (the language switcher) remembers an explicit choice in a cookie.
// "/api/*" is the page counter (see counter.js).
// The bare domain lolgeng.com permanently redirects to www so search engines see one site.
import { handleCounter } from './counter.js';

const YEAR = 60 * 60 * 24 * 365;
const CANONICAL_HOST = 'www.lolgeng.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'lolgeng.com') {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith('/api/')) return handleCounter(request, env, url);
    if (url.pathname !== '/') return env.ASSETS.fetch(request);

    const chosen = url.searchParams.get('lang');
    if (chosen === 'zh' || chosen === 'en') {
      url.searchParams.delete('lang');
      return redirect(homeUrl(url, chosen), {
        'Set-Cookie': `lang=${chosen}; Path=/; Max-Age=${YEAR}; SameSite=Lax; Secure`,
      });
    }

    if ((cookieLang(request) ?? headerLang(request)) === 'en') {
      return redirect(homeUrl(url, 'en'));
    }

    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('Vary', 'Accept-Language, Cookie');
    return out;
  },
};

function homeUrl(url, lang) {
  return new URL((lang === 'en' ? '/en/' : '/') + url.search, url);
}

function redirect(location, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: { Location: location.toString(), 'Cache-Control': 'private, no-store', Vary: 'Accept-Language, Cookie', ...headers },
  });
}

function cookieLang(request) {
  const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)lang=(zh|en)\b/);
  return m ? m[1] : null;
}

// No header (e.g. search engine crawlers) → Chinese, the site's default.
function headerLang(request) {
  const header = request.headers.get('Accept-Language');
  if (!header) return 'zh';
  const [top] = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag, q: q ? parseFloat(q.split('=')[1]) : 1 };
    })
    .filter((l) => l.tag && l.tag !== '*' && l.q > 0)
    .sort((a, b) => b.q - a.q);
  if (!top) return 'zh';
  return top.tag.startsWith('zh') ? 'zh' : 'en';
}
