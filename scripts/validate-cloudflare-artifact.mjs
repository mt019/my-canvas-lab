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
const routes = JSON.parse(readFileSync(join(DIST, '_routes.json'), 'utf8'));
assert.deepEqual(routes.include, ['/api/opentix/search', '/api/opentix-csm/*']);
assert.equal(routes.exclude.length, 0);

for (const file of [
  'functions/api/opentix/search.js',
  'functions/api/opentix-csm/[[path]].js',
]) assert.ok(existsSync(join(ROOT, file)), `missing Pages Function ${file}`);

console.log(`Cloudflare Canvas artifact valid: ${collectRoutes().length} flat routes, explicit 404, 2 narrowly routed Function endpoints`);
