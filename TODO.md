# Canvas Lab · TODO

## 全局（2026-07-13 新增）

### 統計學實驗室（下一輪，兩件都未動工）
- [ ] **教材語料建置**：資料倉 `docs/教科書與參考書單.md` 已有六領域、14 個實測可取用的免費全文。`engineering/scripts/fetch-books.mjs` 已寫好未跑。要做：由書單生 `data/materials/booklist.json` → 跑 fetch → 新增 `index-books.mjs`（pdftotext 抽文字、產 `docs/教材索引.md`）→ 運維三件套（gitignore 擋 PDF、validate 檢查 manifest、LOG、負向測試）。
- [ ] **全站 SEO／AEO**：JSON-LD（Article／FAQPage／BreadcrumbList）、語言進網址 `?lang=en` ＋hreflang（現在語言只存 localStorage，爬蟲看不到英文版）、sitemap.xml／robots.txt 隨 build 產生、可索引頁面 build 後預渲染靜態 HTML。
- [ ] 正文兩處仍偏抽象待補具體例子：p 值均勻分佈、Neyman-Pearson 的長期錯誤率。

- [ ] **eslint 根本沒在檢查 `.jsx`**：`eslint.config.js` 的 files 只有 `**/*.{ts,tsx}`，所以 17 個 `.jsx` 頁面與 `src/components/lab/` 全部逃過 lint，`npm run lint` 的綠燈是假訊號。加上 jsx 支援會一次噴出既有錯誤，要排一輪處理。
- [ ] **共用層下一個該抽的東西**：點標籤／註記標註（帶避讓）。GovernmentDebt 的折線末端國名與 ECFA `ThesisTimeline` 的事件標註各自手刻同一套避讓邏輯——兩個真實用例已到齊。順帶：`AreaWash` 缺漸層、`Dots` 只有單一半徑。
- [ ] **比喻黑話殘留**：`HANDOFF.md` 與資料倉腳本裡還有 `sentinel`／`哨兵`／`棘輪` 等命名（見 jargon-check hook 每次的告警）。改名要跨 repo 動識別字，排一輪專門處理。

## 功能增強

### AirPollutionFee 空氣污染防制費
- [x] ~~安裝 KaTeX~~（2026-07-13 已裝，隨統計站進場）；費額公式 `Σ(Qᵢ · rᵢ) × D × E` 與 D/E 係數式仍待改用 `<Math tex="…" />` 渲染（注意：本頁不在 `validate:math` 範圍內，但公式一律 LaTeX 的規則同樣適用）
- [ ] 稽徵程序：將 `QUARTERLY_DEADLINES` 渲染成季申報截止日速查卡（日曆式表格）
- [ ] 費率查詢：補入重金屬（Pb/Cd/Hg/As/Cr⁶⁺）與戴奧辛費率表
- [ ] 逃漏：補充具體裁判案例或行政裁處實例（目前僅有條文，缺乏實務例證）

### GovernmentDebt 政府債務研究
- [ ] 補入最新數據（IMF WEO 或 BIS）更新各國債務佔 GDP 比率
- [ ] 中國城投（LGFV）債務規模估算補入近年數字

### InternationalTaxOps 國際稅法研究桌
- [x] Codex 資料層收尾（2026-07-09）：補齊 `sources.json` 缺漏的 5 筆已解析來源，新增 OECD BEPS 主題頁，修正已解析狀態，並同步 `src/data/intlTaxOps/{sources,topics}.json`。
- [ ] 依 `../intl-tax-ops-lab/docs/12_PHD_RESEARCH_LAYOUT.md` 重排第一屏：InternationalTaxOps 先呈現 UNIL/Danon PhD research agenda（研究問題、教授接口、制度爭點、文獻缺口、下一個書面產出），來源登錄／監測／關係圖譜退到支援層；Canvas 可見文案不得出現 parser/pipeline/repo/schema/raw/snapshot/workflowState/sourceTier 等工程語言。

