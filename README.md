# Phenom Canvas Lab

音樂創作工具與法律、財稅、政策研究視覺化的互動實驗場。

## 專案

| 分類 | 頁面 | 說明 |
| --- | --- | --- |
| 音樂工具 | 自動調音器 | 吉他／烏克麗麗／吉他麗麗，含 Open G、DADGAD 等特殊定弦 |
| 音樂工具 | 烏克麗麗調音器 | 視覺化品格指引，適合初學者 |
| 音樂工具 | 聲音調音器 | 即時音高偵測，鋼琴捲軸呈現聲線走向 |
| 音樂工具 | Klavier | 六種音色合成音源，支援多指和弦與電腦鍵盤彈奏 |
| 研究地圖 | 政府債務研究 | 主權債務、地方融資平台與國際比較研究地圖 |
| 研究地圖 | 國際稅法研究桌 | OECD、UN、洛桑稅法圈與跨境稅制前沿監測 |
| 研究地圖 | 地方財政與遠洋捕撈 | 財政缺口、罰沒收入、異地執法與資料可信度 |
| 研究地圖 | ECFA 研究地圖 | ECFA 官方文本、早收產品、2024 中止優惠、實證研究基礎與論文研究史 |
| 法政解析 | 空氣污染防制費 | 空污費構成要件、稽徵流程、逃漏效果與財政收入脈絡 |
| 法政解析 | 日本油稅分析 | 日本油價中的稅費層次、二重課稅爭議與制度結構 |
| 法政解析 | Manus–Meta 跨境收購 | AI 新創退出、投資審查、技術管制與國際稅法案例剖析 |
| 生活雷達 | 台北電影節售票雷達 | OpenTix 即時餘額同步，將可買場次壓成決策儀表板 |

## 技術棧

- **框架**：React 18 + Vite
- **樣式**：Tailwind CSS
- **路由**：React Router v6（`import.meta.glob` 自動探索 `src/pages/`）
- **圖示**：lucide-react
- **部署**：Vercel

## AEO 與 SEO

全站以 `src/components/SeoHead.jsx` 統一產生路由層級的 title、description、canonical、Open Graph／Twitter（`summary_large_image`＋固定 og 圖）、breadcrumb 與 Organization／WebSite／WebPage／Article JSON-LD。首頁另帶一份 `ItemList`，內容就是頁面上實際列出的 canvas 目錄（描述畫面上有的東西，不憑空捏造）。首頁列出的頁面會各自帶有可辨識的名稱與摘要；僅供個人決策或設計測試的頁面不進入索引。

正式網址寫在 `.env.production` 的 `VITE_SITE_URL`（目前為 `https://my-canvas-lab.vercel.app`），build 時烤進 client bundle，node 腳本則透過 `scripts/site-config.mjs` 讀同一個值——canonical、Open Graph、JSON-LD、sitemap 全部指向同一處。網址搬家只改這一行。內容頁保持可讀的標題層級、來源連結與可驗證敘述；不要為取得 FAQ rich result 而加入畫面上沒有的問答或結構化資料。

### Build 期預渲染（讓不跑 JS 的爬蟲與答案引擎看得到內文）

`vite build` 之後接兩步（見 `package.json` 的 `build`）：

- `scripts/prerender.mjs`：用 Playwright 起一個 headless Chromium，把 `dist/` 以 SPA fallback 靜態服務起來，逐一開啟每條可索引路由，等 React 掛載完、`SeoHead` 寫好 `<head>` 後，抓渲染後的完整 HTML 寫回 `dist/<route>/index.html`。爬蟲因此拿到真的內文與正確的 per-page metadata，而非空的 `#root`。路由列表由 `scripts/routes.mjs` 依 `src/pages/` 的檔案路徑規則列出（與 `App.jsx` 同一套；`_` 開頭是零件不成路由），新增頁面不用改腳本。noindex 頁（PaletteLab、TaipeiFilmFestival）不預渲染。趕時間可用 `PRERENDER=0 npm run build` 跳過。
- `scripts/generate-sitemap.mjs`：用同一份路由列表產 `dist/sitemap.xml`（絕對網址、排除 noindex）。`public/robots.txt` 已放行主要 AI／答案引擎爬蟲（GPTBot、ClaudeBot、PerplexityBot、Google-Extended 等）並指向 sitemap。

`public/og-default.png`（1200×630）由 `scripts/generate-og-image.mjs` 用 Playwright 渲染首頁識別色的模板產生；改文案或色票時重跑 `npm run og:image`，PNG 進版控。Vercel 以檔案系統優先於 `vercel.json` 的 SPA rewrite，預渲染的巢狀 `index.html` 會先被服務，catch-all 只接沒有預渲染檔的路徑。

### 內容豐富的研究頁：每個分頁一個可索引網址

