import { existsSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DIST } from './dist-target.mjs';
import { collectRoutes } from './routes.mjs';

function removeEmptyParents(path) {
  let current = path;
  while (current !== DIST) {
    try { rmSync(current, { dir: true }); } catch { break; }
    current = dirname(current);
  }
}

let flattened = 0;
for (const route of collectRoutes()) {
  if (route === '/') continue;
  const source = join(DIST, route, 'index.html');
  const target = join(DIST, `${route}.html`);
  if (!existsSync(source)) throw new Error(`Cloudflare staging: missing prerendered route ${route}`);
  renameSync(source, target);
  removeEmptyParents(dirname(source));
  flattened += 1;
}

console.log(`Cloudflare staging: flattened ${flattened} route index files to preserve extensionless URLs without trailing slashes`);
