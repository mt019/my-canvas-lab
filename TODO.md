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
- [ ] 湯德宗對憲訴法改制後裁判編號系統變更表示遺憾——待使用者提供出處（文獻或演講）後放上 About 或案件時間軸的憲訴法標記旁；無出處不上正文
- [ ] 意見書全文抽取（1578 份 PDF 批次下載→抽純文字→刪檔，資料 repo 硬規則流程；>50 件抓取已知需使用者確認）→ 之後才做意見書全文靜態索引（MiniSearch 類、lazy load）。Elasticsearch 不採用：靜態站無伺服器，且現有 1.9MB 快照客戶端篩選已足，只有意見書全文語料（估數十 MB）才需要重新評估
- [ ] 大法官性別 20 人待確認（`資料repo/data/materials/性別覆核佇列.md`），人工補進 justices-overrides.json
- [ ] 釋字時期（813 件）參與大法官：依屆次名冊＋日期回填

### 全局
- [ ] 各頁加入 Open Graph / meta description，使分享連結有標題與預覽摘要

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
- [x] InternationalTaxOps 改為分頁式介面（議題矩陣／來源登錄／前沿監測／關係圖譜／案例與爭議），詳見 `HANDOFF.md`
- [x] 站內字體系統統一（Huiwen-mincho + GenWanMin2/Radio Newsman + Erikas Farbband），詳見 `HANDOFF.md`
