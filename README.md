# Phenom Canvas Lab

音樂創作工具與法律、財稅、政策研究視覺化的互動實驗場。

## 專案

| 分類 | 頁面 | 說明 |
| --- | --- | --- |
| 音樂工具 | 自動調音器 | 吉他／烏克麗麗／吉他麗麗，含 Open G、DADGAD 等特殊定弦 |
| 音樂工具 | 烏克麗麗調音器 | 視覺化品格指引，適合初學者 |
| 音樂工具 | 聲音調音器 | 即時音高偵測，鋼琴捲軸呈現聲線走向 |
| 音樂工具 | Klavier | 六種音色合成音源，支援多指和弦與電腦鍵盤彈奏 |
| 分析工具 | 空氣污染防制費 | 空污法§16 構成要件、稽徵程序、法律效果、逃漏、財政收支、制度沿革 |
| 分析工具 | 日本油稅分析 | 逐層拆解油價中的稅費結構，含二重課稅可視化 |
| 分析工具 | 政府債務研究 | 全球主要國家債務現況、中國 LGFV 城投深度分析 |
| 分析工具 | Manus–Meta 跨境收購 | AI 新創跨境退出 × 投資審查 × 技術管制 × 國際稅法 |

## 技術棧

- **框架**：React 18 + Vite
- **樣式**：Tailwind CSS
- **路由**：React Router v6（`import.meta.glob` 自動探索 `src/pages/`）
- **圖示**：lucide-react
- **部署**：Vercel

## 本地開發

```bash
npm install
npm run dev
```

## 研究資料同步

`GovernmentDebt` 的資料層主本在 private data repo `government-debt-research-data`。本專案不會在瀏覽器或部署環境中連線讀取該 private repo；頁面只 import 本 repo 內的快照檔：

```text
src/data/governmentDebt.json
```

更新流程：

```bash
cd ../government-debt-research-data
npm run sync
cd ../my-canvas-lab
npm run build
```

這個同步目前是手動觸發。不要預設掛進 `build`，因為 Vercel 等部署環境不一定有 sibling private repo。凡是同步到 `src/data/` 並部署出去的內容，都視為公開前端資料；raw 素材、書籍、筆記、工程日誌留在 private data repo。

## 新增頁面

在 `src/pages/` 新增一個 `.jsx` 檔，路由自動生效（路徑為 `/{檔名小寫}`）。若要在首頁顯示卡片，在 `src/App.jsx` 的 `PAGE_META` 補上對應設定。

## 待辦

見 [TODO.md](./TODO.md)。
