// 固定檢查：dist/ 裡每個路由的 index.html 都要真的有內容。
//
// 來歷（2026-07-28）：Vercel 建置環境缺 libnspr4，Chromium 起不來，prerender 印一行
// 警告就 exit 0，於是線上 473 個路由全是 `<div id="root"></div>`，而建置顯示成功、
// sitemap 照樣送出 473 個網址。壞掉的時候回傳的是合法值，沒有任何檢查看得出來。
//
// 這支腳本查的是產物本身，不是 prerender 自己的紀錄：逐一開 dist/<route>/index.html，
// 確認根節點裡有東西、結構化資料有寫進去。prerender 若整個沒跑、跑了一半、或某些頁
// 渲染成白畫面，都會在這裡停下。
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

if (process.env.PRERENDER === '0') {
  console.log('validate:prerender — 跳過（PRERENDER=0，本來就沒有預先渲染）');
  process.exit(0);
}

const DIST = join(ROOT, 'dist');
const routes = collectRoutes();

// 空殼是 1.8–2.5 KB；渲染過的頁最小的是 /vocaltuner 的 7.2 KB（2026-07-28 實測）。
// 門檻取 5 KB，兩邊都有餘裕。主要的判準是下面的根節點檢查，這條只擋「檔案在、
// 但幾乎沒東西」的中間狀態。
const MIN_BYTES = 5000;

const failures = [];
let checked = 0;
let smallest = { route: null, bytes: Infinity };

for (const route of routes) {
  const file = join(route === '/' ? DIST : join(DIST, route), 'index.html');
  let html;
  let bytes;
  try {
    bytes = statSync(file).size;
    html = readFileSync(file, 'utf8');
  } catch {
    failures.push(`${route} — 沒有產出檔案（${file.slice(ROOT.length + 1)}）`);
    continue;
  }
  checked += 1;
  if (bytes < smallest.bytes) smallest = { route, bytes };

  if (/<div id="root">\s*<\/div>/.test(html)) {
    failures.push(`${route} — 根節點是空的（${bytes} bytes）`);
    continue;
  }
  if (bytes < MIN_BYTES) {
    failures.push(`${route} — 檔案只有 ${bytes} bytes，小於 ${MIN_BYTES}，八成沒渲染出東西`);
    continue;
  }
  if (!html.includes('data-seo-schema')) {
    failures.push(`${route} — 沒有結構化資料，SeoHead 沒跑完`);
  }
}

if (failures.length) {
  console.error(`validate:prerender — ${failures.length} 個路由沒有通過（共 ${routes.length} 個）：`);
  for (const line of failures.slice(0, 20)) console.error(`  ${line}`);
  if (failures.length > 20) console.error(`  …另有 ${failures.length - 20} 個`);
  process.exit(1);
}

console.log(`validate:prerender — ${checked} 個路由都有內容（最小的是 ${smallest.route}，${smallest.bytes} bytes）`);