### ManusMetaAcquisition
- [ ] 新增「How this case motivates the PhD project」段落：Manus–Meta 作為問題意識起源與 Danon × Ziegler 方法測試，不是整個申請計畫；研究底稿留在 `intl-tax-ops-lab`，Canvas 只顯示 public-facing 版本。

### ConstitutionalCourt 憲法法庭案例庫
- [ ] **【研究·下次做】起草「憲法解釋方法類型學」碼本草案（第二個分類器，與現處分類型學分開）**（使用者 2026-07-11 提，先不做）。定位：現 A–F 類型學分類「法院做了什麼」（處分/結論，主文為錨）；此新分類器分類「法院怎麼論證」（解釋方法/法學方法論，**理由書為本**，主文無此資訊）。更貼研究問題「分殊化＝審議專業化 vs 任命政治化」（專業化→方法更豐富多元；政治化→方法被工具化湊結論）。
  - **碼本骨架**：歐陸薩維尼四要素（文義/體系/歷史/目的＋合憲性解釋）＋美國 Bobbitt 六 modalities（文本/歷史原意/結構/判例釋義/審慎後果/倫理）＋台灣實務大量用的比例原則、比較憲法、釋義學。需綜合、勿照搬單一套。
  - **設計要點**（我先前分析）：(1) 多標籤不強迫單選（一案可並用多法）；(2) 另立「方法融貫度」軸/旗標（融貫/併用/自相矛盾）——把理由書寫得爛、前後矛盾變成**被測量的變量**而非雜訊，可能是 headline finding；(3) 區分主要理由 ratio vs 附帶 obiter，加權；(4) **預期信度明顯低於處分分類器**（方法是詮釋性、可爭的），人工校準從建議變必要。
  - **參考文獻（使用者指定，已核實路徑）**：東吳憲法課資料夾 `/Users/iw/Documents/NTU/1142/1142_SCU_CONSTITUTIONAL_LAW`——美國文獻豐富、德國較少但有參考價值。重點子目錄：`_Material/OCW/105S104_大法官講堂_中華民國憲法及政府/pdf/`（湯德宗大法官講堂 61 份講義 PDF，使用者特別點名很有用）；`_Material/Seminar/02_導論與理論閱讀/`（Barber-Fleming《Constitutional Interpretation: The Basic Questions》整本、Jed Rubenfeld 等理論）；`_Material/Seminar/08_同學期末報告/`（多份「以憲法解釋方法分析個別憲判」學生報告，如 111憲判6、114憲判1——現成的逐案方法編碼示範）；`_Material/湯德宗_著述與大法官案件清單.md`。
  - **執行順序**（我建議、待使用者定）：先設計碼本（智識核心＝使用者判斷，agent 只出草案排隊給審）→ 20–30 件跨早晚期/審查密度試點 → 看碼本撐不撐得住真實理由書的混亂 → 再決定全量。現處分分類器照跑不衝突。
