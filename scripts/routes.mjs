// The site's indexable route list, enumerated the same way App.jsx routes files:
// every .jsx/.tsx under src/pages (path segments starting with "_" are building
// blocks, not routes), minus the routes App.jsx marks noindex, plus any param
// route expanded per slug. Shared by prerender and sitemap so they never
// disagree. Add a page and both pick it up with no edit here.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { localizedIndexRoutes } from '../src/lib/siteLanguages.js';

const PAGES = join(ROOT, 'src', 'pages');
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const NOINDEX = new Set(['PaletteLab', 'TaipeiFilmFestival', 'Notes']);
// App.jsx 有同名的一份，加參數路由時兩邊都要寫。2026-08-25 起是空的：統計術語頁與
// 標籤頁隨統計站退役刪除，現役副本在 stat.phenomcanvas.com。
const PARAM_ROUTES = {};

function walkPages(dir, rel = '') {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (ent.name.startsWith('_')) continue;
      out.push(...walkPages(join(dir, ent.name), r));
    } else if (/\.(jsx|tsx)$/.test(ent.name) && !r.split('/').some((p) => p.startsWith('_'))) {
      out.push(r);
    }
  }
  return out;
}

function routeFor(rel) {
  const parts = rel.replace(/\.(jsx|tsx)$/, '').split('/');
  const name = parts.pop();
  if (PARAM_ROUTES[name]) return PARAM_ROUTES[name];
  return parts.length === 0 ? `/${name.toLowerCase()}` : `/${parts.map(kebab).join('/')}/${kebab(name)}`;
}


export function collectRoutes() {
  const canvasBuild = process.env.VITE_DEPLOY_TARGET === 'canvas';
  // Cloudflare Canvas owns a research-only directory at its root. The personal
  // front door and /all stay on the apex (phenom-home); the Mandarin service is
  // its own site (phenom-mandarin), not a page here.
  const routes = new Set(canvasBuild ? ['/'] : ['/', '/all']);
  for (const rel of walkPages(PAGES)) {
    const name = rel.replace(/\.(jsx|tsx)$/, '').split('/').pop();
    if (NOINDEX.has(name)) continue;
    routes.add(routeFor(rel));
  }
  return localizedIndexRoutes([...routes]);
}
