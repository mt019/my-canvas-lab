import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const app = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
const routes = collectRoutes();

assert.match(app, /externalUrl:\s*'https:\/\/cc\.phenomcanvas\.com\/constitutionalcourt\/'/);
assert.doesNotMatch(app, /<Route path="\/constitutionalcourt/);
assert.doesNotMatch(app, /import\([^\n]*_constitutional-court/);
assert.match(app, /!\.\/pages\/ConstitutionalCourt\.jsx/);
assert.match(app, /!\.\/pages\/_constitutional-court\/\*\*/);
assert.equal(routes.filter((route) => route === '/constitutionalcourt' || route.startsWith('/constitutionalcourt/')).length, 0);

const [exact, deep] = config.routes;
assert.deepEqual(exact, {
  src: '/constitutionalcourt',
  dest: 'https://cc.phenomcanvas.com/constitutionalcourt/',
  status: 308,
});
assert.deepEqual(deep, {
  src: '/constitutionalcourt/(.*)',
  dest: 'https://cc.phenomcanvas.com/constitutionalcourt/$1',
  status: 308,
});

// Vercel preserves an incoming query string when a redirect destination does
// not replace it. Keeping both destinations query-free is therefore part of the
// contract for old search/filter links such as ?q= and ?tab=.
assert.equal(exact.dest.includes('?'), false);
assert.equal(deep.dest.includes('?'), false);

console.log(`constitutional court cutover ok: /all → standalone; 0 local routes among ${routes.length}; exact/deep 308 redirects preserve query strings`);
