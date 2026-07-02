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
- [x] 資料層拆出：private data repo 保存 raw/materials/notes/logs，前端只保留 `src/data/governmentDebt.json` 快照
- [x] 工程文件補明同步模型：手動同步，不 runtime 讀 private repo，前端快照部署後視為公開資料

### InternationalTaxOps 國際稅法研究桌

- [x] 從獨立 demo 完整搬入 canvas-lab，分頁式介面（議題矩陣／來源登錄／前沿監測／關係圖譜／案例與爭議）
- [x] 議題卡片改為手風琴式行內展開，取消側面獨立詳情面板
- [x] 關係圖譜改用 dagre 自動排版，移除虛構的監測項目連線，節點可拖曳
- [x] 新增「案例與爭議」分頁，內容扣準 Danon 實際學術論著（MAP 批判、UN ISDS 排除條款、GloBE 爭端架構提案等）
- [ ] 待 Codex 補齊 `sources.json` 缺漏的 5 筆已解析來源（見 `intl-tax-ops-lab/docs/24_CODEX_HANDOFF_2026-07-02.md`）
- [ ] 待 Codex 重試 UN FSDO 抓取（改善 headers；OECD BEPS 頁面需改用 headless browser）

### ManusMetaAcquisition Manus–Meta 跨境收購

- [x] 資料層拆出：1354 行內嵌資料抽成 `intl-tax-ops-lab/data/manus-meta-case.json`，與 InternationalTaxOps 共用同一個資料 repo（同屬國際稅法／投資法研究領域）
- [x] 組件精簡至 695 行，只保留渲染邏輯

### 全局
- [ ] 各頁加入 Open Graph / meta description，使分享連結有標題與預覽摘要
- [x] 研究類頁面移出大型 in-component 靜態資料的模式已建立：小型公開資料放 `src/data/*.json`，長期研究資料採 private data repo + frontend snapshot（已套用於 GovernmentDebt、InternationalTaxOps、ManusMetaAcquisition）
- [x] 站內字體系統統一：Huiwen-mincho（正文）＋ GenWanMin2／Radio Newsman（標題）＋ Erikas Farbband（僅限大型裝飾性文字，見 `~/.claude/skills/mincho-typewriter-type-system/`）

## 新頁面構想
- [ ] 碳費制度分析（與空污費對照，2024 年開徵）
- [ ] 台灣房地合一稅視覺化
- [ ] 財政收支劃分法互動圖解

## 技術債
- [ ] 首頁卡片加入 loading skeleton，避免 lazy load 時的版面位移
- [ ] 考慮將共用的 `Accordion`、`InfoBox`、`BulletList`、`Tag` 組件提取至 `src/components/`

## 已完成
- [x] 空氣污染防制費：6 分頁架構（構成要件、稽徵程序、法律效果、逃漏、財政收支、制度沿革）
- [x] 空污費逃漏：依空污法條文補入行政責任（§62/71/74/75）與刑事責任（§51/53/54/56/57）
- [x] 空污費財政收支：中央地方雙層基金結構視覺化
- [x] 首頁：移除 Acoustic 定位，改為「音樂 · 研究 · 實驗」雙軌識別
- [x] GovernmentDebt、ManusMetaAcquisition 頁面
