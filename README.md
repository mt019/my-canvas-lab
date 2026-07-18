# Phenom Canvas Lab

一個互動實驗場：音樂工具、法律與財稅政策的研究地圖、教學用的統計模擬，收在同一個 React canvas 裡。線上版在 <https://my-canvas-lab.vercel.app>。

## 內容

首頁本身就是完整目錄，分五區：

- **研究地圖** — 資料層獨立、能長期累積的小型工作台。憲法法庭案例庫、國際稅法研究桌、政府債務研究、ECFA 研究地圖、中研院法研所出版品等。
- **法政解析** — 單一制度或案例的結構化拆解。空氣污染防制費、日本油稅、Manus–Meta 跨境收購。
- **教學實驗室** — 方法本身的來歷與限制，配上可以親手轉動的模擬。統計學實驗室、虛無假設、等效檢定。
- **即用工具** — 調音器（吉他／烏克麗麗／聲音）、Klavier 合成器、色票試穿間。
- **生活雷達** — 簡報、活動曆、台北電影節售票雷達。

多數研究頁的資料主本在各自的 data repo，canvas 只 import 已同步進來的公開快照。

## 技術棧

- **框架**：React 18 + Vite
- **路由**：React Router v6，檔案路徑即路由（`import.meta.glob` 掃 `src/pages/`）
- **樣式**：Tailwind CSS + `src/styles/tokens.css` 設計系統
- **圖示**：lucide-react
- **部署**：Vercel

## 本地開發

```bash
npm install
npm run dev
```

`npm run build` 會依序跑資料驗證（字體覆蓋、design token、色彩、數學標記、案件查詢）、`vite build`、預渲染與 sitemap。

## 搜尋與答案引擎（SEO / AEO）

`src/components/SeoHead.jsx` 統一產生每條路由的 title、description、canonical、Open Graph／Twitter 卡片與 JSON-LD（Organization、WebSite、WebPage／Article、breadcrumb）。首頁另帶一份 `ItemList`，內容就是畫面上實際列出的目錄。描述只寫頁面真的有的東西——不為了 rich result 捏造問答或評分。

正式網址集中在 `.env.production` 的 `VITE_SITE_URL`（現為 `https://my-canvas-lab.vercel.app`）。build 時烤進 client bundle，node 腳本透過 `scripts/site-config.mjs` 讀同一個值，canonical、Open Graph、sitemap 全部指向同一處。網址搬家只改這一行。

**Build 期預渲染。** `scripts/prerender.mjs` 用 Playwright 起一個 headless Chromium，把 `dist/` 靜態服務起來，逐條可索引路由等 React 掛載完、`SeoHead` 寫好 `<head>` 後，抓完整 HTML 寫回 `dist/<route>/index.html`。不跑 JS 的爬蟲與答案引擎因此拿到真的內文與正確的 per-page metadata，而非空的 `#root`。路由由 `scripts/routes.mjs` 列出（與 `App.jsx` 同一套檔案路徑規則），`scripts/generate-sitemap.mjs` 用同一份清單產 `dist/sitemap.xml`。`public/robots.txt` 放行主要 AI 爬蟲（GPTBot、ClaudeBot、PerplexityBot、Google-Extended…）並指向 sitemap。Chromium 起不來時 fail-soft 跳過預渲染、保住 deploy；趕時間可 `PRERENDER=0 npm run build`。

`public/og-default.png`（1200×630）由 `scripts/generate-og-image.mjs` 產，改文案或色票後重跑 `npm run og:image`，PNG 進版控。

**憲法法庭案例庫：分頁、大法官、案件都有可索引網址。** 走 `?tab=` query 的頁面，爬蟲只看得到預設分頁。案例庫改成三層乾淨路由：每個分頁 `/constitutionalcourt/<tab>`、每位有實質參與的大法官 `/constitutionalcourt/justices/<姓名>`、精選長尾案件 `/constitutionalcourt/case/<字號>`，各帶鎖定關鍵字的 title／description 與結構化資料（整庫一個 schema.org `Dataset`、大法官頁 `Person`、案件頁 `Legislation`）。分頁列與大法官名都是真的 `<Link>`；`?tab=`／`?j=`／`?doc=` 舊深連結仍可用。

