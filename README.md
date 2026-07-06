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
