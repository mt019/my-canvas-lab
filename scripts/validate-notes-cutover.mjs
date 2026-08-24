import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';
import { readRedirects, redirectFor, deepRedirectFor } from './redirects.mjs';

const app = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const redirects = readRedirects();
const routes = collectRoutes();

assert.match(app, /externalUrl:\s*'https:\/\/phenomcanvas\.com\/notes\/'/);
assert.doesNotMatch(app, /<Route path="\/notes/);
assert.doesNotMatch(app, /import\([^\n]*_notes/);
assert.equal(existsSync(join(ROOT, 'src', 'pages', 'Notes.jsx')), false);
assert.equal(routes.filter((route) => route === '/notes' || route.startsWith('/notes/')).length, 0);
const exact = redirectFor(redirects, '/notes');
const deep = deepRedirectFor(redirects, '/notes');
assert.deepEqual(exact, { from: '/notes', to: 'https://notes.phenomcanvas.com/notes/', status: '308' });
assert.deepEqual(deep, { from: '/notes/*', to: 'https://notes.phenomcanvas.com/notes/', status: '308' });

console.log(`notes cutover ok: /all → standalone; 0 local routes among ${routes.length}; Canvas deploy has no Notes data trigger`);
