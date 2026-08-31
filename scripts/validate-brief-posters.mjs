// 固定檢查：brief 的活動圖，站內路徑一律要指得到 public/ 底下真的存在的檔案。
//
// 來歷（2026-08-26）：海報目錄 7/28 從 public/brief/posters/ 改名成 public/brief-posters/
// （第一層不能與 /brief 這條路由同名，見 validate-public-paths.mjs）。改名那一輪把資料倉
// 那側一起改了，站上因此沒有裂圖——直到一筆 7/22 按下的「我去了」快照浮出來：它凍住的是
// 舊路徑，活動過了 30 天退出投影之後那一列改畫快照，圖就 404 了。
//
// 前端這一輪已經改成先查對照表、載不到就整塊不畫（見 src/pages/brief/data.js 與 _EventRow）。
// 這支管的是另一半：資料本身指向的檔案在不在。圖裂掉在畫面上只是一個帶 alt 文字的方框，
// 建置、eslint、prerender 沒有一個會出聲——四道閘全綠而畫面上有個洞，跟 check-brief-pages
// 記的那次是同一種。
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const DATA = 'src/data/brief-events.json';
const data = JSON.parse(readFileSync(join(ROOT, DATA), 'utf8'));

// 圖址出現在三個地方，三個都要看：投影裡的活動、剛結束的活動、以及按活動編號的對照表。
// 只看其中一個的話，另外兩個壞掉時這支照樣是綠的。
const refs = [
  ...(data.events ?? []).map((e) => ({ where: `events ${e.id}`, url: e.poster })),
  ...(data.pastEvents ?? []).map((e) => ({ where: `pastEvents ${e.id}`, url: e.poster })),
  ...Object.entries(data.posters ?? {}).map(([id, v]) => ({ where: `posters ${id}`, url: v?.poster })),
].filter((r) => typeof r.url === 'string' && r.url.length > 0);

const local = refs.filter((r) => r.url.startsWith('/'));
const missing = local.filter((r) => !existsSync(join(ROOT, 'public', decodeURIComponent(r.url).replace(/^\//, ''))));

if (missing.length) {
  console.error(`brief 活動圖檢查未通過：${missing.length} 個站內路徑在 public/ 底下沒有對應的檔案。`);
  console.error('修法：圖的母本在 ../brief-data/data/materials/posters/，路徑寫在同倉的');
  console.error('poster-overrides.json；改完跑那邊的 sync-to-canvas.mjs 重送一次。');
  for (const r of missing) console.error(`  ${r.where}  →  ${r.url}`);
  process.exit(1);
}

const remote = refs.length - local.length;
console.log(`brief 活動圖檢查通過：${local.length} 個站內路徑都指得到檔案，另有 ${remote} 個外站圖址（過期由前端的 onError 收掉）。`);
