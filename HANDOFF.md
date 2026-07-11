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

## Pages

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

### `ConstitutionalCourt` (landed 2026-07-06)

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
  sentinel（`useRef`），`sentinel.getBoundingClientRect().top ≤ 49` 才代表已 pin、其流內空間已捲
  離、此時上移只露出底下滾動的卡片、不留白。hook 回傳 `[sentinelRef, hidden]`（Playwright
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
  底部 sentinel＋IntersectionObserver（rootMargin 800px 預取，deps 含 limit 連續補到底）；
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

## Canvas home entry

Homepage is grouped by page type, not the old broad
`music`/`analysis`/`life` split:

- `研究地圖`: long-running research canvases with separated/expandable
  data layers.
- `法政解析`: legal, fiscal, policy, investment, institutional case
  breakdowns.
- `即用工具`: directly usable instruments and sound tools.
- `生活雷達`: practical decision/availability monitors.

Keep the home page a compact project index with thin separators — no
wall of rounded cards, no count-heavy dashboard blocks. (This is a
logical/`PAGE_META.group` grouping for the homepage display, separate
from the question of whether `src/pages/` should be physically split
into subfolders — see "Declined" below; the two aren't in tension.)

## Design system (tokens + shared components)

Single source of truth: `src/styles/tokens.css` (plain CSS custom properties,
copy-pastable to MkDocs extra.css / vanilla projects). Tailwind reads it via
`tailwind.config.js` theme.extend. Shared components in `src/components/`:
LangSwitch/useLang (bilingual, dict keyed by Chinese source string),
FontSizeControl/useFontScale (container-level `--fs` multiplier, prose only),
PageShell, Eyebrow. Full spec, palette registry, and migration state:
`docs/DESIGN.md`. `npm run validate:tokens` (in build) blocks bare hex in
migrated files; `scripts/design-token-exceptions.txt` is the shrink-only
list of unmigrated files.

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

## Font system (stable, don't re-derive)

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

## Where reusable skills live

`~/.claude/skills/` (user-level — reusable across all projects, not
project-scoped):

- `font-clearance/SKILL.md` — license clearance → subsetting → woff2 →
  `LICENSES.md`. Use before bundling any font anywhere.
- `css-modules-porting/SKILL.md` — porting a standalone app's global
  CSS into a multi-page shell without leakage.
- `mincho-typewriter-type-system/SKILL.md` — this site's validated font
  combination; reapply by name rather than re-deriving.
- `README.md` — index of all installed skills, with Codex cross
  references and a portability note.

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
