// Post-build prerender. Serves the freshly built dist/ with an SPA fallback,
// drives every indexable route through headless Chromium until the app has
// rendered and SeoHead has written the <head>, then saves the resulting HTML as
// dist/<route>/index.html. Non-JS crawlers and answer engines then receive real
// content and correct per-page metadata instead of an empty <div id="root">.
//
// Gated by the build script: PRERENDER=0 skips it. Routes are enumerated the
// same way App.jsx does (file-path routing + the one glossary param route), so
// adding a page needs no change here.
import { createServer } from 'node:http';
import { writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { ROOT, SITE_URL } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const DIST = join(ROOT, 'dist');

// --- static file server with SPA fallback ----------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf',
  '.ico': 'image/x-icon', '.map': 'application/json', '.txt': 'text/plain; charset=utf-8',
};

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let file = join(DIST, url);
      if (extname(file) === '' && await exists(join(file, 'index.html'))) file = join(file, 'index.html');
      if (extname(file) === '' || !(await exists(file))) file = join(DIST, 'index.html'); // SPA fallback
      const type = MIME[extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// --- prerender loop ---------------------------------------------------------
async function main() {
  if (process.env.PRERENDER === '0') {
    console.log('prerender: skipped (PRERENDER=0)');
    return;
  }
  const routes = collectRoutes();
  const server = await startServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  console.log(`prerender: ${routes.length} routes → dist/  (origin baked as ${SITE_URL})`);

  // Fail-soft: if the browser can't launch (e.g. Chromium not installed on a CI
  // image), skip prerender rather than break the deploy. The client SeoHead still
  // sets per-route metadata; only the no-JS-crawler benefit is lost.
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    server.close();
    console.warn(`prerender: skipped — could not launch Chromium (${err.message}). Build continues with client-only SEO.`);
    return;
  }
  const page = await browser.newPage();
  let ok = 0;
  const warnings = [];

  for (const route of routes) {
    // Routes carry Chinese names undecoded (justice pages); encodeURI turns them
    // into a valid URL while leaving ASCII routes untouched. The output dir keeps
    // the decoded name so the deployed file path matches what the server serves.
    await page.goto(`${base}${encodeURI(route)}`, { waitUntil: 'networkidle', timeout: 30000 });
    try {
      await page.waitForFunction(() => {
        const root = document.getElementById('root');
        const spinning = document.querySelector('.animate-spin');
        const ld = document.querySelector('script[data-seo-schema]');
        return root && root.children.length > 0 && !spinning && ld;
      }, { timeout: 15000 });
    } catch {
      warnings.push(route); // capture whatever rendered rather than abort the build
    }
    const html = '<!doctype html>\n' + await page.evaluate(() => document.documentElement.outerHTML);
    const outDir = route === '/' ? DIST : join(DIST, route);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'index.html'), html);
    ok += 1;
  }

  await browser.close();
  server.close();
  console.log(`prerender: wrote ${ok} pages`);
  if (warnings.length) console.warn(`prerender: render signal timed out (captured anyway) for ${warnings.length}: ${warnings.join(', ')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
