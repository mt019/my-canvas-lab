---
name: cc-resume
description: 續作憲法法庭研究（資料 repo＋canvas 頁）。載入斷點、兩 repo 即時 git 狀態與硬規則，然後接上次的進度做下去。
argument-hint: [可選：要做的 backlog 項，如「②德語圈雙尾」；留空則先問]
disable-model-invocation: true
---

接續憲法法庭研究專案。以下脈絡由本指令在送進你之前即時抓取，**不是寫死的舊資料**。

## 斷點（`.claude/CHECKPOINT.md` 的最新一節）

!`sed -n '/^## /,/^## /p' /Users/iw/Documents/NTU/1142/my-canvas-lab/.claude/CHECKPOINT.md | head -40`

完整斷點檔還有前幾輪的紀錄，需要時自己 Read `/Users/iw/Documents/NTU/1142/my-canvas-lab/.claude/CHECKPOINT.md`。

## 兩 repo 即時狀態

資料 repo（`~/Documents/NTU/1142/constitutional-court-research-data`）最近提交：

!`git -C /Users/iw/Documents/NTU/1142/constitutional-court-research-data log --oneline -3`

資料 repo 工作樹（**未 commit 的檔＝他線在途，commit 時絕不可掃入**）：

!`git -C /Users/iw/Documents/NTU/1142/constitutional-court-research-data -c core.quotepath=false status --short || echo "（乾淨）"`

canvas repo（`~/Documents/NTU/1142/my-canvas-lab`）最近提交：

!`git -C /Users/iw/Documents/NTU/1142/my-canvas-lab log --oneline -3`

## 開工前

使用者這次指定要做的：**$ARGUMENTS**

若上行為空，**先用 AskUserQuestion 問要做 backlog 哪一項，不要自己挑、更不要一次全開**。backlog 現況見斷點檔「下一步」節；問完再動手。

## 硬規則（每次都適用，違反就是做錯）

- **只動資料 repo**，除非這次任務本身就是 canvas 前端。線上問題意識頁是舊的、不對的，使用者已知並刻意暫擱。
- **運維導向、可重複**：任何修正都要帶防再犯三件套——共用單一入口（不是修單點）、`npm run validate` 加固定檢查（含負向測試須 exit=1）、工程文件落檔（`engineering/LOG.md`＋斷點檔）。
- **每個計量結論不論顯著都要配圖**；動手畫之前先載 `dataviz` skill，色票與體例沿用 `engineering/scripts/analyze-irt-perjudge.mjs` 與 `figures-grm.mjs`，不要另立一套。
- **方法必附文獻依據**（發現報告的「方法依據」附錄體例：先講依據、再講此依據不保證什麼）。無識別策略就不下因果語言。
- **公開面禁工程作業語言**；底層全局禁 AI 感的比喻式命名（任何語言），命名與註解說做什麼就叫什麼。
- **共用工作樹**：commit 一律 `git commit -m "..." -- <明確路徑>`（`-m` 在 `--` 之前），只提交自己這線的檔。使用者說「推送」才推。
- **驗證走 fresh-context subagent，產出者不自驗**。驗收要證據（檔案:行號、命令輸出關鍵行），不收「已確認」三個字。
- **研究倫理**：以發現真實為目的，不追顯著。null 帶紀律照樣是貢獻；顯著先攻擊它。分析選擇要先於看結果就固定。使用者說「怪怪的」是最高優先訊號。

## 這套研究目前的方法基礎（別重造）

- 立場表投票母本 `data/processed/立場表投票.json`；主分析 `analyze-lct.mjs`（僅爭議 roll、共投≥8、置換檢定）。
- 測量模型：方向尺度＋貝氏 graded-response IRT（`engineering/stan/grm.stan`＋`fit-grm.py`，潛在特質＝違憲宣告傾向）；編碼層單一事實源＝`data/materials/{主文項宣告方向,分向票偏離方向}.json`。
- 工具鏈已裝：CmdStan＋cmdstanpy 在 `engineering/.venv`（未入版控）；R 的 mirt／MCMCpack／wnominate／oc／pscl。**套件沒裝不構成方法限制——需要就裝。**
- 提名總統一律取「當屆」＝`各段提名總統.at(-1)`（見 `analyze-lct.mjs:25`），全站零推定。
