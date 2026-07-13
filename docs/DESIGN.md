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

## 頁內建構元件（`src/components/lab/`，2026-07-13 建）

`components/` 放站級外殼，`components/lab/` 放頁內建構材料。抽取判準：**同一個東西已被兩個以上真實頁面各自手刻過**才抽；只出現一次的形狀留在該頁。抽象若在真實用例上套不動，改的是抽象不是頁面。

| 元件 | 用法與硬規則 |
|---|---|
| `Tabs` ＋ `useTabParam(key, fallback)` | 分頁狀態一律進網址 query（深連結、上一頁可回），預設值不寫進 query，切頁自動捲到頂。`variant="underline"` 給頁面主分頁，`"quiet"` 給次分頁與元件內部切換。 |
| `Accordion` ＋ `useExpandedSet(ids)` | 多選展開，**初值一律全部展開，且沒有「預設收合」的參數**——收合卡片會把讀者要的東西藏起來，這條規則寫進 API 而不是寫在文件裡靠人記得。 |
| `Badge` | `tone` 只吃語意色槽（danger/warning/success/info/neutral 或 cat-1…cat-8），不吃任意顏色。 |
| `HoverCite` | 引註標記，hover/focus 顯示出處。出處物件來自資料倉，缺 locator 的引註在資料倉就 FAIL，前端不做把關。 |
| `Math`（匯入時建議命名為 `Tex`，避免遮蔽全域 `Math`） | KaTeX 包裝，見下方例外。 |
| `Prose` | MDX 文章的排版映射層：`.mdx` 只寫純 markdown，`h2`/`p`/`blockquote` 的樣式在這裡一次決定。這是 markdown 驅動內容而不破壞設計系統的關鍵。 |
| `chart/`（`scale.js`、`ChartFrame`、`Axis`、`marks`） | 只有原語（比例尺、軸、格線、`Bars`/`Line`/`Dots`/`AreaWash`/`RuleLine`），沒有「圖表元件」。只吃分類色槽，沒有 `fill` 參數可以繞過——深墨色不塗大面積這條規則寫進 API。 |

### 長條怎麼畫（2026-07-13 修訂，取代舊的「近白淡底＋細框」）

舊寫法是 `--cat-N-bg` 近白填色加 1px 同色細框。這在色籤尺寸成立，放大到一根 200px 高的長條就變成**空的線框**：沒有量感，直角＋細框讀起來像試算表。Notion、GitHub、Observable 的長條都是**實色填充、低彩度、無外框、小圓角**。

現行 `Bars` 的畫法：填色＝該色槽的墨色 `--cat-N-tx`，`fill-opacity` 0.22（重點長條 0.85）；同色描邊 `stroke-opacity` 0.35（重點長條無框）；圓角 3px。色彩淡而有色相，面積仍然輕。**一張圖只有一個色相**，重點長條用同色實心或單一語意色（如偽陽性用 danger），不要每根一個顏色。

Y 軸標題橫排放在軸頂，不旋轉 90 度立在側邊。

## 色票庫

**色票庫的家是 `/palettelab`（資料層在 `src/styles/palettes.js`）**：站內現用、名畫、器物、水果、中國色五組候選票，整頁即時試穿、可複製成 tokens.css 片段。**「設為全站配色」**把選定票寫進 localStorage（`canvaslab:palette`）並在開站時（`main.jsx` 的 `bootSitePalette()`）套到 `:root` 的 `--c-*` token——全站配色是每台瀏覽器的使用者設定，tokens.css 只是無設定時的中性 fallback。紙面材質（手工紙／簾紋／布紋／細點，全部程式生成、2–4% 透明度）同機制（`canvaslab:texture`），套在 body 的 `--paper-texture`。

**閱讀面鐵律（2026-07-07 使用者裁定）**：色票只管裝飾與框架；每套色票的 `paper` 角色（大段正文的底）必須近白、只准帶極輕微色傾向，有色的 `surface` 只能用在邊框、側欄、badge 等鉻件。新色票不符此規則不收。

頁面識別色票收在各頁頂部的 `*_VARS` 物件（`// token-exempt` 標記）：首頁與翻譯工程的藕粉玫瑰、ECFA 藕粉深玫瑰、AirPollution 陶土粉、ManusMeta 靛藍銅、IntlTaxOps 冷灰茶青（`--teal: #4c7971`，使用者點名保留）、FER 墨綠米。使用者不喜歡 GovernmentDebt 現行配色（「clunky」），待 PaletteLab 選定後重配。

升格判準：使用者在 PaletteLab 點名，或同一套色票被兩頁以上使用。新增候選票一律先進 PaletteLab，不直接改 tokens.css。

### 色彩哲學：學 Notion（2026-07-07 使用者裁定）

Notion 的 tag／badge 色系從不出醜，原因是四條紀律，本站色彩系統一律照做：

