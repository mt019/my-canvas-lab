# 開工指令：把版型抽進 @phenomcanvas/ui，給人物專題站用

寫於 2026-08-04。這份是給**另一個 session** 的開工指令，與顧準那條線並行。
顧準線的斷點在 `.claude/CHECKPOINT.guzhun.md`，模板線的斷點在 `.claude/CHECKPOINT.design-system.md`。

## 目標與動機

站主 2026-08-04 定了三倉分開的架構：`phenom-ops`（基建＋共用 UI 模板套件 `@phenomcanvas/ui`）、
資料倉一人一個、前端倉一個。人物專題（顧準、陳寅恪、朱家驊）要共用一個前端倉 `phenom-studies`，
掛在 `phenomcanvas.com/studies/<人物>`。

他要的是**模板化以便長期運維**：現在幾種版型他都喜歡，但它們散在 `my-canvas-lab/src/pages/`
各自為政（`CHECKPOINT.design-system.md` 第 2 步量過：7 種版型、17 份實作）。模板要住在
`@phenomcanvas/ui` 一份，各站安裝取用，不在各站養平行副本。

新站 `phenom-studies` 是第一個從零開始就只吃套件的消費者，所以它需要什麼、套件就該先有什麼。

## 這輪的範圍

做 `CHECKPOINT.design-system.md` 第 2 步的第二族「左欄常駐導覽」，優先把它送進
`@phenomcanvas/ui`（而不只是進 `my-canvas-lab/src/components/lab/`）。

理由：人物專題三個頁都是這個形狀——左欄一棵目次樹或篇目樹、主欄長文、頂上一條抬頭。
`ZhuJiahua.jsx` 已經是這個樣子（`SiteHeader` ＋ `ArticleLayout` ＋ 左欄 slot 放 `lab/BookTree`），
`IiasPublications`、`InternationalTaxOps`、`JirsForeignLaw` 是同一族的另外三份實作、兩種技術。

三份合一之後，`phenom-studies` 直接 `import { RailLayout } from '@phenomcanvas/ui'` 就能開頁。

## 邊界

**不要碰這些檔**（顧準線正在寫）：
- `~/Documents/NTU/1142/phenom-guzhun-data/**` 整個倉
- `my-canvas-lab/.claude/CHECKPOINT.guzhun.md`
- `~/Documents/NTU/1142/phenom-studies/**`（還沒建；建了也歸顧準線）

**注意會撞到別條線**：`IiasPublications`、`JirsForeignLaw`、憲法法庭那幾頁的 CHECKPOINT 目前是
active。動它們的頁面檔前先看那幾份 CHECKPOINT，是 active 就先問站主要不要等。抽套件本身
（在 ops 那邊新增元件）不會撞，會撞的是把既有頁遷過去的時候。

## 做法提示

- `@phenomcanvas/ui` 的現況與版本管理看 `phenom-ops`；`phenom-wealth/AGENTS.md` 記了它怎麼被
  安裝取用（tarball）。最新一個 building 中的站是 `phenom-wealth`，它的接法是現成範例。
- `docs/DESIGN.md` 的「吸頂 chrome」節已寫過 JIRS 那套 `contents lg:block` 的窄屏做法，抽的
  時候照搬，不要另發明。
- 寬螢幕留白已經做進模板預設（`shellPadding.js`），不要逐頁補。
- 元件命名用直白說法，不要比喻黑話（站主全局禁令）。

## 驗收條件

- `@phenomcanvas/ui` 匯出新的左欄版型元件，且**至少一個既有頁已改成吃它**，畫面與改前一致：
  量 `main p` 的 `getBoundingClientRect().left`，在 390／1024／1280 三個寬度與改前相同。
- `npm run verify:policy` 全過；`vite build --outDir node_modules/.verify-dist` 過（**不要**跑
  完整 `npm run build`，那會寫共用 `dist/`，與別的 session 互踩）。
- `docs/DESIGN.md` 記下這個版型該怎麼用；`HANDOFF.md` 記下決策與踩到的地方。
- 套件版本號有升，且升到哪一版寫進 `CHECKPOINT.design-system.md`。

## 共用工作樹 git 紀律

這個工作樹同時有別的 session 在動。提交一律 `git commit -m "..." -- <明確路徑>`，
絕不裸 `git commit` 或 `-am`；提交後跑 `git status` 確認別人的檔還在工作樹上。
同一個檔混著別人的改動時改走 patch-stage ＋ 裸 commit（見 `~/.claude/rules/harness診斷_20260705.md`
的「共用工作樹 git 紀律」）。推送只在站主說推送時做。

## 回報格式

只回：結論、關鍵證據的「檔案:行號」、驗收條件逐項通過與否、套件升到哪一版。
長產物寫進 `docs/DESIGN.md` 與 `HANDOFF.md`，回報只給路徑。
