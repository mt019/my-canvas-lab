# 小紅書詐騙風險頁

Canvas page: `src/pages/XiaohongshuRisk.jsx`

Frontend snapshot: `src/data/xiaohongshuRisk.json`

Source data repo: sibling `xiaohongshu-risk-research-data`

Update flow:

1. Update source captures, notes, or processing in the data repo.
2. Run `npm run sync` in the data repo.
3. Build Canvas Lab.

Public boundary:

- The Canvas page uses aggregate counts, redacted excerpts, source status, and research next steps.
- Raw HTML, local paths, full scraped dumps, and personal handles remain outside the deployed frontend snapshot.
