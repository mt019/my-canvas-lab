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

  // A failed launch must break the build. This used to be fail-soft, and between
  // then and 2026-07-28 every deploy on Vercel shipped 473 empty shells: the build
  // image had no libnspr4, launch threw, this printed one warning line that looked
  // like a normal message, and exited 0. Nothing downstream noticed — the sitemap
  // still listed every route. Prerendering now happens in CI where the browser is
  // installed on purpose, so there is no environment left that legitimately can't
  // launch one. Skipping is only allowed when asked for explicitly (PRERENDER=0).
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    server.close();
    console.error(`prerender: could not launch Chromium — ${err.message}`);
    console.error('prerender: refusing to emit empty shells. Install the browser (npx playwright install --with-deps chromium) or set PRERENDER=0 to skip on purpose.');
    process.exit(1);
  }
  let ok = 0;
  const warnings = [];

  // 逐頁計時。553 頁跑 227 秒、沒有任何一頁撞到就緒逾時（2026-07-29 的部署 log），所以那是
  // 每頁都真的花了那麼久，而不是幾頁拖累全部。但「哪幾頁貴」到現在還是猜的——統計站那些
  // KaTeX 長文、陳寅恪那份一萬九千行的 JSON，都只是嫌疑。記下來，讓下次建置自己講。
  const timings = [];

  async function renderOne(page, route) {
    const startedAt = Date.now();
    // Routes carry Chinese names undecoded (justice/case pages); encodeURI turns
    // them into a valid URL while leaving ASCII routes untouched. The output dir
    // keeps the decoded name so the deployed file path matches what's served.
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
    timings.push([route, Date.now() - startedAt]);
    ok += 1;
  }

  // Render a pool of pages in parallel — 553 routes one-at-a-time is minutes of
  // wall time; a handful of concurrent tabs cuts it to about one. Each worker
  // owns one page and pulls the next route until the queue drains.
  //
  // 預設從 8 提到 16（2026-07-29）：每個 worker 大部分時間在等網路與等就緒條件，不是在燒
  // CPU，所以並行數不必跟核心數綁在一起。一個 Chromium page 約 50–80MB，16 個約 1.3GB，
  // GitHub runner 有 16GB。核心少的機器要調回去就設 PRERENDER_CONCURRENCY。
  const CONCURRENCY = Math.max(1, Number(process.env.PRERENDER_CONCURRENCY) || 16);
  let next = 0;
  async function worker() {
    const page = await browser.newPage();
    for (let i = next++; i < routes.length; i = next++) {
      await renderOne(page, routes[i]);
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, routes.length) }, worker));

  await browser.close();
  server.close();
  console.log(`prerender: wrote ${ok} pages`);
  // 中位數與 p90 看整體、最慢十條看有沒有離群的。全部 553 條印出來是雜訊，只印這些。
  if (timings.length) {
    const ms = timings.map(([, t]) => t).sort((a, b) => a - b);
    const at = (q) => ms[Math.min(ms.length - 1, Math.floor(ms.length * q))];
    const slowest = [...timings].sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(`prerender: 每頁耗時 中位數 ${at(0.5)}ms、p90 ${at(0.9)}ms、最慢 ${ms[ms.length - 1]}ms`
      + `（並行 ${CONCURRENCY}）`);
    console.log(`prerender: 最慢十條 → ${slowest.map(([r, t]) => `${r} ${t}ms`).join('、')}`);
  }
  if (warnings.length) console.warn(`prerender: render signal timed out (captured anyway) for ${warnings.length}: ${warnings.join(', ')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