案件不全建（813 件會讓每次部署的預渲染爆量），只收精選長尾：全部憲法法庭判決（憲判，從資料現算、新件自動納入）＋一份凍結的釋字清單 `case-index.js`（引用網絡 in-degree 高者、稅法核心、大眾地標、湯德宗東吳憲法課 OCW 講義討論的案）。凍結的原因是那份清單有一部分來源在 repo 外的講義檔，Vercel build 時拿不到，故在本機算好後入版控。哪些可索引由 `seo.js` 的 `caseIsIndexable` 決定，`routes.mjs`（build）與 `CaseRoute.jsx`（runtime）共用它，索引集合與 robots 永遠一致。

SEO 資料集中在 `src/pages/_constitutional-court/seo.js`（純資料，node 腳本與前端共用），路由在 `App.jsx`，分頁／姓名／字號由 `ConstitutionalCourt.jsx` 從 path param 讀。要為別的研究頁比照辦理，就複製這幾個接點。

**責任邊界。** 索引技術（metadata、robots、sitemap、預渲染、schema）屬 canvas 前端；研究事實、原始來源、引註、更新日期屬各 data repo。canvas 把 data repo 的公開快照投影成搜尋摘要與結構化資料，不把 private repo 路徑或內部處理狀態輸出到頁面。

## 效能

首頁進入點只有約 16 KB gzip；React、router、圖示集切成一個 `react-vendor` 穩定分塊，跨路由與跨部署都能快取。憲法法庭全文（理由書、行憲前解釋）是動態 `import()` 的懶載分塊，展開卡片時才抓。新增重量級依賴時，確認它落在使用它的頁面分塊，而非被拉進首頁進入點。

## 設計系統

色彩、字級、間距等 design token 定義在 `src/styles/tokens.css`（單一事實來源）；共用元件在 `src/components/`。完整規範見 `docs/DESIGN.md`。`npm run validate:tokens` 在 build 時擋掉已遷移頁面的裸 hex 色值。

## 字體系統

字體由 `src/index.css` 的 CSS 變數統一管理：`--font-body`（正文與 UI）、`--font-display`（`h1–h3`）、`--font-accent`（少量裝飾性英文眉標）。Tailwind 的 `font-sans` 已映射到 `--font-body`，不得再用框架預設 sans-serif 蓋掉。新增頁面文字或資料快照後要重建 `public/fonts/*-subset.woff2`，再跑 `npm run validate:fonts`；`npm run build` 會先檢查覆蓋率，缺字時必須先重切 subset，不能跳過檢查。

## 研究資料同步

研究頁的資料主本在對應的 data repo。本專案不在瀏覽器或部署環境連線讀取 private/sibling repo，頁面只 import 本 repo 內的快照檔（`src/data/*.json`）。一般流程：

```bash
cd ../<topic>-research-data
npm run sync
cd ../my-canvas-lab
npm run build
```

同步為手動觸發，不掛進 `build`——Vercel 等部署環境不一定有 sibling private repo。凡同步進 `src/data/` 並部署出去的都視為公開前端資料；raw 素材、書籍、筆記、工程日誌留在 private data repo。頁面只呈現讀者語言，不直接顯示檔名、欄位名、狀態碼、路徑或整理狀態；這類措辭必須在 React 頁面轉成自然的繁體中文。各研究頁的視覺規範見 `docs/DESIGN.md`。

## 新增頁面

在 `src/pages/` 新增一個 `.jsx` 檔，路由自動生效（路徑為 `/{檔名小寫}`；子目錄成為 namespace）。要在首頁顯示卡片，在 `src/App.jsx` 的 `PAGE_META` 補上對應設定。

## 待辦

見 [TODO.md](./TODO.md)。
