# Canvas Lab — Engineering Handoff

Current-state document for the next agent (Claude Code or Codex)
picking this up, organized by page/area rather than by session date.
**Rewrite the relevant section in place when you finish work — do not
prepend a new dated section on top.** (This file drifted into
date-stacking once already; merged back down on 2026-07-04. Don't
repeat that.) Check git history if you need the session-by-session
blow-by-blow.

## Canvas-wide hard rule: no engineering language (2026-07-11 使用者裁定)

Nothing engineering- or operations-flavoured may appear on the canvas —
neither in rendered text nor in unrendered JSON fields that ship in the
public bundle. Banned vocabulary includes (zh and en): 抓取/爬蟲/擷取/
解析(of files)/快照/入庫/佇列/管線/腳本/本地路徑, parser, pipeline,
snapshot, capture, scraper, ingest, queue, scheduler, repo, schema,
workflowState, HTTP status codes, headers, internal doc/file paths
(docs/NN_*.md, data/parsed/...). Data-repo files may keep all of that —
they are operational records; the sync layer must strip it. For
intlTaxOps this is enforced structurally: `sync-to-canvas.mjs` writes a
public *projection* (OPS_KEYS strip + watchlist reduced to id/label),
so fix wording in the data repo and re-sync, never hand-edit the canvas
copy. When writing digest/topic prose, narrate what a *reader* learns
(「三份文件已完成研讀」), never how the material was obtained
(「換 headers 後抓取解析成功」).

## 自有域名：`phenomcanvas.com`（2026-07-28 23:35 註冊，已上線）

站的正式網址是 `https://phenomcanvas.com`，`www` 與舊的 `my-canvas-lab.vercel.app` 都轉過來。
域名在 **Cloudflare Registrar**（買到 2031-07-28，auto-renew 開著），DNS 也在 Cloudflare，
兩筆 CNAME（`@` 與 `www`）都指向 Vercel 給的 `e22f8093d6f6ad5e.vercel-dns-017.com`。

- **兩筆記錄的 Proxy status 必須是 DNS only（灰色雲）。** 開橘色雲的話 Cloudflare 擋在 Vercel
  前面，Vercel 簽不到憑證（畫面永遠停在 Generating SSL Certificate，不報錯），HTTPS 轉址還會
  兩邊互踢。Vercel 自己的 DNS 說明也寫 `Proxy: Disabled`。
- **apex 用 CNAME 是靠 Cloudflare 的 CNAME flattening**（DNS 規範不准 apex 有 CNAME，
  Cloudflare 對外會攤平成 A 記錄）。換 DNS 供應商時要確認新的那家也支援，否則 apex 得改 A。
- 換域名時 repo 只有三處要改：`.env.production` 的 `VITE_SITE_URL`（canonical／OG／JSON-LD／
  sitemap 全部由它推導）、`public/robots.txt` 的 `Sitemap:` 行、`scripts/generate-og-image.mjs`
  的頁腳字樣。**`index.html` 裡的 `og:image` 與 `twitter:image` 是絕對網址，第一次掃殘留時漏掉，
  grep 舊網址時記得把 `index.html` 一起掃。** 完整步驟與遷移前後的字數對照在
  `docs/domain-migration.md`。
- 部署順序不能反：**先接通域名、確認 `https://phenomcanvas.com` 真的開得起來，再改那三處推上去**。
  反過來會讓全站 canonical 指向一個還不存在的主機。

## 使用者腳本搬到自有域名（2026-07-29）

三支油猴腳本的正式安裝檔現在是 `https://phenomcanvas.com/scripts/<檔名>.user.js`，落地頁在
`/userscripts`（總覽）與 `/userscripts/law-item-labeler`、`/userscripts/social-auto-expand`、
`/userscripts/fjud`。

**為什麼要搬**：三支原本都沒宣告 `@updateURL`／`@downloadURL`，Tampermonkey 因此拿「使用者
當初安裝的那個網址」查更新。那個網址是寫進別人機器裡的軟體的——改帳號名、改 repo 名、
jsDelivr 改政策，所有已安裝的副本就安靜地不再更新，不報錯也沒人通知。現在三支都指向這個
網域上的固定位置。

**舊位置留一版跳板**：已安裝的副本仍指著舊網址，不會自己改。所以舊位置（law-item-labeler 的
GitHub Pages `law-item-label.user.js`、social-auto-expand 的 release 資產、fjud 的 jsDelivr
`@latest`）都要發一版帶新 `@updateURL` 的，等它們更新過去。`build.js` 因此同時輸出新舊兩個
檔名，內容相同，**別刪舊的那個**。

**前後端分離照舊**：`public/scripts/*.user.js` 與 `src/data/userscripts.json` 的
`version`／`file`／`matches[].pattern`／`grants[].name` 都是同步產物，來自三個來源倉各自的
`sync-to-canvas.mjs`（`node sync-to-canvas.mjs --canvas <canvas 路徑>`，路徑當參數傳、不寫死）。
canvas 只寫落地頁的文案——介紹、每條 `@match` 為什麼要、版本紀錄。`npm run validate:userscripts`
（已接進 `verify:policy`）逐欄比對兩邊，版號、安裝網址、`@match`、`@grant` 對不上就擋下來。

`validate:shell` 這次也放寬了一格：幾條路由共用一份版型時（三頁都是 `_ScriptPage` 傳一個 id），
路由檔裡沒有殼，檢查會跟一層 `_` 開頭的本地匯入去找。只跟一層、只跟 `_` 開頭的檔——跟到別的
路由頁上，就會讓一個真的漏了返回鍵的頁靠鄰居過關。

## 使用者腳本的分發與計數（2026-07-29）

一支腳本同時存在於三個位置，各自服務一批不同的已安裝副本，不是重複備份：這個網域上的
`/scripts/*.user.js` 是正式來源；GitHub release 與 Pages 的舊檔名是 2.1.0 以前那批副本的跳板；
Greasy Fork 託管它自己的一份，從那裡裝的人也從那裡更新。

**只有 social-auto-expand 上 Greasy Fork**（id `588964`）。兩支法律腳本不送：會去那裡搜中文
法律關鍵字的人趨近於零，而公開就有維護義務；fjud 的 `@match *://*/*` 還會踩到 GF 的萬用字元
建議。GF 規則要求可運作的程式碼放在它站上，也不允許張貼意圖把使用者導去別處的下載網址，所以
送上去的那一份必須拿掉 `@updateURL` 與 `@downloadURL`——從 GF 裝的人由 GF 負責更新。

那一份是產生的、不是手改的，而且**進版控**：`npm run greasyfork` 產出
`greasyfork/social-auto-expand.user.js`，GF 從它的 raw 網址同步（webhook 已建在來源倉上，
push 事件，hook id `658202497`）。說明欄同理，從 `greasyfork-listing.md` 逐字同步，所以那個檔
裡不能有任何註解或前言。結果是改版仍然只要 push 一次。

**固定檢查**：`npm test`（來源倉）在 `greasyfork/` 那份落後於來源時 exit 1。這是這條線唯一會
安靜壞掉的地方——GF 會繼續供舊版，列表頁看起來完全正常，兩邊都不報錯。

**看有多少人在用**：`npm run report:userscripts`（`scripts/userscript-reach.mjs`）。它把 release
下載數、倉庫流量、jsDelivr、Greasy Fork 安裝數並排列出來而**不加總**，因為量的不是同一件事：
release 下載數只算從 release 資產抓走的次數，且 2.1.0 以前沒有 `@updateURL`，那個數字裡混著
自己機器每天的更新檢查；law-item-labeler 走 Pages，GitHub 根本不提供計數。GF 的安裝數是唯一
直接量「有多少人裝」的來源。`/scripts/` 那三個靜態檔沒有任何計數，站上沒裝分析工具。

GF 那一側的設定（同步網址、自動／手動、說明欄網址）只能由使用者自己存——它只收 OAuth 登入，
agent 代勞不了，2026-07-29 試過了，別再嘗試自動化那一步。

## 部署：建置在 GitHub Actions，Vercel 只收成品（2026-07-28 改）

`.github/workflows/deploy.yml` 在推上 `main` 時跑完整建置（含 474 個路由的預先渲染），再用
`vercel deploy --prebuilt --prod` 把成品送上去。`vercel.json` 的 `git.deploymentEnabled.main`
設成 `false`，Vercel 自己不再建；**兩邊同時開會互相覆蓋，別把它打開**。

### 預先渲染的成本量出來了：瓶頸是憲法法庭那支 10.34MB 的 chunk（2026-07-29 實測）

一次部署 331 秒，其中 `vite build` 只有 15.4 秒，**預先渲染 553 頁吃掉 227 秒**，
`validate:prerender` 與 sitemap 加起來不到 1 秒。

**並行數不要再往上加。** 兩次真實部署的數字：並行 8 是 227 秒、每頁中位數約 3.3 秒；
改成 16 是 236 秒、每頁中位數 7.1 秒、p90 8.8 秒。每頁耗時正好翻倍而總時間不動——吞吐量
兩次都是每秒約 2.3 頁，完全飽和。ubuntu-latest 是 4 vCPU，React 的水合把核心吃滿了。
`scripts/prerender.mjs` 現在會印中位數、p90 與最慢十條，數字自己會講話。

**最慢的十條全是 `/constitutionalcourt/case/…` 與 `/brief`**（並行 16 時 10–13 秒）。
成因是 `src/pages/ConstitutionalCourt.jsx:15` 靜態 import 整份 `src/data/constitutionalCourt.json`，
打包成 `dist/assets/constitutionalCourt-*.js` **10.34MB**。459 個個案頁，每一頁為了渲染
一個案子都要把這 10.34MB 解析一遍。

**這件事對讀者比對 CI 嚴重。** 那 10.34MB 不是只在 CI 上解析一次——每個點進憲法法庭案子的
真人都要下載並解析它。切片 CI（把路由拆給多個 job）能把建置壓到約 2.5 分鐘，但救不了讀者。
正解是把那份 JSON 拆成「小索引 ＋ 每案一個檔」，頁面只載它要的那一案；建置會跟著快，因為
解析成本正是瓶頸。這件事排在 `CHECKPOINT.constitutional-court.md` 的「長期運維」子線。

### 《手記》的內容在建置當下才進來（2026-07-29 加）

`/notes` 的文章不在這個公開 repo 裡。使用者的裁定是「站上公開沒關係，但不要留在 GitHub」，
所以正文住在私有的 `mt019/notes-data`，workflow 第 4 步用 `NOTES_DATA_TOKEN` 把它 clone 到
`$RUNNER_TEMP`、跑 `npm run update`（build ＋ sync），把 `src/data/notes.json`、
`src/content/notes/*.mdx`、`src/content/notes-archive.mdx`、`src/data/notes-archive.json`
與 `public/notes-assets/**` 放進工作區；這些路徑全部在 `.gitignore` 裡，建置完隨 runner 消失。

- **要多設一個 secret**：`NOTES_DATA_TOKEN`，fine-grained PAT，只給 `mt019/notes-data` 的
  Contents: Read。設法同上（`gh secret set NOTES_DATA_TOKEN`，值貼在提示後面）。
- **私有倉那邊要進版控的是** `content/`、`data/`、`processed/`、`assets/imported/`。
  `drafts/` 不必（每次重算）；**`raw/` 必須**——Hugo 站已經 404，那份抓取結果是唯一的一份。
- 存檔頁那兩個產物（`processed/archive.mdx`、`archive.json`）要 commit，因為它們是 `drafts/`
  算出來的，而 CI 上沒有 `drafts/`。改了短記就在本機跑一次 `npm run archive` 再推。
- **第 5 步是專門為這件事加的閘**：取內容失敗的樣子是「站上整個 /notes 不見了」，而建置
  照樣會成功（預先渲染走路由表，少了資料只會少幾頁、不會報錯）。那一步數 `notes.json` 的
  篇數、比對正文檔數、確認存檔頁在，任一不符就紅掉。
- 已經發表過的那四篇（`fertility-care-responsibility`、`foreign-languages-and-translation`、
  `iias-colophon`、`karl-kraus`）仍留在 git 歷史裡。它們本來就是公開的文章，不必改寫歷史；
  擋的是從今以後不再有新的進來。

**三個 repo secret 已於 2026-07-28 設好，正常情況不必再碰**：`VERCEL_TOKEN`、`VERCEL_ORG_ID`
（`team_SwNJ9WTE8C5JqKjgMSJlT2u8`）、`VERCEL_PROJECT_ID`（`prj_yeHjPDaypcs7Kl9lSbjsxbtDdTGb`，
後兩個不是機密）。要重設時的三件事：

- token 在 vercel.com/account/tokens 建，scope 選 `mt019's projects`。它的權限是整個帳號，
  Vercel 的 access token 沒有專案級 scope。存法是 `gh secret set VERCEL_TOKEN` 然後**貼在
  `Paste your secret:` 提示後面**——寫在命令列上會落進 `~/.zsh_history`（zsh 在終端機關閉時
  才寫入，補救是關視窗前先 `unset HISTFILE`）。
- 兩個編號從 `npx vercel link` 產生的檔裡抄。**CLI 58 對 git 已連結的專案寫的是
  `.vercel/repo.json`，不是舊文件說的 `.vercel/project.json`**，欄位在 `projects[0].id`
  與 `projects[0].orgId`。CI 上沒有這個檔，靠那兩個環境變數認專案。
- **`vercel link` 會擅自往 `.gitignore` 加一行 `.env*`**。那會連 `.env.production` 一起蓋掉，
  而那個檔是公開值、必須進版控（`VITE_SITE_URL` 是 canonical 與 sitemap 的單一來源）。
  本倉已改成只擋 `.env.local` / `.env*.local`，下次 link 完再檢查一次。

**為什麼要搬**：在此之前，線上 473 個路由送的全是空殼，`<div id="root"></div>` 裡零字元，
四個路由抽驗一致（`/`、`/taxlitigation`、`/chenyinke`、`/iiaspublications`）。成因是 Vercel
建置環境缺 `libnspr4.so`，Chromium 起不來，而 `scripts/prerender.mjs` 當時把這個例外 catch
起來、印一行看起來很正常的警告就 **exit 0**。建置顯示成功、sitemap 照樣產出 473 個網址，
實際上一頁內容都沒輸出——壞掉的時候回傳合法值，沒有任何檢查看得出來。Actions 的 runner
裝得動瀏覽器（`npx playwright install --with-deps chromium` 一步補齊系統相依），這條路上
沒有「跑不起來所以跳過」的餘地。

**兩項檢查，別拆掉**：

1. `scripts/prerender.mjs` 現在 launch 失敗就 `exit 1`。只有明寫 `PRERENDER=0` 才准跳過。
2. `npm run validate:prerender`（`scripts/validate-prerender.mjs`）查產物本身：逐一開
   `dist/<route>/index.html`，確認根節點不是空的、檔案大於 5 KB、結構化資料有寫進去。
   它排在 `build` 裡的 `prerender` 之後、`sitemap` 之前——**沒有內容就不會產出網站地圖**。
   workflow 末端還對 `.vercel/output/static/index.html` 再查一次空殼。

改動任何與預先渲染有關的東西之後，線上驗法：`curl -s <url> | grep -c 'id="root"></div>'`
應為 0，或直接看首頁 bytes 數（空殼是 1.8–2.5 KB，真的有內容是幾十 KB）。

### 搬家帶出來的第二個故障：`[REDACTED]` 被烤進 bundle（2026-07-28 修）

**症狀**：線上每一頁 console 都有 `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`，
`/brief` 的登入鈕按了沒反應。建置全綠、頁面正常、預先渲染也沒問題。

**成因**：`VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY` 在 Vercel 專案裡是
**sensitive** 變數（`vercel env ls` 顯示 Encrypted，但 API 查 `type` 是 `sensitive`）。
sensitive 的定義就是誰都讀不回來——`vercel pull` 寫進 `.vercel/.env.production.local` 的是
字面上的 `"[REDACTED]"`，連帶 `decrypt=true` 的 `/v9/projects/{id}/env` 也只回空字串。
建置還跑在 Vercel 自己機器上時真值是當場注入的，所以一直沒事；搬到 Actions 之後
`vercel build` 拿到的就是那串佔位字，Vite 把它烤進 bundle，`AuthProvider` 的
`configured = Boolean(url && key)` 判定為真（非空字串），supabase-js 拿 `[REDACTED]` 當網址就丟錯。
**值是空的反而沒事**（`configured` 為偽，登入鈕自己消失、走純 localStorage）；壞在它是個
truthy 的假值。

**修法（`.github/workflows/deploy.yml` 兩個新步驟）**：

1. `Restore the client-side Supabase env that vercel pull redacts`——拉完設定後用 GitHub
   secrets 覆寫那兩行。secret 沒設就只出一句 `::warning::`，不擅自改檔。
2. `Assert no redacted placeholder was baked into the bundle`——建置後掃
   `.vercel/output/static/assets/`，出現 `[REDACTED]` 就 `exit 1`。**這道閘門是重點**：
   前一個故障（空殼）與這一個是同一族——**壞掉的時候一切照常回傳合法值**，只有直接檢查
   產物內容才看得出來。

**這兩個值要三個地方都有**：本機 `.env.local`（開發）、Vercel Environment Variables（歷史
留存，現在的建置不吃它）、**GitHub repo secrets（現在真正在用的那份）**。它們是公開的
瀏覽器端值，每個訪客的 bundle 裡都有，放 secrets 只是為了不寫進這個公開 repo。

**登入的落點設定在 Supabase**（Authentication → URL Configuration），不在這個倉裡：
Site URL＝`https://phenomcanvas.com`（單值、無萬用字元），Redirect URLs 每條都要帶 `/**`
（`signInWithOAuth` 送的是 `window.location.href`，少了萬用字元就只有首頁算合法落點，
從 `/brief` 登入會被丟回首頁）。完整步驟見 `docs/PERSONAL_STATE.md`。

**線上驗法**：headless 開 `/brief`，console 應無錯誤；點登入應導向
`kbbraozovnmdzuhwfskz.supabase.co/auth/v1/authorize`，其 `redirect_to` 應等於你按下按鈕
那一頁的完整網址（2026-07-28 實測＝`https://phenomcanvas.com/brief`）。

## Pages

### `Notes`（手記・個人短文，2026-07-28 新建）

`/notes` 是清單，`/notes/<slug>` 是單篇。前端三個檔：`pages/Notes.jsx`（清單）、
`pages/_notes/PostRoute.jsx`（單篇）、`pages/_notes/seo.js`（兩條路由共用的 SEO 資料）。
資料倉 `../notes-data`：文章正文在它的 `content/<slug>.mdx`、meta 在 `data/posts.json`，
`npm run update` 產出 `processed/notes.json` 再同步成 canvas 的 `src/data/notes.json`
與 `src/content/notes/*.mdx`。**新增一篇文章不必碰 canvas 的任何一個檔。**

**寫作與資料規則在資料倉的 `AGENTS.md`**（正文不准出現 ASCII 的 `<`／`{`、摘要 20–120 字、
禁用詞清單、日期格式），它的 `npm run validate` 會擋，沒過就不同步。

這頁的幾個決定，改之前先知道：

1. **文章路由不走檔名 glob。** `pages/_notes/` 是建構材料目錄（`_` 開頭，walkPages 會跳過），
   路徑由 `App.jsx` 自己寫成 `/notes/:slug`。所以 `scripts/routes.mjs` **必須**自己讀
   `src/data/notes.json` 把每篇展開（`noteRoutes()`）——漏掉的話文章永遠不會被預先渲染、
   也不會進 sitemap，而畫面上完全看不出來（同 2026-07-28 那顆死掉的分頁按鈕）。
2. **正文按篇分包。** `PostRoute` 的 `import.meta.glob('../../content/notes/*.mdx')`
   **不加 `eager`**，配 `React.lazy` 按 slug 載；`App.jsx` 那條路由本身也是 `lazy()`。
   實測（2026-07-28 丟棄式 build，當時兩篇）：清單 3.3 KB、路由 3.1 KB、正文各自成 chunk
   （3.4 KB／10.7 KB），主 bundle 不帶任何一篇。
3. **右欄目次收起來，但閱讀欄寬不變。** 多數手記是純段落、沒有 `##` 小標，資料倉建置時
   用 `hasSections` 記下來，`PostRoute` 據此傳 `hideToc`。同時傳
   `keepReadingWidth`（本輪為此在 `ArticleLayout` 新增）——沒有它，中欄會吃掉右欄那段寬度
   變成 61rem，一行約 54 個中文字，對散文太寬；現行實測 688px、約 38 字。
4. **返回鍵與眉標是兩顆按鈕，別合成一顆。** `/notes/` 登記在 `src/backNav.js` 的
   `SITE_HOMES`，所以文章頁的返回鍵是「← 手記」、眉標「手記」也回 `/notes`。中間繞過一次：
   `PageIdentity` 剛出來時把眉標＋大標整塊做成連結，登記進 `SITE_HOMES` 之後**文章標題
   整塊變成按鈕**（2026-07-28 使用者：「這個 title 區域變成返回 note 主頁的按鈕了，太奇怪」），
   當時的處置是不登記、由 `PostRoute` 自己傳 `back`。2026-07-29 `PageIdentity` 改成眉標與
   大標題分開掛之後，那個繞路就不需要了，已改回走 `SITE_HOMES`。**一張表兩個消費者
   （返回鍵、報頭）——動它之前先想第二個消費者會變成什麼樣。**
5. **標籤是篩選，不是路由。** 選擇進網址 `?tag=`（`useTabParam` 配 `scroll: 'preserve'`）。
   文章量還撐不起一標籤一頁，那會生出一堆只有一篇文章的路由。
6. **舊帖 `/notes/archive`：58 則短記收成一頁，不各自產網址**（2026-07-29 使用者裁定）。
   最短的一則六個字，一則一頁就是五十幾條點進去只有一行字的網址、五十幾條 sitemap 項目。
   前端多一個檔 `pages/_notes/ArchiveRoute.jsx`；正文 `src/content/notes-archive.mdx`
   與計數 `src/data/notes-archive.json` 都是資料倉 `npm run archive`（`build-archive.mjs`）
   算好送過來的，兩個都進 `notes.sync.json` 的 sha256 清單。三件事要一起知道：
   **(a)** `App.jsx` 的 `/notes/archive` 要排在 `/notes/:slug` **前面**，否則 `archive`
   會被當成 slug 吃掉，讀者看到「查無此文」；**(b)** `scripts/routes.mjs` 要自己加這一條
   （同第 1 點的理由，`pages/_notes/` 不會被 walkPages 掃到）；**(c)** 右欄目次傳
   `tocLevels={[2]}` 只列年份——草稿自己的小標降級成 `###` 之後有六條都叫
   「補記（Matters 留言區）」，列進去是把同一個詞印六遍（`tocLevels` 是本輪在
   `ArticleLayout` 新增的 pass-through，預設仍是 `[2, 3]`）。
   「哪些算舊帖」在資料倉決定：沒定稿成單篇的草稿就是舊帖，某一則將來升級成正式文章時
   canvas 這邊不必改。

