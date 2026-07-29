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
import { writeFile, mkdir, stat, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { ROOT, SITE_URL } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

// PRERENDER_DIST：驗證用的隔離目錄（把 vite build --outDir 到別處、對那份跑 prerender，
// 不碰共用的 dist/——兩個 session 併行時曾同時建刪 dist 而互相覆寫，見 HANDOFF 部署節）。平常不設。
const DIST = process.env.PRERENDER_DIST ? resolve(process.env.PRERENDER_DIST) : join(ROOT, 'dist');

// --- static file server with SPA fallback ----------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf',
  '.ico': 'image/x-icon', '.map': 'application/json', '.txt': 'text/plain; charset=utf-8',
};

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

// SPA fallback 一律回「開跑當下」快取的那份乾淨殼，不回檔案系統上的 index.html——
// 首頁一被 prerender，dist/index.html 就是烤好內容的首頁；之後才冷載入的路由若拿它
// 當起點，等於從首頁的 head（meta、preload）開始長，殘留就跟著烤進每一頁。
function startServer(shellHtml) {
  return new Promise((resolvePort) => {
    const server = createServer(async (req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = join(DIST, url);
      if (extname(file) !== '' && await exists(file)) {
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
        createReadStream(file).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      res.end(shellHtml);
    });
    server.listen(0, '127.0.0.1', () => resolvePort(server));
  });
}

// --- prerender loop ---------------------------------------------------------
async function main() {
  if (process.env.PRERENDER === '0') {
    console.log('prerender: skipped (PRERENDER=0)');
    return;
  }
  const routes = collectRoutes();
  const shellHtml = await readFile(join(DIST, 'index.html'), 'utf8');
  // 殼自己帶的 preload（入口 chunk 那幾條）。跳板打記號時要跳過它們——每一頁都真的需要。
  const shellPreloads = [...shellHtml.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)]
    .map((m) => m[1]);
  const server = await startServer(shellHtml);
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
  // 每頁都真的花了那麼久，而不是幾頁拖累全部。後來查明白了：貴的不是渲染，是**每頁都
  // 冷載入整個 app**（解析執行 React＋7MB 資料 chunk＋整段水合）。同日改成 SPA 導航
  // （見下方 renderWarm），本機中位數 1167ms → 118ms。
  const timings = [];

  // 就緒判準。canonical 必須就是目標路由——這一條在同分頁連續渲染多條路由時是唯一
  // 可靠的「換頁完成」訊號：SeoHead 是新頁 render 之後的 effect 才改 canonical，
  // 所以 canonical 對了，root 裡的內容一定已經是新頁的。冷載入也用同一條（更嚴），
  // 順帶擋掉「渲染出來的其實是別頁」這種今天驗不出的錯。
  function waitReady(page, route, timeout) {
    return page.waitForFunction((expected) => {
      const link = document.querySelector('link[rel="canonical"]');
      if (!link) return false;
      let path;
      try { path = decodeURIComponent(new URL(link.href).pathname); } catch { return false; }
      if (path !== expected) return false;
      const root = document.getElementById('root');
      return !!(root && root.children.length > 0
        && !document.querySelector('.animate-spin')
        && document.querySelector('script[data-seo-schema]'));
    }, route === '/' ? '/' : route, { timeout });
  }

  // 就緒之後再等 DOM 安定下來才存檔：連續 5 個 rAF（約 80ms）innerHTML 長度不變。
  // 就緒判準（canonical＋root＋schema）只保證「這一頁開始是它自己」，保證不了
  // 「它把話說完了」——實測 2026-07-29：憲判字案件頁的理由書是就緒後才非同步載入的，
  // 不等這一步就把「載入理由書中…」烤進靜態檔；手記頁的目次也是晚一拍才長出來。
  // 長度一直在變的頁（動畫不停）等滿上限照存，那是裝飾不是內容。
  async function waitSettled(page, timeout = 3000) {
    await page.evaluate(() => { window.__prLen = -1; window.__prStable = 0; });
    try {
      await page.waitForFunction(() => {
        const len = document.documentElement.innerHTML.length;
        if (len === window.__prLen) window.__prStable += 1;
        else { window.__prStable = 0; window.__prLen = len; }
        return window.__prStable >= 5;
      }, undefined, { timeout, polling: 'raf' });
    } catch { /* 安定不下來就照存：內容型的頁早就安定了，剩下的是動畫 */ }
  }

  async function capture(page, route) {
    await waitSettled(page);
    // 存檔前的兩道清理，都只動自己知道來歷的東西：
    // 1. Vercel Analytics 的腳本標籤。<Analytics /> 是掛載時把它塞進 head 的，這裡抓的
    //    是掛載後的 DOM，不移掉就烤進每一份靜態檔，線上 React 再插一次，一次造訪記成
    //    兩個 page view。
    // 2. 帶 data-prerender-stale 記號的 preload（renderWarm 跳板時打的）：那是同分頁
    //    先前訪過的頁載入的 chunk，不是這一頁的相依——留著會叫每個訪客白抓別頁的檔
    //    （手記一篇一個 mdx chunk，一片 32 頁能積出幾百 KB）。代價是片內後段的頁少了
    //    幾條共用模板 chunk 的預載提示（chunk 已載過就不會再注入連結，分不出誰的），
    //    那只是少暖身、不是壞掉；stylesheet 一律不剝，剝錯會閃樣式。
    const html = '<!doctype html>\n' + await page.evaluate(() => {
      document.querySelectorAll('script[src*="/_vercel/insights/"]').forEach((s) => s.remove());
      document.querySelectorAll('link[data-prerender-stale]').forEach((l) => l.remove());
      return document.documentElement.outerHTML;
    });
    const outDir = route === '/' ? DIST : join(DIST, route);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'index.html'), html);
  }

  // 冷載入：整頁 goto，重新解析執行所有 JS。就緒逾時仍然存檔（保住能存的），照舊記警告。
  // Routes carry Chinese names undecoded (justice/case pages); encodeURI turns
  // them into a valid URL while leaving ASCII routes untouched. The output dir
  // keeps the decoded name so the deployed file path matches what's served.
  async function renderCold(page, route) {
    await page.goto(`${base}${encodeURI(route)}`, { waitUntil: 'networkidle', timeout: 30000 });
    try {
      await waitReady(page, route, 15000);
    } catch {
      warnings.push(route); // capture whatever rendered rather than abort the build
    }
    await capture(page, route);
  }

  // 熱導航：pushState＋popstate 讓 React Router 在已載入的 app 裡換頁。整份 bundle
  // （含那個 7MB 的資料 chunk）只在冷載入時解析執行一次，之後每條路由只付「渲染新頁」
  // 的成本——這是 2026-07-29 併行數實驗（8→16 吞吐量不動、每頁翻倍）指向的唯一出路：
  // 讓每頁做更少事。逾時**絕不存檔**（畫面上可能還是上一頁），丟回去走冷載入重來。
  async function renderWarm(page, route) {
    // 先跳一格不存在的路由，把上一頁整個 unmount，再進目標頁。不跳的話，路由元件相同時
    // （案件頁接案件頁）React 沿用同一個實例，先前頁面累積的內部狀態一路帶著走——實測
    // 2026-07-29：SPA 直導時，憲法法庭案件頁把先前訪過案件的展開全文也烤了進來。
    // 雙 rAF 等 unmount 的 commit 落地。
    await page.evaluate((shellHrefs) => {
      window.history.pushState({}, '', '/__prerender-reset__');
      window.dispatchEvent(new PopStateEvent('popstate'));
      // 這一刻 head 裡的 preload 都是先前那些頁的相依（殼自帶的除外），對接下來要渲染
      // 的頁而言是別人的行李。打上記號，capture 時剝掉。
      const shell = new Set(shellHrefs);
      document.querySelectorAll('link[rel="modulepreload"]').forEach((l) => {
        if (!shell.has(l.getAttribute('href'))) l.setAttribute('data-prerender-stale', '');
      });
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, shellPreloads);
    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, encodeURI(route));
    await waitReady(page, route, 15000);
    await capture(page, route);
  }

  // Render a pool of pages in parallel — 553 routes one-at-a-time is minutes of
  // wall time; a handful of concurrent tabs cuts it to about one. Each worker
  // owns one page and pulls the next route until the queue drains.
  //
  // **8 就是這台 runner 的上限，別再往上加**（2026-07-29 實測）。當時的假設是 worker 多半
  // 在等網路、不是在燒 CPU，於是把預設從 8 提到 16。兩次部署的數字：
  //   並行 8 ：553 頁 227 秒，每頁中位數約 3.3 秒
  //   並行 16：553 頁 236 秒，每頁中位數 7.1 秒、p90 8.8 秒
  // 每頁耗時正好翻倍而總時間不動——吞吐量兩次都是每秒約 2.3 頁，是完全飽和的樣子。
  // ubuntu-latest 是 4 vCPU，React 的水合與渲染把核心吃滿了，加 worker 只是讓大家一起排隊。
  // 要更快只能給更多 CPU（把路由切片交給多個 job）或讓每頁做更少事，不是調這個數字。
  // ——「讓每頁做更少事」2026-07-29 做掉了：SPA 導航（renderWarm）之後每頁只付換頁渲染，
  // 不再逐頁重新解析 bundle。這個並行數對剩下的冷載入（每片第一頁）仍然適用。
  const CONCURRENCY = Math.max(1, Number(process.env.PRERENDER_CONCURRENCY) || 8);
  // PRERENDER_SPA=0 退回每頁冷載入（SPA 導航出怪事時的逃生口，順便留著做 A/B 計時）。
  const SPA_NAV = process.env.PRERENDER_SPA !== '0';

  // 熱導航不能跨站區。Vite 動態載入會往 head 塞 modulepreload／stylesheet link，而且只塞
  // 不收——同一個分頁從陳寅恪導去憲法法庭，存下來的頁就帶著陳寅恪那批 chunk 的預載標籤，
  // 等於叫每個訪客白下載別區的檔（實測 2026-07-29：混跑時 543/553 頁 head 被污染）。
  // 所以佇列以「站區」為單位：同站區的頁共享同一組 chunk，片內殘留趨近於零；片的第一頁
  // 冷載入（乾淨的 head），其餘熱導航。大站區再切成 ≤32 頁的片，免得幾百頁的憲法法庭
  // 個案掛死在同一個 worker 上；大片先發，收尾時才不會剩一大片單線在跑。
  const groups = new Map();
  for (const route of routes) {
    const seg = route === '/' ? '/' : `/${route.split('/')[1]}`;
    if (!groups.has(seg)) groups.set(seg, []);
    groups.get(seg).push(route);
  }
  const SLICE = 32;
  const slices = [];
  for (const g of groups.values()) {
    for (let i = 0; i < g.length; i += SLICE) slices.push(g.slice(i, i + SLICE));
  }
  slices.sort((a, b) => b.length - a.length);

  let nextSlice = 0;
  async function worker() {
    const page = await browser.newPage();
    for (let s = nextSlice++; s < slices.length; s = nextSlice++) {
      let warm = false; // 這個片裡是否已有載入完成的 app 可以做熱導航
      for (const route of slices[s]) {
        const startedAt = Date.now();
        if (SPA_NAV && warm) {
          try {
            await renderWarm(page, route);
          } catch {
            warm = false; // 換頁沒完成（逾時或分頁掛了）：整頁重載重來，走冷載入的存檔規則
            await renderCold(page, route);
          }
        } else {
          await renderCold(page, route);
        }
        warm = SPA_NAV;
        timings.push([route, Date.now() - startedAt]);
        ok += 1;
      }
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, slices.length) }, worker));

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