- [ ] **卡片：無理由書者不顯示理由書按鈕**（前端，使用者 2026-07-11 提；之後做）。現況 `CaseCard`（`ConstitutionalCourt.jsx`）`hasReasoning = !d.系列`（L421）只排除行憲前，釋字第1–79號（歷史上本無獨立理由書，見資料 repo `engineering/LOG.md` 2026-07-11「釋字80 分界」）仍渲染按鈕（L555），點開才顯示「此件無獨立理由書」（L569）——傻。修法：資料層 `build-app-json.mjs` 每件加布林 `有理由書`（釋字≥80 且在 `constitutionalCourt-reasoning-fulltext.json` 有鍵者為 true；憲判同理），前端 `hasReasoning` 改吃 `d.有理由書`，false 就整個不渲染理由書按鈕區塊。需 data→app-json→sync→build。
- [ ] 意見書圖譜（GraphView）佈局重設計：現況節點依意見書總數排名後平均分佈在固定圓上（`ConstitutionalCourt.jsx` `GraphView`），相鄰關係與實際共同具名意見書無關，也無 zoom/pan。改為佈局本身能傳達關係強度（如 d3-force 依共同具名邊權重吸引，或依表決陣營/年代分群）。適合 Codex 出視覺原型；現成交辦 prompt 見 `~/.claude/plans/ui-sleepy-pebble.md` 第 4 條
- [x] 一輪密集 UI 修＋兩則資料修（2026-07-11 完成）：浮層頂欄一體式關閉鈕、分頁切換捲動歸零（修捲動聯動）、理由書全域鈕即時驅動全卡、無限捲動取代「顯示更多」（初始 40＋IntersectionObserver 預取）、理由書雙擊收合、逐人統計母數 7228→行憲後 874、NomineeDossiers 移 114憲判1 專屬分頁、卡片加審判長（僅憲判弱化可點）、逐人統計表頭語意換行＋nowrap。資料 repo（投影層）：官方文字勘誤層修釋字562「臺（77）內地字」（官方 PUA 字元 U+E8C7）、stripBenchRoster 剔憲判理由書尾署名列。詳見 HANDOFF「2026-07-11（同批續，一輪使用者密集回饋）」條。
- [ ] 自傳/簡歷放到任期時間軸（TenureView，使用者 2026-07-11 提；下輪做）：整體寬度縮一點，右側「意見書數」長條更右外突處直接顯示自傳/簡歷按鈕（預設就在、不用點）。需讀 TenureView SVG 版面。
- [x] 隨機挑件浮層＋歷史上的今天（2026-07-11 完成，純前端，計畫 `~/.claude/plans/ui-rosy-pancake.md`）：新增 `?doc=字號` 深連結浮層 `DocSpotlight`（重用 `CaseCard`、列出全部意見書；頂欄「案件預覽」＋關閉、面板 `max-w-4xl` 自適應視窗）；索引工具列尾端「隨機一則」＋同日 icon 鈕（`pickRandomDoc`／`pickOnThisDay`，池＝有 ISO 日期件、跨行憲前後）。使用者定案：頂欄不放 provenance 圖示、不放孤零日期（曾用 Shuffle 交叉圖示被讀成無意義符號，退回）。詳見 HANDOFF「2026-07-11」條。
- [x] 篩選列滾動自動收合（2026-07-11 完成，純前端）：`useHideOnScrollDown` hook；**關鍵修正**＝改用列前 0 高 sentinel 判「已卡住(sticky pin)」後才收，避免 header 過高（工具列自然位 ~313px）時初版固定 150px 門檻誤判、transform 上移留下整片版面空白。只套 `IndexView` 工具列，未動 TenureView／GraphView。Playwright G1–G5 驗證無空白。
- [x] 意見書預覽＋案件↔大法官雙向聯動（2026-07-11 完成，純前端）：大法官頁意見書列與 participationOnly chips 的字號改開 `?doc=` 浮層（看得到全部大法官意見書）；反向 `JusticeRef`（仿 `CaseRef`）——`CaseCard` 主筆／參與大法官、`OpinionLine` 意見書作者的在冊姓名變活連結，點擊 `setParams({tab:'justices',j:名})` 進個人頁、hover 掀迷你浮窗（`group/j` 純 CSS）。case↔justice 雙向打通。Playwright C1–C4／E1–E7／H1–H7。
- [x] 被引用最多的解釋「為何被引用」說明擴充（2026-07-07 完成，`~/.claude/plans/lovely-tumbling-star.md`）：`WHY_CITED`（`ConstitutionalCourt.jsx`）由 2 筆擴至 15 筆，覆蓋前端顯示的前 15 名（`cited.slice(0,15)`）。每筆定位逐一上網對照官方憲法法庭／全國法規資料庫與學說整理查證（來源見計畫檔）；682＝應考試權＋判斷餘地低密度審查、709＝首見強化正當行政程序、594 給予法律明確性定位不再留白。名次更深者仍留白（列表只渲染 15）。純前端硬編、不走資料 repo sync。
- [x] 審查結論規則式類型化（2026-07-07 完成，資料側＋前端）：待人工 434→217，新增 法令解釋（83）/補充前解釋（30）/變更前解釋（10）三非合憲性審查類＋合憲擴充；規則見資料 repo `docs/審查結論分類規則.md`。前端：`ConstitutionalCourt.jsx` 新增 teal badge 色調（沿用 IntlTaxOps 頁使用者點名保留的 `--teal: #4c7971`）套用三新類別、結論篩選器保留三個獨立選項、主題×審查結論矩陣把三者合併成「非合憲性審查」欄（避免稀釋違憲熱區判讀）；已 `npm run sync`＋`npm run build`，Playwright 實機驗證 badge/篩選器/矩陣三處皆通過。詳見 HANDOFF「審查結論 typology」條。審查基準 244 件（16 多重＋228 未明示）依裁示**不自動判、留人工覆核**。殘餘 217 待人工可再抽樣迭代；審查結論覆核 override 層已建（2026-07-07，資料 repo `data/materials/審查結論-overrides.json`＋`build-app-json.mjs` outcomeFor＋validate 防呆，人工／agent 覆核共用、跨重算存活；217 件實際覆核之後走 agent 分析流程分批填，見分類規則文件）。
- [x] 審查結論**類型學 6 軸**前端上線（2026-07-10 完成，純前端，`~/.claude/plans/repo-fluttering-glacier.md`）：快照 `結論類型` 欄（6 軸 A–F）之前未被前端消費；接上後 `ConstitutionalCourt.jsx` 新增 6 軸篩選面板（`IndexView`，可摺疊、作用於 196 件已類型化的「待人工」殘餘）、卡片 A-badge 取代「結論待人工判讀」＋B/C/D/E/F chip、「主題×處分模式（A 軸）」矩陣（`resolveA` 橋接粗軸 657 件＋agent 158 件，圖說標明來源比例與 A 單選主處分之限制）、About 說明節。build 全綠、Playwright 驗證。詳見 HANDOFF「2026-07-10」條。
- [x] 類型學 follow-up ①（2026-07-10 完成）：draft-3 最後 21 件已 `app-json && sync`，快照 196→217。
- [x] 類型學 follow-up ②（2026-07-10 完成 **違憲範圍**）：309 件行憲後違憲* 雙盲貼標（opus×2 pass／輪，gate `--agree`），採納 **286 件**、23 件真分歧進人工佇列（資料 repo `docs/類型學-人工佇列.md`）。來源真相檔 `審查結論類型.json` 217→**503**（500 agent 覆核：407 高／88 中／5 低），validate 全過。複合結構已現形（如釋775：B-B1＋B-B3＋B-B5＋B-B6＋部分違憲，卡片 chip 全列）。**依使用者裁示，348 件非違憲件（合憲225/法令解釋83/補充30/變更10）跳過**（A≈粗軸、低價值；**07-11 改裁示補標，見 follow-up ③**）。gate 加了 `--agree` 旗標（一致即採納，供有粗軸先驗的補標；嚴格雙高仍是預設）。
  - 注意：canvas 快照經完整 `app-json→sync` 正規化到 503（含 `結論類型` 6 軸）。