**寫作素材有本機來源時，先回那個來源核對，不要只憑通行說法。** 卡爾・克勞斯那篇的事實
是對著 `~/Documents/NTU/1142/Translation/KarlKraus`（兩年的翻譯工程，含
`Notizen/Kraus_多維度年表.csv` 與 `Kraus_年表待核實清單.md`）核的：該工程自己定了
`verified_external`／`project_attested`／`needs_verification` 三級，**只有前兩級可以進敘述**。
據此修掉初稿兩處錯誤（西多妮保存的是他寫給她的一千多封信，不是《火炬》手稿；《第三個
瓦普吉斯之夜》1952 年出版＝他死後十六年，不是二十多年），並補上薩梅克那條線。
譯名跟著該工程走（《人類最後的日子》、《第三個瓦普吉斯之夜》）。

驗收（2026-07-28，dev 5173 ＋ 丟棄式 build 的 preview；當時四篇）：清單依年份分節、標籤篩選
1/2 篇且進網址；**從清單點連結**進單篇（不自組網址）→ title/description/keywords 都是
per-post 版、`og:type=article`、JSON-LD 有 Article ＋ 合併節點；預先渲染情境（preview ＋
networkidle）三條路由的 `#root` 都有 8–12 KB 內容；手機寬度無橫向溢出；console 無錯誤。

### `VocalTraining`（聲樂訓練・Vaccai 練習本，2026-07-27 新建）

`/vocaltraining`，`pages/VocalTraining.jsx` ＋ `pages/_vocal-training/{shared,NowView,PiecesView,MethodView,SourcesView,seo}.jsx`。
資料倉 `../vocal-training-data`，`npm run sync` 投影一個檔 `src/data/vocalTraining.json`（46 KB）。
契約見資料倉 `docs/data-contract.md`，**動手前讀它**。

教材是 Nicola Vaccai《Metodo pratico di canto italiano per camera》（1832，倫敦），十五課、
二十二首帶詞的短練習，詞全部取自 Metastasio 的劇本。四個分頁：`now`（現在練哪一首，
**由資料倉的 `meta.currentExercise` 指定，前端不寫死曲號**）、`pieces`（二十二首，按課分組、
可依技術分類篩選）、`method`（教材本身與三套編號對照）、`sources`（按 Metastasio 作品收攏、
標示考證狀態）。殼＝`DashboardLayout`；主分頁與技術分類篩選是兩個維度，用 `useTabParams`
一次寫（兩個 `useTabParam` 會掉一個鍵）。

**這頁的三個坑，改之前先知道**：

1. **課號一律阿拉伯數字**。原書印羅馬數字，但 `II` 這種字在中文字體裡排成全形寬度，夾在
   「第」「課」之間是歪的；羅馬數字只留在「這本教材」那頁的對照表裡。
2. **右欄目次要 `h2[id]`**。`TableOfContents` 從 DOM 讀 `h2[id]`，id 在 MDX 是 rehype-slug 自動加的，
   手寫 JSX 沒有——沒加 id 時右欄只會畫出一條空的分隔線，看起來像壞掉。這頁每個 h2 都手寫了 id。
3. **標題裡的空白要是真字元**。`第 {lesson.no} 課{'　'}` 那個全形空格是刻意寫成 JSX 表達式的：
   JSX 會吃掉行尾空白，而 `ml-3` 這種 margin 在目次的 `textContent` 裡是看不見的，於是右欄會印成
   「第 1 課音階」。

**`context` 欄位（同日第二輪）**：這首前後的原文＋逐行中譯，一首可多塊，每塊帶 `label`
說明是哪裡來的（「唱這首之前的宣敘調」「同一首詠嘆調的第二節，Vaccai 沒有收」）。
Vaccai 多半只取整首詠嘆調的一節，比喻的答案常常在他砍掉的那一節——第 2 首的斑鳩只有比喻，
答案在第二節；第 4 首反過來，他取第二節、砍掉第一節那句「命運已經把額前那綹頭髮遞到你手上了」。
前端用 `ContextBlocks`（`_vocal-training/shared.jsx`）渲染：與正詞同一套逐行對照，但整塊往內縮
並掛一條細線——**讀者要一眼分得出哪些字他會唱到、哪些不會**。目前只有 ex-02、ex-04 有，
其餘十三首的原文已抓在資料倉的 `data/raw/web/`，逐首補中譯是後續工作。

歌詞來源與考證狀態逐首標在資料裡：二十二首中十五首已在義大利文 Wikisource 定位到原始場景，
七首查不到（`source.verified: false`，場景欄位一律 `null`，資料倉的 validator 會擋「未考證卻有值」）。
第四首〈Avvezzo a vivere〉的歌詞與 Metastasio 原文有異文（`ancor nel porto / paventi il mar`
→ `in mezzo al porto / pavento il mar`，第二人稱改第一人稱），記在該首的 `variant` 欄。

### `Brief` ＋ `brief/*`（個人簡報站，2026-07-17 新建，第十輪接上標記層）

站的形狀：`/brief` 儀表板（`pages/Brief.jsx`）＋兩個內頁——`/brief/reading` 讀的東西
（`pages/brief/Reading.jsx`，第九輪新建）與 `/brief/events` 活動曆（`pages/brief/Events.jsx`），
兩者 `PAGE_META` 都標 `listed: false`（門口列它們，首頁列門口）＋ `pages/brief/data.js`（**資料契約
在前端的唯一入口，三頁都從它讀**）。資料倉 `../brief-data`，`npm run sync` 投影一個檔
`src/data/brief-events.json`（14 MB → 599 KB）。契約見資料倉 `docs/data-contract.md`，**動手前讀它**。

**2026-07-28：法律學研究所的活動補齊了，前端不必改。** 該所的 Google 行事曆只放週常的個人
學術研討會，全所性研討會、工作坊、大師講座只公告在 `iias.sinica.edu.tw`——當天行事曆上的未來
場次 1 場、官網 6 場。資料倉新增 `npm run fetch:iias`，`build-events.mjs` 的 `mergeIias()` 對得上
的合併、對不上的新增，站上該所未來場次 1 → 6。**前端多了三個可用欄位**（`registerContact`
怎麼報名的原話、`announcementTitle` 公告原標題、`agendaUrl` 議程檔），目前都還沒有人畫。
另外 `admission` 現在多一種來源會給的答案：官網只留聯絡人、沒講要不要報名的場次，
`registerByKnown` 是 false、`admission` 是 null，前端照原本「沒有查到」那條路走即可——
**不要把它畫成自由入座**。細節見資料倉 `engineering/LOG.md` 2026-07-28 那條。

**2026-07-28 第二輪（活動這一面的整修，前端＋資料倉一起）。** 使用者連續指出五件事，根因大半在
「同一批活動被五個地方各自手刻一次」：

- **活動列收成一份**：`pages/brief/_EventRow.jsx`，日報分區、關門那一區、這一週、活動曆條列、
  我的講座全用它。先前海報只有我的講座畫得出來、「我要去」在關門那一區整個沒有（最該按的一區）。
- **活動圖自適應**：貼在標題左邊、寬度 `30%`（下限 `4.5rem`、上限 `9rem`）、保持原始比例。
  先前是固定 96px 的一欄，手機上是郵票、寬螢幕上看不出畫什麼。
- **`public/brief/` 與 `/brief` 路由撞名**，Vite dev 直接 500（public 的靜態檔蓋掉路由，線上因為
  prerender 產物剛好同名而看不出來）。海報改放 `public/brief-posters/`，新增固定檢查
  `npm run validate:publicpaths`（已進 `verify:policy`）。
- **今／明／後三天 → 這一週**（`?view=week-events`）。整週之前就開始、還沒結束的獨立一區
  「整週都在」，其餘按開始的那一天分段——跨日的展覽每天複印一遍會把當天的講座擠掉。
- **已結束的活動不再消失**：資料倉往回送 30 天的學術活動（`pastEvents`）＋ 按活動編號的活動圖
  對照表（`posters`），`marks.js` 的 `LIVE` 兩者都收。這一區在頁面上是「剛結束的」（預設收起來），
  沒去成的仍找得到、仍能按「我去了」。

**2026-07-28 第四輪：分頁重新設計＋抓取被擋的真正原因＋全站導覽兩條路。**

- **日報／週報／月報 → 未讀／讀的東西／活動**（使用者：「到底什麼邏輯？沒看明白」）。三個報
  各自裝著方向相反的兩種東西，「週報 26」實際是 0 篇文章加 26 場活動。現在文章與活動各自
  一頁，`讀的東西` 用次分頁切 7／30 天，`活動` 保留自己那排次分頁（多了「本週全覽」）。
  舊網址 `?view=daily|week|month` 在前端翻成新分頁。
- **活動列的排序改成「還剩多少時間可以動手」**：沒開始的照開始日、進行中的照結束日。舊規則
  把「進行中」一律排最前面（本來為暑期課程寫的），接了展覽之後，週報最上面四則全是開到
  後年的特展，而每個來源只列前 4 則——這幾天的講座整個被擠掉。
- **Reddit 那三支 403 的真正原因是只送了 User-Agent**（`lib/http.mjs`）。補上 `Accept` 與
  `Accept-Language` 就 200。**不是「它擋機器人只能開瀏覽器」**——那條路走過一輪：無頭
  chromium 一樣 403，有頭的真 Chrome 才過，而有頭視窗使用者明令禁止。最後留下的是
  `lib/browser.mjs` 的無頭退路（只在被擋時才用，兩級都不開視窗），以及一句記在那裡的話：
  先把請求送得像一次真的瀏覽，再談瀏覽器。順帶：三支 feed 已經十一天沒有新東西，而站上
  完全正常（靠「留著上次的資料」）——這種安靜的停更目前只有 validate 的 staleDays 在看。
- **NEP（RePEc）的日期語意修正**：每一則的 `dc:date` 是那篇論文自己標的日期（有的只寫年份、
  有的排在下個月），不是它進到這一期的時間。改用期號的日期（`dateIsPaperDate` 旗標），
  否則「最近 7 天出的」永遠算不準，還會出現一篇下個月才出的論文。
- **導覽兩條路**（`backNav.js` 的 `siteHomeFor()` ＋ `Eyebrow.jsx` 的 `SiteEyebrow`）：左上角
  箭頭回 canvas 首頁，眉標上的站名回這個站的首頁。同時修掉「站首頁的返回鍵指向自己」
  （`backFor()` 把 `/brief` 補成 `/brief/` 才去比前綴，剛好命中自己那條規則）與返回鍵太淡。

**2026-07-28 第三輪：新來源——史語所歷史文物陳列館**（`museum.sinica.edu.tw`，資料倉
`npm run fetch:museum` → `data/materials/museum.json`）。跟法律所同一種漏法而且更徹底：院方
日曆收得到這個館的幾檔特展（標題掛「[展覽訊息]」），**教育推廣活動一場都沒有**——繪本故事屋、
專場導覽、古印鑄造工作坊，要報名、名額 15 到 20 人。合併走 `mergeMuseum()`：對得上的（同所、
同開始日、館方標題整個出現在日曆標題裡）**留日曆那筆當主體**、只補活動圖與摘要（日曆的標題是
雙語的，搜英文的人靠它才找得到）；對不上的新增。實測對上 2 場、新增 19 場。

日期在這個站分兩種寫法，這是接它最需要小心的地方：展覽的檔期寫在清單上，**活動的日期只寫在
內頁「活動資訊」那段散文裡**（`2026年8月5日（三）10:00-12:00`），而且一則公告常常包含好幾場，
所以一場一列（`parseSessions()`，同一天被提到兩次以有時刻的那次為準）。**解不出年月日齊全的
就不收**：常設展、只公告開始日的特展、系列總覽頁共 8 則不列，寫進盲區
`museum-standing-exhibitions`。固定檢查 `checkMuseumCoverage()`＋兩個負向案例。

資料倉同一輪修的四件：活動摘要裡的「報名截止：…」現在讀得出來（`mergeDescriptionDeadlines()`，
只認那四個字後 16 字內的第一個日期；統計科學營的 7/31 截止先前只寫在摘要裡，整個漏在
「這 7 天關門的」之外）、ICS 的 `DTEND` 收成 `endDate`（跨日活動先前印成一天，而「未來或進行中」
只看 `endDate`，於是它們開始的隔天就消失；當時未來場次有 19 場長這樣）、來源自己填的「無 (無)」
不再當成地點印出來、`sync-to-canvas.mjs` 多送 `pastEvents` 與 `posters`。負向測試 27/27、
`npm run check:brief` 55/55。

**區塊從 `sources[]` 的 `collection` ＋ `kind` 長出來**（`data.js` 的 `sectionsOf`）：一個 kind 一區，
資料倉加一個新類的來源＝站上多一區，前端一個字都不用改。**這是第九輪修掉的債**——上一版六區是
手寫的，於是資料端從 5 個來源長到 27 個那天，站上還是六區，多出來的 22 個來源全擠進「讀的東西」
底下一條長清單。現在是 10 個讀的東西的區 ＋ 2 個活動的區，**區塊數照類別算，不照筆數算**。

kind 之間的順序＝它在 `sources.json` 裡第一次出現的順序（那張表是資料倉編排過的），**不照筆數排**。
`isAsideSection`＝整區都是 `inDefaultView: false` 的來源 → 那一區收起來，並沉到同 collection 最後。
今天剛好只有文化活動是這樣，但那是條件不是特例。**一個 kind 只有一個來源時不印來源標題**
（「預印本 12 篇」底下再掛「arXiv 12 篇」＝同一個數字講三遍）。

**分頁切的是時間，不是類別**（`useTabParams`，`?view=daily|week|month|sources`，預設 `daily`）：
這一頁是一份**報**，不是一份目錄。切 collection 的版本回答「這個站有哪些東西」，使用者要的是
「這段時間發生了什麼」。類別降成報裡面的欄目（區塊照樣從 `sources[]` 長出來）。
**「這 7 天關門的」釘在分頁之上，不屬於任何分頁**——錯過就沒了的東西不能藏在別的分頁後面。

**日報＝我還沒看過的，不是「今天」**（`brief/marks.js`，localStorage `canvaslab:brief:seen`）。
拿自然日當日報有兩個各自足以殺死它的問題：(1) 今天才過一點只有 3 篇，昨天那 25 篇已經掉進週報，
**每天早上打開都是空的**；(2) **月精度的來源（NBER、IMF 共 24 篇）日期全部是該月 1 號**，以日期
為準的日報會讓它們在 1 號噴出 24 篇、其餘 30 天掛零，而那個 1 號是資料倉補的。記 id 之後兩個問題
一起消失：看過就是看過，跟它宣稱哪天出生無關。**不自動標已讀**——打開就標會讓日報在你看它的
那一秒清空，重新整理什麼都不剩；那不是讀完，那是弄丟。標記是動作，要按。

**週報月報：同一個天數，兩個方向**（`data.js` 的 `WINDOWS`／`itemInWindow`／`eventInWindow`）。
讀的東西往回看（這 7 天出了什麼＝114 篇），活動往前看（這 7 天要去哪＝17 場）——那兩種日期的
意義本來就相反。**兩種錯法都很難看出來**：往回套活動 → 週報列一堆上禮拜已經結束的講座；往前套
論文 → 週報永遠空的（只有 OECD 那 2 篇排在未來的會冒出來）。
**日報全出、連摘要**（看得完，那是拿來讀的）；**週報月報每來源前 4 件**（112／192 篇，那是回顧，
是拿來找的），深的一層在 `/brief/reading`。

**這三頁自己算的只有「剩幾天」**；其餘每個字都來自資料倉。

**標記層**（`brief/marks.js` ＋ `brief/MarkButton.jsx`，第十輪落地；使用者第五輪就點名要）。
三種標記：看過（`canvaslab:brief:seen`）、留著（`:kept`）、我要去（`:going`），全在 localStorage，
不上傳。門口 `?view=kept` 一個分頁看它們，兩個內頁的每一列也按得到（`/brief/reading` 的「留著」、
`/brief/events` 的「我要去」；月曆的格子太小，不塞按鈕）。

**存法有兩種，分界不是潔癖，是一個 bug 換來的**：

- **看過只記 id**，而且剪掉「已經不在這批投影裡」的 id——那個 id 再也不會被問到，留著只會讓
  localStorage 一直長。
- **留著／我要去記整筆快照**（id、標題、連結、日期、來源、`markedAt`），**而且不剪**。
  上一版三種標記共用一份實作、一律只記 id 也一律剪，**而資料倉的投影是輪替的**——每個來源只送
  最新 12 篇（`sync-to-canvas.mjs` 的 `ITEM_QUOTA_DEFAULT`），一篇東西幾天內就會被新的擠出去。
  於是：你按了留著，過幾天一 sync，那筆標記被當成垃圾剪掉，東西連同標記一起消失，**而畫面上
  一個字都不會說**。一個會把你留的東西弄丟的「留著」，比沒有留著更糟——後者你至少知道要自己記。
- **這種錯永遠不會在今天的資料上出現**，它要等資料換一批才發作，那時候沒有人在看。所以檢查直接
  把那個未來狀態做出來（塞一筆 id 不在庫裡的標記進去）。

**快照是退路，不是主要來源**：庫裡還有就畫庫裡那一筆（售票結束日會延、論文會改版，快照不會知道），
輪替走了才退回快照，並明說「已經不在這批投影裡了，連結還在」。**輪替走的照樣列出來**，那正是
這一層存在的理由。`markedAt` 是時刻、東西本身的日期另存——「留著的」照**你按下去的時間**排，
不照東西的日期：你上禮拜留的那篇 2019 年的論文，是上禮拜的事。

「我要去」分成還沒到的與已經過去的兩塊。**過去的不刪**（那是你標了要去的紀錄，抹掉是替他決定
那件事不再存在），但也不跟還沒到的混在一起，否則「我接下來要去哪」就沒人回答了。
**留著 ≠ 看過**：按留著不會讓那篇從日報消失（那會是「按一下就弄丟」的另一種樣子）。
按鍵用 ■/□ 不用星星——這個站已經有一套開關的講法，而**標記是開關、沒有程度**；星星會讓人以為
可以給幾顆，那是評分、是排序，正是這個站在殺的病。

**`data.js` 裡三個分不清就會說謊的概念**：

- `inDefaultView`＝**主辦單位層**的選擇（我沒在追那個所）。
- `isAside`＝**來源層**的事實（這個來源預設不跳出來）。
  兩者混用過一次：拿 `!inDefaultView` 當「售票」，於是 36 場沒被追蹤的中研院講座被算成戲票，
  標題寫「售票節目 480 檔」而實際只有 444。**一個講座不會因為我沒追蹤它就變成一齣戲。**
- `entryOf`＝進場方式五種（有截止日／額滿為止／自由入座／售票／不知道）。**看 `admission` 先**，
  反過來的話一齣要價 800–5000 元的戲會被畫成「自由入座」（它的 `registerBy` 是 null）。
  「額滿為止」比有截止日的**更急**，沒有任何一天可以倒數；「不知道」與「自由入座」畫成一樣就是說謊。
  五種狀態的字不同，但**只有前兩種給強調**：佔多數的值不准掛籤，否則訊號被自己蓋掉。

**`datePrecision` 是這一層最容易安靜說謊的欄位**（`data.js` 的 `preciseDate`）：NBER 與 IMF 只講得出
月份，資料倉為了排序把日期補成該月 1 號。前端照 `md()` 印會印出「7/1」——**一個沒有人講過的日子**，
而且看起來完全正常。247 篇裡 24 篇是這樣。跟 `registerByKnown` 同一個道理。
**`summary` 可以是 null 而且那是事實**（36/247：ECB 與 OECD 的登錄裡沒有 abstract，Reddit 轉貼連結的
貼文沒有內文）——不拿別的欄位去湊，空著就空著。

**固定檢查**：`npm run check:brief`（需另開 `npm run dev`）。37 項，一律「從 JSON 自己算一次再跟
畫面上的字比」，不比對寫死的期望值。**它存在的理由**：480/444 那個錯，build 閘門全綠、eslint 全綠、
零 console error——每一道都過，而畫面在說謊。

第九輪新增的兩類與它們的負向測試（都跑過、都偵測到、都指名）：
- **區塊是不是真的從資料長出來**：不檢查「有沒有那六個標題」（舊版就那樣寫，區塊被改回寫死它照樣
  通過），改成拿資料裡實際有幾種 kind 去數畫面上有幾區、每區的數字是不是那區的來源自己數的。
  負向測試：`itemSections.slice(0, 6)` → 21/24，指名少了智庫分析、學者部落格、技術發布、社群討論。
- **日報是不是真的「沒看過的」**：負向測試把它改成看自然日 → 24/31，指名「**月精度的 24 篇進不了
  日報**」——正是那個改法會犯、而畫面上看起來完全正常的錯。
- **報的兩個方向**：負向測試讓活動也往回看 → 29/31，指名「活動往前看 7 天＝17 場」未通過。
- **不自動標已讀**：負向測試在 daily 掛一個 `useEffect(markSeen)` → 25/31，指名重新整理後日報清空。
- **`datePrecision` 有沒有被吃掉**：月精度的來源不准印出「月/日」，＋反面（日精度的要真的印到日，
  免得為了躲上一條把全部砍成月）。負向測試：拿掉 `precision === 'month'` 那行 → 22/24，訊息直接
  寫「印出了 7/1」。

第十輪新增的標記層檢查與它們的負向測試（都跑過、都偵測到、都指名）：

- **留著撐得過投影輪替**：塞一筆 id 不在庫裡的標記 → 它要照樣列著、而且要明說原因。負向測試：
  把 LIVE 剪法加回 `readRecords` → 35/37，兩項一起被抓到。
- **留著 ≠ 看過**：負向測試在留著的 `onToggle` 順手 `markSeen([id])` → 36/37，只抓到那一項。
- **標記撐得過重新整理**：負向測試拿掉 `write()`（只存在記憶體）→ 34/37。
- 另一個負向測試**是我造的假 bug，記在這裡免得有人重造**：把 `useKept` 指到 `seen` 的鍵，並不會
  製造出「留著＝看過」——兩邊的存法不相容（一邊 id 字串、一邊物件），互相根本讀不到，那條檢查
  當然不叫。**改鍵不等於改行為**；要測「兩種標記混起來」，就得真的讓一個動作去寫另一份。

**這個站被使用者退回五次，教訓全在 `docs/DESIGN.md`**：「資料頁的形狀」「資料驅動的頁不准被單一
來源綁架」「**也不准被單一種類綁架**」三節。**動這個站之前先讀那三節。**

