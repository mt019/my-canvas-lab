// 外殼的兩條鐵律，各修過一次就加一條檢查，免得下一頁再犯。
//
// 一、寬螢幕的水平內距只有一個來源：src/components/shellPadding.js。
//     手寫 `px-4 sm:px-6` 的寬容器會讓正文貼著視窗左緣，而「補過的頁」與「沒補的頁」
//     並存比兩者都糟。窄欄（max-w-3xl 這種）本來就置中，不在管轄範圍。
//
// 二、返回鍵只有一個來源：src/backNav.js。頁面自己寫死 `/` 或 `/all` 就是分岔的開始，
//     站上曾經同時存在四種返回鍵（回素首頁／回清單／回 canvas 根／沒有）。每個路由頁
//     都要有一條回頭路：走三個殼之一，或自己放 <BackLink />。
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const path = join(dir, e.name);
  return e.isDirectory() ? walk(path) : [path];
});

const failures = [];

/* ── 一、水平內距 ─────────────────────────────────────────── */

// 會撐到接近視窗寬的容器。窄欄（max-w-3xl／2xl／52rem…）置中後兩側自帶大片外邊界，不列管。
const WIDE = /max-w-(?:6xl|7xl|\[8[0-9]rem\])/;
const HARDCODED = /px-4(?:\s+sm:px-6)?/;

for (const path of walk('src').filter((p) => /\.jsx$/.test(p))) {
  const source = readFileSync(path, 'utf8');
  // 註解裡引用舊寫法（說明當年為什麼改）不算違規，所以要會分辨程式與註解。
  let inBlockComment = false;
  for (const [i, line] of source.split('\n').entries()) {
    const wasInComment = inBlockComment;
    const opens = line.lastIndexOf('/*');
    const closes = line.lastIndexOf('*/');
    if (opens > closes) inBlockComment = true;
    else if (closes > opens) inBlockComment = false;
    if (wasInComment || inBlockComment || line.trim().startsWith('//')) continue;
    if (!line.includes('mx-auto') || !WIDE.test(line)) continue;
    if (!HARDCODED.test(line)) continue;
    if (line.includes('SHELL_PAD_X')) continue; // 常數本身就以 px-4 sm:px-6 起跳
    failures.push(
      `${relative('.', path)}:${i + 1}：寬容器手寫了水平內距。改用 src/components/shellPadding.js 的 `
      + `SHELL_PAD_X／SHELL_PAD_X_RAIL／SHELL_PAD_X_TIGHT，別讓正文在寬螢幕上貼著視窗左緣`,
    );
  }
}