- [x] 類型學 follow-up ③（2026-07-12 完成收官）：348 件非違憲行憲後件補標 6 軸全部收斂，**全 874/874 行憲後件六軸完成**（雙盲 opus×2＋gate `--agree`，難案 Codex 第三票 tie-break，唯 釋250 留人工）。凍結碼本 v1.0、逐值憑證（3392 引文）、官方 kappa（全軸 ≥0.8）、污染測試否證記憶依賴、研究報告隱蔽頁全上線並 push。詳見資料 repo `docs/審查結論類型學-凍結v1.0.md`、`docs/類型學-方法論問答與待辦.md`、`engineering/LOG.md`。仍待裁：行憲前 5040 是否延伸（見 plan 檔方案，建議僅 C 軸規則式或延後）。
- [ ] 大法官出身／留學國「待確認」共 19 人（2 出身＋17 留學國，`TENURE_BG_COLOR`／`ABROAD_GROUP` 待確認分支）：範圍小、來源明確，適合直接研究。交辦 prompt 見上述計畫檔第 1 條
- [ ] 湯德宗對憲訴法改制後裁判編號系統變更表示遺憾——待使用者提供出處（文獻或演講）後放上 About 或案件時間軸的憲訴法標記旁；無出處不上正文
- [ ] 意見書全文抽取（1578 份 PDF 批次下載→抽純文字→刪檔，資料 repo 硬規則流程；>50 件抓取已知需使用者確認）→ 之後才做意見書全文靜態索引（MiniSearch 類、lazy load）。Elasticsearch 不採用：靜態站無伺服器，且現有 1.9MB 快照客戶端篩選已足，只有意見書全文語料（估數十 MB）才需要重新評估
- [ ] 大法官性別 20 人待確認（`資料repo/data/materials/性別覆核佇列.md`），人工補進 justices-overrides.json
- [x] 釋字時期（813 件）參與大法官：~~依屆次名冊回填~~ 2026-07-07 改從官方頁署名列解析，813 件全覆蓋（迴避者不在列，非推定）
- [x] 署名列×任期交叉查核出界 12 人（2026-07-07 完成）：11 人確認、1 人（黃亮）部分確認（第三屆卸任日查無、暫用屆次推定終年 1976-09），查核結果＋逐項來源見資料 repo `data/materials/參與解釋查核結果.md`，已寫入 `justices-overrides.json` 逐段任期。重跑 justices→app-json→validate→sync 後**出界旗標 684→0 清零**。制度性發現：田炯錦/戴炎輝/城仲模/謝在全/賴英照等卸任大法官後轉任院長/副院長仍以「大法官會議主席」身分署名（司法院大法官會議法第3條），任期須延伸至院長/副院長卸任日；黃正銘第三屆卸任年順帶訂正（1976→1972-07-04 呈請退職）
- [x] 屆次/任期收斂（2026-07-07 落地）：推定者單行＋「任期依屆次推定」小字，簡歷頁/人工核定者保留任期明細，現任顯示實際起日；Playwright 四例驗證通過。後續：張式彝等推定值錯誤由資料 repo 傳記查核批次修
- [x] 沿革分頁 Phase A（P1，2026-07-07 完成上線）：ConstitutionalCourt 第 7 分頁 `?tab=history`，雙軸＝機關四階段時間軸（大理院統字→最高法院解字→司法院院字/院解字→大法官釋字＋憲法法庭憲判，等比橫條）＋憲政時期色帶（北京政府→訓政→行憲，制憲為嵌入標記，比照 TenureView 疊帶）；四段機關卡＋四張時期卡預設全展開、憲判件數綁 `data.統計`、時間軸 1913 起。文字＋五項取捨經使用者核可定稿（資料 repo `docs/沿革摘要草稿.md`）、憲政時期年份經 sonnet 查證（`docs/沿革素材查證.md` E 節）。由 Claude Code 直接實作（使用者裁示不經 Codex）；build／lint／Playwright（14 檢查）綠。設計見 `docs/司法解釋沿革設計.md`（含「Phase A 增補」雙軸節）。交辦稿 `~/.claude/plans/constcourt-provenance-ui-codex.md` 已標 superseded。

