# 設計系統（canvas-lab 孵化版）

單一事實來源是 `src/styles/tokens.css`：純 CSS 自訂屬性、單一 `:root` 區塊，設計上可原封複製到 MkDocs 站的 `extra.css` 或 vanilla 專案。Tailwind（`tailwind.config.js` 的 `theme.extend`）只是它的讀取層；改色值改 tokens.css，不改 config。字體系統不在本檔範圍——三個 `--font-*` 變數與 @font-face 定義在 `src/index.css`，規範見 `HANDOFF.md` 的 Font system 章節（stable, don't re-derive）。

## Token 語意

| 前綴 | 內容 | 使用時機 |
|---|---|---|
| `--c-paper` | 冷近白 `#fdfdfc`（過渡預設） | 正文區唯一允許的底色 |
| `--c-surface(-raised)` | 卡片、側欄底 | 需要與正文區分層時 |
| `--c-ink(-muted/-faint)` | 三級文字 | 正文／輔助說明／註記 |
| `--c-line(-soft)` | 分隔線 | 邊框／髮絲線 |
| `--c-accent(-soft)` | 壓灰深藍（過渡預設；正式值由 PaletteLab 選定） | 互動與強調 |
| `--c-warn/-danger/-info` | 低彩度狀態色 | 徽章、警示 |
| `--text-*` | 字級 scale（rem） | `--text-body` = 18px 是正文基準 |
| `--space-*` | 4px 網格 | 主要給 CSS Modules／raw CSS／MkDocs 用 |
| `--radius-*`、`--shadow-*` | 圓角、極淡陰影 | 紙感，不做 Material 浮起 |
| `--dur-*`、`--ease-out` | 120/200/320ms | 動效只准 opacity/transform |

## 字級規則

- 正文 18px（`--text-body`）。匯文明朝筆畫細，CJK 明朝正文要比拉丁預設大一級；16px 以下視為過小。
- 讀者字級控制（2026-07-07 起）＝**整頁等比縮放**：頁面內容根容器 `style={{ zoom: scale }}`，七檔 0.85–1.6，像瀏覽器 ⌘+。PageShell 內建；自帶外殼的頁把 zoom 掛頁根 div。所有元素（含表格、nav、寫死 px 的字）一律跟著縮放。
- 舊的 `--fs`／`.prose-scaled`／`text-scaled-*` 文字級 multiplier 保留為次要機制；**不要與 zoom 同時掛 --fs**，會疊乘。
- 不動 `html` 的 font-size。

## 共用元件（`src/components/`）

| 元件 | 用法 |
|---|---|
| `LangSwitch` ＋ `useLang` | `const { lang, setLang, t } = useLang(dict)`；字典以中文原文為 key，zh 零成本、漏譯自動回退。localStorage `canvaslab:lang`，同步 `document.documentElement.lang`。新頁一律用它，不再自造 lang state。 |
| `FontSizeControl` ＋ `useFontScale` | `const [scale, setScale] = useFontScale()`；七檔 0.85–1.6，localStorage `canvaslab:fontScale`。scale 掛頁根 `zoom`（見字級規則）。學術長文頁放 header 右側。 |
| `PageShell` | 新頁與簡單長文頁的外殼：`--c-paper` 底、prose（~65ch）或 wide 寬度、document.title、header 右側 controls slot。自帶複雜外殼的儀表板頁（分頁導覽、側欄）不硬套。 |
| `Eyebrow` | 眉標 kicker。打字機 accent 字體（Erikas）唯一的預設允許位置——曾於 2026-07-07 短暫用於 h1–h3 拉丁面，同日因行內數字紋理過噪而改回 Radio Newsman；標題中文面維持 Huiwen Mincho（與內文同，取代 GenWanMin2）。GenWanMin2 已無 token 引用，字檔暫留。 |

## 色票庫

**色票庫的家是 `/palettelab`（資料層在 `src/styles/palettes.js`）**：站內現用、名畫、器物、水果、中國色五組候選票，整頁即時試穿、可複製成 tokens.css 片段。**「設為全站配色」**把選定票寫進 localStorage（`canvaslab:palette`）並在開站時（`main.jsx` 的 `bootSitePalette()`）套到 `:root` 的 `--c-*` token——全站配色是每台瀏覽器的使用者設定，tokens.css 只是無設定時的中性 fallback。紙面材質（手工紙／簾紋／布紋／細點，全部程式生成、2–4% 透明度）同機制（`canvaslab:texture`），套在 body 的 `--paper-texture`。

**閱讀面鐵律（2026-07-07 使用者裁定）**：色票只管裝飾與框架；每套色票的 `paper` 角色（大段正文的底）必須近白、只准帶極輕微色傾向，有色的 `surface` 只能用在邊框、側欄、badge 等鉻件。新色票不符此規則不收。

頁面識別色票收在各頁頂部的 `*_VARS` 物件（`// token-exempt` 標記）：首頁與翻譯工程的藕粉玫瑰、ECFA 藕粉深玫瑰、AirPollution 陶土粉、ManusMeta 靛藍銅、IntlTaxOps 冷灰茶青（`--teal: #4c7971`，使用者點名保留）、FER 墨綠米。使用者不喜歡 GovernmentDebt 現行配色（「clunky」），待 PaletteLab 選定後重配。

升格判準：使用者在 PaletteLab 點名，或同一套色票被兩頁以上使用。新增候選票一律先進 PaletteLab，不直接改 tokens.css。

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

- **AI 預設審美零容忍**（2026-07-07 使用者裁定）：奶油底＋灰綠 accent 的組合（`#fbfaf7`/`#f4f1ea`＋`#4c7971` 式搭配）不得作為任何頁面的預設外觀；大圓角厚陰影的「產品感」卡片同屬此列。判準：看起來像 LLM 產品官網就重來。
- **大面積低資訊密度卡片禁止**：KPI 大卡、只放一個數字的色塊卡不准用；數字與說明併入行內（表格列、列表列、行內註記），參照 GitHub 的密度。此規則原是 ECFA 單頁規範（HANDOFF），現升為全站規則。
- **金箔限文字筆畫**（2026-07-07 使用者裁定）：`GOLD_FOIL` 漸層只准以 `.foil-text`（background-clip: text）染文字，或細描邊、髮絲線等同量級小面積；禁止整面填充按鈕、卡片、大色塊——整顆金箔按鈕已被判定醜。`.foil` 的整面用法退場，現存唯一違例在 `PaletteLab.jsx:211-215`（修正任務見 TODO 全局）。
- 正文區底色只准 `--c-paper`（或頁面色票中同角色的近白值）；不放任何搶眼背景色。
- 不引入 UI 框架（shadcn、MUI 等）。
- 不新增字體、不改 `--font-*` 三變數與 @font-face（見 HANDOFF）。
- 遷移過的檔案不寫裸 hex：色值進 tokens.css 或頁面 `*_VARS`。`npm run validate:tokens` 在 build 時強制檢查；`scripts/design-token-exceptions.txt` 是未遷移清單，只准變短。

## 遷移現況（2026-07-06）

- 已遷移：App.jsx（首頁）、ECFAResearch（含 FontSizeControl 示範）、批 B 各頁、共用元件。
- 例外清單裡剩下的：見 `scripts/design-token-exceptions.txt`（批 C 的注入式 CSS 頁因 validator 豁免機制限制暫留清單；批 D 調音器頁機會性遷移）。
- 下一步（輻射）：tokens.css 複製進兩個 MkDocs 課程站的 extra.css，對齊變數名。
