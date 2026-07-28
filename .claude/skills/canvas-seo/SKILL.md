---
name: canvas-seo
description: 給 my-canvas-lab 的頁面補 SEO/AEO——per-page 的 title/description/keywords 與 structured data（Course/Dataset/Person/Legislation…）。建新研究頁時順帶做，或事後專門優化某頁的搜尋與答案引擎表現時用。底層基建（SeoHead 自動產的 OG/canonical/breadcrumb/Organization/WebSite、prerender、sitemap、robots）已全站共享、不用碰；此 skill 只管每頁要判斷的那一層。
---

# canvas-seo：一頁 SEO/AEO 的標準流程

## 先分清兩層（省時間的關鍵）

- **基建，已全站建好、不用碰**：`src/components/SeoHead.jsx` 對每條路由自動產 title、description、canonical、OG/Twitter、以及 JSON-LD 的 Organization/WebSite/CollectionPage(或 Article)/BreadcrumbList。`scripts/prerender.mjs` 用 headless Chromium 把這些烤進 `dist/<route>/index.html`（不跑 JS 的爬蟲/答案引擎才拿得到）。sitemap、robots（放行 GPTBot/ClaudeBot/PerplexityBot/Google-Extended）也自動。權威說明：`README.md`「搜尋與答案引擎（SEO / AEO）」節。
- **per-page，每頁做一次（這個 skill 的範圍）**：keywords、鎖關鍵字的 title/description、page-specific 的 `buildSchema`。新頁不做，就只有陽春的基礎 SEO。

## 原則（硬規則，違反會被 SeoHead 的設計否決）

**只描述頁面真的有的東西。不捏造 FAQ、評分、更新日期、不存在的作者。** schema 裡每個欄位都要對得上畫面上或資料裡真實存在的事實。

## 步驟

### 1. 建 `src/pages/_<page>/seo.js`（純資料，前端與 node 腳本共用）

匯出四樣（照 `_law-classics/seo.js`、`_constitutional-court/seo.js` 的樣子）：

- `<X>_KEYWORDS`：頓號分隔字串。**放頁面上真實出現的長尾詞**——人名、案號、課號、機構名。答案引擎才接得住「某某教授 台大 X」這類問法。
- `<X>_TITLE`：完整 `<title>`，鎖主關鍵字，結尾 `｜Phenom Canvas Lab`。
- `<X>_DESC`：description，**塞可提取的事實**（數字、年份範圍、涵蓋量），一兩句話能被答案引擎整段引用。接到 PAGE_META 的 `seoDesc`，不是 `desc`。
- `<X>Schema(SITE_URL)`：回傳 JSON-LD 物件**陣列**。每個物件帶 `@context`/`@type`/`@id`。用 `creator: { '@id': \`${SITE_URL}/#org\` }` 指回站的 Organization node，答案引擎才把整站解析成同一個實體。

### 2. 選對 schema.org 類型（不確定就少放，別硬套）

| 頁面是什麼 | 主要 @type |
|---|---|
| 一門課／課程史 | `Course`（帶 `courseCode`、`provider` 大學、`inLanguage`） |
| 一批資料／檔案庫／量化研究 | `Dataset`（帶 `temporalCoverage`、`keywords`、`isAccessibleForFree`） |
| 一個人（大法官、學者） | `Person` |
| 一部法規／判決 | `Legislation` |
| 一篇長文 | `Article`（多半 SeoHead 已自動，看 type） |

一頁可以同時放多個（如課程史 = `Course` ＋ `Dataset`）。

### 3. App.jsx 的 PAGE_META entry 接線

該頁 entry 補上 `title`、**`seoDesc`**、`keywords`、`type`（如 `'CollectionPage'`）、`buildSchema`。

⚠️ **長描述要放 `seoDesc`，不是 `desc`。** `desc` 是首頁卡片上的那一行文案，`PageRoute` 只在沒有
`seoDesc` 時才拿它當 `<meta name=description>`。把兩百字的 SEO 描述寫進 `desc`，首頁那張卡就變成
一大段話（2026-07-27 被使用者當場退回兩頁）。`npm run validate:copy` 現在會擋 `desc` 超過 60 字。頂部 import 這頁的 seo.js。`PageRoute` 會把這些餵給 SeoHead。

### 4. ⚠️ 頁面 useEffect 的 document.title 要用同一個 TITLE 常量

坑：頁面元件裡若有 `useEffect(() => { document.title = '…' })`，它會**蓋掉** SeoHead 設的 SEO title——`<title>`（搜尋結果主標題）就變回簡短版。改成 `document.title = <X>_TITLE`（import 同一常量），別讓兩處各寫一份。

## 驗證（必跑，read-back）

起 dev，用 headless 讀 `<head>`，確認 title/description/keywords/JSON-LD 都是優化版、`ldTypes` 含你加的類型：

```js
// node <此檔>.mjs（在 repo 根，用專案的 playwright）
import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto('http://localhost:<port>/<route>', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
console.log(await p.evaluate(() => ({
  title: document.title,
  desc: document.querySelector('meta[name=description]')?.content?.slice(0, 60),
  kw: document.querySelector('meta[name=keywords]')?.content?.slice(0, 50),
  ld: [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap(s => { const j = JSON.parse(s.textContent); return Array.isArray(j) ? j.map(x => x['@type']) : []; }),
})));
await b.close();
```

`title` 要是完整 SEO 版（不是簡短版＝步驟 4 沒做）；`ld` 要含你加的 `Course`/`Dataset`/… 型別。收尾別忘 kill 掉 dev server（`lsof -ti tcp:<port>` 再 `kill`，別 `pkill -f` 廣泛 pattern）。

## 共用工作樹的提交（多 session 並行時）

App.jsx 常同時被別的 session 改（新頁 entry）。**只提交自己的 hunk**：`git diff src/App.jsx` 挑出含你 seo 常量名（如 `GLCT`）的 hunk，`git apply --cached` 進 index，獨占的 `_<page>/seo.js` 用 `git add`，再**裸 `git commit`**（提交 index，別加 pathspec——pathspec 會拿工作樹覆蓋、把別人的 entry 一起帶進來）。commit 後 `git status` 確認別人的改動還在。

## 從源頭省事

理想是**建新頁時就把這五個 SEO 欄位填全**，而不是像德文課程頁那樣事後補。若在跑 `canvas-new-page`，建 PAGE_META entry 的當下就照步驟 1–4 一起做。