- [x] M5 Phase B 行憲前司法解釋入庫＋前端（2026-07-08 完成上線）：大理院統字（2012）＋最高法院解字（245）＋司法院院字／院解字（4097）共 **6,354 件**維基文庫全文入庫（資料 repo `crawl-wikisource.mjs`，MediaWiki API），與釋字／憲判同進 `文件` 集合、加「機關」維度區分。前端（`ConstitutionalCourt.jsx`）：索引頁**頂部大分段鈕**（行憲後 釋字・憲判 874／行憲前 統一解釋 6354／全部 7228，預設行憲後）取代埋藏下拉，行憲前另給機關子篩選；行憲前檢視隱藏大法官時代篩選（類型／主題／審查基準）。首頁「大法官解釋」改讀 `統計.機關.大法官`（813，不再被行憲前污染成 7167），行憲前另列一行分隔顯示。排序改 **系列＋號次**（統字多無日期，原退回檔名字母序而亂序）。行憲前全文走**懶載檔** `constitutionalCourt-pre1947-fulltext.json`（Vite 動態 import 分塊、只抓一次），`CaseCard` 進行憲前檢視**自動展開全文**（不用逐張點）。沿革四段卡加「檢視這 N 件案件」深連（`?機關=…`）。TimelineView／TopicHeatmaps 排除行憲前。字型子集重建吸收古典字、27 個來源缺字入 exceptions（系統 serif fallback）；統字日期源頭幾近全缺（僅統字500 有 1916 年）。決策與探勘見資料 repo `docs/司法解釋沿革設計.md`、`docs/行憲前來源探勘.md`、`docs/data-contract.md`。build（字型＋token＋色彩＋vite）全綠、零新色、Playwright 實機驗證（分段鈕／排序／自動展開全文）。

