// The site's indexable route list, enumerated the same way App.jsx routes files:
// every .jsx/.tsx under src/pages (path segments starting with "_" are building
// blocks, not routes), plus the one glossary param route expanded per term, minus
// the routes App.jsx marks noindex. Shared by prerender and sitemap so they never
// disagree. Add a page and both pick it up with no edit here.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { ZJH_TAB_SLUGS } from '../src/pages/_zhu-jiahua/seo.js';
import { localizedIndexRoutes } from '../src/lib/siteLanguages.js';

const PAGES = join(ROOT, 'src', 'pages');
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
// Glossary: the standalone /statistics/glossary page was folded into the
// Statistics Lab hub's 術語表 tab. The file stays only to redirect old links, so
// it is kept out of prerender and the sitemap (no duplicate of the tab's content).
const NOINDEX = new Set(['PaletteLab', 'TaipeiFilmFestival', 'Glossary', 'Tags', 'Notes']);
const PARAM_ROUTES = {
  GlossaryTerm: '/statistics/glossary/:slug',
  TagPage: '/statistics/tags/:slug',
  Dialogue: '/mandarin-dialogue',
};

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

function glossarySlugs() {
  try {
    const g = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'statistics-glossary.json'), 'utf8'));
    return Object.keys(g.terms || {});
  } catch {
    return [];
  }
}

// One route per tag, from the same derived index the runtime uses (hub.tags).
function tagSlugs() {
  try {
    const h = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'statistics.json'), 'utf8'));
    return (h.tags || []).map((t) => t.slug);
  } catch {
    return [];
  }
}

function chenYinkeSelectionRoutes() {
  try {
    const d = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'chenYinke', 'liu-rushi-edition', 'reading-view.json'), 'utf8'));
    return (d.selections || []).map((selection) => `/chenyinke/liu-rushi/${selection.id}`);
  } catch {
    return [];
  }
}

export function collectRoutes() {
  const canvasBuild = process.env.VITE_DEPLOY_TARGET === 'canvas';
  // Cloudflare Canvas owns a research-only directory at its root. The personal
  // front door, /all, and the Mandarin service remain exclusively on the apex.
  const routes = new Set(canvasBuild ? ['/'] : ['/', '/all']);
  for (const rel of walkPages(PAGES)) {
    const name = rel.replace(/\.(jsx|tsx)$/, '').split('/').pop();
    if (NOINDEX.has(name)) continue;
    if (canvasBuild && name === 'Dialogue') continue;
    const route = routeFor(rel);
    if (route === '/statistics/glossary/:slug') {
      for (const slug of glossarySlugs()) routes.add(`/statistics/glossary/${slug}`);
    } else if (route === '/statistics/tags/:slug') {
      for (const slug of tagSlugs()) routes.add(`/statistics/tags/${slug}`);
    } else {
      routes.add(route);
    }
  }
  for (const slug of ZJH_TAB_SLUGS) routes.add(`/zhujiahua/${slug}`);
  for (const route of chenYinkeSelectionRoutes()) routes.add(route);
  return localizedIndexRoutes([...routes]);
}