0. **和諧來自「明度齊一＋彩度中低＋色相多樣」，不是來自避開某些色相，更不是逃去灰色（2026-07-07 使用者關鍵指正）。** 本站 `Badge` 元件那組 tone（`#984f62` 紅／`#8a6d3b` 金／`#566d50` 綠／`#4c7971` 茶青／`#615982` 藍／`#945d70` 紫／`#52616a` 灰）之所以放在一起很和諧，是因為它們明度全部落在 L≈0.48–0.55、彩度都在 0.05–0.10、色相卻鋪滿整個色環——這正是 Notion tag 的原理。金、綠、藍、紫在這裡都好看，因為它們被校準過。**要配分類色（圖表、圖例、任期橫條）就吃這組校準過的色，別憑空造新色，也別因為怕出錯就全部壓成低飽和暖色與灰色**——那樣既失去色相多樣（變糊）也失去明亮（變濁），比原本更醜。曾經的錯誤示範：任期時間軸一度被改成一片藕紫混灰，使用者當場說「灰不溜秋很醜」。**但校準過的 ink 用在哪，2026-07-08 使用者再指正：色相由 ink 承擔的位置是「小面積鉻件」（邊框、圖例點、細分隔線、milestone 標記），不是「大面積填色」。** 大條的深綠、深紫、深玫瑰、土黃色塊——即使色是校準過的——鋪成一片仍然醜；所以每個色調都備一對「近白淡底 `-bg`＋深墨 ink `-tx`」，大面積吃淡底、色相辨識交給 ink 細框。這條吸收了色相多樣（框與圖例仍鋪滿色環）又避開了大色塊。
1. **色彩多以「淡底＋深墨色文字」一對呈現，不濫用大面積實色。** 底色（bg）近白、只帶極淡色傾向；真正看得見色相的是文字／邊框的墨色（ink）。正文區底、整顆按鈕、金箔大色塊禁止實色填滿（呼應「金箔限文字筆畫」「正文區底色只准 paper」）。**圖表資料標記也照此辦（2026-07-08 使用者裁定，覆寫舊版「圖表長條可用 ink 實色」的許可）：長條、任期橫條、大色帶＝近白淡底 `-bg` 填色＋同色相 ink `-tx` 的 1px 細框（keyline）**；ink 實色只准用在圖例點、細分隔線、milestone、單一 active 節點等小面積鉻件。狀態靠形狀不靠濃淡：現任/未封口＝虛線框、待確認＝無色底虛線框、已確認＝實線框（示範見 `ConstitutionalCourt.jsx` 的 `fillOf`／`inkToFill`／`PROV_SEGMENTS`）。舊版曾允許「圖表長條用 Badge tone ink＋略降透明度」，實測在大條上仍讀成深色塊，已作廢。
2. **色相 50°–140°（黃→黃綠→土黃土綠）只約束「離群、臨時公式生成、大面積」的填色。** 這個色相帶在中高彩度下讀成芥末/土黃/土綠，是 OKLCH 可驗證的物理現象。但站內 Badge 已校準的金（`#8a6d3b`）與綠（`#566d50`）屬和諧色系例外，可用——關鍵差別是「校準過的和諧色 vs 憑空生成的離群色」，不是色相本身。稽核大面積填色時把危險門檻收到彩度 C≥0.04（比小 badge 嚴），且必須把 `var(--cc-*)` 解析成 hex 再驗色相（純 grep hex literal 會漏掉 var 引用）。
3. **一個畫面最多一處撞色（pop）。** 刻意把三種以上互相對比的高彩度色相硬湊在一起才算違規；圖表本身需要 N 色區分 N 類（且取自校準的 Badge tone 和諧集）不算跳色。

**技術落地**：任何要生成新色階（漸層、分類色、圖表色）的地方，優先直接抄站內 `PALETTES`（`src/styles/palettes.js`）或既有 Badge 元件裡已經在用、已經被使用者看過不反感的真實色碼——不要用公式對一整個色相環套同一組飽和度/明度算出一批新顏色。公式對某個色相剛好好看，換一個色相不一定還好看（尤其黃、黃綠一帶，即使中等彩度也容易讀成土黃／土綠，這條在 OKLCH 色彩空間裡是可驗證的物理現象，不是玄學）；只有在「淡底」這種低風險、幾乎所有色相都安全的轉換上才准公式生成，「墨色」本身永遠用已審過的真實值。工作範例：`ConstitutionalCourt.jsx` 的 `Badge` 元件（bg/ink 兩色一組）、`PaletteLab.jsx` 的 `TasteQuiz`／`tagTones()`（2026-07-07 從「公式生成色塊」改成「抄 PALETTES 真實色碼＋只算淡底」，過程與教訓見 `HANDOFF.md`）。

### 語意色 token 系統（2026-07-08，前六輪配色鬼打牆後建立）

上面那條「優先抄真實色碼」的原則，現在有一套**可計算、可強制**的 token 系統把它固化下來。研究了 GitHub Primer／Material 3／Atlassian／Radix／Notion／Obsidian（研究筆記在 scratchpad `research-*.md`、提案在 `PROPOSAL-color-token-system.md`）後，抄了三件事落地在 `src/styles/tokens.css`：

