# 設計系統（canvas-lab 孵化版）

單一事實來源是 `src/styles/tokens.css`：純 CSS 自訂屬性、單一 `:root` 區塊，設計上可原封複製到 MkDocs 站的 `extra.css` 或 vanilla 專案。Tailwind（`tailwind.config.js` 的 `theme.extend`）只是它的讀取層；改色值改 tokens.css，不改 config。字體系統不在本檔範圍——三個 `--font-*` 變數與 @font-face 定義在 `src/index.css`，規範見 `HANDOFF.md` 的 Font system 章節（stable, don't re-derive）。

## Token 語意

| 前綴 | 內容 | 使用時機 |
|---|---|---|
| `--c-paper` | 暖近白 `#fbfaf7` | 正文區唯一允許的底色 |
| `--c-surface(-raised)` | 卡片、側欄底 | 需要與正文區分層時 |
| `--c-ink(-muted/-faint)` | 三級文字 | 正文／輔助說明／註記 |
| `--c-line(-soft)` | 分隔線 | 邊框／髮絲線 |
| `--c-accent(-soft)` | 品牌藍綠 `#4c7971` | 互動與強調；與 intl-tax-ops-lab、font-lab 共用 |
| `--c-warn/-danger/-info` | 低彩度狀態色 | 徽章、警示 |
| `--text-*` | 字級 scale（rem） | `--text-body` = 18px 是正文基準 |
| `--space-*` | 4px 網格 | 主要給 CSS Modules／raw CSS／MkDocs 用 |
| `--radius-*`、`--shadow-*` | 圓角、極淡陰影 | 紙感，不做 Material 浮起 |
| `--dur-*`、`--ease-out` | 120/200/320ms | 動效只准 opacity/transform |

## 字級規則

- 正文 18px（`--text-body`）。匯文明朝筆畫細，CJK 明朝正文要比拉丁預設大一級；16px 以下視為過小。
- 讀者字級控制走容器級 multiplier：長文容器掛 `.prose-scaled` class 與 `style={{ '--fs': scale }}`，內部閱讀文字用 em 字級（Tailwind 的 `text-scaled-xs/sm/base/lg`）才會跟著縮放。儀表板、調音器等密集 UI 不掛 `.prose-scaled`，用 `text-token-sm/xs` 固定字級。
- 不動 `html` 的 font-size：那會連動所有 Tailwind rem 間距，拉壞儀表板版面。

## 共用元件（`src/components/`）

| 元件 | 用法 |
|---|---|
| `LangSwitch` ＋ `useLang` | `const { lang, setLang, t } = useLang(dict)`；字典以中文原文為 key，zh 零成本、漏譯自動回退。localStorage `canvaslab:lang`，同步 `document.documentElement.lang`。新頁一律用它，不再自造 lang state。 |
| `FontSizeControl` ＋ `useFontScale` | `const [scale, setScale] = useFontScale()`；五檔 0.9–1.4，localStorage `canvaslab:fontScale`。學術長文頁掛在 header 右側。 |
| `PageShell` | 新頁與簡單長文頁的外殼：`--c-paper` 底、prose（~65ch）或 wide 寬度、document.title、header 右側 controls slot。自帶複雜外殼的儀表板頁（分頁導覽、側欄）不硬套。 |
| `Eyebrow` | 眉標 kicker。打字機 accent 字體唯一的預設允許位置。 |

## 色票庫

全域 token 只收中性色與品牌 accent。頁面識別色票收在各頁頂部的 `*_VARS` 物件（`// token-exempt` 標記），目前有：

| 色票 | 所在 | 性格 |
|---|---|---|
| 玫瑰灰（`HOME_VARS`） | `src/App.jsx` | 首頁：藕粉底、灰褐 ink、玫瑰 accent |
| 藕粉／深玫瑰（`ECFA_VARS`） | `src/pages/ECFAResearch.jsx` | 低彩度研究儀表板（README 的 ECFA 視覺規範） |
| 墨綠米（`--fer-*`） | `src/pages/FiscalEnforcementRisk.jsx` | 注入式 CSS 的頁內變數區塊 |
| 冷灰藍綠 | `src/pages/InternationalTaxOps.module.css` | 冷調工作台；`--teal` 已指回 `--c-accent` |

升格判準：同一套色票被兩頁以上使用，才升進 tokens.css 成具名 palette；單頁實驗色不升格。

## 品味參照 → 具體規則

| 參照 | 落地規則 |
|---|---|
| Notion 的 typography | 明確的字級層級（token scale，不寫死 px）；長文行長上限約 65ch（PageShell prose） |
| GitHub 的資訊密度 | 密集 UI 允許 `--text-sm/xs`，但那是 chrome 不是正文；正文永遠 ≥ `--text-body` |
| Obsidian 的知識網路 | 頁間、資料間的連結是一等公民；引用與出處要可點 |
| Material 的 accessibility | 文字對比至少 AA；互動元件有可見 focus；語言切換同步 `html lang` |
| Apple 的動畫節制 | 動效只用 opacity/transform，時長 ≤ `--dur-slow`；沒有理由就不加動畫 |
| Stripe 的首頁品質 | 首頁是全站驗收線：新慣例先過首頁這關 |
| Vercel 的文件版式 | 長文頁比照其 docs：窄欄、清楚層級、乾淨底色 |

## 禁止事項

- 正文區底色只准 `--c-paper`（或頁面色票中同角色的近白值）；不放任何搶眼背景色。
- 不引入 UI 框架（shadcn、MUI 等）。
- 不新增字體、不改 `--font-*` 三變數與 @font-face（見 HANDOFF）。
- 遷移過的檔案不寫裸 hex：色值進 tokens.css 或頁面 `*_VARS`。`npm run validate:tokens` 在 build 時強制檢查；`scripts/design-token-exceptions.txt` 是未遷移清單，只准變短。

## 遷移現況（2026-07-06）

- 已遷移：App.jsx（首頁）、ECFAResearch（含 FontSizeControl 示範）、批 B 各頁、共用元件。
- 例外清單裡剩下的：見 `scripts/design-token-exceptions.txt`（批 C 的注入式 CSS 頁因 validator 豁免機制限制暫留清單；批 D 調音器頁機會性遷移）。
- 下一步（輻射）：tokens.css 複製進兩個 MkDocs 課程站的 extra.css，對齊變數名。