**下一輪**：(1) ~~首頁設計~~ **已完成（2026-07-27）**：根 `/` 改成 glitch 門面、索引移
`/all`、眉標豆腐格用 CSS 圓點修掉，見「Canvas home entry」節；(2) **OPENTIX 即時票況走前端現抓**（倉裡刻意不存剩餘票數，幾小時就過期）——
標記層已經在了，「我要去」那幾場正是該現抓票況的那幾場；(3) **證券市場分析是時間序列不是清單**
（同一個數字每天更新），要走 `components/lab/chart/` 做圖表，使用者已裁示排隊。

**標記層還沒做的**：標記只在這台瀏覽器裡，換一台機器就沒有（頁面有講出這件事，沒有假裝有同步）。
沒有備註欄——按了留著之後想寫一句「為什麼留」，現在沒地方寫。兩件都還沒有人要求，別自己開工。

### `StatisticsLab` ＋ `statistics/*`（統計學實驗室，2026-07-13 新建）

站的形狀：hub（`/statisticslab`，依 topic 列文章，清單由資料驅動，加第二篇不用改它）＋每篇一
個路由頁（`/statistics/null-hypothesis`）。路由來自 `App.jsx` 的巢狀 glob（`pages/**`；子目錄
→ 命名空間網址；`_` 開頭的路徑段不進路由，所以 `_figures/`、`_lib/` 安全）。文章頁在 `PAGE_META`
標 `listed: false`（要 SEO、不上首頁；首頁的 ungrouped fallback 會撿走沒有 group 的頁，所以省
略 group 達不到這個效果）＋`type: 'Article'`。

資料倉 `../statistics-lab-data`：正文 `article.mdx`、`figures.json`（互動元件參數與 seed）、
`sources.json`（引文出處，缺 locator 就 validate FAIL）、`misreadings.json`、`timeline.json`、
`quiz.json`。`npm run sync` 一次投影三個檔（兩個 JSON ＋ 一份 .mdx 正文）。

**這是全站唯一允許在瀏覽器算數的頁**（資料倉 `docs/simulation-policy.md` 明文例外）：教學需要
讀者親手重跑一萬次。邊界四條——只算已投影參數的純函式；一律 seeded（seed 在 figures.json）；
資料倉 `data/reference/` 存同一 seed 下的期望輸出，`npm run verify:sim` 重跑比對；**瀏覽器只
生成分佈，不生成論點**（統計解釋、門檻、史料一律來自資料倉）。模擬引擎在 `_lib/`（mulberry32、
Box-Muller、pooled-variance t 檢定、regularized incomplete beta）；實測校準：虛無為真時
alpha=.05 的偽陽性率 5.1%，品茶精確分佈 [1,16,36,16,1]/70。

六個互動 figure 全部實跑通過（零 console error）。刻意不做的圖：Fisher/Neyman 引用數逐年變化、
誤讀出現頻率——沒有真實資料就不畫，見 `docs/DESIGN.md` 與資料倉的 figures 註記。

### `statistics/judicial-ideal-points`（大法官理想點論文，2026-07-19 新建）

定位＝**一篇剛好放在統計站的高水準論文草稿**（使用者 2026-07-19 拍板），非教學隨筆：出版結構
（摘要＋1–8 編號節＋獨立文獻回顧＋參考文獻），深度優先、術語照學術慣例首次定義（非全面白話）。
中文正文完稿；英文 `article.en.mdx` 是佔位（僅摘要＋兩圖英標），待譯。

兩張互動圖在 `_figures/`：`BayesIdealPoints.jsx`（古典 MDS vs 貝氏 GRM θ 毛毛蟲，19 位＋90% CI，
提名總統上色＝cat-1/cat-2 設計系統固定順序；tone 指派用純函數每次由資料重算，勿改回 module 層
可變狀態——那會讓 re-render 後圖例色塊落空，已踩過）、`SameNomineeForest.jsx`（八算法勝算森林，
1× 參考線＋淡底 ink 細框）。**圖資料是一次性硬拷**進資料倉 figures.json 的 params（抽自 CC 資料倉
`立場表GRM.json`／`共同具名-TierB-{階層,穩健}.json` 與 `立場表分析.json` 的古典位置），**沒有 sync
接回 CC 母本——CC 分析一重跑就靜默過期**（見 `.claude/CHECKPOINT.statistics.md` 待決）。

sources.json 這篇新增 18 條精確書目（台灣六篇＋Hanretty 逐一手 PDF 核對，2026-07-19）；另有
`references.bib`（22 條，citekey 與 sources.json 1:1，供未來 LaTeX/PDF 版）。用到四個 `<Term>` 連結：
permutation-test、credible-interval、ideal-point、equivalence-test（各在首見處，摘要不連）。
資料倉 validate 的工程語言檢查已改「ASCII 詞加詞邊界」（否則 "New Democracies" 的 "ocr" 會誤中）。
四閘＋playwright 全綠、console 0；display 數學置中（`.katex-display` text-align center 實測）。

**記號約定（2026-07-19 統一）**：假設義「虛無假設（$H_0$）」§4.2 首見、之後 $H_0$；結果義全 null（§4.2
定義為推翻不了 $H_0$ 的結果）。摘要保留純詞不上符號。動這篇時沿用，勿再混寫裸 `H0` 或「虛無分布」。

**術語表條目（2026-07-19）**：這篇替統計站 glossary 新增兩條範本——`credible-interval`（貝氏可信區間，
**與既有 frequentist `confidence-interval` 是不同概念，勿互連**）與 `ideal-point`（引 NOMINATE／
Martin-Quinn／Clinton-Jackman-Rivers）。`data/glossary-groups.json` 為此新增第 4 群 `measurement`
「把行為估成位置」（收 ideal-point，未來 latent-trait/GRM 進此群）。剩餘術語（latent-trait、GRM、
odds-ratio、specification-curve、dyad/MRQAP）待使用者過目範本後推廣。

**兩層結論的分寸（2026-07-19 修，已推送 canvas `09e3508`／data `03ccaf8`）**：§6 與 quiz `two-layer` 原用「不同構念／更常加入不代表對齊」
圓兩層分裂，把協作層（1949 以來上百人）與投票層（現任 19 人）當同一批「他們」——已改成靠「不同母體、
不可通約，不相印證也不相矛盾」，代理疑慮交還 §7。**English 版仍是佔位，且記號約定（$H_0$/null）、四個 Term
連結、這個兩層修正全只在 zh；寫 en 時以 zh 為準，勿把舊框架譯進去。** kuuu 已核投票層數字未過期（逐法官 θ
對 CC 母本 `立場表GRM.json` 逐一相符、CI 寬 1.068／相關 0.967／p 0.34 全對得上）。

**標籤系統（2026-07-19，canvas 已推送 `6a4c495`）**：每篇文章的主題標籤通往「談同一件事的所有文章」。
`/statistics/tags` 是總覽頁（`Tags.jsx`），`/statistics/tags/:slug` 是單標籤頁（`TagPage.jsx`）。標籤索引在
資料倉 `build-app-json.mjs` 產出，落進 `statistics-app.json` 的 `tags`（slug＋成員），sync 成 canvas
`statistics.json` 的 `hub.tags`——**canvas 端不手改**。`routes.mjs` 新增 `tagSlugs()` 把每個標籤頁納入
prerender＋sitemap（458 頁；`Tags` 總覽頁列 `NOINDEX`）。`ArticleMeta` 的 tag chip 由純文字改成 `<Link>`：
`tags[i]` 配 `tagSlugs[i]`，**slug 以中文標籤為鍵、語言中性**，沒有 slug 的標籤仍以純文字渲染。標籤詞表已正規化
（「虛無結果」→「非顯著結果」、"null results"→"non-significant result"），`validate-processed.mjs` 加了標籤
slug 驗證。**資料倉這一半已推送 `statistics-lab-data` master `5d227b0`**（build 引擎＋驗證器＋meta 標籤＋
processed＋LOG）；兩 repo 同步。

### 統計站的長文外殼與排版（2026-07-13 補）

`lab/ArticleLayout`＋`ArticleNav`＋`TableOfContents`＋`ArticleMeta`：左書目、中閱讀欄、右自動目次
（rehype-slug 給標題 id，IntersectionObserver 標當前章節，`refreshKey` 讓它隨語言重讀——否則切成
英文後仍列中文標題）。閱讀欄**不填色、不加材質、不畫邊界**；紙張顆粒鋪整頁（只鋪在 article 上會畫出
一個看得見的矩形，那就是面板）。主題色只出現在「當前位置」的標記。

雙語：文章走兩份 `.mdx`（字典式逐句翻譯對散文是錯的形狀），六個互動元件各自帶 zh/en 完整文案，
引註卡讀資料倉的 `en` 欄位。

**CJK 排版三條全域規則**（`src/index.css` body）：`line-break: strict`（行首不得為收尾標點）、
`text-wrap: pretty`、`overflow-wrap: break-word`。**`HoverCite` 用 `<span role="button">` 而非
`<button>`**：Chromium 把表單控制項當成不可分割的行內物件，其中文字不進入周圍文字流，斷行規則跨不
過去，句號會被丟到下一行。卡片用 `createPortal` 掛到 body，否則 hover 時段落會位移。實測判準：
全文行首孤立標點 0 處、hover 前後段落 boundingBox 相同。

**標題內的間距要放進文字，不要靠 CSS margin（2026-07-19 修）**：`TableOfContents` 與 `SubOutline`
的大綱／scroll-spy 是讀 h2/h3 的 `textContent` 生成的，**CSS margin 不進 textContent**。統計站術語表
的組標題原本用 `<span className="ml-2">{n} 條</span>` 撐開組名與數量，頁面上有間距、但「本頁區塊」
大綱顯示成「組成8 條」黏一起。改用 JSX `{' '}` 真實空格、拿掉 `ml-2`（`StatisticsLab.jsx`）。通則：
凡標題會被 textContent-based 大綱消費，其內部間距一律用真實字元，兩個消費點已加行內註解。

### `IiasPublications`（中研院法研所出版品，2026-07-11）

Backed by sibling `../iias-publications-data` repo（GitHub mt019/iias-publications-data，
private；data 遷自 SCU 憲法課倉庫）。Pipeline：`npm run app-json`（manifest → 純 metadata
投影 296KB，NFC 正規化，核數檢查對 manifest 宣告數自校）→ `npm run sync`（JSON →
`src/data/iiasPublications.json`＋87 張封面 webp → `public/covers/iias/`）。規模：87 種出版品
／797 篇章（**已全面 PDF 化**：~743 篇直連 GitHub Release `iias-pdfs` 的 PDF＋54 純目次無檔；
`type:"read"` 線上閱覽已消滅為 0）。前端**五 tab**（總覽含分類構成表＋年×分類堆疊條、完整清單
預設全展開、期刊架 42 期、篇章檢索 797 列、作者榜 429 位）＋策展人（湯德宗）專頁；作者榜靠資料倉
`normalizeAuthors()` 產的每章 `authorList[]`。CSS Modules＋全域 tokens（分類色固定佔
`--cat-1..4`，淡底＋ink 細框）。PDF 走 `/api/pdf` 代理（`api/_pdfProxy.mjs` 白名單：中研院官網
`.pdf` ＋ GitHub Release objects）。字型：本頁進場時補過子集（rebuild-font-subsets）＋7 個源字型
缺字進 `font-coverage-exceptions.txt`。**本頁 CSS 自帶 reset、與其他頁隔離**：`.workspace button,a`
只繼承 `font-family`（不可用 `font:inherit`／不可補 `.workspace button{font-size}`，否則蓋掉元件字級、
全站按鈕變 18px——見 HISTORY.iias 2026-07-27 晚間）。未做（列於資料 repo README）：PDF 全文檢索
（pdf_text 46MB 在資料倉，需 OCR）；可玩性四方向（隨機一篇／年表可點／作者星圖／依篇幅過濾）。

**「整理者的話」是隱藏版（2026-07-28）**：那一段有幾節對具體論文的方法提出批評，不擺在本站說明的
首屏。入口＝緣由段之後的一個無標籤墨菱形（`.colophonMark`，8px 轉 45°，實色 `ink-faint`→hover
`ink`，無光暈），`#colophon` 可直達。**收合用 CSS `display:none`，不做條件渲染——那段一律留在
DOM**，所以檢視原始碼或抓取頁面的讀得到，人要自己找到入口。這是刻意的，不要「順手改成條件渲染
省 DOM」。展開後第一句是 `.colophonCaveat`（個人觀感／對事不對人／數字可回原文覆核）。**站規例外**：
`Accordion` 明令初值全展開且 API 不給收合參數，此處刻意不走 `Accordion`。

### `ECFAResearch`

Backed by the sibling `../ecfa-research-data` repo; canvas-lab consumes
the synced snapshot `src/data/ecfaResearch.json`. Framing: ECFA itself
(official agreement text, annexes, early-harvest products,
implementation/rollback events, product exposure, trade-panel
readiness) is the project center. NDLTD thesis meta-analysis is a
secondary, supporting research-history layer — not the main subject.

Hard UI rules for this page:

- No data-processing vocabulary visible in the canvas. JSON may keep
  fields like source status or confidence, but the React page must
  translate them into reader-facing Traditional Chinese before
  display — no raw file names, status codes, field names, local paths,
  parser/snapshot/pipeline language visible.
- No project-framing meta-prose visible in the canvas. Avoid copy like
  `研究主軸`, `X 本身先於 Y`, `主軸回到...`, `只作為...`,
  `真正的研究基礎...`. Show facts, timeline, affected products,
  sources, and methods directly instead of narrating the research's
  own structure.
- No large KPI-card rows, count-only dashboard cards, or bar charts
  that just restate low-value counts. Numbers belong inline with the
  event/timeline/comparison/method point they support.
- Uses the site-wide font system (see Font System below); rebuild font
  subsets and run `npm run validate:fonts` after adding visible text or
  synced JSON text that introduces new characters.
- Visual tone stays restrained: low-chroma lotus pink, grey-brown, deep
  rose accents. No chunky colored tags or overlapping/clipping labels.

Current tabs: `ECFA 本體`, `事件時間軸`, `2024 中止影響`, `實證設計`,
`論文研究史`, `事實查核`, `名詞解釋`, `資料來源`, `研究進度`. `研究地圖`
was removed as a tab (duplicated the overview + event timeline) — keep
`名詞解釋` and `事實查核` as separate tabs, don't re-merge them.

Data-layer status as of 2026-07-04 (source of truth is
`../ecfa-research-data`, not this file — check there for anything more
recent than this):

- `fetch:ecfa-core` captures 17 official ECFA/core sources (portal
  pages, 2010 agreement PDF, annexes 1-5, Taiwan MOEA/ITA + mainland
  rollback statements/notices, Customs tariff pages), with fetch/curl
  fallback; `parse:ecfa-core` extracts PDF text via `pdftotext` into
  `data/materials/ecfa_core_products.json`/`.tsv`.
- 2024 rollback lists parsed to the official counts (batch 1: 12
  products, effective 2024-01-01; batch 2: 134 products, effective
  2024-06-15).
- **Known gap:** Annex 1 early-harvest list extraction (267
  Taiwan-concession / 539 mainland-concession rows official benchmark)
  currently only yields 226/519 rows via the PDF-text parser. Visible
  in the Canvas page as a gap; must be closed before any causal
  (DID/event-study) estimation work.
- `data/processed/ecfa-research-app.json` is schema `0.2.0`, includes
  `datasets.ecfaCore`, synced to `src/data/ecfaResearch.json`.

Next gates: close the 267/539 extraction gap; build an HS-code
year/version concordance across 2009 ECFA lists, 2024 mainland tariff
references, and Taiwan trade-statistics codes; fetch HS-code ×
year/month × partner trade values before claiming DID/event-study
feasibility; build an ECFA text corpus for deeper NLP work only after
raw official + thesis-abstract coverage stabilizes.

### `InternationalTaxOps`

Full tab-based research desk, not a stub. **2026-07-09 reframing:**
this page should become the public-facing UNIL/Danon PhD research
agenda, not a source-management dashboard. Source registry, watchlist,
and relation graph remain supporting views. The research record and
actual judgments live in `../intl-tax-ops-lab`; Canvas renders the
public-safe copies under `src/data/intlTaxOps/`.

Research split:

- `InternationalTaxOps` = PhD research agenda: core question, Danon fit,
  Ziegler interface, institutional design disputes, literature gaps, and
  next written outputs.
- `ManusMetaAcquisition` = origin case / motivating example. It explains
  where the question comes from and tests the Danon × Ziegler frame, but
  it is not the whole proposal.

Next UI direction: first screen should answer "What is the PhD question,
why UNIL/Danon, and what is the next research output?" before showing
sources. Avoid visible engineering language such as parser, pipeline,
repo, schema, raw, snapshot, workflowState, or sourceTier.

Current tab-based implementation:

- **Tab bar** (`.mainTabBar`, matches `GovernmentDebt`'s pattern):
  主題判讀 (default) / 深度研讀 / 名詞與機構 / 議題矩陣 / 最新動態 /
  來源登錄 / 關係圖譜 / 案例與爭議. Only the active tab renders.
  (前沿監測/Frontier Watch was removed 2026-07-11; its capture JSON
  left the sync map with it.)
- **主題判讀 tab** (research, default; 2026-07-11, Codex + CC):
  `thematic_analyses.json` — six bilingual thematic readings
  (question / current reading / implication / evidence + authority
  link), two-column card grid (`analysisGrid`/`analysisCard`).
- **深度研讀 tab** (closeReading; split out as its own tab per user
  2026-07-11): `research_analyses.json` — an *array* of per-paper
  analysis objects (citation, tagline, researchLine/topic links,
  bilingual `sections[]` with optional `table`). Append-only by design;
  if the five-tab restructure from `12_PHD_RESEARCH_LAYOUT.md` ever
  lands, 主題判讀＋深度研讀 together become 文獻缺口 with zero data
  migration. First paper entry: Ash & Marian, 24 Fla. Tax Rev. 151
  (2020) — NLP convergence study of 4,052 tax treaties; analysis
  written against the full PDF archived in the data repo and
  number-checked against its parsed text. Sections are accordions,
  default expanded, Set-keyed `paperId:sectionId`. Table = plain HTML in
  an `overflow-x` scroll div, pale fill + ink keyline, no fake charts
  (per `feedback_no_meaningless_viz` we show the paper's Table 1
  excerpt as a table and say so in the caption).
- **名詞與機構 tab** (wiki; user-requested 2026-07-11):
  `glossary.json` — bilingual encyclopedia entries in four categories
  (concept / institution / instrument / provision 條文), each carrying a
  `subcategory {id, zh, en}` under which the page groups cards with
  teal-keyline headings (`wikiGroupHead`); group order = array order.
  Each entry: definition, optional 「研究相關性」paragraph, and an
  authoritative source link (URLs reuse the registered source list or
  stable OECD DOIs — never invented). Category filter chips
  (`wikiFilters`) + the global sidebar search both apply. Cards reuse
  `analysisGrid`/`analysisCard`; `.analysisCard .tagRow` overrides the
  global `margin-top: auto` so the category chip stays at the top.
  **The master checklist lives in the data repo:
  `../intl-tax-ops-lab/docs/13_GLOSSARY_PLAN.md`** (~90 planned entries,
  writing rules, per-entry status; 32 done as of 2026-07-11). Extend the
  wiki by editing `data/glossary.json` there in plan order and
  re-syncing — never hand-edit the canvas copy.
- **Codex 2026-07-11 correction record**: Codex's foregrounding commit
  also stripped topic summaries, 待補研究 (nextActions), the 最新動態
  digest tab, and the 核實日 pill — all restored (they are
  reader-facing research content, not engineering). Kept from the same
  commit: research-first tab order + default, subtitle rewrite,
  workflowState removal, 更新頻率 (cadence) pill removal.
- **Sidebar**: brand, search, back-to-canvas link, then 分類視角
  (classification-lens) filter as a vertical list — the *only* place
  that filter exists. Selecting an option also switches to the matrix
  tab. **Do not re-add a duplicate copy in the main content area** —
  tried twice already, reverted both times.
- **Topic matrix**: accordion cards, default expanded (matches
  `feedback_accordion_default`), not a side-by-side list + separate
  detail panel. Detail expands inline under the clicked card.
- **Relations graph**: React Flow + `@dagrejs/dagre` layout. Only real
  `source → topic` edges (from `topic.sourceIds`) are drawn — the
  original round-robin wiring of every watch-list item to
  `topics[i % topics.length]` had no basis in the data and is gone.
  Watch-list items render as an honest unconnected column. **Nodes are
  draggable** via `useNodesState`/`useEdgesState` — a bare controlled
  `nodes`/`edges` prop with no `onNodesChange` silently resets drag
  position on every render; this bit us once.
- **Cases & controversies tab**: `controversies.json`, six entries
  grounded in Robert Danon's actual scholarship (MAP structural
  critique, UN Model 2025 ISDS-override clause, his 2022/2023 GloBE
  dispute-resolution proposal, the beneficial-ownership legal/economic
  judicial split, a concrete Qatar QDMTT date discrepancy, and a
  cross-reference to `ManusMetaAcquisition` as the one entry with a
  live, dated fact pattern). Ties directly into the user's UNIL/Danon
  PhD application research folder for UNIL/Danon — treat that folder as
  authoritative background before extending Danon-related content,
  don't re-derive his positions from scratch.

Data layer: `src/data/intlTaxOps/*.json`, public-safe snapshots synced
from `intl-tax-ops-lab/data/*.json`. **`data/raw/`/`data/parsed/`
(downloaded OECD/EU PDFs, scraped HTML) must never be copied here** —
see the `canvas-research-data-workflow` Codex skill. `topics.json` was
rewritten with cited, specific claims (page counts, decision dates,
named cases) replacing generic scaffold text — don't write a topic
summary without a citation behind it.

Durable research handoff for this page lives in
`../intl-tax-ops-lab/docs/12_PHD_RESEARCH_LAYOUT.md`. Read it before
changing the page structure.

Styling: `InternationalTaxOps.module.css`, CSS Modules scoped via a
`.workspace` wrapper (see `css-modules-porting` skill for why bare
`:root`/`body`/tag selectors don't auto-scope, and why React Flow's own
classes need `:global()`).

### `ManusMetaAcquisition`

Data extracted from a 1354-line monolithic component (9-phase timeline,
corporate structure, 5 legal-dimension analyses, 5 research questions,
3 scholar-framework write-ups, 12 fact-checked claims, sources) into
`src/data/intlTaxOps/manusCase.json` (synced from
`intl-tax-ops-lab/data/manus-meta-case.json`) — same data repo as
`InternationalTaxOps`, **not a separate repo**: Manus applies the same
Danon × Ziegler framework and shares `topicDomain` taxonomy, so it's a
sub-topic of the same research domain, just implemented as its own
canvas-lab page. Component is now 695 lines, rendering logic only. Icon
components can't survive JSON serialization — stored as string `iconId`
and remapped to components in the JSX header.

