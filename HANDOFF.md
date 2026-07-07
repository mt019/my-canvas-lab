# Canvas Lab — Engineering Handoff

Current-state document for the next agent (Claude Code or Codex)
picking this up, organized by page/area rather than by session date.
**Rewrite the relevant section in place when you finish work — do not
prepend a new dated section on top.** (This file drifted into
date-stacking once already; merged back down on 2026-07-04. Don't
repeat that.) Check git history if you need the session-by-session
blow-by-blow.

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

Full tab-based research desk, not a stub:

- **Tab bar** (`.mainTabBar`, matches `GovernmentDebt`'s pattern):
  議題矩陣 / 來源登錄 / 前沿監測 / 關係圖譜 / 案例與爭議. Only the
  active tab renders.
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
  PhD application research
  (`~/Documents/NTU/1141/2027-phd-application/20_PhD申請/applications/unil_danon/`)
  — treat that folder as authoritative background before extending
  Danon-related content, don't re-derive his positions from scratch.

Data layer: `src/data/intlTaxOps/*.json`, public-safe snapshots synced
from `intl-tax-ops-lab/data/*.json`. **`data/raw/`/`data/parsed/`
(downloaded OECD/EU PDFs, scraped HTML) must never be copied here** —
see the `canvas-research-data-workflow` Codex skill. `topics.json` was
rewritten with cited, specific claims (page counts, decision dates,
named cases) replacing generic scaffold text — don't write a topic
summary without a citation behind it.

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

- Imports `src/data/constitutionalCourt.json` (~1.8MB), a copied
  snapshot owned by the sibling repo
  `../constitutional-court-research-data` (GitHub mt019, private).
  Update flow: in that repo run `npm run update` (incremental crawl of
  cons.judicial.gov.tw) → `npm run sync` → here rebuild font subsets
  if new glyphs appeared → `npm run build`.
- Seven tabs: 案件索引 (filters + full-text cards + CSV/JSON/BibTeX/
  引註/manifest export), 案件時間軸, 大法官, 任期時間軸 (tenure
  gantt), 意見書圖譜 (SVG circular co-sign network, no chart lib),
  沿革 (`HistoryView`, see the 2026-07-07 沿革 entry below), 資料說明.
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
  a 參與解釋 column. Known data caveat: 12 justices' recorded tenures
  conflict with their signature activity (queue in the data repo's
  `data/materials/參與解釋查核佇列.md`) — fix tenures in overrides, the
  rosters are the more reliable side.
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
  standard of review; too risky). Still not built: a 人工 override layer
  for 審查結論 (classifyOutcome recomputes all 874 every run, so a
  hand-corrected 結論 would be clobbered — add before any manual 覆核).
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
- Chart categorical palette — superseded 2026-07-07, see the dated
  entry further down (the original `#a84f6e / #5a5fb0 / #3f7d44` set
  is gone; don't resurrect it, it's the combination the user rejected
  as an ugly clash). Current hexes are in `TENURE_BG_COLOR` /
  `TENURE_ABROAD_COLOR` / `PRES_COLOR` themselves — don't swap those
  casually either without re-running the dataviz skill's validator.
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
  Update (same session, immediately after): the tenure-timeline
  categorical palette was redrawn — `TENURE_BG_COLOR`/
  `TENURE_ABROAD_COLOR` are now rose/steel-blue/moss-green/ochre
  (`#aa4d75`/`#007dae`/`#4a9a5e`/`#a76c12`) and `PRES_COLOR` is an
  8-hue rose→plum rotation with alternating lightness, both
  re-validated with the dataviz skill's `validate_palette.js`
  (`--pairs all` against this page's own surface, not just adjacent
  pairs, since sort order can put any two categories next to each
  other) — replaces the old violet-blue/green pairing the user
  called an ugly clash despite it having passed the original
  CVD/contrast validation (accessibility-valid ≠ aesthetically
  harmonious was the actual gap). Two swatches sit in the CVD 8–12
  warn band / sub-3:1 contrast band respectively, which the skill
  says is legal only with secondary encoding — already satisfied
  here since the legend and hover tooltip always show the category
  name as text, never color alone. Also added three deeper paper-
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

Local machine paths (`/Users/iw/...`) were removed from both
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