分頁走 `?tab=` query param 的頁面，爬蟲只看得到預設分頁，其餘高價值內容沒有各自的網址可排名。憲法法庭案例庫的作法是替每個分頁開一條乾淨、可預渲染、可獨立索引的路由 `/constitutionalcourt/<tab>`（研究問題、意見書圖譜、沿革、大法官…），各帶鎖定關鍵字的 title／description／keywords 與三層 breadcrumb，整個案例庫另以 schema.org `Dataset` 描述（可進 Google Dataset Search）。SEO 資料集中在 `src/pages/_constitutional-court/seo.js`（純資料，node 腳本與前端共用），路由在 `App.jsx` 的 `CCTabRoute`，分頁狀態由 `ConstitutionalCourt.jsx` 從 path param 讀取；`?tab=` 深連結全部沿用不動。要為別的研究頁比照辦理就複製這三個接點。

### 資料 repo 與 Canvas 的責任邊界

| 工作 | 負責位置 |
| --- | --- |
| `title`、description、canonical、Open Graph、JSON-LD、語意 HTML、robots、sitemap、索引與 noindex 判斷 | Canvas 前端 repo |
| 研究事實、原始來源、引註、資料更新日期、可公開的摘要與圖片素材 | 對應 data repo |
| 將資料 repo 的公開快照轉成頁面搜尋摘要與結構化資料 | Canvas；不得把 private repo 路徑或內部處理狀態輸出到頁面或 metadata |

因此，AEO／SEO 的技術實作與發佈設定屬於 Canvas；data repo 的責任是供應可驗證、可更新的內容。若研究頁需要更精確的搜尋摘要，可在資料快照加入公開的 `seo` 欄位（例如摘要、主題、更新日），再由 Canvas 的 metadata 層讀取；不要在 data repo 放 `robots.txt`、`sitemap.xml` 或部署網域設定。

## 設計系統

色彩、字級、間距等 design token 定義在 `src/styles/tokens.css`（單一事實來源，可複製到其他專案）；共用元件（LangSwitch 雙語切換、FontSizeControl 字級控制、PageShell、Eyebrow）在 `src/components/`。完整規範與遷移現況見 `docs/DESIGN.md`。`npm run validate:tokens` 在 build 時擋住已遷移頁面的裸 hex 色值。

## 字體系統

站內字體由 `src/index.css` 的 CSS 變數統一管理：

- `--font-body`：正文與一般 UI 文字。
- `--font-display`：`h1-h3` 與需要標題感的文字。
- `--font-accent`：只用於少量裝飾性英文/眉標。

Tailwind 的 `font-sans` 已映射到 `--font-body`，不得再用框架預設 sans-serif 蓋掉站內字體。新增頁面文字或資料快照後，要重建 `public/fonts/*-subset.woff2`，並跑：

```bash
npm run validate:fonts
npm run build
```

`npm run build` 會先檢查字體 subset 覆蓋率；缺字時必須先重切 subset，不能直接跳過檢查。

## 本地開發

```bash
npm install
npm run dev
```

## 研究資料同步

研究頁面的資料層主本在對應的 data repo。本專案不會在瀏覽器或部署環境中連線讀取 private/sibling repo；頁面只 import 本 repo 內的快照檔：

```text
src/data/governmentDebt.json
src/data/ecfaResearch.json
src/data/fiscalEnforcementRisk.json
```

ECFA 目前由 `../ecfa-research-data` 管理。主軸是 ECFA 官方文本、五個附件、早收產品、2024 中止優惠與後續實證研究基礎；論文 meta-analysis 只是研究史組成部分。

一般更新流程：

```bash
cd ../<topic>-research-data
npm run sync
cd ../my-canvas-lab
npm run build
```

這個同步目前是手動觸發。不要預設掛進 `build`，因為 Vercel 等部署環境不一定有 sibling private repo。凡是同步到 `src/data/` 並部署出去的內容，都視為公開前端資料；raw 素材、書籍、筆記、工程日誌留在 private data repo。

ECFA 頁面的資料可以保留研究整理所需的欄位，但畫面只能呈現讀者語言。前端不得直接顯示資料整理語彙、檔名、欄位名、狀態碼、路徑、raw/copy/snapshot 類描述，必須在 React 頁面轉成自然的繁體中文。名詞解釋與事實查核是兩個分頁，不合併。

ECFA 視覺規範：不要用大面積 KPI 卡片、單純計數卡片、佔空間但只重述數字的直條圖。重要數字應嵌在時間軸、事件說明、對照表或精簡儀表盤列中；不影響理解的整理狀態、抓取數、處理數不要放到 canvas。標籤和表格文字要能換行但不可互相遮蔽，色彩維持藕粉、灰褐、深玫瑰的低彩度組合。

## 新增頁面

在 `src/pages/` 新增一個 `.jsx` 檔，路由自動生效（路徑為 `/{檔名小寫}`）。若要在首頁顯示卡片，在 `src/App.jsx` 的 `PAGE_META` 補上對應設定。

## 待辦

見 [TODO.md](./TODO.md)。