2026-07-09 research role: this page is the origin case for the PhD
application narrative. It should gain a concise section explaining how
the Manus-Meta fact pattern motivates the broader research agenda:
mobile intangible value, offshore legal ownership, technology/security
control, investment protection, and tax realization split across
jurisdictions. Keep detailed research notes in `../intl-tax-ops-lab`;
Canvas should only show the polished public version.

### `FiscalEnforcementRisk`

Landed — committed 2026-07-06 in `1157d6e` together with
`ECFAResearch`. `src/pages/FiscalEnforcementRisk.jsx` (~1,260 lines)
renders `src/data/fiscalEnforcementRisk.json`, a public snapshot
synced from the sibling `../local-fiscal-enforcement-risk-research-data`
repo (sync state: `docs/DATA_SOURCES.md`). Page identity palette: FER
墨綠米 (`docs/DESIGN.md` 色票庫). Per-tab implementation notes were
never written down here — add them the next time this page gets real
work.

### eslint 從未檢查過這個網站（2026-07-17 修好）

`eslint.config.js` 是 Vite **react-ts** 樣板的預設值，整份設定寫 `files: ['**/*.{ts,tsx}']`。
這個 repo 有 **70 個 `.jsx`、21,000 行、`.tsx` 0 個** → `npm run lint` 的真實涵蓋範圍是
**零規則、零 UI 檔，永遠會過**（連那 23 個被列出的 `.js`／`.mjs` 也沒套到規則，`js.configs.recommended`
同樣關在 ts/tsx 區塊裡）。**而 `vite build` 不做型別檢查也不做 lint，它只轉譯**——四道 build 閘門
檢查的是字型、色票、tokens、數學符號，沒有一道在看 JavaScript 本身。

改成涵蓋 `js/jsx` 後第一次跑，抓到 **9 件 `exhaustive-deps`，其中一件是當天剛推的字號檢索**
（`IndexView` 的 `rest` 少 `exactSet`）。全部已修：

- `IiasPublications` ×3 與 `GraphView` 的 `cellVal`：render body 裡的函式包成 `useCallback` 並列進依賴。
  原本都「碰巧對的」——只依賴 query／mode，而那些已在依賴裡。
- `GraphView` 的 `ed`：`eraData[eraKey] ?? {…}` 寫在 render body，鍵不存在時**每次 render 都造新物件**，
  底下三個 useMemo 的快取形同虛設。包成 useMemo 固定身分。
- `VocalTuner`：`updateLoop` 列了沒用到的 `resetDisplay`。

**設定上的判斷（都不是程式碼問題，是設定沒認得慣例）**：`no-unused-vars` 加 `^_` 放行
（UkuleleTuner 有 7 個 `catch (_error)`）；`no-empty` 加 `allowEmptyCatch`（三個調音器頁的 Web Audio
收音全是 `catch {}`，對已停止的 oscillator 再 stop 本來就會丟例外）；`no-irregular-whitespace`
跳過字串與註解（全形空格是本站排版）；`vite.config.ts` 的 3 個 `any` 放行——要給真型別得裝
`@types/node`（沒裝，`node:http` 解析不到），**填一個解析不到的型別等於假裝有檢查**。
**該 override 必須放在設定最後**：flat config 後面蓋前面，放在 ts/tsx 區塊之前會被它的 recommended 蓋回去。

另清掉 41 處死碼（未用的 lucide import、`mulberry32`、`QUARTERLY_DEADLINES`、`statusLabel`、
`NOMINEE_CASES`、`STRUCTURE`、`typeFill` 等）。**清的過程中用 sed 一次改兩處 `blacks.map`，
把第二處還在用的 `note` 也刪了——`no-undef` 當場抓到**。那會是 `vite build` 照過、使用者點下去
才白畫面的 ReferenceError，正好證明這件事的價值。改完 15 個頁面路由逐條實跑，零 JS 錯誤。

**尚未掛進 `npm run build`**，這是刻意的：先讓它在這個 repo 穩定為綠再說。掛太早會被一堆
warning 擋住 build，然後被關掉——那比現在更糟，因為會以為它在把關。
`src/pages/Brief.jsx` 目前還紅（brief 標記層在途，非本輪產出）。

### `ConstitutionalCourt` (landed 2026-07-06)

- 2026-07-28 **職權轉型曲線上站**（新 `_constitutional-court/JurisdictionShiftChart.jsx`，掛在
  `?tab=jurisdiction` 的首節）。畫的是釋字每五年期裡「統一解釋法律及命令」佔的百分比：
  1949–54 為 51%，1955–74 四期都在八成以上，1975–79 為 63%、1980–84 為 38%、1985–89 為 19%，
  1990 之後每期都在一成以下。這是職權分類那條研究線的實質產出——同一個機關依同一條憲法第78條，
  七十二年間做的事整個換了一種。
  - **資料一律來自資料倉**：`職權分類摘要.釋字五年期`（`classify-jurisdiction.mjs` 產生、
    `validate-jurisdiction.mjs` 驗過合計 813 與年份連續）。**前端不自己分期、不自己加總**；
    分期規則若兩邊各寫一份，兩條曲線遲早會不一樣。
  - **長條照 DESIGN.md 現行畫法**：淡彩實色填充（`color-mix(in oklab, --cat-5-tx 22%, --cat-5-bg)`）
    ＋頂端 2.6px 深墨小蓋、無外框。整張圖只有一個色相，cat-5 與「案件時間軸」下緣那條職權色帶的
    0% 端同色，兩處講同一件事就用同一個顏色。末期佔比為 0，畫一條貼軸底的細線，讓「有資料而值是 0」
    跟「沒有資料」看得出差別。
  - **各期件數靜態標在長條下方**，不藏進 hover：早期各期只有 14–43 件，一件的進出就動好幾個百分點，
    分母是讀者判斷這條曲線該信到什麼程度的必要資訊。
  - **窄螢幕給 svg `minWidth: 560` 讓它橫捲，不等比縮**。390px 的手機上若讓它縮到 358px 寬（實測），
    9.5px 的年份標籤會變成 5px 上下。寬的東西自己捲，別連字一起縮——這條對任何 viewBox 圖都適用。
  - **同一輪修掉的 bug：職權分類分頁的按鈕是死的。** `/constitutionalcourt/:tab` 交給 `CCTabRoute`，
    它拿 tab id 去 `CC_TABS_SEO` 查 slug，查不到就 `<Navigate>` 回站首頁——而那張表裡從來沒有
    `jurisdiction` 這一條，所以按鈕按下去原地彈回，畫面上一個字都不說。連帶地，這一頁也從來
    沒被 prerender 或寫進 sitemap（`routes.mjs` 也是讀 `CC_TAB_SLUGS`）。**防再犯**：新增
    `npm run validate:tabroutes`（`scripts/validate-tab-routes.mjs`，已接進 `verify:policy`），
    把頁面連出去的每個子路由 slug 跟 SEO 表對起來，缺一個就失敗；SEO 表用 import 讀不用正則掃，
    因為朱家驊那張表是 spread 展開的、掃字面值會生出六個假陽性。CC 與 ZJH 各造一個假故障實測過。
    **開發時我一直用 `?tab=jurisdiction` 進頁，正好繞過那條路由，所以沒發現。**
  - **同節的方法段落改掉了卡片與大數字**（使用者：「我討厭卡片 還用卡片？」「職權分類做完了嗎？
    沒做完怎麼上前端了？」）。原本是一張 `text-3xl` 的「240／813 件」進度條大卡＋六張各帶一個
    `text-2xl` 彩色數字的狀態卡＋兩段文字各包一張白卡。改成：四列的密集表（規則判定／單人查核／
    兩人一致／第三人複核，件數 `tabular-nums` 右對齊、不放大不上色——六個數字六種顏色時，色相
    沒有承載任何分類意義），欄位說明三卡改 `dl`，判定順序的圓圈數字改 `1.`，法源表脫掉圓角白框
    改髮絲線。**同時改掉的是話術不只是版面**：進度條在宣傳一件不會發生的事（量產複核 471 件已於
    07-28 判定取消），現在直說「那 471 件不打算逐件複核，這是研究判斷」並附 95.5% 實測誤差。
    `現況聲明` 那句「釋字職權分類仍須獨立複核」在**資料倉**改掉（`classify-jurisdiction.mjs`），
    不在前端蓋字。**未 commit。**

- 2026-07-19 **索引頁右欄時間軸捲軸 `TimeRail`＋工具列捲動行為修一輪**（frontend-only，**DONE**，
  零資料 repo 改動）。新 `_constitutional-court/TimeRail.jsx`：索引頁右邊一條縱向時間脊柱，
  只在 `lg` 以上出現。設計逐一被使用者拍板（過程反覆數輪）：
  (1) **縱軸＝年、全高敷滿**（不留空、不擠一端；早期試過「中央固定滾輪」被打回，端點會留空「貼在下面」）。
  (2) **刻度長度＝件數對數密度**（同「案件時間軸」頁的年度密度；早期「靠中央放大」的透鏡被打回，視覺不好看）。
  (3) **每年間距上限 `MAX_STEP=15px`**：年份少的母體（統一解釋 ~22 年）不拉滿整條、改壓短，避免刻度太稀疏；
      年份多（行憲後 ~76 年）照舊敷滿。
  (4) **時代帶淡塗背景**（`ERA_TONE` 色票，統字/解字/院字/釋字/憲判），隨工具列母體（SegControl）增減。
  (5) **焦點隨捲動連續滑動＋阻尼**：焦點用「分數位置」＝年索引＋該卡在那年的序位（`railPosByJid`，在
      `IndexView` 算），捲過件數多的年也一路連續滑不卡格；`requestAnimationFrame` lerp（`EASE=0.12`）做阻尼。
      焦點由「焦點線（視窗頂下 96px）上正在跨越的那張卡」的 `data-year`/`data-jid` 反推——故 `shown.map` 的
      每張 `CaseCard` 外包一層 `data-jid`/`data-year`/`scroll-mt-[64px]` 的 div。
  (6) hover highlight 該年、**點年瞬間跳**（`scrollIntoView({behavior:'auto'})`，非 smooth；使用者明確不要慢滑；
      站上無全域 `scroll-behavior:smooth`）；跳轉目標若還沒延遲載入進 DOM，先撐 `limit` 再下一影格捲。
  **踩到一個真 bug**：焦點原本完全不跟捲動。因 React **StrictMode 的 mount→cleanup→remount 共用同一
  `rafRef`**，cleanup 取消動畫卻沒把 `rafRef.current` 歸零，remount 後 `setTarget` 的 `if(!rafRef.current)`
  永遠 false ⇒ 永不重排。修法：cleanup 內 `cancelAnimationFrame` 後補 `rafRef.current = 0`。
  **開關**：工具列動作區加 `時間軸開/關` 鈕（`usePref('ccShowRail', true)`）；關閉時版型從二欄塌回單欄、內文滿寬。
  **z 疊層**：右欄容器 `z-30`，讓往左溢出的年份浮標疊在工具列（z-10）與分頁列（z-20）之上，不被壓住。
  版型：`IndexView` root 改 `lg:grid grid-cols-[minmax(0,1fr)_3.75rem]`（開關開時），右欄 `<aside>` sticky `top-[57px]`。
  **同輪一併修工具列自動收合 hook**（就在 `IndexView.jsx` 上方）：sentinel/哨兵 用語全改直白
  `mark`/標記（plain-naming 全局禁令，hook 會糾）。當時的兩態版已於 2026-07-20 整支換掉，
  見下方「工具列收合＝捲動連動位移」。
  **切換母體回分頁列位置**：SegControl 與機關下拉的 onChange 加 `scrollToTabs()`——捲到讓大表頭捲離、分頁列貼齊頂端（**不是**整頁最上方）。基準用非 sticky 的 `toolbarMark` 絕對座標 `-49`（用 `<nav>` 會因 sticky pin 讀到 0，不可靠）。
  **工具列動作區改兩列**：第一列件數＋檢視控制（排序／理由書／時間軸／PDF）＋右端探索鈕（隨機一則／今日同日期）；
  第二列專放匯出（CSV/JSON/BibTeX/引註/批次下載）。修「隨機一則＋今日兩顆單獨落在最底一排」的醜。
  **待辦（使用者「先這樣吧」暫緩）**：工具列按鈕仍偏多，匯出 5 顆可折成一顆「匯出 ▾」下拉；`TimeRail` 手感旋鈕
  （`SIGMA`/`AMP` 已無用、`MAX_STEP`/`TICK_MIN`/`TICK_SPAN`/`EASE`/`REVEAL_UP`）都在檔頭常數，要調改一個數字即可。
  Playwright 實測：焦點 2026→2023 隨捲動追、切換後 scrollY 停在 264（分頁列位、非 0）、開關 present↔absent、
  工具列微抖不彈出／持續上捲才彈出；`npm run build` 全綠、零 console error。

- 2026-07-17 **字號精準檢索**（frontend-only，**DONE**，零資料 repo 改動）。原本搜尋框對
  `字號` 只做子字串比對，打「88」會同時撈到釋字第188號、第880號、院字第88號——指名一件
  反而要自己挑。新增 `_constitutional-court/caseQuery.js`（**純字串進、字號陣列出，不 import
  資料或 React，所以 node 直接跑得動**）：`parseCaseNo()` 認 `#88`／`113-1`／`釋88`／
  `釋字第88號`／`111憲判1`／`111憲暫裁1`／`院解2876`／`統1000`／`解1`，含全形數字與全形井號
  正規化；`shared.jsx` 的 `findCases(q)` 是唯一的對照入口（查 `docByNo`）。
  **三個設計決定**：(1) **`#` 才是精準前綴，裸數字 `88` 仍走關鍵字搜尋**（可能是想搜條號或
  金額）；(2) **`113-1` 只解成憲判字**——同年同號另有 `113年憲暫裁字第1號` 真的存在，兩件一起
  回等於又要使用者挑，要暫裁就打明字別；(3) **命中件繞過機關與所有篩選並置頂**，指名一件時它
  不該因為視圖停在行憲前就消失；其餘關鍵字結果照舊接在後面，精準是多給一件、不是換掉原搜尋。
  UI：placeholder 維持短句（寫法塞進去會拉成一長條淺字），字號寫法收在搜尋框右側一顆 **info
  圓圈鈕**（lucide `Info`；元件 `SyntaxHint` 在 `IndexView.jsx` 上方）：點開列六種寫法，
  **每列本身可點＝說明與捷徑同一個東西**；點別處或 Esc 收合，`aria-label="字號怎麼打"`＋
  `aria-expanded`。中間試過常駐範例鈕，佔掉搜尋框寬度、使用者要求改成圓圈鈕。命中提示壓成
  `字號命中 X` 一個短標籤＋tooltip，否則會把匯出鈕擠掉一行。
  **注意**：`scripts/font-chars.mjs` 把 `HANDOFF.md` 也當字型來源掃（L15），所以本檔正文
  **不要打 U+24D8 那個圈 i 字元**——寫一次就會把它塞進出貨的 webfont 子集，而網站上根本不顯示它。
  **固定檢查**：`npm run validate:cases`（`scripts/validate-case-query.mjs`，已掛進 `npm run build`
  成第五道閘門），19 個寫法命中正確＋5 個非字號正確略過。**負向測試做過**：拿掉全形正規化、
  讓裸數字當字號，兩次都當場失敗並指名項目；還原回綠。**這支檢查第一次跑就抓出 `113-1` 的
  憲暫裁歧義**——原本會回兩件。Playwright 實跑七個查詢＋範例鈕＋行憲前視圖下搜 `#88` 全過，
  零 console error。（`caseQuery.js` 裡一條「院解要排在院字前面否則會解錯」的註解已刪除：
  正則錨定到結尾，回溯會自己救回來，順序其實不影響——那條註解在說一件不成立的事。）

- 2026-07-11 三個 UX／驚喜互動功能（frontend-only，**DONE**，零資料 repo 改動——只
  重新輸出既有已同步欄位）。統一機制：新增 `?doc=字號` 深連結浮層 `DocSpotlight`
  （`fixed inset-0 z-40`，主體直接重用 `CaseCard`，故列出該案**全部**大法官意見書；
  ESC／背板／關閉鈕清 `doc` 參數；`overflow:hidden` 鎖背景捲動）。三處消費它：
  (1) **隨機挑件**——索引工具列尾端加 `隨機一則`（`pickRandomDoc`）＋ `CalendarClock`
  icon-only 同日鈕（`pickOnThisDay`，與今天同月日者隨機取一、無則環形最近；helper 在
  L84 附近，池＝有 ISO 日期者 `datedDocs`，跨行憲前後）。**克制原則：不用 emoji、
  不寫「歷史上的今天」字樣**——同日只用小 `CalendarClock` 圖示。(2) **意見書預覽**——
  `JusticeDetail` 意見書列與 participationOnly chips 的字號從外連官網改成 `onOpenDoc`
  開浮層（滿足「看到其他大法官有無意見書」）；浮層內 CaseCard 仍提供官方頁連結，資訊不失。
  (3) 浮層底欄 `在索引中檢視` → `?q=字號`（`IndexView` 新增 `initialQ` prop，`useEffect`
  同步預搜）。**篩選列滾動自動收合**：新 `useHideOnScrollDown` hook（rAF 節流），套在
  `IndexView` 那條 `sticky top-[49px]` 工具列上（往下捲 `-translate-y-full` 藏、往上捲顯示）；
  **只套索引頁這條**，未動 `TenureView`/`GraphView` 的 sticky 列。**關鍵修正（使用者回退
  一版）**：初版用固定 `scrollY>150` 門檻決定收合，但本頁 header 高（工具列自然位 ~313px），
  於是 scrollY 150–313 時工具列**還在正常流內**，transform 上移會留下它原本佔的版面高度＝一大塊
  空白（nav 與首張卡片間）。正解＝**只在列真正「卡住」(sticky pin) 後才收**：列前放一個 0 高
  標記元素（`useRef`），`標記.getBoundingClientRect().top ≤ 49` 才代表已 pin、其流內空間已捲
  離、此時上移只露出底下滾動的卡片、不留白。**這條「貼齊後才動」的前提至今仍成立**，其餘的
  兩態收合已於 2026-07-20 換成捲動連動位移（見下）。（Playwright
  G1–G5 驗證：未卡住不收、卡住往下捲收、收合時首卡貼齊 nav 無空白、往上捲還原）。新 import
  `Shuffle`/`X`/`useRef`。注意字型陷阱：U+86CB（egg 字，曾用於「easter-egg」的中譯詞）不在子集，
  `validate:fonts` 連註解都掃，故程式碼註解一律避開該字（已改用「隨機挑件」措辭）——本檔亦同，
  只以 codepoint 指涉。Playwright 實機 17 檢全過、console 無錯、`npm run build` 全綠。
  浮層頂欄設計定案（使用者退回一版）：**不放 provenance 圖示**（Shuffle 交叉圖示配日期被讀成
  無意義符號）、不放孤零零的日期（卡片本身已顯示日期），只留「案件預覽」eyebrow ＋ 關閉鈕。
  面板寬度 `w-full max-w-4xl`（自適應視窗、非寫死 px；實測 896→608 隨視窗縮）。
- 2026-07-11（同批續）**案件↔大法官雙向聯動**（frontend-only，**DONE**）。新 `JusticeRef`
  元件（L~150，仿 `CaseRef`）：`CaseCard` 主筆／參與大法官、`OpinionLine` 意見書作者
  （提出／加入）姓名，凡在冊（`justiceByName`）者變活連結——點擊 `setParams({tab:'justices',
  j:名})` 進個人頁（在浮層內點會一併關浮層，因換掉整組 param 含 `doc`）；hover 掀迷你浮窗
  （屆次／任期・提名總統・意見書數＋「開啟大法官主頁 →」，Tailwind 具名群組 `group/j` 純
  CSS，浮窗本身亦可點）；不在冊姓名退回純文字。方向與 Feature C（大法官頁→案件浮層）相反，
  兩向合一即 case↔justice 全打通（研究站超連結感）。Playwright E1–E7 全過、H1–H7 全過、
  console 無錯、build 全綠。
- 2026-07-11（同批續，一輪使用者密集回饋）**前端多項修＋兩則資料 repo 修**（DONE）：
  前端（`ConstitutionalCourt.jsx`）：(1) 浮層頂欄改一體式右上角圓角關閉鈕（移除尖角橫條、
  移除孤零日期；底欄另備關閉）；(2) **分頁切換 `window.scrollTo(0,0)`**（effect deps＝
  `[active, justiceName]`，不含 focusDoc）——修「索引捲到底點大法官、新頁也停在底」的捲動聯動；
  (3) 理由書全域「預設展開/收合」鈕改用 effect 同步 `showReason`，即時驅動**所有已載卡片**
  （原只影響新卡）；(4) **無限捲動**取代「顯示更多」：`INDEX_PAGE=40` 初始／重置、
  底部標記元素＋IntersectionObserver（rootMargin 800px 預取，deps 含 limit 連續補到底）；
  (5) 理由書展開區塊 `onDoubleClick` 收合；(6) 逐人統計頁尾統計基礎母數 7228→行憲後 874
  （行憲前無大法官具名意見書、不計入）；(7) `NomineeDossiers` 從通用 `CaseCard` 移到
  `Case1Analysis`（114憲判1 專屬分頁）——被提名人簡歷不該出現在每次案件預覽；(8) 卡片加
  **審判長**（僅憲判 60 件、弱化樣式、`JusticeRef` 可點）——研究判斷：審判長／主席＝主持評議
  之院長、程序性、資訊量低，故只憲判掛、釋字主席 813 件全為院長不掛（主筆才是實質作者）；
  (9) 逐人統計表頭語意換行（提出／意見書 兩行、非 4+3+1 醜拆）＋姓名／意見書類型 nowrap＋
  縮長條欄。**資料 repo**（`../constitutional-court-research-data`，投影層 build-app-json，
  原樣層不動）：(a) 官方文字勘誤層 `data/materials/官方文字勘誤.json`——釋字562 解釋文民國年碼
  是官方自訂字型 PUA 字元 U+E8C7（肉眼空白），依理由書＋官方連結還原「臺（77）內地字」；
  (b) `stripBenchRoster` 剔憲判理由書尾端合議庭署名列（60 件，已結構化在 參與/審判長 欄）。
  已 app-json→validate→sync→canvas build。全部 Playwright 實機驗證（本輪 5+5+14 檢）、console 無錯。
- 2026-07-11 NFKC 標點污染修復（資料 repo）：意見書 1533 篇＋釋字 813 件欄位的全形標點曾被管線
  NFKC 打成半形，已改 NFC 全量復原（詳資料 repo LOG 同日條）；資料層正規化政策＝落地一律 NFC
  （`lib.mjs normalizeText()`），validate 加半形標點固定檢查（主欄位 ≤2.5%／意見書 ≤1.0%）。
  本 repo 隨動：快照三檔重 sync、字型子集 rebuild＋exceptions 補小形標點 ﹐﹔﹖ 三字位、build 綠。
