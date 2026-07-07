# Canvas Lab · TODO

## 功能增強

### AirPollutionFee 空氣污染防制費
- [ ] 安裝 KaTeX，將費額公式 `Σ(Qᵢ · rᵢ) × D × E` 及 D/E 係數計算式渲染為數學符號
- [ ] 稽徵程序：將 `QUARTERLY_DEADLINES` 渲染成季申報截止日速查卡（日曆式表格）
- [ ] 費率查詢：補入重金屬（Pb/Cd/Hg/As/Cr⁶⁺）與戴奧辛費率表
- [ ] 逃漏：補充具體裁判案例或行政裁處實例（目前僅有條文，缺乏實務例證）

### GovernmentDebt 政府債務研究
- [ ] 補入最新數據（IMF WEO 或 BIS）更新各國債務佔 GDP 比率
- [ ] 中國城投（LGFV）債務規模估算補入近年數字

### InternationalTaxOps 國際稅法研究桌
- [ ] 待 Codex 補齊 `sources.json` 缺漏的 5 筆已解析來源、重試 UN FSDO 抓取（見 `HANDOFF.md`「Outstanding work」）

### ConstitutionalCourt 憲法法庭案例庫
- [ ] 意見書圖譜（GraphView）佈局重設計：現況節點依意見書總數排名後平均分佈在固定圓上（`ConstitutionalCourt.jsx` `GraphView`），相鄰關係與實際共同具名意見書無關，也無 zoom/pan。改為佈局本身能傳達關係強度（如 d3-force 依共同具名邊權重吸引，或依表決陣營/年代分群）。適合 Codex 出視覺原型；現成交辦 prompt 見 `~/.claude/plans/ui-sleepy-pebble.md` 第 4 條
- [x] 被引用最多的解釋「為何被引用」說明擴充（2026-07-07 完成，`~/.claude/plans/lovely-tumbling-star.md`）：`WHY_CITED`（`ConstitutionalCourt.jsx`）由 2 筆擴至 15 筆，覆蓋前端顯示的前 15 名（`cited.slice(0,15)`）。每筆定位逐一上網對照官方憲法法庭／全國法規資料庫與學說整理查證（來源見計畫檔）；682＝應考試權＋判斷餘地低密度審查、709＝首見強化正當行政程序、594 給予法律明確性定位不再留白。名次更深者仍留白（列表只渲染 15）。純前端硬編、不走資料 repo sync。
- [x] 審查結論規則式類型化（2026-07-07 完成，資料側＋前端）：待人工 434→217，新增 法令解釋（83）/補充前解釋（30）/變更前解釋（10）三非合憲性審查類＋合憲擴充；規則見資料 repo `docs/審查結論分類規則.md`。前端：`ConstitutionalCourt.jsx` 新增 teal badge 色調（沿用 IntlTaxOps 頁使用者點名保留的 `--teal: #4c7971`）套用三新類別、結論篩選器保留三個獨立選項、主題×審查結論矩陣把三者合併成「非合憲性審查」欄（避免稀釋違憲熱區判讀）；已 `npm run sync`＋`npm run build`，Playwright 實機驗證 badge/篩選器/矩陣三處皆通過。詳見 HANDOFF「審查結論 typology」條。審查基準 244 件（16 多重＋228 未明示）依裁示**不自動判、留人工覆核**。殘餘 217 待人工可再抽樣迭代；`classifyOutcome` 人工 override 層尚未建（見資料 repo 分類規則文件「尚缺」節）。
- [ ] 大法官出身／留學國「待確認」共 19 人（2 出身＋17 留學國，`TENURE_BG_COLOR`／`ABROAD_GROUP` 待確認分支）：範圍小、來源明確，適合直接研究。交辦 prompt 見上述計畫檔第 1 條
- [ ] 湯德宗對憲訴法改制後裁判編號系統變更表示遺憾——待使用者提供出處（文獻或演講）後放上 About 或案件時間軸的憲訴法標記旁；無出處不上正文
- [ ] 意見書全文抽取（1578 份 PDF 批次下載→抽純文字→刪檔，資料 repo 硬規則流程；>50 件抓取已知需使用者確認）→ 之後才做意見書全文靜態索引（MiniSearch 類、lazy load）。Elasticsearch 不採用：靜態站無伺服器，且現有 1.9MB 快照客戶端篩選已足，只有意見書全文語料（估數十 MB）才需要重新評估
- [ ] 大法官性別 20 人待確認（`資料repo/data/materials/性別覆核佇列.md`），人工補進 justices-overrides.json
- [x] 釋字時期（813 件）參與大法官：~~依屆次名冊回填~~ 2026-07-07 改從官方頁署名列解析，813 件全覆蓋（迴避者不在列，非推定）
- [x] 署名列×任期交叉查核出界 12 人（2026-07-07 完成）：11 人確認、1 人（黃亮）部分確認（第三屆卸任日查無、暫用屆次推定終年 1976-09），查核結果＋逐項來源見資料 repo `data/materials/參與解釋查核結果.md`，已寫入 `justices-overrides.json` 逐段任期。重跑 justices→app-json→validate→sync 後**出界旗標 684→0 清零**。制度性發現：田炯錦/戴炎輝/城仲模/謝在全/賴英照等卸任大法官後轉任院長/副院長仍以「大法官會議主席」身分署名（司法院大法官會議法第3條），任期須延伸至院長/副院長卸任日；黃正銘第三屆卸任年順帶訂正（1976→1972-07-04 呈請退職）
- [x] 屆次/任期收斂（2026-07-07 落地）：推定者單行＋「任期依屆次推定」小字，簡歷頁/人工核定者保留任期明細，現任顯示實際起日；Playwright 四例驗證通過。後續：張式彝等推定值錯誤由資料 repo 傳記查核批次修
- [x] 沿革分頁 Phase A（P1，2026-07-07 完成上線）：ConstitutionalCourt 第 7 分頁 `?tab=history`，雙軸＝機關四階段時間軸（大理院統字→最高法院解字→司法院院字/院解字→大法官釋字＋憲法法庭憲判，等比橫條）＋憲政時期色帶（北京政府→訓政→行憲，制憲為嵌入標記，比照 TenureView 疊帶）；四段機關卡＋四張時期卡預設全展開、憲判件數綁 `data.統計`、時間軸 1913 起。文字＋五項取捨經使用者核可定稿（資料 repo `docs/沿革摘要草稿.md`）、憲政時期年份經 sonnet 查證（`docs/沿革素材查證.md` E 節）。由 Claude Code 直接實作（使用者裁示不經 Codex）；build／lint／Playwright（14 檢查）綠。設計見 `docs/司法解釋沿革設計.md`（含「Phase A 增補」雙軸節）。交辦稿 `~/.claude/plans/constcourt-provenance-ui-codex.md` 已標 superseded。