**兩層架構（Primer／Obsidian 模型）**：
- **Layer 0 primitive**——`--tone-{rose,red,amber,green,teal,blue,plum,slate}-{tx,bg}`，8 個校準色調，每個一對「文字/標記色 `-tx`」＋「近白底色 `-bg`」，同色相。值＝站內已認可的 Badge 色。
- **Layer 1 semantic**——用途命名、`var()` 指向 primitive，不寫死 hex：狀態色 `--status-{danger,warning,success,info,neutral}-{tx,bg}`（依意義）；分類色 `--cat-1..8-{tx,bg}`（固定順序身分槽，供圖表/圖例/多類別 badge）。改一個 primitive，全站語意色跟著動；產物是純 CSS，複製到 MkDocs 零依賴。

**Notion 的和諧規律，用 validator 強制（`scripts/validate-color-system.mjs`，接進 `npm run build`）**：每個 `-tx` 的 OKLCH 明度鎖在 L 0.46–0.58（且全體明度極差 ≤0.10＝「看起來一樣亮」）、彩度 0.045–0.13（莫蘭迪，不純不灰）；每個 `-bg` 鎖在 L 0.90–0.97 近白。任一色調飄出帶就 **build 失敗**。這把「挑一個好看的顏色」從品味變成過機器——土黃色（H79 那種）想混進來，明度一驗就被擋（實測 `#a8862e` 會讓 build 紅）。

**和諧 vs 可辨識的取捨（一手實證：同明度和諧色在無標籤時難辨）**：本站選擇「一組色盤通吃 badge 與圖表」，因為圖表一律有文字圖例＋hover 標籤——**讓標籤負責辨識、讓顏色負責和諧**。這是明知取捨的決定，不是忽略衝突；未來若出現無標籤圖表才需要另備高區辨分類色。

**規則**：要配任何分類/狀態色，**引用 `--status-*` 或 `--cat-*`，不要再開頁面級 hex 孤島**（`ConstitutionalCourt` 的 `Badge`／`TENURE_*` 已示範改吃 token，移除了 13 個 `--cc-badge-*`）。其餘 7 頁的 `*_VARS` hex 孤島列為 Phase 2 增量收斂（見 HANDOFF）。深色模式現在不做，但兩層結構讓未來只需換 Layer 0 值、語意名不變（Obsidian 模型）。

## 品味參照 → 具體規則

| 參照 | 落地規則 |
|---|---|
| Notion 的 typography | 明確的字級層級（token scale，不寫死 px）；長文行長上限約 65ch（PageShell prose） |
| Notion 的色彩系統 | 淡底＋深墨色文字一對、小面積鉻件、一畫面最多一處撞色——詳見上方「色彩哲學」節 |
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
- 不新增字體、不改 `--font-*` 三變數與 @font-face（見 HANDOFF）。**唯一例外：數學公式，見下節。**
- 遷移過的檔案不寫裸 hex：色值進 tokens.css 或頁面 `*_VARS`。`npm run validate:tokens` 在 build 時強制檢查；`scripts/design-token-exceptions.txt` 是未遷移清單，只准變短。

## 例外：數學公式與 KaTeX（2026-07-13 使用者裁定）

數學排版是內容，不是裝飾。統計教學站引入 KaTeX，連同它自帶的 KaTeX_* 字族。這是「不新增字體」的唯一例外，邊界如下：

1. KaTeX 字型只准出現在 `.katex` 作用域內。不得指派給正文、標題、UI，不得寫進 `--font-*`，不得進 tokens.css。覆寫樣式一律寫在 `src/styles/katex.css`，只用 ink token，不寫裸 hex。
2. **數學記號一律以 LaTeX 進場**：`.mdx` 用 `$…$` / `$$…$$`（remark-math ＋ rehype-katex 在建置時轉換），JSX 用 `<Math tex="…" />`。原始碼裡不得直接打 Unicode 數學字元。理由有二：同一個符號若一半走明體、一半走 KaTeX_Math，同一頁上會出現兩種字形；而且 Unicode 數學字元會被拖進字型子集掃描。`npm run validate:math` 在 build 時強制，範圍是統計站、`src/content/`、`src/data/statistics*` 與 `src/components/lab/`（舊頁把 `≥`、`≈` 當散文標點用，字型子集已覆蓋，不在此範圍）。
3. KaTeX 只在統計站的 async chunk 載入（路由已是 `lazy()` 分包），不進全站 bundle。
4. 公式區塊仍受「正文區底色只准 `--c-paper`」約束：公式不做色塊、不做卡片、不加 accent 色。

## 遷移現況（2026-07-06）

- 已遷移：App.jsx（首頁）、ECFAResearch（含 FontSizeControl 示範）、批 B 各頁、共用元件。
- 例外清單裡剩下的：見 `scripts/design-token-exceptions.txt`（批 C 的注入式 CSS 頁因 validator 豁免機制限制暫留清單；批 D 調音器頁機會性遷移）。
- 下一步（輻射）：tokens.css 複製進兩個 MkDocs 課程站的 extra.css，對齊變數名。