- Imports `src/data/constitutionalCourt.json` (~5.4MB since M5 Phase B;
  行憲前 rows are lean catalog previews, not full text) plus a lazy
  companion `constitutionalCourt-pre1947-fulltext.json` (~2.4MB,
  dynamic-imported on demand — see M5 below). Both are copied snapshots
  owned by the sibling repo `../constitutional-court-research-data`
  (GitHub mt019). Update flow: in that repo run `npm run update`
  (incremental crawl of cons.judicial.gov.tw) → `npm run sync` (copies
  both files) → here rebuild font subsets if new glyphs appeared
  (`node scripts/rebuild-font-subsets.mjs`) → `npm run build`.
- Seven tabs: 案件索引 (filters + full-text cards + CSV/JSON/BibTeX/
  引註/manifest export), 案件時間軸, 大法官, 任期時間軸 (tenure
  gantt), 意見書圖譜 (SVG circular co-sign network, no chart lib),
  沿革 (`HistoryView`, see the 2026-07-07 沿革 entry below), 資料說明.
- **2026-07-08 M5 Phase B — 行憲前司法解釋 (6,354 件)**: 大理院統字 /
  最高法院解字 / 司法院院字·院解字 harvested from 維基文庫 into the
  same `文件` collection, distinguished by a new `機關` dimension
  (大理院/最高法院/司法院/大法官/憲法法庭). 索引 gained a prominent top
  **segmented control** (`SegControl`): 行憲後 / 行憲前 / 全部, default
  行憲後 (drives the `機關` state; sub-dropdown for the three pre-1948
  institutions appears only under 行憲前). When viewing 行憲前 the
  大法官-era filters (類型/主題/審查基準) are hidden. Header stat
  「大法官解釋」 now reads `統計.機關.大法官` (813) — NOT `統計.解釋`
  (which is 7167, era-spanning); 行憲前 is a separate labelled line.
  Sort uses `sortKey` (行憲前 by 系列+號次 since 統字 mostly lack dates,
  else by 日期) — do not sort 行憲前 by date. 行憲前 full text lives in
  the lazy `-pre1947-fulltext.json`; `CaseCard` dynamic-imports it and
  **auto-expands** for 行憲前 cards (one shared fetch, cached). 沿革
  stage cards deep-link to `?機關=…`. TimelineView / TopicHeatmaps skip
  `d.系列` rows. Fonts: full classical corpus expanded the Huiwen subset;
  27 source-absent glyphs are in `font-coverage-exceptions.txt`. Data
  design: research-data repo `docs/{司法解釋沿革設計,行憲前來源探勘,
  data-contract}.md`.
- 2026-07-06 update: opinion parsing in the data repo was overhauled
  (抄本 bundled-PDF filenames expanded into per-opinion records and
  deduped against standalone PDFs; compound types normalized; names
  joined by 及/與/分別 no longer dropped). New snapshot fields the page
  now consumes: `子主題` (tax-law subtopics; topic select is
  two-level with `└` indented entries), `審查基準` (review-standard
  machine tag, new filter + card badge), `參與大法官`/`審判長`
  (judgments/rulings only — 釋字 pages have no roster; needs the
  justices-roster backfill), `收於抄本` (opinion only exists inside a
  bundled 抄本 PDF). Timeline tab gained two hand-rolled SVG heatmaps
  (主題×年代 5-year bins, 主題×審查結論 matrix) using a single-hue
  plum sequential ramp — magnitude encoding, not categorical, so the
  categorical palette note below doesn't apply to them. Rule docs +
  how-to-rerun live in the data repo:
  `docs/意見書解析與標籤規則.md`.
- 2026-07-07 update: all tabs + the new per-justice page live on URL
  query params (`?tab=…&j=姓名`) via `useSearchParams` — deep-linkable
  and back-button friendly. Justice detail page assembles opinions/
  participation by scanning the snapshot client-side and offers
  per-justice exports (citation list / BibTeX / fetch-batch manifest).
  Tenure gantt gained president-era background bands, a `按提名總統`
  color mode (8-color palette validated; CVD sits in the 8–12 warn
  band — the bands + tooltip are the required secondary encoding), and
  a 45° hatch overlay marking female justices (gender is
  wiki-machine-tagged in the data repo, 20 justices still 待確認 and
  unmarked). Footer-menu pollution in the data repo's 相關法令 field
  was fixed (74 cases lost a spurious 選舉與政黨 topic; snapshot
  resynced).
