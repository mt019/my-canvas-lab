// The site's indexable route list, enumerated the same way App.jsx routes files:
// every .jsx/.tsx under src/pages (path segments starting with "_" are building
// blocks, not routes), plus the one glossary param route expanded per term, minus
// the routes App.jsx marks noindex. Shared by prerender and sitemap so they never
// disagree. Add a page and both pick it up with no edit here.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { CC_TAB_SLUGS, ccJusticePath, justiceHasContent, ccCasePath, caseIsIndexable } from '../src/pages/_constitutional-court/seo.js';
import { decodeDataset } from '../src/pages/_constitutional-court/decode.js';
import { ZJH_TAB_SLUGS } from '../src/pages/_zhu-jiahua/seo.js';

const PAGES = join(ROOT, 'src', 'pages');
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
// Glossary: the standalone /statistics/glossary page was folded into the
// Statistics Lab hub's 術語表 tab. The file stays only to redirect old links, so
// it is kept out of prerender and the sitemap (no duplicate of the tab's content).
const NOINDEX = new Set(['PaletteLab', 'TaipeiFilmFestival', 'Glossary', 'Tags']);
const PARAM_ROUTES = { GlossaryTerm: '/statistics/glossary/:slug', TagPage: '/statistics/tags/:slug' };

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

// One route per note. The page component lives under pages/_notes/ (a building
// block directory, so walkPages skips it) and App.jsx names the path itself, which
// means nothing here would find these pages on its own — without this they would
// never be prerendered and never reach the sitemap.
function noteRoutes() {
  try {
    const d = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'notes.json'), 'utf8'));
    return (d.posts || []).map((post) => `/notes/${post.slug}`);
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

// One route per justice who has anything to show — the same predicate the app
// uses to decide who is indexable, so prerender, sitemap and runtime agree.
function justiceRoutes() {
  try {
    // decodeDataset：快照的重複欄位是查表編碼的（見 _constitutional-court/decode.js）。
    // 這裡目前只讀主鍵與大法官（都不編碼），仍統一過解碼層，免得日後改讀編碼欄位時靜默拿到索引。
    const d = decodeDataset(JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'constitutionalCourt.json'), 'utf8')));
    return (d.大法官 || []).filter(justiceHasContent).map((j) => ccJusticePath(j.姓名));
  } catch {
    return [];
  }
}

// One route per indexable case: every 憲判 (live from the data) plus the frozen
// curated 釋字 list — the same caseIsIndexable predicate the runtime uses.
function caseRoutes() {
  try {
    const d = decodeDataset(JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'constitutionalCourt.json'), 'utf8')));
    return (d.文件 || []).filter((doc) => caseIsIndexable(doc.字號)).map((doc) => ccCasePath(doc.字號));
  } catch {
    return [];
  }
}

export function collectRoutes() {
  // '/' is the glitch front door; '/all' is the project index it hides behind.
  const routes = new Set(['/', '/all']);
  for (const rel of walkPages(PAGES)) {
    const name = rel.replace(/\.(jsx|tsx)$/, '').split('/').pop();
    if (NOINDEX.has(name)) continue;
    const route = routeFor(rel);
    if (route === '/statistics/glossary/:slug') {
      for (const slug of glossarySlugs()) routes.add(`/statistics/glossary/${slug}`);
    } else if (route === '/statistics/tags/:slug') {
      for (const slug of tagSlugs()) routes.add(`/statistics/tags/${slug}`);
    } else {
      routes.add(route);
    }
  }
  // Constitutional Court archive: one clean, prerendered URL per tab, per justice
  // with recorded activity, and per indexable case.
  for (const slug of CC_TAB_SLUGS) routes.add(`/constitutionalcourt/${slug}`);
  for (const route of justiceRoutes()) routes.add(route);
  for (const route of caseRoutes()) routes.add(route);
  for (const slug of ZJH_TAB_SLUGS) routes.add(`/zhujiahua/${slug}`);
  for (const route of chenYinkeSelectionRoutes()) routes.add(route);
  for (const route of noteRoutes()) routes.add(route);
  // 舊帖存檔頁。它的元件也在 pages/_notes/ 底下，所以跟單篇一樣要在這裡指名，否則不會被
  // 預先渲染、也不會進 sitemap。它收錄的那 58 則短記刻意不各自產網址——一則一頁就是
  // 五十幾條點進去只有一行字的網址。
  routes.add('/notes/archive');
  // 短記流。同上，元件在 pages/_notes/ 底下，不指名就不會被預先渲染、也不會進 sitemap。
  // 收錄的每一則同樣刻意不各自產網址。
  routes.add('/notes/stream');
  return [...routes].sort();
}
