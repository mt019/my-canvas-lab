# 資料來源總覽

`my-canvas-lab` 是公開展示層，本身不產生研究資料，所有資料都手動同步自對應私有倉庫的 `data/processed/*.json`。同步前務必確認來源內容已穩定，可對外負責（見 `workspace-governance.md` 第 7 節）。

| 來源 repo | 用途 | 最近同步/更新日期 | 過期風險 |
|---|---|---|---|
| `1142/government-debt-research-data` | `src/data/governmentDebt.json`（政府債務比較頁） | 2026-07-02（來源與快照 mtime 一致） | 低——雙方皆已 commit，明文標示 sync 流程 |
| `1142/ecfa-research-data` | `src/data/ecfaResearch.json`（ECFA 研究頁） | 2026-07-05（來源剛完成首次 commit；快照與來源 mtime 一致） | 中——快照未進 `my-canvas-lab` 版控（`git status` 顯示 `?? src/data/ecfaResearch.json`） |
| `1142/local-fiscal-enforcement-risk-research-data` | `src/data/fiscalEnforcementRisk.json`（地方財政執行風險頁） | 2026-07-02（來源剛完成首次 commit；快照與來源 mtime 一致） | 中——快照未進 `my-canvas-lab` 版控（`git status` 顯示 `?? src/data/fiscalEnforcementRisk.json`） |
| `1142/intl-tax-ops-lab` | `src/data/intlTaxOps/`（國際稅法研究頁） | 2026-07-02（多檔快照與來源 mtime 一致） | 低——已 commit（`d8dc6f6`／`43210fb`） |
| `1142/2026_台北電影節` | `src/data/taipeiffPrograms.json`（台北電影節節目頁） | 2026-07-02（來源與快照大小一致） | 中——來源倉庫本身尚未 `git init`，上游沒有版控保障 |
| `1142/constitutional-court-research-data` | `src/data/constitutionalCourt.json`（憲法法庭案例庫頁） | 2026-07-06（來源 `data/processed/constitutional-court-app.json` mtime 19:49:05，快照 mtime 19:50:02，約 1 分鐘內同步） | 中——快照目前有未 commit 變更（`git status --porcelain` 顯示 `M src/data/constitutionalCourt.json`），來源倉庫本身已 commit（最後 commit 2026-07-06 19:21:36） |
| `1142/ntu-coursemap-research-data` | `src/data/germanLawCourseTimeline.json`（德國法課程時間軸頁） | 2026-07-06（來源 `data/teacher_timeline.json` 最後 commit 2026-07-06 14:42:10；快照 mtime 14:47:22，大小與來源一致，均為 102492 bytes） | 低——雙方皆已 commit，但無 `sync-to-canvas.mjs` 這類自動化腳本，靠 `scripts/generate_teacher_timeline.py` 產出後手動複製（見該倉庫 AGENTS.md），忘記重跑不會有任何自動提示 |

## 使用說明

- 新增或更新任何快照前，先確認來源倉庫該筆資料已 commit（`government-debt-research-data`、`intl-tax-ops-lab`、`constitutional-court-research-data`、`ntu-coursemap-research-data` 已符合；`ecfa-research-data`、`local-fiscal-enforcement-risk-research-data` 剛完成首次 commit，尚待下次同步後一併 commit 快照；`2026_台北電影節` 尚未版控，同步前建議先替它 `git init`）。
- 本表由 mtime／git log 實查產生（2026-07-05；constitutional-court-research-data 與 ntu-coursemap-research-data 兩列於 2026-07-06 補查），非依賴 README 自述；下次更新請重新核實，不要只改日期。