- 2026-07-07 (later): interpretation-era participation is now REAL
  data — the data repo parses the justice signature roster embedded at
  the tail of each 解釋's 理由書/解釋文 (813/813 coverage; recused
  justices are absent from the roster, so this is per-case evidence,
  not tenure inference). Snapshot cases carry `參與大法官`, `主席`,
  `名單來源`; the justices array carries split `參與解釋`/`參與判決`
  counts. The justice detail page merged its two case sections into one
  「案件參與」 section: full rows for cases with own opinions (now with
  主筆/主席 badges and `加入註記` partial-join notes shown verbatim from
  the filename, e.g. 呂太郎加入第四部分), plus a compact chip cloud for
  participation-only cases (＊=主筆, †=主席). The overview table gained
  a 參與解釋 column. 2026-07-07 **RESOLVED**: the 12 tenure-vs-signature
  conflicts were researched (11 confirmed + 1 partial: 黃亮, third-term
  end date unfindable, provisionally 屆次推定 1976-09), written into the
  data repo's `justices-overrides.json` as full multi-segment tenures,
  and the cross-check flag dropped **684→0 出界**. Full sourced findings:
  data repo `data/materials/參與解釋查核結果.md`. Structural finding worth
  reusing: 5 of them (田炯錦/戴炎輝/城仲模/謝在全/賴英照) kept signing
  interpretations *after* their 大法官 title ended because they'd moved
  up to 院長/副院長, who by 司法院大法官會議法 §3 chairs the conference —
  so their `任期` now carries `司法院院長`/`司法院副院長` segments after the
  大法官 segment, and the frontend's `formatTenureRange` prefixes the
  non-大法官 role (verified rendering on 戴炎輝's page). 黃正銘's third-term
  end was also corrected in passing (1976 → 1972-07-04 呈請退職).
- 2026-07-10 審查結論**類型學 6 軸**前端上線 (frontend-only, **DONE**):
  快照每件的 `結論類型` 欄（6 軸 A–F，資料 repo `data/materials/審查結論類型學.json`
  編碼本＋`data/processed/審查結論類型.json` 逐件貼標）之前完全沒被前端消費；此次接上。
  範圍界線很重要：`結論類型` 目前**只涵蓋粗軸判不出的「待人工」殘餘 196 件**（全 agent
  雙盲覆核，且全部 `審查結論.結論 === 其他/待人工`）；已由粗軸分好的 657 件行憲後案件**沒有**
  細軸值。`ConstitutionalCourt.jsx` 改動：(1) 常數 `TYPO_AXES`/`TYPO_LABEL`/`A_ORDER`/
  `A_TONE`＋`resolveA(d)`（agent 細軸優先，否則 `COARSE_TO_A` 把粗軸換算成 A 軸）＋
  `typoValues(d)`（~L139）；(2) `CaseCard` 卡片：agent 覆核件的 A-badge **取代**原本無用的
  「結論待人工判讀」badge，並在主題列下方加一排 B/C/D/E/F chip＋provenance（如「純解釋」＋
  「C 審判權/管轄」「F 統一解釋」）；(3) `IndexView` 加**可摺疊的 6 軸篩選面板**（6 個 Select，
  只在 `!isPre` 顯示，作用於 196 件，選任一軸值即只列已類型化件；header 顯示「已類型化 N 件」）；
  (4) `TopicHeatmaps` 加「主題×處分模式（A 軸）」矩陣——用 `resolveA` 把粗軸 657 件橋接進 A 軸
  分佈、agent 158 件覆蓋（有主題者才計；圖說標明 158 agent/562 bridge，並註記 A 為單選主處分、
  複合「部分違憲部分合憲」結構在 B-B6/E-E6 多值軸、多數違憲案未套細軸故矩陣尚看不到部分結構）；
  (5) `AboutView` 加類型學說明節。全在 canvas repo、零資料重跑、`resolveA` 純函式可逆。
  build（fonts/tokens/colors/vite）全綠、Playwright 實機驗證（篩選 A=純解釋→119 件、釋字772
  卡片 A-badge＋chip、兩矩陣渲染）。
- 2026-07-10（同日續）**兩個 follow-up 完成**（見 TODO）：① draft-3 最後 21 件已 `app-json→sync`（196→217）。
  ② 行憲後 309 件違憲* 雙盲貼標（每輪 opus×2 pass、gate `--agree`＝一致即採納，使用者核可；資料 repo
  `typology-tag-gate.mjs` 加旗標）：五輪採納 **286 件**、23 件真分歧進人工佇列（資料 repo `docs/類型學-人工佇列.md`）。
  來源 `審查結論類型.json` 217→**503**（500 agent 覆核：407 高／88 中／5 低），validate 全過。348 件非違憲件依
  使用者裁示跳過。複合結構已現形（釋775：B-B1＋B-B3＋B-B5＋B-B6，卡片 chip 全列，Playwright 驗證）。
  注意：**canvas 快照經完整 `app-json→sync` 正規化到 503**（含 `結論類型` 6 軸）。（先前一版曾用 overlay，已被完整 build 取代。）曾誤判有並行 Codex
  在資料 repo 跑立場表計量分析 W2（`build-app-json.mjs`／`analyze-lct`／`立場表投票.json` 未 commit），跑完整
  `app-json→sync` 會把其半成品推上前端。**Codex commit W2 後**，補跑一次乾淨 `app-json→sync` 即正規化快照
  （結果同 503，且格式回正——目前 overlay 為 minified）。資料 repo 的 `審查結論類型.json`／gate 旗標／held／
  人工佇列 doc 皆 uncommitted，與 Codex 的 W2 在同一工作樹（各自檔案不重疊，可 selective add 分別 commit）。
- 2026-07-11 類型學分類器**信度／效度／穩健度評估**（完整版：資料 repo `engineering/LOG.md` 同日條目；
  摘要：資料 repo `docs/類型學-運維.md`）。要點：503 件雙 pass 全一致、真分歧 4% 隔離人工佇列，但兩
  pass 同為 opus——一致率是模型自我再現性、非人類編碼員 kappa，方法論須揭露；校準 92%＋主文逐字引文錨，
  但輸入不含理由書 → D/E 軸系統性偏漏、多值軸交集偏保守；`--agree` 收入 18% 中/低信心件，下游分析可用
  高信心子集（410 件）做穩健性檢查。補強首選＝人工抽驗 30–50 件算 human-agent kappa。同日開跑
  **348 件非違憲行憲後件補標**（07-10 曾裁示跳過，07-11 CHECKPOINT 改列為下一步，以新裁示為準；
  清單＝資料 repo `data/materials/貼標-剩餘清單.json`，排除人工佇列 23 件，~6 輪 opus×2＋gate `--agree`）。
- 2026-07-11 大法官提名文件＋被提名人（frontend；資料本體在資料 repo）：個人頁基本資料列新增
  自傳／提名簡歷／學思歷程報告連結（快照 `大法官[].提名文件`——108/112 批 8 位現任＋湯德宗 100 年報告）；
  114憲判1 卡片掛 `NomineeDossiers` 區塊（快照頂層 `被提名人批次`，113/114 落選 14 人，掛載案件由
  資料 `相關案件` 欄驅動、JSX 不寫死字號）。`/api/pdf` 白名單擴總統府 File/Doc＋web.archive.org id_
  回放（皆 attachment，預覽須代理改 inline）；`vercel.json` regions=hnd1＋edge 快取 7 天（PDF 預覽提速，
  部署後生效）。來源版圖與未開工線索（立法院《同意權實錄》逐屆合訂本、自存文件撿漏、SPN 備援機制）：
  資料 repo `docs/提名文件來源探勘.md`。
- 2026-07-13 提名總統逐批查證上前端＋PDF 預覽漏接修復（frontend；資料本體與查證層在資料 repo）。
  **提名總統**：資料層把原「依就任日推定」升為逐批查證核定（查證層 `data/materials/justices-提名批次.json`、
  `提名總統標註` 全站零推定），前端只替換 `大法官` 節點（不動在途問題意識/立場表節點，不跑全量 sync）。
  個人頁基本資料列的「提名」改讀 `各段提名總統`：多段任期者列出各段不同提名人（許宗力＝陳水扁、蔡英文），
  單段列 scalar；拿掉永不觸發的「（推定）」字尾；title 帶 `提名批次`。TenureView 方法說明改「逐批查證核定」
  措辭（原「依各段任期起始日反查總統任期推定」已不準）。時間軸「按提名總統」著色仍讀 scalar `提名總統`
  （生涯首任），與個人頁多段顯示各司其職、皆正確。**PDF 預覽修復**：`pdfHref(url,pdfMode)` 是全站 PDF 走
  `/api/pdf` 代理預覽（vs 直連下載）的唯一入口，但兩處漏接原樣直連＝無視預覽開關強制下載——大法官個人頁
  意見書清單（`op.下載網址` 直用）與意見書圖譜 `PairDetail`（`d.下載網址` 直用），已補走 `pdfHref`；
  `PairDetail` 原無 `pdfMode`，比照其他葉組件直接 `usePref('pdfMode','preview')` 讀同一偏好。1534 個意見書
  PDF 全在代理白名單（`cons.judicial.gov.tw/download`）。預設 preview（新分頁預覽），符合使用者要求。
- 2026-07-07 審查結論 typology (data-side + frontend + sync **DONE**):
  the data repo reworked `classifyOutcome` so early 釋字 that aren't
  constitutionality review get real categories. `審查結論.結論` now has,
  besides 違憲*/合憲, three NEW values: `法令解釋` (83, statutory/unified
  interpretation), `補充前解釋` (30), `變更前解釋` (10). 待人工 dropped
  434→217; 違憲* and existing 合憲 are byte-unchanged. Rules + 16-case
  sample table: data repo `docs/審查結論分類規則.md`. Frontend
  (`ConstitutionalCourt.jsx`): (1) `OUTCOME_TONE` map (~L84) — new `teal`
  badge tone for all three (ink reuses the user-approved IntlTaxOps
  `--teal: #4c7971`, new pale bg `--cc-badge-teal-bg: #e3edeb` added to
  `CC_VARS` ~L53 and the `Badge` colors map ~L119 — existing blue/plum
  were already spoken for by 主題/類型 badges on the same card row, so
  reusing either would've collided); (2) 結論 filter `Select` (~L435) —
  kept the three new categories as **individual** options (precise
  browsing) per user's call; (3) 主題×審查結論 matrix (~L615-625) —
  **merged** the three into one `非合憲性審查` column (user's call: keeps
  the 違憲-hotspot read undiluted; filter vs. matrix deliberately treated
  differently). Synced (`npm run validate` → `npm run sync` in the data
  repo → `npm run build` here) and Playwright-verified (badge tone/label
  on 釋字第63號/28號/51號, filter option counts 83/30/10 match, matrix
  header row shows the 5 columns with real per-topic numbers, no console
  errors). 審查基準 (未明示 228＋多重 16) remains deliberately untouched
  for human 覆核 (auto-picking a scrutiny tier = deciding the case's
  standard of review; too risky). 審查結論 override layer NOW built
  (2026-07-07, data repo): `data/materials/審查結論-overrides.json` (keyed
  by 字號) is the authoritative source `build-app-json.mjs`'s `outcomeFor()`
  consults before falling back to `classifyOutcome`, so a 覆核 verdict now
  survives every rebuild instead of being clobbered. Shared by 人工 and
  agent review — each entry self-reports `標註方式` (人工核定/agent覆核) plus
  `依據`/`來源`; `validate-processed.mjs` guards it (unknown 字號, illegal
  結論/標註方式 all fail loudly, since a typo'd 字號 would silently no-op).
  Ships empty; filling the 217 待人工 cases is a later agent-analysis pass
  writing into this same file (propose→confirm staging recommended — see
  the data repo's `docs/審查結論分類規則.md`「覆核 override 層」/「尚缺」).
- 2026-07-07 沿革 tab (landed, `62691c4`): 7th tab `?tab=history`
  (`HistoryView`) — two stacked axes: the four-stage
  interpretation-organ timeline (大理院統字 → 最高法院解字 →
  司法院院字/院解字 → 大法官釋字 → 憲法法庭憲判, proportional bars
  from 1913) under a 憲政時期 band (北京政府 → 訓政 → 行憲, with 制憲
  as an embedded marker — TenureView-band style), plus four organ
  cards and four period cards, all default-expanded. 憲判 count binds
  to `data.統計` so it tracks the snapshot. Card copy is
  user-approved final text (data repo `docs/沿革摘要草稿.md`; period
  years verified in `docs/沿革素材查證.md` §E) — **don't reword it
  without user sign-off**. Spec: data repo `docs/司法解釋沿革設計.md`
  (incl. the「Phase A 增補」dual-axis section). Implemented directly
  by Claude Code at the user's instruction; the Codex handoff draft
  (`~/.claude/plans/constcourt-provenance-ui-codex.md`) is superseded.
  Build/lint/Playwright (14 checks) green. Phase B (pre-1948
  interpretations catalog) is still scoping-only — see the data repo
  design doc before touching it.
- Site-wide font change (2026-07-07, settled after one same-day
  reversal): `--font-display` is Radio Newsman (Latin) + Huiwen
  Mincho (CJK — replacing GenWanMin2 so headings and body share one
  Mincho). Erikas Farbband was tried in the display slot and reverted:
  its ink-ribbon texture reads as noise on the inline digits these
  CJK headings are full of; it stays eyebrow-only. GenWanMin2 is no
  longer referenced by any token; its `@font-face` block and subset
  file are kept for now — cleanup candidate. Subset char extraction
  now includes punctuation and lives in `scripts/font-chars.mjs`,
  shared by rebuild + validate so the two can't drift apart again.
- Downloads are two-stage by design: the page exports a manifest of
  official URLs; actual batch download happens in the data repo via
  `npm run fetch-batch -- --manifest <file>` (or `--tag 稅法`). The
  frontend never proxies or hosts official files.
- Chart categorical palette — iterated several times on 2026-07-07,
  final state is a **site-wide color-philosophy rule** now documented in
  `docs/DESIGN.md` (色票庫 → 色彩哲學). The short version: every
  chart/identity color must be a real hex pulled from
  `src/styles/palettes.js` (not formula-generated), and no color may sit
  in OKLCH hue 50°–140° (mustard/olive — computable, not taste). **Two
  hard lessons that turned into rules:** (1) the hex-literal grep audit
  MISSED the 沿革 `大理院` timeline bar because it referenced its color
  via `var(--cc-badge-gold-ink)`, not a hex literal — a full audit must
  **resolve `var(--cc-*)` to CC_VARS hex** before checking hue (script:
  scratchpad `scan-cc.mjs`). (2) The C≥0.08 chroma cutoff was too
  lenient for **large fills** — `#8a6d3b` (H79.7, C0.077) and `#b08060`
  (H54.6, C0.075) both slipped under it but read as ugly olive/tan as
  big bars; for anything larger than a small badge, treat hue 50°–140°
  as suspect down to **C≥0.04**. Current `TENURE_BG_COLOR` /
  `TENURE_ABROAD_COLOR` (per user directive "深藍深綠消失、紫色降飽和")
  are a muted warm-only 4-class set — 學者 rose `#8f6071`, 法官 muted
  purple `#6f5080`, 律師 mauve `#9a7f96`, 檢察官 brick `#a44a4a`, gray for
  其他/待確認 — all in the 290°–360°/0°–50° warm arc, no blue, no green,
  distinguished mainly by lightness + text labels (CVD warn-band is
  accepted because legend + hover always show the category name).
  `PRES_COLOR` 嚴家淦/蔣經國 are off the old gold/olive to
  `#a44a4a`/`#b3452e`; 沿革 大理院 bar is now `#7d4256` deep wine.
  Two small **semantic status badge inks deliberately kept** despite
  sitting in-band: `--cc-badge-gold-ink #8a6d3b` (違憲定期失效 amber
  warning) and `--cc-badge-green-ink #566d50` (合憲 green) — small inline
  chrome with universally-read status meaning (green=合憲, amber=warning),
  the philosophy's reserved-status exception; revisit only if the user
  objects. Don't swap any chart color without re-running
  `validate_palette.js` *and* the hue-50–140 check.
- `scripts/validate-font-coverage.mjs` walks `src/` with pure node
  (no ripgrep): this machine has no real `rg` binary — the shell `rg`
  is Claude Code's wrapper, invisible to node's spawn.
- Early 釋字 (約 431 號以前) opinions are embedded in the official page body,
  not PDFs; the snapshot marks them `內嵌: true` and both CaseCard and
  the justice detail page already render them (link label 官方頁正文/
  官方頁). A 2026-07-07 screenshot showing 王澤鑑 with 4 opinions
  predates this fix — current data has 6 (436/437 are 內嵌).
- 2026-07-07 (UI batch, triaged from one long user feedback message —
  full triage + ready-to-paste handoff prompts for the deferred items
  live in `~/.claude/plans/ui-sleepy-pebble.md`): PaletteLab's swatch
  sidebar is now `lg:sticky` + independently `overflow-y-auto` so the
  live preview stays put while comparing swatches. Site-wide paper
  texture (`--paper-texture` var, set by `applySiteTexture`) was wired
  correctly all along but every page's own opaque `min-h-screen`
  wrapper painted over `body`'s texture layer — added a shared
  `.paper-texture` class (index.css) carrying the same
  background-image/-size, applied to `PageShell.jsx`, `App.jsx`
  (home + Suspense fallback), and every page with its own root
  background (`ConstitutionalCourt`, `ECFAResearch`,
  `AirPollutionFee`, `ManusMetaAcquisition`, `GovernmentDebt`,
  `TaipeiFilmFestival`, `TranslationAtlas`). `FuelTaxBreakdown`'s price
  slider had an invisible thumb: `appearance-none` strips WebKit's
  native thumb entirely and `accent-color` does nothing once
  `appearance` is removed — fixed with explicit
  `[&::-webkit-slider-thumb]`/`[&::-moz-range-thumb]` Tailwind
  arbitrary-variant rules. In `ConstitutionalCourt.jsx`: tenure date
  ranges now use a shared `formatTenureRange()` with a spaced en dash
  (`1948-07 – 1949-03`) instead of the bare-dash-next-to-bare-dash
  original; president bands show `（提名 N 位）` for wide-enough bands
  (`PRES_NOM_COUNT`, derived from each justice's `提名總統`); the
  tenure gantt gained an asc/desc row-order toggle (`最早在上`/
  `最新在上`); 案件索引's 類型/結論/審查基準 selects gained `（n）`
  counts (主題 already had them); a date sort toggle (`新→舊`/`舊→新`)
  was added (previously no `.sort()` existed at all — always raw
  array order); 主題 filter split its fake `└`-indented sub-category
  rows into a second, conditionally-shown 細分 select (scales cleanly
  whenever a category besides 稅法 grows subtopics, since it's
  computed by co-occurrence with `d.主題`, not hardcoded to 稅法); the
  ~200 docs whose 主文 concatenates numbered clauses ("1 … 2 … 3 …")
  with a bare space (no real `\n`, so `whitespace-pre-line` had
  nothing to preserve) now split into separate `<p>` blocks at
  `。<space>(\d+)<space>` boundaries — user explicitly chose plain
  paragraph breaks over any added marker glyph; a small 相關外部連結
  section (official `cons.judicial.gov.tw` link only) was added to
  AboutView. Also discovered while implementing: 「被引用最多的解釋」
  ranking (TimelineView, from the `引用網絡` snapshot field, 1791
  citation edges) already existed and was already wired up — it was
  *not* missing data as initially assumed; only the "why is this one
  so cited" explanation was missing. Added a `WHY_CITED` lookup with
  exactly two entries this session is confident about without
  guessing (443 層級化法律保留, 371 法官聲請釋憲) — deliberately left
  the rest blank rather than invent doctrine attributions; expanding
  it is queued in `TODO.md`. All of the above verified with a
  Playwright script driven against a local dev server (screenshots +
  `console --errors` check, zero console errors) before being called
  done — see the plan file for the verification transcript if useful.
  Update (same session): the tenure-timeline categorical palette was
  redrawn twice more that day — first to rose/steel-blue/moss/ochre,
  then (final) to the current rose/indigo/teal/copper after the
  site-wide color-philosophy audit flagged the steel-blue/moss/ochre
  set's green and ochre as still-muddy; the ochre/copper cross-
  contamination fix and the `PRES_COLOR` 嚴家淦/蔣經國 gold-olive swap
  both belong to that same audit. See the color-philosophy bullet above
  and `docs/DESIGN.md` for the final rule; the two swatches still sitting
  in the CVD 8–12 warn / sub-3:1 contrast bands are legal only because
  the legend + hover tooltip always show the category name as text,
  never color alone. Also added three deeper paper-
  texture options to `palettes.js` (`fiber-deep`, `chain-laid`,
  `cold-press` — each layers two noise/line frequencies plus, for
  `fiber-deep`, a faint edge shadow) alongside the original four
  rather than replacing them; computed-style-checked to confirm all
  layers actually render (screenshots alone don't show much
  difference at normal zoom, by design — these stay in the same
  2–4%-alpha "near-white reading surface" register as the originals).
  Both changes need your own eyes in `/palettelab` and the tenure tab
  before being treated as settled, same as any other palette pick.
  Still open (not touched this session, by design — see the plan
  file's Group C): the GraphView circular layout, the citation "why"
  backlog beyond 443/371, and the large-scale 待人工 classification
  backlog are all written up as TODO.md items with ready-to-paste
  handoff prompts in the plan file above.
- WHY_CITED expansion (2026-07-07, `~/.claude/plans/lovely-tumbling-star.md`):
  the citation "why" backlog noted above is now cleared for the visible
  list. `WHY_CITED` grew from 2 → 15 entries, covering the full
  `cited.slice(0, 15)` most-cited ranking. Each new doctrinal one-liner
  was web-verified against the official 憲法法庭 / 全國法規資料庫 pages and
  secondary summaries (極憲焦點, 都更研究基金會) — not written from memory;
  source URLs are in the plan file. Notable resolutions during research:
  釋字682 is 應考試權 + 判斷餘地低密度審查; 709 is the court's self-described
  first strengthening of 正當行政程序; 594 earned a 法律明確性 entry rather
  than staying blank. Ranks deeper than 15 stay blank by design (the list
  only renders 15). Frontend-only, hardcoded in `ConstitutionalCourt.jsx`
  per existing convention — does not flow through the data-repo sync.
- 屆次/任期 convergence (landed 2026-07-07): the justice detail page
  no longer renders two duplicated spans. Single 屆次 line is the
  base; `任期來源 === '屆次推定'` (64 justices, 任期 mechanically
  derived from the 屆次 label) appends muted 「任期依屆次推定」
  instead of a 任期 span — the caveat stays visible because 推定 can
  be wrong (張式彝 died in office 1948-11 but 推定 says 1958-09; data
  fix queued in the data repo's 傳記查核 batch). `簡歷頁`/`人工核定`
  justices keep the separate 任期 detail (multi-segment, 辭職,
  卒於任內, 連任; 人工核定 tagged); `現任大法官` shows the real
  start date–現任. Verified via Playwright against 黃虹霞/翁岳生/
  張式彝/楊惠欽.
- 問題意識/research page — 分層附錄 appendix (landed 2026-07-18):
  a collapsible page-foot beat (`類型: '分層附錄'`) in `ResearchProblem.jsx`
  explains the two-layer 投票層/協作層 (Tier A/B) distinction in reader
  language. Rendered as `<details>` **defaulting collapsed** — a deliberate
  exception to the accordion-default-open rule (it is a long methodology
  aside, not a content card), so don't "fix" it to default-open. Content
  flows from data repo `data/materials/問題意識-敘事.json` → analyze-research
  → app-json → sync; canvas only adds the renderer. No "Tier A/B" engineering
  jargon on the page — reader words only (the Tier A/B definition lives in the
  data repo report `docs/立場表計量-發現報告.md` 分層架構 section).

### `PaletteLab` (品味測驗 landed 2026-07-07, v3 architecture)

New second mode on the existing single-page palette browser: a
top-of-page toggle (`試穿色票` / `品味測驗`) switches between the
original browse UI and `TasteQuiz`, both defined in `PaletteLab.jsx`
(no new file). Motivation: repeated rounds of manually guessing
categorical chart colors for `ConstitutionalCourt`'s TenureView legend
(see that section above) all missed — the user pushed back that
isolated single-swatch taste doesn't predict combination harmony or
how a color reads against different backgrounds. The quiz measures
that directly instead of guessing.

**Went through two failed architectures before landing on the current
one — read this before touching hue generation again.**

- **v1**: swatches generated procedurally from a fixed OKLCH formula
  applied to 10 hue anchors spanning the full 360° wheel, rendered as
  giant solid rectangles. Broke twice: (a) the 50°-140° band (gold →
  olive) reads as muddy/dirty at almost any chroma — a real OKLCH
  property, not taste, and exactly the hue range this site's own
  Morandi/Monet palettes already dodge by crushing chroma near zero;
  (b) giant solid-color panels violate this repo's own rule that color
  is chrome, never a large fill — true regardless of which hue.
- **v2**: dropped the bad hue band (8 anchors left), shrunk every
  swatch to a small badge-scale chip. Still broke: the user pointed
  out the actual `PALETTES` browse view *always* looks fine, but the
  quiz — even fixed — didn't, and asked why. Answer: `PALETTES` values
  are hand-picked by a person; a single formula plugged into different
  hues is not equivalent even when the target hue is "safe," because
  each hue needs its own tuning to read as elegant rather than
  harsh/flat. No uniform formula reproduces that.
- **v3 (current)**: **stopped generating colors.** Every visible hue in
  the quiz is now a real `accent`/`accent2` value pulled live from
  `PALETTES` — never invented. Also adopted a documented "Notion 色彩
  哲學" principle (now in `docs/DESIGN.md` under 色票庫, not just this
  component): color is always a pale-background + saturated-ink *pair*
  (`tagTones(hex)` — `ink` is the real value unchanged, `bg` is the
  only thing still computed, a near-white tint of the same hue, which
  is safe at virtually any hue because muddiness is a moderate/high-
  chroma phenomenon), rendered as small "Aa" tag chips (genuinely
  Notion-tag-shaped, not solid blocks), and **never more than 2 hues
  side by side** — matches `palettes.js`'s own `pop` role doc-comment
  ("一個畫面最多出現一處"), generalized: any 3+ contrasting hues
  shown together reads as a clash even if each hue alone is fine.

**Mechanism** (`hexToOklch`/`oklchToHex` at the top of the file, hand-
rolled, matrices kept in sync with the dataviz skill's
`scripts/validate_palette.js`): `hexToOklch` tags every
`PALETTES` accent/accent2 with its hue/L/C so real colors can be
grouped and scored; `oklchToHex` is used *only* to synthesize the pale
`bg` half of a tag pair, never an `ink`. `REAL_ACCENTS` is the pool
(accent + accent2 across all 18 palettes; `pop` deliberately excluded
— it's a clash color by definition, shouldn't enter routine
comparisons). `HUE_ANCHORS` picks, per each of 8 target hue positions,
whichever real accent in the pool is closest — so "the rose anchor"
is literally some real palette's actual accent hex, not a lookalike.

20 trials, 3 rounds: **hue** (11 — round-robin over 8 anchors + 3
cross pairs), **combination** (5 — for 5 named palettes, "its own
designed accent+accent2 pair" vs. "its accent mismatched with an
unrelated palette's accent," via `HARMONY_SPEC`; always exactly 2 tags
per option, never 3+), **background context** (4 — same real accent
chip on two different real `PALETTES` surface/paper tones, derived
live via `PALETTES.find(...)`, not hardcoded — a `validate:tokens`
bare-hex catch during v1/v2 already forced this). `scoreTaste()`
outputs a hue win-ranking (each entry carries which palette it came
from, via `.from`), a *derived* chroma/lightness lean (v3 dropped the
old dedicated muted-vs-vivid/pale-vs-deep synthetic rounds entirely —
that was still formula generation; instead it diffs the real L/C of
chosen vs. rejected hue-anchors across the hue round, so the lean is
observed from real picks, not tested via synthetic extremes), a
warm/cool lean, a designed-vs-mismatched combination preference, and a
background win-tally. Results screen shows all of it plus "複製摘要"
(`tasteSummaryText()`) — copies a plain-text profile including which
source palette each favorite hue came from, meant to be pasted back to
Claude in chat and saved as project memory (**intentionally not
auto-saved to any memory system** — the harness can't read browser
localStorage). Raw picks also persist to
`localStorage['canvaslab:tastequiz:v3']` (bumped twice already as the
trial structure changed shape — bump again if you change trial count
or meaning, old positional picks silently mean something else
otherwise).

Font-coverage trap worth remembering: `npm run validate:fonts` scans
raw source text across `src/`, `HANDOFF.md`, `TODO.md`, and
`README.md` for CJK glyphs, **comments included**, not just rendered
strings — writing the literal characters for a rejected hue name into
this handoff (to document what got renamed) trips the same check that
fired in the component. Describe by Unicode codepoint instead of
pasting the character if you need to reference a rejected one in prose
anywhere in this repo, not just component files.

Playwright-verified end to end at each architecture revision (final
v3: 20-trial run, tag-pair rendering confirmed visually at all 3 round
types — pale-bg/ink pairs, 2-tag combination groups, chip-on-real-
background — no muddy hues, no 3-way clashes), results math cross-
checked against a deterministic always-pick-left run, `localStorage`
write confirmed, no console errors, `npm run build` (incl.
`validate:fonts`/`validate:tokens`) clean at every revision.

## Canvas home entry （2026-07-27 改為隱藏式：`/`＝門面、`/all`＝索引）

**根 `/` 不再是專案索引，是一個 glitch 門面** `src/components/FrontDoor.jsx`
（在 `App.jsx` 手動路由）。它只有鉛印風的「Phenom」名牌（Radio Newsman，隨機
故障套色錯位，`plum`＋`misty-blue` 兩通道，非霓虹）＋一段 Karl Kraus〈Fernes
Licht〉情詩（德中對照，Huiwen Mincho；德文變音與中文都在現有子集內）。**整頁墨
在紙上、禁任何發光體**（無 radial glow／box-shadow 光暈／游標暖光——試過、被使
用者退回，見 memory `feedback_no_glow_ink_only`）。**隱藏入口**：下方空白處平常
全空，游標靠近才用 `near²` 曲線浮現墨色大寫 `HEREIN`（Radio Newsman，其子集已含
H/E/R/I/N），點下去才進 `/all`。鍵盤 Tab、觸控都到得了。

**專案索引（原本的分組清單）移到 `/all`**（`HomePage` in `App.jsx`，未 lazy，
進站瞬間、無載入畫面）。`routes.mjs` 種子 `['/', '/all']`，兩者都預渲染＋進
sitemap。**動機：藏掉「一站看盡全部專案」的聚合清單**——單一子站照樣各自被
Google 收錄、可單獨分享，但拿到某個子站連結的人把網址砍回根目錄，只會撞到門面、
翻不到全貌。

分組（`PAGE_META.group`，`生活雷達` 現排最前＝每天開的 Brief 在最上）：

- `研究地圖`: long-running research canvases with separated/expandable data layers.
- `法政解析`: legal, fiscal, policy, investment, institutional case breakdowns.
- `即用工具`: directly usable instruments and sound tools.
- `生活雷達`: practical decision/availability monitors.

`/all` 維持精簡索引：細分隔線，無大圓角卡牆、無數字磚。

### 返回鍵導覽政策（2026-07-28 使用者裁定，取代 07-27 版）

**每一頁都要有一條回頭路，落點只有一個地方決定：`src/backNav.js`。**

07-27 的版本把頂層頁的「← Canvas Lab」全部移除，理由是「通往 `/all` 的返回鍵等於把剛
藏起來的目錄洩漏給任何拿到單一站連結的人」。那個顧慮成立，但移除返回鍵是過頭的解法：
執行到一半就變成「有的有、有的沒有、有的回 `/`、有的回 `/all`」四種樣子並存，讀者每進
一頁都要重新猜。07-28 使用者的原話是「其實我是覺得是要有的」。

**現在的解法是換落點，不是拿掉按鈕**：頂層頁的返回鍵回**素首頁 `/`**（那是一張詩的紙，
不是目錄），`/all` 只從素首頁的隱藏入口進得去。洩漏的顧慮因此消失，回頭路也回來了。

- 單一事實來源 `src/backNav.js`：`BACK_NAV_ENABLED`（總開關）、`HOME`（預設落點，
  `label` 空字串＝只畫箭頭不印站名）、`INDEX`（`/all`）、`SITE_HOMES`（主題站例外）、
  `NO_BACK`（`/` 與 `/all` 自己不畫）、`backFor()`／`resolveBack()`。
- **畫出來的實作只有一個**：`src/components/BackLink.jsx`。三個殼（`PageShell`／
  `DashboardLayout`／`SiteHeader`）在抬頭列放它，自己刻版型的頁直接放它。三個殼原本
  各寫一個 `<a>`＝「安靜」有三份定義。
- **安靜**：淡墨 `opacity .7`、滑過去轉深；`HOME` 沒有 label 所以只有一個箭頭。
  「Phenom」不印在每一頁的左上角——那是廣告不是導覽。帶字的只有主題站落點。
- `SiteHeader` 的 `back` 從必填改成選填：配置已經知道每個主題站的首頁，頁面什麼都不說
  也拿得到對的連結，而且總開關關得掉全站（原本靠 `throw` 當強制，現在靠配置）。
- **樂器頁不掛**（`AutoTuner`／`UkuleleTuner`／`VocalTuner`／`ElectricPiano`）：整頁就是
  一台儀器，沒有抬頭列，浮貼一顆會壓在儀表上。退出用瀏覽器上一頁。
- 固定檢查 `npm run validate:shell`（已接進 `verify:policy`）：路由頁沒有回頭路就失敗、
  頁面把 `/` 或 `/all` 寫死當返回鍵就失敗。**免除要具名附理由**，寫在
  `scripts/validate-shell-chrome.mjs` 的 `NO_BACK_PAGES`——不能靠沉默免除，否則下一個
  漏掉返回鍵的頁會混在裡面看不出來。

素首頁往 `/all` 的入口同日再隱一階（`FrontDoor`）：近接顯影半徑 210→96px、不透明度
從 `near²` 改 `near³`，游標要真的停在詩下方那段空白才浮出 `herein`。觸控裝置原本固定
露出 `.42`（等於手機上一直看得見），改成完全不露。**留給自己的兩條路：按 `h`，或在
頁面上長按 600ms**——兩者都只是讓字浮出來，進去仍然要點它。

（分組是 `PAGE_META.group` 的邏輯分組，與 `src/pages/` 是否實體拆子資料夾無關——
見「Declined」。）

全站焦點框政策見「Design system」；字體子集缺字陷阱見「Font system」。

### 收斂成兩條回頭路，眉標接上站首頁（2026-07-29 使用者裁定）

一天之內被糾正三次才收斂：**左上角的箭頭一律回素首頁、不寫站名**（原本內頁會寫成
「← 手記」，於是同一畫面兩個寫著「手記」的東西指向不同地方）；**眉標上的站名回這個站的
首頁**，是內頁唯一一直看得見的回頭路（箭頭平時透明、手機根本沒有 hover），點線底線、
不畫箭頭（使用者：箭頭太醜）；**大標題全站一律不是連結**，`identityHomeFor()` 已刪除。
規則本文寫在 `docs/DESIGN.md`「一頁只有兩條回頭路」。

當天收尾的兩件（同日稍晚做完）：

- **自己刻抬頭列的頁全部接上**（`ConstitutionalCourt`／`ECFAResearch`／`IiasPublications`／
  `InternationalTaxOps`／`GovernmentDebt`／`ManusMetaAcquisition`／`TranslationAtlas`／
  `FiscalEnforcementRisk`／`statistics/TagPage`）。判斷收進
  `src/components/SiteHomeEyebrow.jsx` 一份，頁面只交出字、顏色與圖示；沒有站首頁可回時
  它原樣畫出原本的標籤，所以換過去的當下畫面一模一樣。**這件事本來看不出漏掉**——
  `SITE_HOMES` 登記了、validator 也算得出「這頁該有回站首頁的路」，那顆按鈕卻沒接線，
  只有等該站真的長出內頁才會被讀者按到。`validate:shell` 因此加第五節逐檔擋（沒走殼、
  有 `<h1>` 就必須用 `SiteHomeEyebrow`），免除名單每條附理由；用故意寫壞的案例驗過會失敗。
  `JirsForeignLaw` 是唯一免除的：它的眉標與大標題整塊是「回本頁總覽」的按鈕，`<a>` 不能
  包進 `<button>`，而那個站沒有內頁路由。
- **統計的術語頁與標籤頁回子清單，不是回實驗室門口**。原本各自寫死「← 術語表／← 所有
  標籤」，寫死的落點在 07-29 那輪被全部收掉之後，眉標一律回 `/statisticslab`，少了一層
  精確度。改法是把子清單也登記進 `SITE_HOMES`（前綴長的排前面）：
  `/statistics/glossary/<term>` → 術語表、`/statistics/tags/<tag>` → 所有標籤。這兩份清單是
  `/statisticslab` 的分頁、沒有自己的路由，落點因此帶查詢字串；`validate:shell` 比對路由
  存不存在時先切掉 `?…`，所以「分頁真的存在」機器驗不到——**改用 headless 真的點那顆眉標**
  確認落地後 tags 頁列出 29 個標籤、glossary 頁列出術語清單（2026-07-28 那次就是用
  `?tab=` 進頁繞過了死掉的分頁按鈕，這次不重蹈）。

## VocalTuner：單音/旋律引導線（2026-07-27）

`pages/VocalTuner.jsx`。頭部切「單音 / 旋律」兩模式：單音＝互斥（`targetNotes` 恆
0/1，按新音取代）；旋律＝可疊多條引導線。引導線細（1px＋淡綠帶＋左端音名標籤，多
條也不雜亂）。選音分工：**按鍵/琴鍵＝加線（dedup，不 toggle）、點引導線＝移除該條、
右下毛玻璃圓鈕＝全清**（只在有線時出現）。cents 回饋比對最近的引導線，兩模式通用。
**踩到的 bug**：原本鍵盤觸發把 `handlePianoPress` 包在 `setKeyOctave` 的 updater 裡，
React StrictMode 雙呼叫 updater → 每音被 toggle 兩次；改用 `keyOctaveRef` 直接呼叫一
次。通則：side effect 別塞進 setState updater。

## 憲法法庭年度密度圖：頂線式畫法（2026-07-20）

`TimelineView.jsx` 的年度密度長條（100 根、跨 1927–2026、對數軸）反覆調色調不好看，連換
四輪填色濃度（半透明 24%／實色 color-mix 52/60/40%）都被使用者否掉。根因不是選色，是
**校準色的 `-tx` 彩度只有 0.05–0.10（莫蘭迪、故意壓低，DESIGN.md 明說它是為 badge／細線這種
小面積設計的），鋪成大面積長條時，濃了沉悶、淡了發灰，先天不討好**。使用者自己點破關鍵：
同一套色在右欄滾輪時間軸（`TimeRail.jsx`）上好看、在長條上醜——差別在面積。

解法是複刻滾輪的用色：滾輪把深墨色只用在 1.5px 刻度線與 7px 焦點圓點（小面積），大面積時代帶
用極淡 `-bg`＋0.38 透明。密度圖照做——每根長條拆兩層：主體（茎）用 `color-mix(-tx 22%, -bg)`
的淡彩（大面積、不透背後參考線），頂端一道 3.4px 的 `-tx` 滿色深墨細線承載色相辨識（小面積）。
茎不能用純 `-bg`：那太淡，rose 的 `-bg`（`#f7edf0`）在近白 paper 上幾乎消失——踩過。hover 非當前
年時茎降到 0.82、頂線降到 0.6（都別更低，否則粉色那類淡色會不見——踩過兩次）。色相回到與滾輪
`RAIL_TONE` 同一套 cat 槽（`ERA_TONE`），全頁統一。

這是「換畫法而非再調數字」的案例：同一參數連調四輪都不對，就是該換路的信號，不是繼續調。
過程中一度試把機關色改用空污費頁的候選 hex（`ERA_PAINT`），被使用者否（大面積長條上一樣醜），
已撤除。**未竟**：密度圖頂線式的最終觀感待使用者拍板；`ERA_TONE` 裡最高法院 teal(H182) 與
司法院 green(H139) 在滾輪淡帶下略難分，使用者提過但未修（記於 TODO）。

**空窗年空心環（2026-07-20 追加）**：1950、1951 是全序列唯一整年零解釋的年份（1949 底政府遷台、
大法官四散人數不足、會議無法召開，至 1952.05 釋字第3號恢復）。原本 `!byYear.get(y)` 直接
`return null`＝該年默默消失、不能 hover，使用者要「空也要能護出標籤解釋為何空」。改法：空年若在
`timelineGaps` 內就畫一個立在軸底的空心小環（`circle` fill none、色相取自該筆 `屬`、r 1.7、平時
strokeOpacity 0.5／hover 0.95），hover 時 `hover.empty` 分支讓 tooltip 換成換行的說明句（max-w-280
居中，非件數那條的 nowrap）。史脈另補一句進圖下散文。**史實文字走 data-repo-first，不寫死在 canvas**：
使用者追問「資料段要不要補」後改為——資料倉 `data/materials/年表空窗註記.json` curate（含查證來源），
`build-app-json.mjs` 公開投影成快照頂層 `年表空窗註記`（`查證`／`產生` 內部欄剝除），前端經
`shared.jsx` 的 `timelineGaps` 只讀不寫。要新增空窗（如未來某年缺額）改資料倉那支 JSON、`npm run
app-json && sync` 即可，前端零改。schema 見資料倉 `docs/data-contract.md`。

## 全站預設色票：陶土粉（2026-07-20）

`DEFAULT_PALETTE_ID` 從 `neutral-interim` 換成 `terracotta`，且該票的值烘進了
`tokens.css` 的 `--c-*`。在此之前，站上「選定的色票」只存在每台瀏覽器的
localStorage 裡——**首次到訪的讀者、459 個預渲染頁面、以及輻射出去的 MkDocs，
拿到的全是過渡中性票**，那是 2026-07-07 標明「PaletteLab 決定前的暫用值」而後
一直沒有人回來收尾的東西。

兩處值必須一起改：`palettes.js` 的條目與 `tokens.css`。`applySitePalette()`
對預設票的做法是移除全部 inline 覆寫、讓 tokens.css 露出來，所以兩邊不一致的話，
使用者從別的票「選回預設」會得到第三個顏色。改完跑 `validate:tokens` 與
`validate:colors`，再 grep 建置產物確認 `dist/assets/*.css` 裡是新值（first paint
不該等 JS）。設計依據與 accent 的使用邊界寫在 `docs/DESIGN.md` 色票庫節。

**已知缺口**：`validate-color-system.mjs` 只驗 Layer-0 的 `--tone-*` 八對，
色票角色 `--c-*` 沒有任何機器檢查。分類色是機器擋出來的，全站色票好不好看純粹
靠人選。補檢查的三條判準列在 `TODO.md` 全局節。

## AirPollutionFee：改用共用儀表板殼（2026-07-20）

964 行的單檔頁改成 TaxLitigation 那個形狀：薄殼 `AirPollutionFee.jsx`（~75 行）
＋ `src/pages/_air-pollution-fee/`（`data.js` 純資料、`shared.jsx` 小零件、七個
View）。連帶清掉三樣東西：自帶的 40 個 `--apf-*` 色變數（原本靠 `// token-exempt`
標記豁免檢查，現在真的乾淨，`validate:tokens` 從 110 檔增至 118 檔通過）、四個
複製版 `Accordion`／`InfoBox`／`BulletList`／`Tag`（改用 `components/lab/`）、
以及寫死的 `text-[9px]`／`text-[12px]`（改 token 字級——寫死 px 會讓字級控制器
對這頁完全無效，殼的 `reader-scale` 縮放不到它們）。

費率查詢原本埋在「構成要件」底下一顆要點開的按鈕裡，現在是獨立分頁。

**配色上踩過的一個彎路值得記**：中途一度新開了一個 `theme.js`，把那 40 個色變數
整理成 18 對手寫 hex 並按色相命名（green/purple/gold）——那是在設計系統外另立一套
色，`Badge.jsx` 的註解明寫呼叫端只能選意義不能選色碼，而且沒有任何 validator 管得到。
使用者當場擋下。最後的做法是：真正帶資訊的分類維度只有污染物那四個（＋收入來源三個），
各自吃 `cat-1…cat-4`；逃漏五節是意義不是類別，吃語意槽；章節圖示色、九個年份標記色、
七段支出色不在頁面上使用——一項一個色相是裝飾不是資訊，識別本來就靠旁邊的標籤。
`data.js` 現在零 hex。

**但那些顏色本身留著，沒有丟。** 18 對「淡底＋深墨」移進
`src/styles/tone-candidates.js`，當作 Layer-0 的擴充候選——tokens.css 現在只有 8 對，
單是空污費一頁就要 7 個分類槽，遲早不夠用。該檔的檔頭寫了實算出來的分析（見下方
「這組色為什麼好看」節），以及照抄進 Layer-0 會踩到的四處超標。**還沒重新校準，
所以目前只是倉庫，不要直接引用。**

## Design system (tokens + shared components)

Single source of truth: `src/styles/tokens.css` (plain CSS custom properties,
copy-pastable to MkDocs extra.css / vanilla projects). Tailwind reads it via
`tailwind.config.js` theme.extend. Shared components in `src/components/`:
LangSwitch/useLang (bilingual, dict keyed by Chinese source string),
FontSizeControl/useFontScale, PageShell, Eyebrow. Full spec, palette registry,
and migration state: `docs/DESIGN.md`. `npm run validate:tokens` (in build)
blocks bare hex in migrated files; `scripts/design-token-exceptions.txt` is the
shrink-only list of unmigrated files.

**焦點框全站政策（2026-07-27，`src/index.css`）**：瀏覽器預設 focus 外框（Safari
藍光／Chrome ring）連滑鼠點按也會留在按鈕上，很醜（音樂工具閒置時最明顯）。規則：
`:where(a,button,[role=button],input,select,textarea,summary,[tabindex])` 的 `:focus`
外框一律關掉，只在真正鍵盤操作（`:focus-visible`）時給一圈陶土色（`--c-accent` 45%）。
`:where()` specificity 0，不蓋 `.canvas-range`/`.canvas-check` 既有 focus 樣式。**別為了
去掉某個藍框對單一元素加 `outline:none`——全站政策已在。**

**Reader font-scale mechanism (rewritten 2026-07-18, replaces the earlier
whole-page `zoom` — read `docs/DESIGN.md` 字級規則 first).** The page sets
`--reader-scale` on its root; shared class `.reader-scale` (index.css) carries
it as `zoom` on the content wrapper *inside* each shell's fixed-width frame,
never on the full-width `<main>`. Because the max-width column and outer gutter
sit outside the zoom, enlarging type reflows the content but the margins never
move (Substack/Kindle-style in-page control, not browser Cmd+). Wired into
PageShell, ArticleLayout, DashboardLayout, and the two bespoke pages
(Glossary, ECFAResearch). The toolbar and DashboardLayout's right-rail TOC
stay unscaled; DashboardLayout's sticky tab bar (2026-07-20) now scales with
the rest — it is the primary way to move through the page, not toolbar chrome,
so leaving it fixed size while the title/body grew read as broken (see below).
Paper textures (`--paper-texture` + `.reading-grain`) are painted on a
`position: fixed` `::before` sibling layer (index.css), *not* as an ancestor
background: a `zoom`ed descendant makes Chrome re-rasterize its ancestor's
painted background, which moirés the fine 1px line textures (布紋/簾紋・雙層)
at non-integer scale. Fixed sibling layer = provably 0 pixel difference between
100% and 160% (measured). Only the regular *line* textures showed the artifact
visibly — noise/dot textures resample invisibly, so the same bug was there but
imperceptible on them.

**Semantic color token system (2026-07-08, built after six rounds of color
thrashing — read `docs/DESIGN.md` 色彩哲學 → 語意色 token 系統 before touching
any chart/badge/category color).** Two layers in `tokens.css`: Layer 0
`--tone-{rose,red,amber,green,teal,blue,plum,slate}-{tx,bg}` primitives (8
calibrated pairs, values = the user-approved Badge hues), Layer 1
`--status-{danger,warning,success,info,neutral}-{tx,bg}` (by meaning) +
`--cat-1..8-{tx,bg}` (fixed-order categorical slots) as `var()` aliases. A
third build validator, `scripts/validate-color-system.mjs` (`npm run
validate:colors`, wired into build), enforces Notion's harmony rule
computably: every `-tx` must sit in OKLCH L 0.46–0.58 with total spread ≤0.10
(uniform lightness) and C 0.045–0.13 (muted); every `-bg` L 0.90–0.97
(near-white). A mustard tone literally can't be added without failing the
build (verified: `#a8862e` → build red). Design decision baked in: ONE palette
serves both badges and charts, relying on the always-present text
label/legend for distinguishability (the harmony-vs-CVD trade-off, resolved
per research — sources in scratchpad `research-*.md`, proposal in
`PROPOSAL-color-token-system.md`). Reference implementation landed in
`ConstitutionalCourt` (Badge tones + `TENURE_*` now consume tokens, 13
`--cc-badge-*` islands removed). **Phase 2 (not done): the other 7 pages'
`*_VARS` raw-hex islands still need consolidating into the semantic tokens —
do it incrementally, don't open new hex islands.** Rule for any new
chart/status color: reference `--status-*` / `--cat-*`, never a fresh page hex.

## 資料倉是內容的唯一來源，canvas 只負責畫：加上固定檢查（2026-07-29 使用者裁定）

這條界線本來只是一句口號（「改動一律從資料倉下手」），沒有任何東西擋得住違反它的人。
它壞掉的方式很固定，而且兩種都是當下沒事、以後才炸：

1. **有人為了快，直接改 canvas 這邊的 `src/data/*.json` 或 `src/content/**`。** 下一次 sync
   把他的改動整個洗掉，而且沒有任何痕跡說明發生過什麼。
2. **把算得出來的東西寫進 JSX**（分組、排序、摘要、字數、日期格式），於是同一份邏輯在
   兩個倉各長一份，日後只改到其中一份。

`scripts/validate-synced-content.mjs`（`validate:synced`，已進 `verify:policy`）擋這兩件：

- 資料倉的 `sync` 腳本現在會多寫一份清單 `src/data/<line>.sync.json`，內含每個送過來的檔的
  sha256。這支檢查重算一次對照，不一致就 exit 1，訊息直接指回該去哪個倉改。清單沒收錄、
  卻躺在正文目錄裡的 `.mdx` 也會被抓出來（手工加的，下次 sync 就沒了）。
- 每條線的前端檔案有**行數上限**——「前端只負責畫」的可量化說法。手記現在 459/600 行
  （`Notes.jsx` ＋ `_notes/`，含 2026-07-29 新增的 `ArchiveRoute.jsx`）。超過通常表示有
  東西該搬回資料倉。

負向測試三個都驗過會擋：改一個字的 `.mdx`（回報該檔與資料倉不一致）、手工新增一篇
`.mdx`（回報不在清單裡）、把行數上限暫時壓到 100（回報 326 超過並列出檔名）。

新增一條線時在 `LINES` 加一筆（清單檔名、正文目錄、前端路徑、行數上限），
並在該資料倉的 sync 腳本裡照 `notes-data/engineering/scripts/sync-to-canvas.mjs` 補寫清單。

## 資料層與 PDF 代理白名單分岔：加上固定檢查（2026-07-28）

線上中研院出版品的 743 份 PDF 全部回 `forbidden target`。成因是兩份必須同步的東西各自走：
`src/data/iiasPublications.json` 的網址早就改指 GitHub Release 的自有典藏並進了版控，
`api/_pdfProxy.mjs` 對應的 `github.com` 白名單規則卻留在工作樹沒 commit。本機 dev 讀工作樹
所以一切正常，線上讀 HEAD 所以全掛——**這類「本機好、線上壞」的落差不會有任何既有閘門發現。**

`scripts/validate-pdf-proxy.mjs` 直接 import `resolveTarget`，逐一驗證前端會送進 `/api/pdf`
的網址：中研院出版品的篇章網址（`IiasPublications` 的 `pdfHref` 無條件套代理，白名單漏一條就是
整批打不開），以及憲法法庭資料裡被 `_constitutional-court/shared.jsx` 的 `PDF_PROXYABLE` 判為
可代理者（那個 regex 是白名單的第二份寫法，會各自漂移）。覆蓋 2,377 個網址，接進 `verify:policy`。
負向測試：拿掉 `github.com` 那條規則，檢查回報 738 個網址不被接受並 exit 1。

通則：**資料層改指新來源時，代理／白名單那一側要在同一個 commit 一起推。**

## 作業語言不准進畫面：加上固定檢查（2026-07-27）

站級硬規則本來只寫在本檔開頭，靠人記得。這次聲樂頁的頁尾寫了「資料層在 vocal-training-data」，
使用者當場退回（「工程信息禁止進前端！！！」）。規則沒有守門人就會反覆被破。

**`npm run validate:copy` 現在擋兩類字**：`資料倉`／`資料層`／`同步過來的快照`，以及逐個列出的
資料倉目錄名（`*-research-data`、`brief-data`、`vocal-training-data`、`jirs-foreign-law` 等）。
倉庫名用白名單列、不用 `*-data` 通則式——英文正文裡的 `fiscal-data`、`tax-data` 是真的在講財政
資料，不是倉庫名。

**註解不算**：比對前會把註解去掉，而且現在連「跟在程式碼後面的行末 `//`」也一起去掉（原本只去
整行註解，於是 `if (g) { // 資料層優先` 這種會被誤報）。去行末註解時用 `[^:\w]` 擋住 `https://`，
免得切掉半個網址。

**順手掃出的三處舊違規**（都是真的印在畫面上的字）：憲法法庭 `AboutView` 的空狀態
「找不到……（資料層尚未同步）」→「目前沒有……的深度分析」；首頁「實證研究」那一組的說明
「有分離資料層……」→「自己蒐集原始材料……」；`PaletteLab` 的一個標題。

負向測試：把「資料倉 vocal-training-data」塞回聲樂頁頁尾，檢查兩條規則各報一次；還原後通過。

## 眉標的油墨紋理不見了：是字重，不是字級（2026-07-28 使用者裁定）

使用者原話：「眉毛這地方的字體的油墨點點字體呢？？？？底層模板修復」。

**第一次診斷錯了，記下來免得再錯一次。** 我先量到 `Erikas Farbband` 有載入、逐字 advance width
都是 53.7（等寬），於是判斷「字體有套上，只是 14px＋`ink-faint` 太小太淡，紋理落在次像素裡」，
把眉標放大到 16px＋`ink-muted`。使用者回：「依然不是那個有油墨點點的字體」。

**真正的原因是字重。** Erikas 有兩支字面：400 是乾淨的細打字機體、沒有紋理；**700
（`ErikasFarbband-Bold-subset.woff2`）才是色帶油墨的網點字面**。首頁那條「PHENOM · CANVAS LAB」
一直寫 `font-bold`，共用的 `Eyebrow` 元件卻沒有，所以站上一直有兩種眉標，而使用者記得的是首頁那個。
**通則：字體看起來「不對」時，先把同一支字體的每個字重排在一起比，再去懷疑字級、顏色與 fallback。**

**順帶修掉兩個一直存在的坑**：Erikas 子集沒有空格字符（advance width＝0），詞距只剩
`letter-spacing`，字詞邊界糊成一排等距字母——現在按空白切成一詞一個 span、flex `gap` 撐開，
單獨成詞的間隔號改畫 CSS 圓點（同首頁做法）；中文眉標退到 Huiwen 而 Huiwen 沒有 700 字面，
加 `font-synthesis: none` 擋掉瀏覽器合成的假粗體，中文才不會在 12px 上糊掉。

現行值：`--text-xs`／700／`tracking .26em`／`ink-muted`。四個呼叫端（`PageShell`、
`DashboardLayout`、`JirsForeignLaw`、`ZhuJiahua`）一次跟著改；空污費的中文眉標實測正常。

**沒有加機器檢查**：站內另有八處刻意的 10px accent 標籤（AppearanceMenu 分區標題、SourceFilter
欄名、FrontDoor），一條「accent 一律 bold」的規則會全部誤報。規則寫進 `docs/DESIGN.md`
「accent 字體：紋理在字重，不在字級」。

## 窄側欄的換行：改元件，不是改單頁（2026-07-27 使用者裁定）

聲樂頁的側欄目次把「第 8 課　倚音（上方與下方）、短倚音」斷成「…（上方與下」＋「方）、短倚音」。
使用者原話：「修正側邊欄醜 wrap，底層禁止醜 wrap」。

**`TableOfContents` 與 `SubOutline` 都加了同一組**：`[line-break:strict]`（斷行避開全形括號與
頓號）＋`[text-wrap:pretty]`（最後一行不落單字）＋`line-clamp-2`＋`title`（完整標題留給滑鼠）。

**`TableOfContents` 新增 `data-toc` 支援**：`h2` 有這個屬性就用它當側欄標籤，沒有才用
`textContent`。這樣內容欄可以印完整課名、側欄印短標，不必為了側欄把正文標題砍短。
短標放資料層（`vocalTraining.json` 的 `lessons[].topic`，資料倉 validator 限十字內），
不在 JSX 裡臨時砍字串。

**全站掃過**：十條有側欄目次的路由，共 96 條項目，沒有一條超過兩行、沒有一條被截斷。
`/brief` 那五條兩行的（「美國國家經濟研究局（NBER）12 篇」之類）現在斷在「（」之前，是完整的兩行。
規範寫進 `docs/DESIGN.md`「窄側欄的換行」節。

## 首頁卡片文案與 SEO 描述分家（2026-07-27 使用者裁定）

`PAGE_META.desc` 原本同時餵首頁卡片與 `<meta name=description>`。為了 SEO 而寫的事實密集長句
（VocalTraining 259 字、GermanLawCourseTimeline 約 150 字）於是原封不動印在首頁卡片上，變成
一大段話。使用者原話：「這兩個太囉嗦！！！！」

**現在**：`desc` ＝首頁卡片那一行（一眼掃得完），`seoDesc` ＝給搜尋與答案引擎的長描述。
`PageRoute` 取 `route.meta.seoDesc ?? route.meta.desc`，只寫 `desc` 時兩邊共用（多數頁不用改）。

**固定檢查**：`npm run validate:copy` 擋 `PAGE_META.desc` 超過 60 字（現況中位數 30）。
順手縮短了兩筆既有的：`JirsForeignLaw`（74 字）、`LegalGlossary`（66 字）。

**skill 也改了**：`.claude/skills/canvas-seo/SKILL.md` 步驟 3 原本寫「補上 title、desc（＝description）」
——那句話正是這次的來源，已改成 `seoDesc` 並加警告。

## 外殼的水平內距：留白改成預設（2026-07-27 使用者裁定）

單一事實來源 `src/components/shellPadding.js`，三個常量 `SHELL_PAD_X`／`SHELL_PAD_X_RAIL`／
`SHELL_PAD_X_TIGHT`，規範寫在 `docs/DESIGN.md`「外殼的水平內距」節。

**改了什麼**：`DashboardLayout` 的 `padX` 預設從 `px-4 sm:px-6` 改成 `SHELL_PAD_X`
（`px-4 sm:px-6 lg:px-16 xl:px-24`）；`ArticleLayout` 與 `PageShell` 的 `wide` 版改吃
`SHELL_PAD_X_RAIL`（側欄本身已是留白，只給一半）；`PageShell` 的 `prose` 版不變
（`max-w-3xl` 在寬螢幕本來就有大片外邊界）。`LegalGlossary` 原本自己傳的那份 `padX`
移除——它現在就是預設值。

**為什麼是模板層改，不是逐頁補**：使用者原話是「你底層優化一下我的所有的模板，要不然我每次
新開一個都有這個問題」。逐頁傳 `padX` 的做法製造的是「補過的頁」與「沒補的頁」兩種樣子，
而且新頁預設會落在錯的那一邊。

**手機不受影響**：三個值都從 `px-4 sm:px-6` 起跳，留白只在 `lg`（1024px）以上長出來。
實測左邊界（正文段落，px）：390 → 16、768 → 24、1024 → 64、1280 → 96、1600 → 256；
390px 下九條路由零水平溢出。量測腳本的做法記在 `.claude/history/`，要複驗就用 playwright
量 `main p` 的 `getBoundingClientRect().left`。

**加寬表格頁時**：整欄是寬表格、橫向真的不夠用，才傳 `SHELL_PAD_X_TIGHT` 換回貼邊，並在
呼叫端寫一行理由。

**2026-07-28 補完：規則寫在文件裡擋不住自己刻殼的頁。** 07-27 只改了三個共用殼，而站上
有 14 頁的版型是自己刻的，它們照樣手寫 `px-4 sm:px-6`——使用者回報「內容起始過於左邊」，
指的就是這些。這輪加了固定檢查 `npm run validate:shell`（`scripts/validate-shell-chrome.mjs`，
已接進 `verify:policy`）：任何 `mx-auto` 的寬容器（`max-w-6xl`／`7xl`／`8Xrem`）手寫
`px-4 sm:px-6` 就失敗，內距字面值被複製到 `shellPadding.js` 以外的檔也失敗；註解裡引用
舊寫法不算違規（要會分辨程式與註解，`/* */` 區塊要有狀態機，只看行首 `//` 抓不到 JSX 註解）。

它當場掃出四處漏網，全部修掉：`SiteHeader`（`article` 版現吃 `SHELL_PAD_X_RAIL`，與底下
`ArticleLayout` 的三欄格線對齊——不對齊就會看到返回鍵與正文落在兩條左邊界上）、
`ConstitutionalCourt`／`ECFAResearch`（各三個容器：抬頭、吸頂分頁、主欄，三個要吃同一個值
才不會有段差）、`JirsForeignLaw`（有 14rem 左欄，吃 `SHELL_PAD_X_RAIL`）。**通則：
「單一事實來源」只有配上固定檢查才算數，否則它只約束得了記得去讀文件的那些頁。**

## Page building blocks: `src/components/lab/` (2026-07-13, new)

`src/components/` holds site chrome; `src/components/lab/` holds the pieces a
page is built from, and it exists because 17 pages had each hand-rolled their
own tabs, accordions and SVG axes (16k lines of page code against 287 lines of
shared code). What is in it, and the rules baked into the API rather than into
prose:

- `Tabs` + `useTabParam(key, fallback)` / `useTabParams(defaults)` — tab state
  lives in the URL, so every tabbed view is deep-linkable; the default value is
  kept out of the query string; switching scrolls to top. **Use `useTabParams`
  when a page has two tab dimensions** (a main tab that resets a sub-tab): two
  separate `useTabParam` calls cannot both write in one click handler — each
  closes over its own render-time query snapshot, so the second write silently
  drops the first. This bit GovernmentDebt during migration and is why the
  multi-key hook exists. Variants: `underline` (page sections), `quiet` (inside
  a figure), `bar` (a dark strip under a page's own colored masthead), `pill`
  (sub-tabs that read as buttons).
- `Accordion` + `useExpandedSet(ids)` — multi-select, and **everything starts
  open, with no parameter to ask otherwise**. The standing "cards default to
  fully expanded" rule is enforced by the type, not by memory.
- `SourceFilter` + `usePersistedFlag(key)` (2026-07-18) — the left-rail source
  filter shared by both `/brief` inner pages. Controlled: selection lives in the
  URL (`?sources=all|none|csv`), the parent maps it. Pass `sections` for
  kind-grouped rendering (toggle a whole kind at once), or just `sources` for a
  flat list. Fixed control row: select-all / clear / **invert** / **radio**
  (single-select). **Empty set is legal** — the content area shows an empty
  state, the filter does not block it. UI toggles (radio mode, Reading's
  summary-only filter) persist via `usePersistedFlag` (`canvaslab:*` keys); the
  selection itself stays in the URL so it is shareable.
- `DashboardLayout` (2026-07-18) — the dashboard three-column shell, sibling to
  `ArticleLayout` (essay). `/brief` had hand-rolled it inline. Header scrolls
  away → sticky underline `Tabs` bar → `[12rem_1fr_12rem]` grid: h2-only left
  TOC (+ optional `leftRailTop` for an urgent notice), full-width content, right
  `SubOutline`. The page passes eyebrow/title/summary/tabs/children; the shell
  wires TOC + SubOutline to the content ref. Use `ArticleLayout` when prose wants
  a fixed measure, `DashboardLayout` when a dashboard wants full-width dense rows.
  `ConstitutionalCourt`'s sticky-tab shell is deliberately **not** folded in — it
  is a separate design system (`--cc-*` vars, pill tabs, no TOC rails).
  **Rebuilt to two columns (2026-07-20, TaxLitigation build)**: the left h2-only
  TOC is gone — the sticky tab row already is the "which big topic" nav, so a
  second h2 list said the same thing twice. The right rail now runs
  `TableOfContents` with no `levels` restriction (it already supported h2+h3 with
  scroll-spy; the old 3-column split had artificially capped it to `levels=[2]`
  and handed h3s to `SubOutline` instead — two components doing one job).
  `SubOutline` is now unused by this shell (still in the tree, nothing imports
  it — a future cleanup pass can delete it, or a page with a real use for
  "current section's children only" could still reach for it). `leftRailTop`
  (Brief's urgent-alert slot) renders above the outline in the right rail now;
  the prop name is unchanged on purpose — renaming would mean touching every
  caller for no functional gain. Tab bar switched from the `underline` variant
  to a new `dashboard` variant (`Tabs.jsx`): solid pill buttons inside an
  `inline-flex bg-surface` capsule, not a full-width `flex` row. A full-width
  row with few tabs (this page has 5, StatisticsLab has 3) stranded the button
  group on the left with a wide empty strip under a full-bleed border — looked
  broken, not spacious. The capsule bounds itself to its buttons and sits flush
  with the header's left edge (same column as the title/body — centering it
  independently was tried and rejected: it reads as detached from where the
  text starts). No `backdrop-blur` on the sticky strip: blur over that same
  near-empty strip read as a smear, worse than a flat fill. **Zoom-in-outer-box
  pitfall**: `reader-scale` (`zoom`) must wrap only the innermost content, with
  an *unzoomed* `mx-auto max-w-7xl px-4` frame around it — exactly the header's
  existing nesting. Putting `reader-scale` on the same div that also carries
  `mx-auto`/`max-width`/padding lets `zoom` scale the auto-margin centering
  math itself, so the box's centered position drifts left as scale increases;
  invisible at 100%, visible by 160%. Hit this once building the tab row (fixed
  in the same session), worth flagging since the same trap is in `DashboardLayout`
  itself, not React state — any new zoomed region must copy the header's split
  instead of re-deriving it.
- `chart/` — primitives only (`linearScale`/`bandScale`/`niceTicks`,
  `ChartFrame`, `Grid`/`AxisX`/`AxisY`, `Bars`/`Line`/`Dots`/`AreaWash`/
  `RuleLine`). No chart components: two real charts had nothing in common above
  the scale/axis layer. `Bars` and `AreaWash` take a categorical slot (1–8), not
  a color, and bake in pale fill + same-hue ink keyline — there is no `fill`
  prop to route around it.
- `HoverCard` — the floating card behind both prose annotations: open on hover or
  focus, click to pin, positioned from the marker's real screen box and clamped to
  the viewport, portalled to `<body>`. The marker is a `<span>` with `role=button`,
  never a real `<button>`: Chromium treats a form control as an atomic inline box
  even at `display:inline`, which drops the text out of the surrounding run and
  strands the CJK full stop after a citation on the next line. Don't "fix" that
  back to a button.
- `HoverCite` (citation, dotted underline) and `TermLink` (glossary term, dashed
  underline) — both are thin cards over `HoverCard`. A citation hands the reader a
  source; a term hands them a definition, an example, and a link to its own page.
- `Badge`, `Math` (import it as `Tex`; the name `Math` shadows the global),
  `Prose` (the MDX typography mapping).

**Known gaps (found by migrating GovernmentDebt and reading ECFA's
ThesisTimeline, both real users):** no primitive for point labels / annotation
callouts with collision avoidance (both pages hand-roll it — the strongest
candidate for the next extraction); `AreaWash` has no gradient; `Dots` has one
radius for all points.

## MDX + KaTeX (2026-07-13, new)

Long-form articles are `.mdx`: plain markdown prose with interactive figures
written inline (`<LadyTastingTea />`). `@mdx-js/rollup` runs `enforce: 'pre'` in
`vite.config.ts`; `remark-math` + `rehype-katex` compile `$…$` at build time.
The `.mdx` file imports nothing — the page shell (`src/pages/statistics/
NullHypothesis.jsx`) injects the figure components and the `<Cite>` binding
through `Prose`'s MDXProvider, so writing the next article is writing prose.

**Math is LaTeX-only.** No Unicode math character (Greek, sub/superscripts,
operators) may be typed into the statistics pages, `src/content/`,
`src/data/statistics*`, or `src/components/lab/`; `npm run validate:math`
(fourth build gate, `scripts/validate-math-notation.mjs`) fails the build on
one. Reason: the same symbol would otherwise render in Mincho in one place and
KaTeX_Math in another, on the same page. Older pages use `>=`-type characters as
ordinary prose punctuation and are out of scope. KaTeX's own fonts are the one
sanctioned exception to "no new fonts" (`docs/DESIGN.md`), confined to `.katex`,
and land only in the statistics async chunk (verified: `dist/index.html` and the
home chunk contain no katex).

**已修：`validate:math` 對中文刪節號誤報（2026-07-29 發現並修好）。**
`⋯`（U+22EF）落在 Unicode 的數學運算子區段，所以上面那條規則抓它；但中文排版用的就是它當
刪節號——`…`（U+2026）在明體裡貼著基線，`⋯` 才是置中的。手記搬進 `src/content/notes/` 之後，
一道為統計長文寫的閘套到了散文上，`cannot-say-goodbye`／`learning-to-swim`／
`semester-2023-fall`／`semester-2024-spring`／`third-time-positive`／`why-it-moved-me` 共 12 處
全是成對的 `⋯⋯`，`npm run build` 因此紅在第四關。兩條修法：放行成對的 `⋯⋯`（單獨一個 `⋯`
仍然攔，那才可能是數學）——比較窄，建議這條；或把 `src/content/notes` 移出 `ROOTS`，貼近該檔
docstring 自述的範圍，代價是手記裡真混進 σ 之類的也不會被抓，而那幾篇正好在談機率論。

**`remark-gfm` 也在管線裡（2026-07-29 加）。** 手記要搬 2021–2024 的舊貼文進來，Matters 的
`<s>` 標籤轉出來是 `~~刪除線~~`，而 CommonMark 沒有刪除線——少了 gfm 會原樣顯示成波浪號。
加它之前先量過影響：**站上當時 51 篇 `.mdx` 加與不加的編譯輸出完全相同（0 位元組差）**，
77 篇舊文草稿也只有帶 `<s>` 的那 4 篇有變化；作者打字拖長音的 `拜托~~~`、`笑~~~` 不是合法的
刪除線標記，gfm 不碰它們。順帶啟用了表格、裸網址自動連結與註腳，寫新文章時可以直接用。
**要改這條之前先重跑一次那個比對**（用 `@mdx-js/mdx` 的 `compile()` 對每個 `.mdx` 編兩次比字串），
不要憑印象判斷「應該沒差」。

**MDX 對 `<` 與 `{` 的容忍度比想像中高。** 反斜線跳脫過的 `\<` 是 CommonMark 的字面字元，
編得過；只有**沒跳脫**的才會被當成標籤或表達式。用 `/[<{]/` 這種不分跳脫與否的正則去攔，
會攔到自己人（notes-data 的匯入腳本 `escapeForMdx()` 產出的正是 `\<`）。判斷「這篇編不編得過」
的正確方式是拿 `@mdx-js/mdx` 真的編一次，不是用正則猜。

## Font system (stable, don't re-derive)

**字體平滑只給長文正文，別處維持系統預設（2026-07-28 使用者裁定）。**
起因是「正文字體磅重太重……看得累」。先量再改：當時正文實測是字重 400、`--c-ink`（暖褐，
不是黑）、18px／行高 1.85，用的是 Huiwen Mincho 本尊而非 fallback——都已經是最輕的一檔，
**變重的是渲染**（`-webkit-font-smoothing` 預設 `auto`＝macOS 次像素平滑，把明體細筆畫整圈
加厚）。第一版設在 `body` 上、全站一起變細，**使用者當場退回**：別處「會覺得看不清，好奇怪」
（清單、儀表板、工具列字級小、要一眼掃過，細筆畫反而不利）。現行範圍是
`.prose-body`（`Prose` 元件外層，即 `.mdx` 長文的正文區，見 `src/index.css` 那條註解），
`.prose-body .font-accent` 再設回 `auto`——Erikas 700 的油墨網點靠筆畫邊緣的顆粒，灰階平滑
會抹乾淨，而正文裡的行內程式碼正是這支字體。自己刻版型的閱讀面自己加這個 class，目前兩處：
`ZhuJiahua` 的校訂全文、`_chen-yinke/LiuRushiEdition` 的 `.reading`。**不能收進 `ArticleLayout`
自動生效**——`/brief` 的兩個清單頁用的是同一個殼。判準與現況表寫在 DESIGN.md
「字體平滑：只有長文正文吃灰階」。**差別只在 macOS 上看得見，headless 截圖驗不出來**（截圖本來
就走灰階）——只能請人在瀏覽器裡看；能自動驗的只有作用範圍（實測：手記文章、統計站長文、
朱家驊全文、陳寅恪重排本正文＝`antialiased`；手記清單、`/brief`、中研院本站說明＝`auto`）。

**Emoji 一律走系統彩色字體，不進子集（2026-07-29）。** 手記搬進 2021–2024 的舊貼文帶了
17 個 emoji（🙃😭🥹🫠👻💨😆😇😐😑😣😥😬😮🙄🤣🥺），明體子集當然畫不出來，
`validate:fonts` 會擋。正解是把碼位加進 `scripts/font-coverage-exceptions.txt`（`👋` 早有前例），
讓它落到 Apple Color Emoji／Noto Color Emoji——**不要為了 emoji 去重建 CJK 子集**，
那是彩色字形，明體子集本來就不該含。以後有新 emoji 進站照這條走。

`src/index.css` defines three CSS variables:

- `--font-body`: Huiwen-mincho only (CJK, Public Domain). Default for
  body text, in-card headings, and text mixed inline with CJK.
- `--font-display`: Radio Newsman + GenWanMin2. Applied to `h1-h3`
  site-wide. Clean at any size, no synthesis artifacts.
- `--font-accent`: Erikas Farbband (opt-in only — has a heavy
  ink-ribbon texture, noisy in body text or small headings; currently
  used only for the `.eyebrow` kicker in `InternationalTaxOps`). **Do
  not make this the default body font again** — that was the original
  bug fixed here.
- **Latin 顯示/accent 子集是文字驅動的（只含站上用過的字），缺常見標點
  （2026-07-27 踩到）。** Erikas（`--font-accent`）連半形空格 U+0020、`·`
  (U+00B7)、nbsp 都沒有，多字詞或 `·` 分隔的 eyebrow 在它底下會跳豆腐格——分隔
  點用 CSS 圓點畫、詞距用 flex `gap`，別靠字體的空格/·（見 `FrontDoor.jsx`、
  `App.jsx` 索引 eyebrow）。Radio Newsman（`--font-display`）子集已含
  H/E/R/I/N/P/h/e/n/o/m（做「Phenom」＋門面 `HEREIN`）；加新 Latin 字母得重建它的
  子集，而 `rebuild-font-subsets.mjs` 只處理 CJK。**Huiwen（`--font-body`）是固定
  comprehensive 子集、含 Latin 0x0020–0x024f（連 ä ö ü ß 都有）＋常用 CJK，多語言
  正文放它最安全。**
- `font-synthesis: none` on `body` is load-bearing — without it the
  browser fakes bold weights these fonts don't ship, producing a
  moiré-like glitch.
- Tailwind's `font-sans` is mapped in `tailwind.config.js` to
  `var(--font-body)`. Don't let Tailwind fall back to its default
  sans-serif stack on canvas pages — that regression happened once
  (ECFA page) and was fixed 2026-07-02.
- `npm run build` runs `scripts/validate-font-coverage.mjs` before
  Vite. Rebuild font subsets before building if new page/data text
  introduces new characters. Don't bypass this check.
- **`scripts/rebuild-font-subsets.mjs` now rebuilds all three subsets
  (2026-07-13).** It used to rebuild only Huiwen and GenWanMin2, while
  the coverage validator checked the *union* of Huiwen and the Chiron
  fallback — so "Huiwen lacks it, Chiron covers it" was a hand-maintained
  claim with no script behind it. The script now subsets Chiron to exactly
  the codepoints Huiwen cannot draw, and prints the `unicode-range` line
  that `src/index.css` must carry. Paste it back after every rebuild: a
  stale range means those glyphs fall through to the system font while the
  validator still passes. (First run of the fixed script found the range
  had drifted from 19 codepoints to 110.)

Erikas Farbband / Radio Newsman have **undocumented upstream
redistribution terms** — bundled at the user's explicit, informed,
repo-scoped decision (`public/fonts/LICENSES.md`). Re-confirm with the
user before reusing them in a new project. Full recipe:
`~/.claude/skills/mincho-typewriter-type-system/SKILL.md`.

Two queued tasks touch this system (see TODO「全局」, 2026-07-07): a
sonnet evaluation of the `huiwenmincho-improved` upstream (could remove
the 19-char Chiron Sung HK fallback) plus a Planschrift_Project ID, and
a footer font-credit line linking `/fonts/LICENSES.md`. Until the user
rules on that evaluation, DESIGN.md's "no new fonts, don't touch
@font-face" ban stands — the evaluation itself changes no files.

## Security (done, stable — do not revisit)

Local machine paths were removed from both
`my-canvas-lab` and `intl-tax-ops-lab`, with git histories rewritten
and force-pushed. `intl-tax-ops-lab`'s history was fully scrubbed with
`git filter-repo --replace-text` since the leak dated to its first
commit. Both repos' "expose local research folder" UI panels were
removed entirely, not just the path string. **Do not try to "restore"
old commits** — they contained the leak by design of the fix.

## 憲法法庭索引頁：工具列收合＝捲動連動位移 (2026-07-20)

`IndexView.jsx` 的 `useScrollLinkedToolbar`，取代原本的 `useHideOnScrollDown`。

**原本壞在哪**：舊版是兩態開關。工具列 sticky 貼齊後，先釘住 `armPx=160` 不動，
跨過門檻才用 `-translate-y-full` 加 200ms 過渡整條一次彈掉。列在哪跟你捲了多少
完全脫鉤，使用者的描述是「卡住了就卡住了，然後突然往上縮，有時候縮有時候不縮」。
`REVEAL_UP=90` 的累積門檻是為了掩蓋同一個缺陷——因為是兩態，微小抖動才會讓整條跳出來。

**現在**：位移量直接綁捲動距離。

- 貼齊前（`pastPin ≤ 0`）位移恆為 0。這條前提沒變：還在正常流內就上移會留下
  它原本佔的版面高度，那塊大空白是 2026-07-13 踩過的。
- 往下捲 1:1 跟手退，上限一個列高（實測 229px），退滿即完全收起。
- 往上捲 `REVEAL_GAIN=2.2` 倍速露出——讀到深處想回頭用篩選時，不必反捲一整個
  列高才看得到它。
- `offset` 另外 clamp 到 `pastPin`，否則剛貼齊那幾幀列會跑得比頁面快，像被抽走。
- 直接寫 `style.transform`，不走 React state：這頁掛著數百張案件卡，每個 scroll
  事件都 re-render 會掉幀。**元素上不要加 transition**——位移逐幀寫入，再補一層
  過渡只會讓它落後手指。

連續位移對觸控板抖動天生免疫（抖幾 px 就位移幾 px），所以累積門檻整個拿掉了。

Playwright 實測：貼齊前 0；往下 20/40/60/80 → 上移 20/40/60/80；往下 289 → 229
（clamp）；往上 10 → 退 22；往上 30 → 退 66；深處往上 40 → 229 降到 141。

## Running `npm run build` (2026-07-20 — 一次自己製造的事故)

`npm run build` 是一條長鏈：五支 validate 腳本 → `vite build` → `prerender.mjs`
寫 459 頁 → sitemap。整條在這台機器上要跑好幾分鐘，**常常超過 agent harness 的
單次命令逾時而被移到背景**。

被移到背景不代表它停了，它還在跑，而且 `prerender.mjs` 全程都在寫 `dist/`。
所以：

- **重跑之前先確認舊的已結束**：`ps aux | grep '[n]pm run build'`，或
  `while ps -p <pid> >/dev/null 2>&1; do sleep 5; done` 等它。
- **不要在 build 可能還在跑的時候 `rm -rf dist`。** 兩邊互踩的症狀是
  `rm: dist: Directory not empty` 加上 `ENOENT: dist/index.html`，而且症狀
  出現在後跑的那個 build 身上，看起來像原始碼壞了。
- **`dist/` 憑空缺檔就去 `ps`，不要對症狀猜因。**
- **不要用 `pkill -f` 配廣泛 pattern 清場**：`node.*bin/vite` 會匹配 build 自己
  啟動的 `vite build`。先 `ps aux | grep` 看清楚完整命令列，再針對 PID `kill`。

驗證前端改動時，一次乾淨的 build 就夠了；連續開好幾次只會製造上面這些症狀。

## Where reusable skills live

`~/.claude/skills/` (user-level — reusable across all projects, not
project-scoped):

- `canvas-new-page/SKILL.md` (2026-07-13) — adding a page, an MDX
  article, or a whole topic site to this canvas: routing and PAGE_META
  (incl. the `listed: false` trap), the `lab/` building blocks and the
  rules baked into them, MDX + KaTeX, the four build gates, the
  prohibitions, and how to actually verify with Playwright. Hands the
  data layer off to the Codex skill below.
- `font-clearance/SKILL.md` — license clearance → subsetting → woff2 →
  `LICENSES.md`. Use before bundling any font anywhere.
- `css-modules-porting/SKILL.md` — porting a standalone app's global
  CSS into a multi-page shell without leakage.
- `mincho-typewriter-type-system/SKILL.md` — this site's validated font
  combination; reapply by name rather than re-deriving.
- `README.md` — index of all installed skills, with Codex cross
  references and a portability note.

## Session state: `.claude/CHECKPOINT.*` and `.claude/history/` (2026-07-20)

This repo is the hub every session opens from, so all lines' resume
state lives here even though each research line has its own data repo.
Two layers, split on purpose:

- `.claude/CHECKPOINT.<slug>.md` — **current state only, overwritten in
  place, hard cap 120 lines.** Sub-lines are `## 子線：X` sections inside
  the one file; each carries its own `updated`. Never stack new sections
  on top. Frontmatter `status:` is `active` (has a concrete next step) /
  `paused` (waiting on the user, or only optional backlog left) / `done`.
  A sub-project gets its own file only when two sessions would write the
  same file concurrently — then it carries `parent: <slug>`.
- `.claude/history/` — milestone history, one `HISTORY.<slug>.md` per
  line, newest first. Sessions don't read it; grep it when you need to
  dig. **It is not committed to this repo — origin is public and the
  history carries unpublished numbers and absolute paths.** The
  directory holds its own local-only git repo for recovery, and
  `.gitignore` excludes the whole thing. Check
  `gh repo view --json visibility` before ever version-controlling
  session state.

Both layers are enforced mechanically, not by convention:
`~/.claude/hooks/checkpoint-nudge.sh` (SessionStart) lists active/paused
and flags any checkpoint over the cap or idle over 7 days;
`~/.claude/hooks/checkpoint-guard.sh` (PostToolUse) checks the cap at
write time, snapshots every checkpoint into the local history repo on
each write, and — when a checkpoint loses more than 30% of its lines —
prints the exact pinned-hash command to recover the previous version.

Authoritative definition: `~/.claude/rules/斷點續作.md`. `/bp` and
`/斷點` follow it; `/cc-resume` loads the constitutional-court checkpoint
in full (it is small enough to read whole, so it no longer slices out
"the first section").

## Division of labor (Codex ↔ Claude Code)

- **Codex first:** research data layer, backend data structures, data
  cleaning, indexing, JSON/CSV/schema work; first-draft frontend UI,
  React/Vite visual/interactive demos.
- **Claude Code first:** research judgment, data classification logic,
  comparative-law framing, long-form spec/explanation writing;
  integrating a frontend into the existing multi-page shell, CSS
  Modules leakage prevention, long-term maintenance conventions.
- **Both:** final code review, bug hunting, maintainability checks —
  cross-review each other's work rather than only self-reviewing.

## Outstanding work (handed to Codex, not yet actioned)

See `intl-tax-ops-lab/docs/24_CODEX_HANDOFF_2026-07-02.md` for full
detail. `sources.json` still has only 8 entries as of this writing —
neither proposed fix has landed:

1. Add 5 missing `sources.json` entries for already-parsed documents.
   Schema-checked drafts are in the handoff doc.
2. Retry UN FSDO ingestion with browser-realistic headers before
   reaching for a headless browser (needed only for the
   Cloudflare-gated OECD BEPS page specifically).

## Decided against (don't redo without new information)

- The public/private data-repo boundary (`intl-tax-ops-lab` owns raw
  materials; `my-canvas-lab/src/data/intlTaxOps/` holds only public
  snapshots for both `InternationalTaxOps` and `ManusMetaAcquisition`;
  `ecfa-research-data` follows the same pattern for `ECFAResearch`).
- The Erikas Farbband / Radio Newsman license decision — accepted by
  the user, scoped to this repo only.
- The rewritten git histories in both repos.
- The CSS Modules scoping approach for `InternationalTaxOps`.
- The sidebar-only placement of the classification-lens filter.
- `src/pages/` staying flat, not split into subfolders matching the
  homepage groups — considered and declined; revisit only if one
  group's file count gets uncomfortable to navigate (watch `analysis`).
- This file itself staying a single rewritten document instead of
  stacked dated sections — it drifted into stacking once (see top of
  this file); don't let that happen again.

## Not started (don't start without being asked)

- `humanizer-zh` skill cleanup — flagged in `~/.claude/skills/README.md`
  as a flat file inconsistent with the `<name>/SKILL.md` convention,
  plus unreconciled overlap with several Codex skills.
- Watch-list items have no topic-relevance field; if added to
  `frontier_watchlist.json`, the relations graph should wire real edges
  instead of the current unconnected column.
- `intl-tax-ops-lab`'s `data/raw`/`data/parsed` PDFs were never audited
  for their own copyright status — irrelevant while they stay off the
  public frontend, worth knowing if that boundary is ever revisited.
