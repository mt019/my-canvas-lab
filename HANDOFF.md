# Session Handoff — 2026-07-02

Context for the next agent (Claude Code or Codex) picking this up. Read
this before touching `InternationalTaxOps`, `ManusMetaAcquisition`,
fonts, or `intl-tax-ops-lab`. This file is rewritten to reflect current
state at the end of each engineering session, not appended to — check
git history if you need the blow-by-blow.

## Current state, by area

### Security (done, stable — do not revisit)

Local machine paths (`/Users/iw/...`) were removed from both repos and
their git histories rewritten + force-pushed. `intl-tax-ops-lab`'s
history was fully scrubbed with `git filter-repo --replace-text` since
the leak dated to its first commit. Both repos' "expose local research
folder" UI panels were removed entirely, not just the path string.
**Do not try to "restore" old commits** — they contained the leak by
design of the fix.

### Font system (done, stable)

`my-canvas-lab/src/index.css` defines three CSS variables:

- `--font-body`: Huiwen-mincho only (CJK, Public Domain). Default for
  all body text, headings-within-cards, and small text mixed inline
  with CJK.
- `--font-display`: Radio Newsman + GenWanMin2. Applied to `h1-h3`
  site-wide. Clean at any size, no synthesis artifacts.
- `--font-accent`: Erikas Farbband (opt-in only). Has a heavy
  ink-ribbon texture that reads as noisy in body text or small
  headings — use only for large/sparse decorative text (currently:
  the `.eyebrow` kicker in `InternationalTaxOps`). **Do not make this
  the default body font again** — that was the original bug this fixed.
- `font-synthesis: none` on `body` is load-bearing. Without it the
  browser fakes bold weights these fonts don't ship, producing a
  moiré-like glitch.

Erikas Farbband / Radio Newsman have **undocumented upstream
redistribution terms** — bundled at the user's explicit, informed,
repo-scoped decision (see `public/fonts/LICENSES.md`). Re-confirm with
the user before reusing them in a new project; the decision doesn't
travel automatically. The full recipe (which font plays which role, the
CSS structure, the failure mode) is captured as a reusable skill:
`~/.claude/skills/mincho-typewriter-type-system/SKILL.md`.

### `InternationalTaxOps` — the research desk

Full tab-based app, not a stub. Structure:

- **Tab bar** (`.mainTabBar`, matches `GovernmentDebt`'s tab pattern):
  議題矩陣 (matrix) / 來源登錄 (sources) / 前沿監測 (frontier) / 關係圖譜
  (relations) / 案例與爭議 (controversies). Only the active tab's
  content renders — this replaced an earlier single-long-scroll layout.
- **Sidebar**: brand, search, back-to-canvas link, then the
  分類視角 (classification-lens) filter as a vertical list — this is
  the *only* place that filter exists. Selecting a filter option also
  switches to the matrix tab, since filtering only affects topics.
  **Do not re-add a duplicate copy of this filter in the main content
  area** — that was tried twice this session and reverted both times
  as pointless duplication.
- **Topic matrix**: accordion cards, default expanded (matches the
  site's established `feedback_accordion_default` convention), not a
  separate side-by-side list + detail-panel split. Detail (authority/
  temporal/workflow info, next actions, risk flags) expands inline
  directly under the card you click.
- **Relations graph**: React Flow + `@dagrejs/dagre` for layout. Only
  real `source → topic` edges (backed by `topic.sourceIds` in the
  data) are drawn — the original implementation wired every
  watch-list item to `topics[i % topics.length]`, a round-robin with
  no basis in the data, which has been removed. Watch-list items render
  as an honest unconnected column since no topic-relevance field
  exists for them yet. **Nodes are draggable** — this required
  `useNodesState`/`useEdgesState` local state (`nodes`/`edges` as a
  bare controlled prop with no `onNodesChange` handler silently resets
  drag positions on every render; this bit us once already).
- **Cases & controversies tab** (new): `controversies.json`, six
  entries grounded in Robert Danon's actual scholarship (MAP structural
  critique, the UN Model's 2025 ISDS-override clause, his 2022/2023
  GloBE dispute-resolution proposal, the beneficial-ownership
  legal/economic judicial split, a concrete Qatar QDMTT date
  discrepancy, and a cross-reference to `ManusMetaAcquisition` as the
  one entry with a live, dated fact pattern). This ties directly into
  the user's UNIL/Danon PhD application research
  (`~/Documents/NTU/1141/2027-phd-application/20_PhD申請/applications/unil_danon/`)
  — treat that folder as authoritative background if extending this
  further, don't re-derive Danon's positions from scratch.

Data layer: `src/data/intlTaxOps/*.json` — public-safe snapshots only,
synced from `intl-tax-ops-lab/data/*.json`. **`data/raw/` and
`data/parsed/` (downloaded OECD/EU PDFs, scraped HTML) must never be
copied here** — that boundary is the whole point of the split, per the
`canvas-research-data-workflow` Codex skill. `topics.json` was rewritten
this session with cited, specific claims (document page counts,
decision dates, named cases) replacing the original generic scaffold
text — if you're tempted to write a topic summary without a citation
behind it, don't; that's the exact problem that got fixed.

Styling: `InternationalTaxOps.module.css`, CSS Modules scoped via a
`.workspace` wrapper class so nothing leaks into other canvas-lab
routes — see `~/.claude/skills/css-modules-porting/SKILL.md` for why
(`:root`/`body`/bare-tag selectors don't auto-scope, and React Flow's
own class names need `:global()`).

### `ManusMetaAcquisition` — data extracted, same pattern

Was a 1354-line monolithic component with all research data (9-phase
timeline, corporate structure, 5 legal-dimension analyses, 5 research
questions, 3 scholar-framework write-ups, 12 fact-checked claims,
source list) hardcoded as inline JS. Extracted to
`src/data/intlTaxOps/manusCase.json` (synced from
`intl-tax-ops-lab/data/manus-meta-case.json`), same data repo as
`InternationalTaxOps` — **not a separate repo**, because this case
study applies the same Danon × Ziegler analytical framework and shares
`topicDomain` taxonomy with the rest of that repo's content (Manus is
a sub-topic of the international-tax/investment-law research domain,
per the user's own framing, just implemented as its own canvas-lab
page/mini-app rather than a topic inside `InternationalTaxOps`).
Component is now 695 lines, rendering logic only. Icon components
(`Shield`/`Network`/`Scale`/`Globe`) can't survive JSON serialization —
they're stored as string IDs (`iconId`) in the JSON and remapped to
components in the JSX header.