### 全局
- [x] 全站色彩哲學稽核（2026-07-07 完成）：使用者裁定「整體 canvas 不允許違反色彩設計哲學」。逐頁用 OKLCH 計算篩出色相 50°–140°、彩度 ≥0.08 的土黃/土綠風險色（不憑眼睛猜），全站 618 個 distinct hex 掃過，修掉 ConstitutionalCourt（PRES_COLOR 嚴家淦/蔣經國、TENURE_*檢察官/其他銅棕交叉污染）、ManusMeta（MMA_VARS 11 處＋事實查核狀態色）、FiscalEnforcementRisk（amber 徽章）、GermanLawCourseTimeline（7 色領域圖例＋首頁卡片文字色）、AutoTuner/UkuleleTuner/VocalTuner（調音指針）共約 20+ 處違規，一律換成 `palettes.js` 真實色票色碼、多分類色重過 CVD 驗證。剩餘 12 個在 `palettes.js` 候選展示色票內（水果/名畫主題色票的個別 accent/pop）＋GOLD_FOIL，屬使用者刻意保留的瀏覽候選，只標記不動。色彩哲學三規則已入 `docs/DESIGN.md`。獨立 agent 重掃＋8 頁 Playwright 實機驗證通過
- [ ] 各頁加入 Open Graph / meta description，使分享連結有標題與預覽摘要
- [ ] PaletteLab 金箔按鈕修正（派：sonnet）：`PaletteLab.jsx:211-215` 整顆 `.foil` 填滿的按鈕退場，改文字版 `.foil-text`＋一般底色；使用規則已入 `docs/DESIGN.md` 禁止事項（2026-07-07 使用者裁定：金箔做字好看，整顆按鈕醜）
- [ ] 字體上游評估（派：sonnet 研究；產出評估報告交使用者裁定，實作前過 font-clearance skill——`DESIGN.md`「不新增字體、不改 @font-face」禁令在使用者裁定前有效）：(1) bosswnx/huiwenmincho-improved 可否替換現行 HuiwenMincho subset 上游——重點：`index.css:26-32` 那 19 個 Chiron Sung HK fallback 缺字可否消掉、license 為何、與 zhuanlan.zhihu.com/p/344103391 介紹文比對來歷；(2) Fitzgerald-Porthmouth-Koenigsegg/Planschrift_Project 是什麼字體、license、對本站有無用處
- [ ] 首頁頁尾字體出處聲明（派：sonnet）：`App.jsx:304-311` 頁尾加一行字體 credit（Huiwen Mincho 公有領域等，連到 `/fonts/LICENSES.md`）；Erikas Farbband／Radio Newsman 上游條款未明（見 HANDOFF Font system），措辭比照 LICENSES.md 現況陳述，不誇大授權

