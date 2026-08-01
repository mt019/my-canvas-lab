import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const app = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const deploy = readFileSync(join(ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8');
const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
const routes = collectRoutes();

assert.match(app, /externalUrl:\s*'https:\/\/phenomcanvas\.com\/notes\/'/);
assert.doesNotMatch(app, /<Route path="\/notes/);
assert.doesNotMatch(app, /import\([^\n]*_notes/);
assert.equal(existsSync(join(ROOT, 'src', 'pages', 'Notes.jsx')), false);
assert.equal(routes.filter((route) => route === '/notes' || route.startsWith('/notes/')).length, 0);
assert.doesNotMatch(deploy, /NOTES_DATA_TOKEN|notes-stream|notes-content|phenom-notes-data/);

const exact = config.routes.find((route) => route.src === '/notes');
const deep = config.routes.find((route) => route.src === '/notes/(.*)');
assert.deepEqual(exact, { src: '/notes', dest: 'https://phenom-notes.pages.dev/notes/' });
assert.deepEqual(deep, { src: '/notes/(.*)', dest: 'https://phenom-notes.pages.dev/notes/$1' });

console.log(`notes cutover ok: /all → standalone; 0 local routes among ${routes.length}; Canvas deploy has no Notes data trigger`);
