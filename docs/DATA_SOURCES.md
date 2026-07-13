# 資料來源總覽

`my-canvas-lab` 是公開展示層，本身不產生研究資料，所有資料都手動同步自對應私有倉庫的 `data/processed/*.json`。同步前務必確認來源內容已穩定，可對外負責（見 `workspace-governance.md` 第 7 節）。

| 來源 repo | 用途 | 最近同步/更新日期 | 過期風險 |
|---|---|---|---|
| `1142/government-debt-research-data` | `src/data/governmentDebt.json`（政府債務比較頁） | 2026-07-02（來源與快照 mtime 一致） | 低——雙方皆已 commit，明文標示 sync 流程 |
| `1142/ecfa-research-data` | `src/data/ecfaResearch.json`（ECFA 研究頁） | 2026-07-05 同步；快照 2026-07-06 隨 `1157d6e` 入版控 | 低——雙方皆已 commit |
| `1142/local-fiscal-enforcement-risk-research-data` | `src/data/fiscalEnforcementRisk.json`（地方財政執行風險頁） | 2026-07-02 同步；快照 2026-07-06 隨 `1157d6e` 入版控 | 低——雙方皆已 commit |
| `1142/intl-tax-ops-lab` | `src/data/intlTaxOps/`（國際稅法研究頁） | 2026-07-02（多檔快照與來源 mtime 一致） | 低——已 commit（`d8dc6f6`／`43210fb`） |
| `1142/2026_台北電影節` | `src/data/taipeiffPrograms.json`（台北電影節節目頁） | 2026-07-02（來源與快照大小一致） | 中——來源倉庫本身尚未 `git init`（2026-07-07 復查仍未 init），上游沒有版控保障 |
| `1142/constitutional-court-research-data` | `src/data/constitutionalCourt.json`（憲法法庭案例庫頁） | 2026-07-10：`結論類型` 6 軸 **503 件**（217 待人工＋286 行憲後違憲；follow-up ② 完成違憲範圍）。快照為**只覆寫 `結論類型` 欄的局部更新**＝非正規 build 產物 | **中——待正規化**：因並行 Codex 立場表 W2 未 commit，未跑完整 `app-json→sync`；Codex commit 後補跑一次乾淨 sync 即正規化（結果同 503）。人工佇列 23 件見資料 repo `docs/類型學-人工佇列.md` |
| `1142/statistics-lab-data` | `src/data/statistics.json`（統計學實驗室 hub）、`src/data/statistics-null-hypothesis.json`（文章資料）、`src/content/statistics/null-hypothesis.mdx`（文章正文） | 2026-07-13（新建，`npm run sync` 一次投影三個檔） | 低——資料倉有 `validate` 與 `verify:sim` 兩道閘門；**唯一一個把 .mdx 正文也同步過來的來源**，正文改動一律在資料倉改再 sync |
| `1142/ntu-coursemap-research-data` | `src/data/germanLawCourseTimeline.json`（德國法課程時間軸頁） | 2026-07-06（來源 `data/teacher_timeline.json` 最後 commit 2026-07-06 14:42:10；快照 mtime 14:47:22，大小與來源一致，均為 102492 bytes） | 低——雙方皆已 commit，但無 `sync-to-canvas.mjs` 這類自動化腳本，靠 `scripts/generate_teacher_timeline.py` 產出後手動複製（見該倉庫 AGENTS.md），忘記重跑不會有任何自動提示 |

## 使用說明

- 新增或更新任何快照前，先確認來源倉庫該筆資料已 commit（除 `2026_台北電影節` 尚未版控外，其餘六個來源倉與其快照均已 commit；替電影節同步前建議先 `git init`）。
- 本表由 mtime／git log 實查產生（2026-07-05 首查；2026-07-06 補查 constitutional-court 與 ntu-coursemap 兩列；2026-07-07 復查 ecfa、fiscalEnforcementRisk（均已入版控）、constitutionalCourt（刻意落後）、台北電影節（仍未 init）四列），非依賴 README 自述；下次更新請重新核實，不要只改日期。