## 新頁面構想
- [ ] 新獨立 repo `~/Documents/NTU/1142/review-notes`（paper/book review 專案；P2，scaffold 交 Codex/sonnet）：README＋第一篇骨架＝王兆珅《憲法解釋機制在中國的建立與展開（1906–1949）》碩論 review（同時是 ConstitutionalCourt 沿革區的素材來源）；review 正文之後由高階模型寫
- [ ] 瑞士法學前世今生（使用者 2026-07-07 提議，範圍待其點頭後 Fable 定案）：瑞士法學的歷史與現況，與 UNIL 申請脈絡掛鉤（Danon 稅法、Ziegler 國際經濟法）；流程比照沿革工作：Fable 定範圍與分期框架 → sonnet 深研（每個年份與主張附來源，禁止憑記憶）→ Codex 首版 UI → 文字經使用者審後上正文
- [ ] 碳費制度分析（與空污費對照，2024 年開徵）
- [ ] 台灣房地合一稅視覺化
- [ ] 財政收支劃分法互動圖解

## 技術債
- [ ] Vite 升級評估（派：sonnet，低優先）：Vite 5.4 升最新穩定大版——版本號與 Node 版本需求由該任務查官方文件（不憑記憶），並確認 `validate:fonts`／`validate:tokens` 純 node 腳本與 build 流程相容後才動手。不換框架（2026-07-07 評估：Vite＋React 棧對本站夠用）
- [ ] 首頁卡片加入 loading skeleton，避免 lazy load 時的版面位移
- [ ] 考慮將共用的 `Accordion`、`InfoBox`、`BulletList`、`Tag` 組件提取至 `src/components/`

## 已完成
- [x] 空氣污染防制費：6 分頁架構（構成要件、稽徵程序、法律效果、逃漏、財政收支、制度沿革）
- [x] 空污費逃漏：依空污法條文補入行政責任（§62/71/74/75）與刑事責任（§51/53/54/56/57）
- [x] 空污費財政收支：中央地方雙層基金結構視覺化
- [x] 首頁：移除 Acoustic 定位，改為「音樂 · 研究 · 實驗」雙軌識別
- [x] GovernmentDebt、ManusMetaAcquisition 頁面
- [x] InternationalTaxOps 改為分頁式介面（議題矩陣／來源登錄／前沿監測／關係圖譜／案例與爭議），詳見 `HANDOFF.md`
- [x] 站內字體系統統一（Huiwen-mincho + GenWanMin2/Radio Newsman + Erikas Farbband），詳見 `HANDOFF.md`
- [x] PaletteLab 色票品味測驗（2026-07-07，經三版才定案，過程見 `HANDOFF.md`）：新「品味測驗」標籤，20 題成對比較（色相 11／配色和諧 5／底色情境 4），色塊一律直接抄站內 `PALETTES` 真實色碼，不再公式生成；呈現改 Notion 風格淡底＋深墨色 tag（`tagTones()`），never 三色並排撞色。「色彩哲學」已寫進 `docs/DESIGN.md` 色票庫節，全站色彩決策都適用，不只這個測驗。結果存 localStorage＋一鍵複製摘要貼給 Claude 存品味檔案。