### 全局
- [x] 全站色彩哲學稽核（2026-07-07 完成）：使用者裁定「整體 canvas 不允許違反色彩設計哲學」。逐頁用 OKLCH 計算篩出色相 50°–140°、彩度 ≥0.08 的土黃/土綠風險色（不憑眼睛猜），全站 618 個 distinct hex 掃過，修掉 ConstitutionalCourt（PRES_COLOR 嚴家淦/蔣經國、TENURE_*檢察官/其他銅棕交叉污染）、ManusMeta（MMA_VARS 11 處＋事實查核狀態色）、FiscalEnforcementRisk（amber 徽章）、GermanLawCourseTimeline（7 色領域圖例＋首頁卡片文字色）、AutoTuner/UkuleleTuner/VocalTuner（調音指針）共約 20+ 處違規，一律換成 `palettes.js` 真實色票色碼、多分類色重過 CVD 驗證。剩餘 12 個在 `palettes.js` 候選展示色票內（水果/名畫主題色票的個別 accent/pop）＋GOLD_FOIL，屬使用者刻意保留的瀏覽候選，只標記不動。色彩哲學三規則已入 `docs/DESIGN.md`。獨立 agent 重掃＋8 頁 Playwright 實機驗證通過
- [ ] 各頁加入 Open Graph / meta description，使分享連結有標題與預覽摘要
- [ ] PaletteLab 金箔按鈕修正（派：sonnet）：`PaletteLab.jsx:211-215` 整顆 `.foil` 填滿的按鈕退場，改文字版 `.foil-text`＋一般底色；使用規則已入 `docs/DESIGN.md` 禁止事項（2026-07-07 使用者裁定：金箔做字好看，整顆按鈕醜）
- [ ] 字體上游評估（派：sonnet 研究；產出評估報告交使用者裁定，實作前過 font-clearance skill——`DESIGN.md`「不新增字體、不改 @font-face」禁令在使用者裁定前有效）：(1) bosswnx/huiwenmincho-improved 可否替換現行 HuiwenMincho subset 上游——重點：`index.css:26-32` 那 19 個 Chiron Sung HK fallback 缺字可否消掉、license 為何、與 zhuanlan.zhihu.com/p/344103391 介紹文比對來歷；(2) Fitzgerald-Porthmouth-Koenigsegg/Planschrift_Project 是什麼字體、license、對本站有無用處
- [ ] 首頁頁尾字體出處聲明（派：sonnet）：`App.jsx:304-311` 頁尾加一行字體 credit（Huiwen Mincho 公有領域等，連到 `/fonts/LICENSES.md`）；Erikas Farbband／Radio Newsman 上游條款未明（見 HANDOFF Font system），措辭比照 LICENSES.md 現況陳述，不誇大授權

## 新頁面構想
- [ ] 新獨立 repo `review-notes`（paper/book review 專案；P2，scaffold 交 Codex/sonnet）：README＋第一篇骨架＝王兆珅《憲法解釋機制在中國的建立與展開（1906–1949）》碩論 review（同時是 ConstitutionalCourt 沿革區的素材來源）；review 正文之後由高階模型寫
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
