# 資料來源總覽

`my-canvas-lab` 是公開展示層，本身不產生研究資料，所有資料都手動同步自對應私有倉庫的 `data/processed/*.json`。同步前務必確認來源內容已穩定，可對外負責（見 `workspace-governance.md` 第 7 節）。

| 來源 repo | 用途 | 最近同步/更新日期 | 過期風險 |
|---|---|---|---|
| `1142/chen-yinke-research-data` | `src/data/chenYinke.json`、`src/data/chenYinke/`（陳寅恪文集研究室） | 2026-07-29：第三章 `b0002–b0244`，243 段連續細讀，provenance schema 2.0 | 低——原文可逐字復原並帶 SHA-256；編者解讀逐筆明標，年代結論保留不確定性；人物 Hover 只用原文實見稱謂；`chenYinke.sync.json` 防止 Canvas 手改快照 |
| `1142/government-debt-research-data` | `src/data/governmentDebt.json`（政府債務比較頁） | 2026-07-02（來源與快照 mtime 一致） | 低——雙方皆已 commit，明文標示 sync 流程 |
| `1142/ecfa-research-data` | `src/data/ecfaResearch.json`（ECFA 研究頁） | 2026-07-05 同步；快照 2026-07-06 隨 `1157d6e` 入版控 | 低——雙方皆已 commit |
| `1142/local-fiscal-enforcement-risk-research-data` | `src/data/fiscalEnforcementRisk.json`（地方財政執行風險頁） | 2026-07-02 同步；快照 2026-07-06 隨 `1157d6e` 入版控 | 低——雙方皆已 commit |
| `1142/intl-tax-ops-lab` | `src/data/intlTaxOps/`（國際稅法研究頁） | 2026-07-02（多檔快照與來源 mtime 一致） | 低——已 commit（`d8dc6f6`／`43210fb`） |
| `1142/2026_台北電影節` | `src/data/taipeiffPrograms.json`（台北電影節節目頁） | 2026-07-02（來源與快照大小一致） | 中——來源倉庫本身尚未 `git init`（2026-07-07 復查仍未 init），上游沒有版控保障 |
| `1142/constitutional-court-research-data` | `src/data/constitutionalCourt.json`（獨立站拆分前的保留快照；Canvas build 不再載入） | 2026-08-01：憲法法庭案例庫的發布目標改為 `https://cc.phenomcanvas.com/constitutionalcourt/`；Canvas cutover 只保留 `/all` 外鏈及舊路徑 308 轉址。研究資料後續由獨立站的 SHA-pinned export 消費，不再以 Canvas 頁面作發布目標 | **已全量覆核**：初版239件中信度釋字已逐案審核；現為憲法解釋651／統一解釋162，813件釋字均高信度。資料倉庫有機器可讀覆核登錄、專用 validator 與維護 SOP；未來新邊界案回到人工覆核佇列。既有6軸 `結論類型` 與本欄正交，不互相覆寫 |
| `1142/statistics-lab-data` | `src/data/statistics.json`（統計學實驗室 hub）、`src/data/statistics-null-hypothesis.json`（文章資料）、`src/content/statistics/null-hypothesis.mdx`（文章正文） | 2026-07-13（新建，`npm run sync` 一次投影三個檔） | 低——資料倉有 `validate` 與 `verify:sim` 兩道閘門；**唯一一個把 .mdx 正文也同步過來的來源**，正文改動一律在資料倉改再 sync |
| `1142/ntu-coursemap-research-data` | `src/data/germanLawCourseTimeline.json`（德國法課程時間軸頁） | 2026-07-06（來源 `data/teacher_timeline.json` 最後 commit 2026-07-06 14:42:10；快照 mtime 14:47:22，大小與來源一致，均為 102492 bytes） | 低——雙方皆已 commit，但無 `sync-to-canvas.mjs` 這類自動化腳本，靠 `scripts/generate_teacher_timeline.py` 產出後手動複製（見該倉庫 AGENTS.md），忘記重跑不會有任何自動提示 |
| `1142/brief-data` | `src/data/brief-events.json`（簡報、活動曆、我的講座與要讀的） | 2026-07-22（由資料倉 `npm run sync` 重建） | 中——公開投影由資料倉白名單控制；活動詳情含可得的海報與截短正文，個人標記只存在瀏覽器 localStorage |

## 使用說明

- 新增或更新任何快照前，先確認來源倉庫該筆資料已 commit（除 `2026_台北電影節` 尚未版控外，其餘六個來源倉與其快照均已 commit；替電影節同步前建議先 `git init`）。
- 本表由 mtime／git log 實查產生（2026-07-05 首查；2026-07-06 補查 constitutional-court 與 ntu-coursemap 兩列；2026-07-07 復查 ecfa、fiscalEnforcementRisk（均已入版控）、constitutionalCourt（刻意落後）、台北電影節（仍未 init）四列），非依賴 README 自述；下次更新請重新核實，不要只改日期。
