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

### `FiscalEnforcementRisk` (new, in progress)

Present in the working tree as of 2026-07-04
(`src/pages/FiscalEnforcementRisk.jsx`,
`src/data/fiscalEnforcementRisk.json`) but not yet committed or
described here in detail — update this section once that work lands.

### `ConstitutionalCourt` (landed 2026-07-06)

- Imports `src/data/constitutionalCourt.json` (~1.8MB), a copied
  snapshot owned by the sibling repo
  `../constitutional-court-research-data` (GitHub mt019, private).
  Update flow: in that repo run `npm run update` (incremental crawl of
  cons.judicial.gov.tw) → `npm run sync` → here rebuild font subsets
  if new glyphs appeared → `npm run build`.
- Five tabs: 案件索引 (filters + full-text cards + CSV/JSON/BibTeX/
  引註/manifest export), 時間軸, 大法官, 意見書圖譜 (SVG circular
  co-sign network, no chart lib), 資料說明.
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
- Chart categorical palette `#a84f6e / #5a5fb0 / #3f7d44` was
  validated with the dataviz skill's validator against surface
  `#fbf7f4` — don't swap hues casually.
- `scripts/validate-font-coverage.mjs` walks `src/` with pure node
  (no ripgrep): this machine has no real `rg` binary — the shell `rg`
  is Claude Code's wrapper, invisible to node's spawn.
- Early 釋字 (約 431 號以前) opinions are embedded in the official page body,
  not PDFs; the snapshot marks them `內嵌: true` and both CaseCard and
  the justice detail page already render them (link label 官方頁正文/
  官方頁). A 2026-07-07 screenshot showing 王澤鑑 with 4 opinions
  predates this fix — current data has 6 (436/437 are 內嵌).
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
