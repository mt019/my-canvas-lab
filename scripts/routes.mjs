// The site's indexable route list, enumerated the same way App.jsx routes files:
// every .jsx/.tsx under src/pages (path segments starting with "_" are building
// blocks, not routes), plus the one glossary param route expanded per term, minus
// the routes App.jsx marks noindex. Shared by prerender and sitemap so they never
// disagree. Add a page and both pick it up with no edit here.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { CC_TAB_SLUGS, ccJusticePath, justiceHasContent, ccCasePath, caseIsIndexable } from '../src/pages/_constitutional-court/seo.js';

const PAGES = join(ROOT, 'src', 'pages');
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const NOINDEX = new Set(['PaletteLab', 'TaipeiFilmFestival']);
const PARAM_ROUTES = { GlossaryTerm: '/statistics/glossary/:slug' };

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

// One route per justice who has anything to show — the same predicate the app
// uses to decide who is indexable, so prerender, sitemap and runtime agree.
function justiceRoutes() {
  try {
    const d = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'constitutionalCourt.json'), 'utf8'));
    return (d.大法官 || []).filter(justiceHasContent).map((j) => ccJusticePath(j.姓名));
  } catch {
    return [];
  }
}

// One route per indexable case: every 憲判 (live from the data) plus the frozen
// curated 釋字 list — the same caseIsIndexable predicate the runtime uses.
function caseRoutes() {
  try {
    const d = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'constitutionalCourt.json'), 'utf8'));
    return (d.文件 || []).filter((doc) => caseIsIndexable(doc.字號)).map((doc) => ccCasePath(doc.字號));
  } catch {
    return [];
  }
}

export function collectRoutes() {
  const routes = new Set(['/']);
  for (const rel of walkPages(PAGES)) {
    const name = rel.replace(/\.(jsx|tsx)$/, '').split('/').pop();
    if (NOINDEX.has(name)) continue;
    const route = routeFor(rel);
    if (route.includes(':slug')) {
      for (const slug of glossarySlugs()) routes.add(`/statistics/glossary/${slug}`);
    } else {
      routes.add(route);
    }
  }
  // Constitutional Court archive: one clean, prerendered URL per tab, per justice
  // with recorded activity, and per indexable case.
  for (const slug of CC_TAB_SLUGS) routes.add(`/constitutionalcourt/${slug}`);
  for (const route of justiceRoutes()) routes.add(route);
  for (const route of caseRoutes()) routes.add(route);
  return [...routes].sort();
}
