// Emits dist/sitemap.xml with absolute URLs for every indexable route (shared
// enumeration with the prerender step). Run after the build. The homepage gets a
// higher priority; everything else defaults. lastmod is the build date — honest
// for a site whose pages are rebuilt together, and not claimed per-page.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_URL } from './site-config.mjs';
import { DIST, DIST_LABEL } from './dist-target.mjs';
import { collectRoutes } from './routes.mjs';
import { languageAlternates } from '../src/lib/siteLanguages.js';

const today = new Date().toISOString().slice(0, 10);
const routes = collectRoutes();

const body = routes.map((route) => {
  // encodeURI so justice routes (Chinese names) become valid, percent-encoded
  // URLs that match the canonical the app emits; ASCII routes pass through.
  const loc = `${SITE_URL}${route === '/' ? '/' : encodeURI(route)}`;
  const priority = route === '/'
    ? '1.0'
    : route.startsWith('/zhujiahua/')
      ? '0.9'
      : route === '/zhujiahua'
        ? '0.8'
        : '0.7';
  const changefreq = route.startsWith('/zhujiahua') ? 'monthly' : 'weekly';
  const alternates = languageAlternates(route)
    .filter((alternate) => alternate.hreflang !== 'x-default')
    .map((alternate) => `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${SITE_URL}${encodeURI(alternate.path)}" />`)
    .join('\n');
  return `  <url>\n    <loc>${loc}</loc>\n${alternates ? `${alternates}\n` : ''}    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;

await writeFile(join(DIST, 'sitemap.xml'), xml);
console.log(`sitemap: ${routes.length} urls → ${DIST_LABEL}/sitemap.xml`);
