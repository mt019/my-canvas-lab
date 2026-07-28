// 固定檢查：public/ 底下的第一層檔名，不得與任何頁面路由的第一段同名。
//
// 來歷（2026-07-28）：brief 的海報從資料倉同步過來時放進 public/brief/posters/，而站上
// 本來就有一個 /brief 路由。public/ 的東西在 Vite dev 是照原樣端出去的靜態資源，於是
// 開發時進 /brief 直接 500：「This file is in /public and will be copied as-is during
// build ... It can only be referenced via HTML tags.」——頁面在本機完全打不開，線上卻
// 因為 prerender 產物剛好也叫 dist/brief/index.html 而看不出來。兩邊行為不同，靠人記得
// 這件事是不行的，所以在這裡擋。
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const firstSegment = (p) => p.replace(/^\//, '').split('/')[0];

const routeHeads = new Set(collectRoutes().map(firstSegment).filter(Boolean));
const publicEntries = readdirSync(join(ROOT, 'public'), { withFileTypes: true })
  .map((e) => e.name)
  .filter((n) => !n.startsWith('.'));

const clashes = publicEntries.filter((n) => routeHeads.has(n.replace(/\.[^.]+$/, '')) || routeHeads.has(n));

if (clashes.length) {
  console.error(`public/ 路徑檢查未通過：${clashes.length} 個檔名與頁面路由同名，會蓋掉那個路由。`);
  console.error('修法：把 public/ 那一份改名（例：brief → brief-posters），並同步改寫產生它的來源');
  console.error('（brief 的海報由 ../brief-data 的 sync-to-canvas.mjs 送過來，路徑同時寫在 poster-overrides.json）。');
  for (const n of clashes) console.error(`  public/${n}  ↔  /${n}`);
  process.exit(1);
}

console.log(`public/ 路徑檢查通過：${publicEntries.length} 個項目，沒有一個與 ${routeHeads.size} 個路由字首同名。`);