// 常數只准在 shellPadding.js 裡定義，不准有人在別處複製一份字面值。
const PAD_LITERAL = /['"`]px-4 sm:px-6 lg:px-(?:16|10)/;
for (const path of walk('src').filter((p) => /\.jsx?$/.test(p) && !p.endsWith('shellPadding.js'))) {
  if (PAD_LITERAL.test(readFileSync(path, 'utf8'))) {
    failures.push(`${relative('.', path)}：把內距值抄了一份。匯入 shellPadding.js 的常數，不要複製字面值`);
  }
}

/* ── 二、吸頂分頁列不橫捲 ──────────────────────────────────── */

// 使用者 2026-07-28 明令：吸頂欄不准左右捲動。理由是它把「這一頁有哪些分頁」
// 變成要先滑一段才知道的事，而貼在畫面頂端的東西應該一眼看完；標籤放不下時
// 要換行（flex-wrap），或者承認標籤太多、該重新分。
//
// 判定方式：找到帶 `sticky` 的那一行之後，往下看 WINDOW 行之內有沒有
// `overflow-x-auto`。不能只查「同一行同時有兩者」——實際寫法幾乎都是外層 <nav>
// 吸頂、內層 <div> 捲動，分屬兩行（憲法法庭那個就是這樣，2026-07-28 第一版規則
// 因此完全沒偵測到它，是負向測試把這件事翻出來的）。
//
// 窗口在遇到吸頂容器的結束標籤時提早關閉，所以吸頂列下方的寬表格不會被算進去。
const WINDOW = 8;
for (const path of walk('src').filter((p) => /\.jsx$/.test(p))) {
  const lines = readFileSync(path, 'utf8').split('\n');
  for (const [i, line] of lines.entries()) {
    if (!/\bsticky\b/.test(line)) continue;
    for (let j = i; j < Math.min(i + WINDOW, lines.length); j += 1) {
      if (j > i && /<\/(?:nav|header|div)>/.test(lines[j])) break;
      if (/overflow-x-auto/.test(lines[j])) {
        failures.push(
          `${relative('.', path)}:${j + 1}：吸頂欄橫向捲動（吸頂容器在第 ${i + 1} 行）。` +
          `改成 flex-wrap 換行；真的放不下就是標籤太多，重新分組而不是讓它捲`,
        );
        break;
      }
    }
  }
}

/* ── 三、返回鍵 ───────────────────────────────────────────── */

// 路由頁的枚舉法與 scripts/routes.mjs 相同：src/pages 底下的 .jsx，`_` 開頭的路徑段是
// 建構元件不是路由。
const PAGES = 'src/pages';
const routePages = walk(PAGES)
  .filter((p) => /\.jsx$/.test(p))
  .filter((p) => !relative(PAGES, p).split('/').some((seg) => seg.startsWith('_')));

// 這些頁不畫返回鍵，各有理由，不是漏掉。
const NO_BACK_PAGES = new Map([
  ['FrontDoor', '素首頁自己就是返回鍵的終點'],
  ['Glossary', '只為舊連結轉址的空殼，不渲染畫面（scripts/routes.mjs 的 NOINDEX）'],
  ['Tags', '同上，轉址空殼'],
  // 樂器頁整頁就是一台儀器（調音錶、琴鍵），沒有抬頭列可以掛返回鍵，浮貼一顆又會壓在
  // 儀表上。使用者 2026-07-28 裁定這幾頁不要返回鍵，退出用瀏覽器上一頁。
  ['AutoTuner', '滿版樂器介面'],
  ['UkuleleTuner', '滿版樂器介面'],
  ['VocalTuner', '滿版樂器介面'],
  ['ElectricPiano', '滿版樂器介面'],
]);

// 殼會自己畫返回鍵（都經過 src/backNav.js）；頁面也可以自己放 <BackLink />。
const PROVIDES_BACK = /<(?:PageShell|DashboardLayout|SiteHeader|BackLink)\b/;

for (const path of routePages) {
  const name = path.split('/').pop().replace(/\.jsx$/, '');
  if (NO_BACK_PAGES.has(name)) continue;
  const source = readFileSync(path, 'utf8');
  if (!PROVIDES_BACK.test(source)) {
    failures.push(
      `${relative('.', path)}：沒有回頭路。用 PageShell／DashboardLayout／SiteHeader 其中一個殼，`
      + `或自己刻的版型就放一個 <BackLink />（src/components/BackLink.jsx）`,
    );
  }
}

// 寫死落點：任何頁面把 `/` 或 `/all` 直接當返回鍵的 href，就繞過了全站配置。
for (const path of routePages) {
  const source = readFileSync(path, 'utf8');
  for (const [i, line] of source.split('\n').entries()) {
    if (!/←/.test(line)) continue;
    if (!/(?:href|to)=["']\/(?:all)?["']/.test(line)) continue;
    failures.push(
      `${relative('.', path)}:${i + 1}：返回鍵寫死了落點。改用 <BackLink />，`
      + `落點由 src/backNav.js 決定（那裡也是全站開關）`,
    );
  }
}
/* ── 結果 ─────────────────────────────────────────────────── */

if (failures.length) {
  console.error(`shell chrome validation failed:\n${failures.map((l) => `- ${l}`).join('\n')}`);
  process.exit(1);
}
console.log(
  `shell chrome ok: ${routePages.length} 個路由頁都有回頭路，寬容器的水平內距全部來自 shellPadding.js`,
);