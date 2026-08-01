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

// 幾條路由共用同一份版型時（/userscripts/<三支腳本> 都是 _ScriptPage 傳一個 id），路由檔
// 只剩一行 `return <ScriptPage id="…" />`，殼在被匯入的那個建構元件裡。**只跟一層、只跟
// `_` 開頭的本地檔**：那是這個倉庫裡「建構元件」的標記，跟到別的路由頁上就會讓一個真的
// 漏了返回鍵的頁靠鄰居過關。
function providesBack(path, source, followed = false) {
  if (PROVIDES_BACK.test(source)) return true;
  if (followed) return false;
  for (const m of source.matchAll(/^import\s+\w+\s+from\s+'(\.[^']+)'/gm)) {
    const spec = m[1];
    if (!/(^|\/)_/.test(spec.split('/').pop())) continue;
    const target = join(path, '..', spec.endsWith('.jsx') ? spec : `${spec}.jsx`);
    let inner;
    try { inner = readFileSync(target, 'utf8'); } catch { continue; }
    if (providesBack(target, inner, true)) return true;
  }
  return false;
}

for (const path of routePages) {
  const name = path.split('/').pop().replace(/\.jsx$/, '');
  if (NO_BACK_PAGES.has(name)) continue;
  const source = readFileSync(path, 'utf8');
  if (!providesBack(path, source)) {
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
/* ── 三、回頭路的落點 ──────────────────────────────────────── */

// 2026-07-29 踩過的：`identityHomeFor` 的 fallback 寫成「沒有站內原點就回素首頁」，
// 於是主題站若沒登記進 SITE_HOMES，整個文章標題會直接連到素首頁。
// 使用者的規矩是：**站內頁往回只能回這個小站的首頁，永遠不會是素首頁**，而且內頁的
// 大標題根本不是連結。這一節把它變成機械檢查，逐條路由算一次。
const { backFor, siteHomeFor } = await import('../src/backNav.js');
const { collectRoutes } = await import('./routes.mjs');

const allRoutes = (await collectRoutes()).map((r) => (typeof r === 'string' ? r : r.path ?? r.url));
const routeSet = new Set(allRoutes.map((p) => (p.length > 1 ? p.replace(/\/+$/, '') : p)));
const depth = (p) => p.split('/').filter(Boolean).length;

for (const route of allRoutes) {
  const inner = depth(route) > 1;
  const back = backFor(route);

  if (inner) {
    // 箭頭：一律回素首頁，而且不帶站名（站名歸眉標，見 src/components/Eyebrow.jsx 的 back）
    if (back?.href !== '/') {
      failures.push(`${route}：左上角的箭頭應該回素首頁，現在落在「${back?.href ?? '無'}」`);
    }
    if (back?.label) {
      failures.push(
        `${route}：箭頭上寫著「${back.label}」。那支箭頭只管離開這個站，站名寫在眉標那顆按鈕上，`
        + '兩個都寫會變成同一畫面兩個同名、去處卻不同的東西',
      );
    }
    // 眉標：站內頁一定要有一顆回自己站首頁的按鈕
    const site = siteHomeFor(route);
    if (!site) {
      failures.push(
        `${route}：站內頁沒有回自己站首頁的路。把這個站登記進 src/backNav.js 的 SITE_HOMES`
        + '（前綴長的排前面），眉標才會變成那顆按鈕',
      );
    }
    // 落點可以帶查詢字串（`/statisticslab?tab=glossary`＝實驗室的術語表分頁，沒有自己的路由），
    // 所以比對路由存不存在之前先把 `?…` 切掉。
    if (site && !routeSet.has(site.href.split(/[?#]/)[0])) {
      failures.push(`${route}：站首頁 ${site.href} 不是真的路由。SITE_HOMES 的落點寫錯了`);
    }
    if (site && !site.label) {
      failures.push(`${route}：站首頁沒有標籤，眉標那顆按鈕的 aria-label 會說不出要回哪裡`);
    }
  } else if (!['/', '/all'].includes(route)) {
    if (back?.href !== '/') failures.push(`${route}：站首頁／單頁的箭頭應該回素首頁，現在是「${back?.href ?? '無'}」`);
    if (back?.label) failures.push(`${route}：箭頭上寫著「${back.label}」。回素首頁的箭頭不掛招牌`);
    if (siteHomeFor(route)) failures.push(`${route}：站首頁的眉標連到自己。SITE_HOMES 的比對漏掉了「站首頁自己不算內頁」`);
  }
}

/* ── 四、模板統一的兩條，逐檔掃 ────────────────────────────── */

// 這兩件事一旦讓頁面自己決定，就會長回 2026-07-29 那天的樣子：每頁一種回頭路。
for (const path of walk('src/pages').filter((p) => /\.jsx$/.test(p))) {
  const source = readFileSync(path, 'utf8');
  const lines = source.split('\n');
  for (const [i, line] of lines.entries()) {
    // (1) 箭頭的落點只有 backNav.js 說了算。頁面只能傳 back={null}（這頁不畫）。
    if (/\bback=\{\{/.test(line)) {
      failures.push(
        `${relative('.', path)}:${i + 1}：自己指定了箭頭的落點。箭頭一律回素首頁，`
        + '站名寫在眉標那顆按鈕上（src/backNav.js 的 SITE_HOMES）；要整頁不畫才傳 back={null}',
      );
    }
    // (2) 大標題不是連結。抓「<Link>／<a> 包住 h1」這種寫法（含把 h1 存成變數再包起來）。
    if (!/<h1[\s>]|\{heading\}|\{titleEl\}/.test(line)) continue;
    const before = lines.slice(Math.max(0, i - 6), i).join('\n');
    if (/<(?:Link|a)\b[^>]*$|<(?:Link|a)\b[^>]*>\s*$/.test(before.trimEnd())) {
      failures.push(
        `${relative('.', path)}:${i + 1}：大標題被包成連結。全站的大標題都不可點——`
        + '回素首頁用左上角的箭頭，回這個站的首頁用眉標上的站名',
      );
    }
  }
}

/* ── 五、自己刻抬頭列的頁，眉標也要接上 ────────────────────── */

// 走殼的頁由 PageIdentity 把眉標接上 siteHomeFor；自己刻抬頭列的頁（各有各的 CSS 變數與
// 字級，套不進共用殼）曾經只接了左上角那支箭頭，眉標是一行寫死的字。差別在有內頁的時候
// 才看得出來：SITE_HOMES 登記了、validate 第三節也算得出「這頁該有回站首頁的路」，但那顆
// 按鈕根本沒接線，讀者按了沒反應。所以這裡逐檔要求它們走 src/components/SiteHomeEyebrow.jsx。
const CARVES_OWN_HEADER = /<(?:PageShell|DashboardLayout|ArticleLayout)\b/;
const WIRED_EYEBROW = /<SiteHomeEyebrow\b|<Eyebrow\b[^>]*\bback=/;
const EYEBROW_EXEMPT = new Map([
  ['ElectricPiano', '滿版樂器介面，整頁就是琴鍵，沒有抬頭列'],
  ['JirsForeignLaw', '眉標與大標題整塊是「回本頁總覽」的按鈕（同頁切視圖，不是換網址）；'
    + '此站也沒有內頁路由。日後真的長出 /jirsforeignlaw/… 的內頁，要先把那顆按鈕拆開再接眉標'],
]);

for (const path of routePages) {
  const name = path.split('/').pop().replace(/\.jsx$/, '');
  const source = readFileSync(path, 'utf8');
  if (CARVES_OWN_HEADER.test(source)) continue; // 走殼：PageIdentity 已經接好
  if (!/<h1[\s>]/.test(source)) continue;       // 沒有大標題＝沒有抬頭列（轉址空殼、樂器頁）
  if (EYEBROW_EXEMPT.has(name)) continue;
  if (!WIRED_EYEBROW.test(source)) {
    failures.push(
      `${relative('.', path)}：自己刻了抬頭列，眉標卻沒接上站首頁。改用 `
      + `src/components/SiteHomeEyebrow.jsx（className 原樣傳進去，沒有站首頁可回時畫面一模一樣）`,
    );
  }
}

/* ── 六、返回鍵的外觀不准逐頁傳 ────────────────────────────── */

// 2026-07-30 使用者在 /constitutionalcourt 點出來的：那頁的箭頭一直看得見。成因是
// `BackLink` 當時寫 `className || QUIET`——呼叫端一傳 className，整組隱形樣式就被換掉，
// 而九個自己刻抬頭列的頁全都傳了自己的字級與顏色。於是「預設隱形」只在三個殼裡成立，
// 頁面自己放 BackLink 的地方一律是實心的，看起來像九頁各自的樣式選擇，其實是同一個缺口
// （順帶：九頁九種字級與九種 hover 色）。
//
// 現在 `BackLink` 沒有 `className` 這個 prop：隱形、字級、hover 色、hover 熱區都在
// src/components/BackLink.jsx 裡，呼叫端只決定它放在哪、要不要留間距。要換某頁的 hover
// 色，就在該頁本來就有的頁面級變數表加一行 `--backlink-accent`。
for (const path of walk('src').filter((p) => /\.jsx$/.test(p))) {
  const lines = readFileSync(path, 'utf8').split('\n');
  for (const [i, line] of lines.entries()) {
    if (!/<BackLink\b[^>]*\bclassName=/.test(line)) continue;
    failures.push(
      `${relative('.', path)}:${i + 1}：又給返回鍵傳樣式了。BackLink 沒有 className——`
      + '外觀與隱形都歸元件（src/components/BackLink.jsx），要換 hover 色就在該頁的頁面級'
      + '變數表加一行 `--backlink-accent`',
    );
  }
}

/* ── 結果 ─────────────────────────────────────────────────── */

if (failures.length) {
  console.error(`shell chrome validation failed:\n${failures.map((l) => `- ${l}`).join('\n')}`);
  process.exit(1);
}
console.log(
  `shell chrome ok: ${routePages.length} 個路由頁都有回頭路，寬容器的水平內距全部來自 shellPadding.js；`
  + `${allRoutes.length} 條網址的回頭路落點逐條算過（箭頭一律回素首頁、站內頁的眉標回自己的站首頁、大標題全站都不是連結）；`
  + '自己刻抬頭列的頁都走 SiteHomeEyebrow',
);
