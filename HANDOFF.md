# Session Handoff — 2026-07-02

Context for the next agent (Claude Code or Codex) picking this up. Read
this before touching `InternationalTaxOps`, fonts, or `intl-tax-ops-lab`.

## What changed, in order

1. **Security: local machine paths removed from public/private repos.**
   - `my-canvas-lab`: `InternationalTaxOps.jsx` had a hardcoded
     `/Users/iw/...` path and a UI panel exposing local research-folder
     locations. Removed; the leaking commit was rewritten and
     force-pushed (`43145c2` → `fa2fb8e` → `d8dc6f6`, final state at
     `d8dc6f6`).
   - `intl-tax-ops-lab` (private repo): same class of leak existed in
     `src/main.jsx`, `logs/ENGINEERING_LOG.md`, and
     `docs/30_DYNAMIC_UPDATE_PLAN.md`, present since the *first* commit.
     Full history rewritten with `git filter-repo --replace-text` and
     force-pushed. The "research folder" UI panel exposing
     `data/raw/`, `data/parsed/text/` was also removed from the app
     itself (not just the canvas-lab gateway).

2. **Site-wide font system.** Bundled and subset (via `fonttools
   pyftsubset`, glyphs limited to actual site usage) into
   `my-canvas-lab/public/fonts/`:
   - CJK: **Huiwen-mincho** (body, Public Domain) + **GenWanMin2**
     (display/headings, SIL OFL 1.1).
   - Latin: **Erikas Farbband** (body) + **Radio Newsman** (display) —
     typewriter faces from the Translation project's BVerfGE set.
     **Their redistribution terms are undocumented upstream.** Bundled
     anyway at the user's explicit, informed direction (see
     `public/fonts/LICENSES.md`). Do not extend their use to new
     projects without re-confirming this decision with the user — it was
     accepted for this repo, not blanket-cleared.
   - Wired via `@font-face` + `--font-body`/`--font-display` CSS vars in
     `src/index.css`, applied to `body`/`h1-h3` site-wide.
   - `font-synthesis: none` is load-bearing — without it the browser
     fakes a bold weight these fonts don't have, producing a moiré-like
     glitch on `font-weight: 900` text.

3. **`InternationalTaxOps` is now the real research desk, not a stub.**
   Ported in full from the standalone `intl-tax-ops-lab` Vite app:
   source registry, topic matrix, frontier watch, React Flow relations
   graph. Data layer is `src/data/intlTaxOps/*.json` — public-safe
   snapshots only (`sources.json`, `topics.json`,
   `data_classification_schema.json`, `frontier_watchlist.json`).
   **`data/raw/` and `data/parsed/` (downloaded OECD/EU PDFs, scraped
   HTML) were never copied and must never be** — that boundary is the
   whole point of the split, per the `canvas-research-data-workflow`
   Codex skill.
   Styling is `InternationalTaxOps.module.css`, a CSS Modules file
   scoped via a `.workspace` wrapper class specifically so it can't leak
   into other canvas-lab routes — see the `css-modules-porting` skill
   for why (`:root`/`body`/bare-tag selectors don't auto-scope).

4. **Relations graph decluttered.** The original graph wired every
   watch-list item to `topics[i % topics.length]` — a round-robin with
   no basis in the data, producing meaningless crossing edges. Removed.
   Only `source → topic` edges (backed by real `topic.sourceIds`) remain,
   laid out with `@dagrejs/dagre` instead of hand-placed grid
   coordinates. Watch-list items now render as an honest unconnected
   column since no topic-relevance field exists for them yet (see
   Optional follow-up).

## What was pushed

- `my-canvas-lab` (public, `origin/main`): `d8dc6f6` → `e14f370` →
  `6edc75e` (current HEAD). All work landed and pushed; nothing
  uncommitted.
- `intl-tax-ops-lab` (private, `origin/main`): history rewritten through
  `56c3335`, then `093e255` (current HEAD). All work landed and pushed.

## Where reusable skills live

- `~/.claude/skills/font-clearance/SKILL.md` — font license
  clearance → subsetting → woff2 → `LICENSES.md` workflow. Use before
  bundling any font anywhere.
- `~/.claude/skills/css-modules-porting/SKILL.md` — porting a
  standalone app's global CSS into a multi-page shell without leakage.
- `~/.claude/skills/README.md` — index of all user-level skills,
  including cross-references to related Codex skills
  (`~/.codex/skills/`) and a portability note. **User-level = reusable
  across all projects; only fork into a project's own
  `.claude/skills/` on an actual conflict, not preemptively.**
- Both new skills are plain YAML-frontmatter + Markdown, written to be
  portable back to Codex's format without a rewrite.

## What should NOT be reworked

- The public/private data-repo boundary for `InternationalTaxOps`
  (`intl-tax-ops-lab` owns raw/parsed research materials;
  `my-canvas-lab/src/data/intlTaxOps/` holds only the public snapshot).
  This is a deliberate architecture decision, confirmed with the user,
  not an oversight to "simplify."
- The Erikas Farbband / Radio Newsman license decision — already
  surfaced to and accepted by the user for this repo. Don't re-litigate
  it silently; if it comes up again, treat it as a fresh decision for
  whatever new context raises it.
- The rewritten git histories in both repos. Don't try to "restore" the
  old commits — they contained the local-path leak by design of the fix.
- The CSS Modules scoping approach in `InternationalTaxOps.module.css`
  (`.workspace` wrapper + `:global()` for React Flow's own class names).
  Removing the wrapper or importing the CSS globally reintroduces the
  leakage this was built to prevent.

## Optional follow-up (not started)

- **`humanizer-zh` skill cleanup** — flagged in
  `~/.claude/skills/README.md` as a flat file
  (`~/.claude/skills/去除AI味.md`) inconsistent with the `<name>/SKILL.md`
  convention, plus un-reconciled overlap with several Codex skills
  (`avoid-ai-writing`, `de-ai-writing-router`, `humanizer-zh-plus`,
  `remove-ai-flavor`). **Explicitly not started this session — do not
  start it without being asked.**
- Watch-list items have no topic-relevance field, which is why the
  relations graph now shows them unconnected. If real relevance data
  gets added to `frontier_watchlist.json` (in `intl-tax-ops-lab`, then
  synced), the graph should wire real edges instead of leaving them
  isolated.
- The `data/raw`/`data/parsed` PDFs in `intl-tax-ops-lab` were never
  audited for their own copyright status (OECD/EU Tax Observatory
  reports) — irrelevant as long as they stay off the public frontend,
  but worth knowing if that boundary is ever revisited.

## Division of labor for future work on this project (Codex ↔ Claude Code)

Set by the user this session, applies going forward:

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
