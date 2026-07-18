// Emits dist/sitemap.xml with absolute URLs for every indexable route (shared
// enumeration with the prerender step). Run after the build. The homepage gets a
// higher priority; everything else defaults. lastmod is the build date — honest
// for a site whose pages are rebuilt together, and not claimed per-page.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, SITE_URL } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const today = new Date().toISOString().slice(0, 10);
const routes = collectRoutes();

const body = routes.map((route) => {
  const loc = `${SITE_URL}${route === '/' ? '/' : route}`;
  const priority = route === '/' ? '1.0' : '0.7';
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

await writeFile(join(ROOT, 'dist', 'sitemap.xml'), xml);
console.log(`sitemap: ${routes.length} urls → dist/sitemap.xml`);
