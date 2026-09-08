import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './dist-target.mjs';
import { ROOT, SITE_URL } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

assert.equal(SITE_URL, 'https://canvas.phenomcanvas.com', 'Cloudflare Canvas artifact must bake the Canvas canonical origin');

for (const route of collectRoutes()) {
  const file = route === '/' ? join(DIST, 'index.html') : join(DIST, `${route}.html`);
  assert.ok(existsSync(file), `${route}: missing flat Cloudflare HTML artifact`);
  const html = readFileSync(file, 'utf8');
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${route === '/' ? '/' : encodeURI(route)}`));
  if (route !== '/') assert.equal(existsSync(join(DIST, route, 'index.html')), false, `${route}: directory index would force a trailing slash on Pages`);
}

assert.ok(existsSync(join(DIST, '404.html')), 'Cloudflare artifact needs top-level 404.html to disable implicit SPA fallback');
const bundle = readdirSync(join(DIST, 'assets'))
  .filter((name) => name.endsWith('.js'))
  .map((name) => readFileSync(join(DIST, 'assets', name), 'utf8'))
  .join('\n');
assert.doesNotMatch(bundle, /\[REDACTED\]/, 'Cloudflare bundle contains a redacted environment placeholder');
assert.match(bundle, /https:\/\/[a-z0-9-]+\.supabase\.co/, 'Cloudflare bundle lacks the Supabase browser URL');
assert.match(bundle, /sb_publishable_[A-Za-z0-9_-]+/, 'Cloudflare bundle lacks the Supabase publishable key');
// OpenTix 反向代理 2026-09-08 移除（無 origin 檢查、任何 method 原樣轉發，等於公開匿名代理，
// 且站內已無呼叫端）。Functions 只剩 noindex 的 _middleware.js，全路徑生效，不再需要 _routes.json
// 收窄——留著舊清單反而讓 middleware 只在已刪掉的路徑上執行。
assert.equal(existsSync(join(DIST, '_routes.json')), false, 'stale _routes.json would restrict the noindex middleware to removed routes');
assert.equal(existsSync(join(ROOT, 'functions/api')), false, 'functions/api reappeared; the OpenTix proxy was removed on purpose');
assert.ok(existsSync(join(ROOT, 'functions/_middleware.js')), 'missing the pages.dev noindex middleware');

console.log(`Cloudflare Canvas artifact valid: ${collectRoutes().length} flat routes, explicit 404, middleware-only Functions`);