## What was pushed

- `my-canvas-lab` (public, `origin/main`): HEAD is `43210fb`. Nothing
  uncommitted.
- `intl-tax-ops-lab` (private, `origin/main`): HEAD is `eb25ec5`.
  Nothing uncommitted. Note: this repo lost its upstream tracking at
  some point this session (likely from the `filter-repo` history
  rewrite) and needed `git push --set-upstream origin main` once —
  already fixed, just noting it in case it recurs.

## Where reusable skills live

`~/.claude/skills/` (user-level — reusable across all projects, not
project-scoped):

- `font-clearance/SKILL.md` — license clearance → subsetting → woff2 →
  `LICENSES.md`. Use before bundling any font anywhere.
- `css-modules-porting/SKILL.md` — porting a standalone app's global
  CSS into a multi-page shell without leakage.
- `mincho-typewriter-type-system/SKILL.md` — the specific validated
  font combination used on this site (see Font system above);
  reapply by name rather than re-deriving.
- `README.md` — index of all three, with Codex-skill cross-references
  and a portability note.

## Division of labor (Codex ↔ Claude Code)

Set by the user, applies going forward:

- **Codex first:** research data layer, backend data structures, data
  cleaning, indexing, JSON/CSV/schema work; first-draft frontend UI,
  React/Vite visual/interactive demos.
- **Claude Code first:** research judgment, data classification logic,
  comparative-law framing, long-form spec/explanation writing;
  integrating a frontend into the existing `canvas-lab` multi-page
  shell, CSS Modules leakage prevention, long-term maintenance
  conventions.
- **Both:** final code review, bug hunting, maintainability checks —
  cross-review each other's work rather than only self-reviewing.

## Outstanding work (handed to Codex, not yet actioned)

See `intl-tax-ops-lab/docs/24_CODEX_HANDOFF_2026-07-02.md` for full
detail. As of this writing, **`sources.json` still has only 8
entries** — the handoff's proposed additions have not landed:

1. Add 5 missing `sources.json` entries for already-parsed documents
   (`oecd-side-by-side-package-2026`, `unil-map-pillar-two-days-2026`,
   `euto-offshore-wealth-data-page`, `unil-tax-policy-center-research`,
   `danonlaw-about`). Schema-checked draft entries are in the handoff
   doc — verify against `data_classification_schema.json` before
   pasting.
2. Retry UN FSDO ingestion with browser-realistic headers
   (`Accept-Language`, `Referer`) before falling back to a headless
   browser for the Cloudflare-gated OECD BEPS topic page specifically.

## What should NOT be reworked

- The public/private data-repo boundary (`intl-tax-ops-lab` owns raw
  materials; `my-canvas-lab/src/data/intlTaxOps/` holds only public
  snapshots for both `InternationalTaxOps` and `ManusMetaAcquisition`).
- The Erikas Farbband / Radio Newsman license decision — already
  surfaced to and accepted by the user, scoped to this repo only.
- The rewritten git histories in both repos.
- The CSS Modules scoping approach — removing the `.workspace` wrapper
  or importing the CSS globally reintroduces the leakage it prevents.
- The sidebar-only placement of the classification-lens filter — see
  above, this was tried both ways and settled.
- `src/pages/` staying flat (not split into `music/`/`analysis/`/`life/`
  subfolders) — considered and declined this session; revisit only if
  one group's file count gets uncomfortable (analysis is the one to
  watch, currently 5 files).

## Optional follow-up (not started, don't start without being asked)

- `humanizer-zh` skill cleanup — flagged in `~/.claude/skills/README.md`
  as a flat file inconsistent with the `<name>/SKILL.md` convention,
  plus unreconciled overlap with several Codex skills.
- Watch-list items have no topic-relevance field. If that gets added to
  `frontier_watchlist.json`, the relations graph should wire real edges
  for them instead of the current unconnected column.
- The `data/raw`/`data/parsed` PDFs in `intl-tax-ops-lab` were never
  audited for their own copyright status — irrelevant as long as they
  stay off the public frontend, worth knowing if that boundary is ever
  revisited.
