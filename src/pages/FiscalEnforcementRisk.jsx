import React, { useEffect, useMemo, useState } from 'react';
import LangSwitch, { useLang } from '../components/LangSwitch';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Database,
  FileSearch,
  GitCompare,
  Layers3,
  ListChecks,
  Radar,
  Scale,
  ShieldAlert,
  TimerReset,
} from 'lucide-react';
import data from '../data/fiscalEnforcementRisk.json';

const ds = data.datasets;
const initial = ds.initialResults;

const tabs = [
  { id: 'overview', label: '問題意識', en: 'Research Problem', icon: Radar },
  { id: 'materials', label: '證據基礎', en: 'Evidence Base', icon: Database },
  { id: 'findings', label: '分析結果', en: 'Findings', icon: GitCompare },
  { id: 'factcheck', label: '事實查核', en: 'Fact Check', icon: ShieldAlert },
  { id: 'methods', label: '方法設計', en: 'Methods', icon: BarChart3 },
  { id: 'next', label: '研究路線', en: 'Research Route', icon: ListChecks },
];

const confidenceLabel = {
  zh: { high: '高', medium: '中', low: '低' },
  en: { high: 'High', medium: 'Medium', low: 'Low' },
};

const i18n = {
  '地方財政缺口風險與遠洋捕撈現象': 'Local Fiscal Gap Risk and Predatory Cross-Regional Enforcement',
  '財政壓力如何轉化為跨區域趨利性執法的可觀測指標': 'How fiscal pressure becomes observable indicators of profit-driven cross-regional enforcement',
  '若地方財政壓力提高後，跨區域案件、凍結資金、罰沒收入與灰色產業標的同步上升，則可檢驗財政缺口推動趨利性執法的政治經濟學機制。': 'If rising local fiscal pressure is followed by increases in cross-regional cases, frozen funds, fine-and-confiscation revenue, and gray-market targets, the project can test the political-economic mechanism linking fiscal gaps to profit-driven enforcement.',
  '初步材料整理': 'Preliminary Evidence Review',
  '適合做問題意識、類型學、個案線索與描述性財政圖；尚不足以做強因果面板。': 'The current evidence supports problem framing, typology, case leads, and descriptive fiscal comparisons, but not a strong causal panel model.',
  '模型先保留候選，不直接上 TWFE。等官方財政 row、案件 outcome proxy、比較組補齊後再選。': 'Keep econometric models as candidates for now. Do not run a TWFE design until official fiscal rows, enforcement outcome proxies, and comparison units are sufficiently complete.',
  '遠洋捕撈的類型化': 'Typology of Predatory Cross-Regional Enforcement',
  '目前證據能支撐什麼': 'What the Evidence Can Support',
  '目前不能直接推出的結論': 'Claims Not Yet Supported',
  '事實查核小表': 'Fact-Check Ledger',
  '初步結果': 'Preliminary Findings',
  '南陽官方數與第三方縣市區表抽樣比對': 'Nanyang Official Data vs. Third-Party County/District Totals',
  '現在先不急著上強因果模型': 'Do Not Rush Into a Strong Causal Model',
  '第一個可用研究形態': 'First Usable Research Design',
  '暫時不該宣稱的模型': 'Designs Not Yet Defensible',
  '從材料到模型的路徑': 'Path From Evidence to Model',
  '下一輪研究工作': 'Next Research Tasks',
  '展示時保留的風險邊界': 'Risk Boundaries Kept in View',
  '初步展示：問題意識、證據基礎、事實查核與方法邊界': 'Preliminary dashboard: research problem, evidence base, fact-checking, and method boundaries',
  '更新日': 'Updated',
  '證據來源': 'Evidence Sources',
  '政策、案例、文獻': 'Policy, cases, literature',
  '事件時間線': 'Event Timeline',
  '依可信度分級': 'Tiered by credibility',
  '財政核對': 'Fiscal Validation',
  '官方與第三方口徑比對': 'Official vs. third-party scopes',
  '政策與案例來源': 'Policy and Case Sources',
  '68 組來源': '68 source groups',
  '20 筆事件': '20 events',
  '南陽 2022-2023': 'Nanyang 2022-2023',
  '南陽財政比對': 'Nanyang Fiscal Validation',
  '縣級財政序列': 'County Fiscal Series',
  '債務壓力序列': 'Debt-Pressure Series',
  '方法依據': 'Method References',
  '3 篇核心文獻': '3 core references',
  '已建置': 'Built',
  '可用於時間線': 'Usable for timeline',
  '剛起步': 'Early stage',
  'B 級種子': 'B-grade seed',
  'B 級背景': 'B-grade context',
  '可用': 'Usable',
  '信心': 'Confidence',
  '年度': 'Year',
  '指標': 'Metric',
  '官方口徑': 'Official scope',
  '官方': 'Official',
  '第三方': 'Third party',
  '差異': 'Difference',
  '狀態': 'Status',
  '依據': 'Basis',
  '限制': 'Limit',
  '已核實': 'Verified',
  '部分核實': 'Partly verified',
  '待核實': 'Pending',
  '不可作結論': 'Not a conclusion',
  '財政壓力先用 t-1；panel 足夠時再檢查 t-2、t-3。': 'Use t-1 fiscal pressure first; test t-2 and t-3 when the panel is long enough.',
  '強 TWFE 因果模型': 'Strong TWFE causal model',
  '完整 dyad-year targeting model': 'Full dyad-year targeting model',
  '機制型比較個案 + 描述性 city/county fiscal timeline': 'Mechanism-centered comparative case study plus descriptive city/county fiscal timeline',
  't-2 lag': 't-2 lag',
  't-3 lag': 't-3 lag',
  '事件月/季度集中度': 'Event month/quarter concentration',
  'origin-target dyad-year': 'Origin-target dyad-year',
  'A-grade 罰沒收入明細不足': 'A-grade fine-and-confiscation details are still insufficient',
  '2025-2026 官方縣市資料未補齊': 'Official county/city data for 2025-2026 remain incomplete',
  '案件 outcome proxy 還不完整': 'Enforcement outcome proxies are still incomplete',
  '比較組尚未建立': 'Comparison units have not yet been constructed',
  '來源盤點': 'Source Mapping',
  '按地區與年份建立財政報告、司法文書與案例來源清單。': 'Build a jurisdiction-year inventory of fiscal reports, judicial/procuratorate documents, and case sources.',
  '原始保存': 'Source Capture',
  '保存官方 HTML/PDF、媒體頁面與資料庫匯出檔，並記錄 URL 與取得日期。': 'Preserve official HTML/PDF files, media pages, and database exports, with URLs and capture dates.',
  '欄位抽取': 'Field Extraction',
  '抽取財政收入支出、罰沒收入、案件地理欄位、罪名、金額與月份。': 'Extract fiscal revenue/expenditure, fine-and-confiscation revenue, case geography, charges, amounts, and months.',
  '跨區域判定': 'Cross-Regional Classification',
  '比對執法機關所在地與被告/企業/伺服器/資金所在地，標記跨省、跨市、跨縣。': 'Compare enforcement-origin location with defendant, firm, server, or fund location, then flag cross-province, cross-city, and cross-county cases.',
  '面板建構': 'Panel Construction',
  '形成 region-year panel 與案件級 microdata，可接上固定效應模型。': 'Construct region-year panels and case-level microdata that can later support fixed-effects models.',
  '模型估計': 'Model Estimation',
  '估計財政缺口對趨利性執法 proxy 的邊際效應與異質性。': 'Estimate marginal effects and heterogeneity between fiscal gaps and profit-driven enforcement proxies.',
  '官方文書缺失或下架': 'Official documents are missing or removed',
  '保存來源快照；用多來源交叉驗證；保留缺失機制說明。': 'Preserve snapshots, cross-check multiple sources, and retain a missingness explanation.',
  '跨區域不等於趨利性執法': 'Cross-regional enforcement is not automatically profit-driven',
  '區分合法管轄、專項行動與財政抽取 proxy；用金額、月份、標的產業與地方財政壓力共同判斷。': 'Separate lawful jurisdiction, national campaigns, and fiscal-extraction proxies; use amount, timing, target sector, and local fiscal pressure jointly.',
  '個案指控法律風險': 'Legal risk in presenting individual case allegations',
  '前端只呈現研究框架與聚合結果；個人層級資訊保留在研究 notes 並採來源狀態標記。': 'The public dashboard presents research framing and aggregated findings; person-level details remain in research notes with source-status labels.',
  '內生性與反向因果': 'Endogeneity and reverse causality',
  '使用滯後財政指標、固定效應、事件時間、placebo crime category 與異質性檢驗。': 'Use lagged fiscal variables, fixed effects, event timing, placebo crime categories, and heterogeneity checks.',
  '抽取南陽 2024 官方財政數值，記錄第三方 2024 南陽缺口。': 'Extract Nanyang 2024 official fiscal values and record the third-party 2024 Nanyang gap.',
  '抓南陽凍品案 17 批公告、拍賣/評估、罰沒財物處置、入庫線索。': 'Capture the 17 Nanyang frozen-goods notices, auction/appraisal records, confiscated-property disposal records, and fiscal-deposit leads.',
  '恢復泌陽官方資料：18 個扣留公告、2023-2025 財政/審計文件。': 'Recover Biyang official materials: 18 detention notices and 2023-2025 fiscal/audit documents.',
  '驗證駐馬店、南陽、德州、焦作、商丘地級市債務資料。': 'Validate prefecture-level debt data for Zhumadian, Nanyang, Dezhou, Jiaozuo, and Shangqiu.',
  '建立第一版 Nanyang/Biyang 財政-事件時間線。': 'Build the first Nanyang/Biyang fiscal-event timeline.',
  '目前可以公開展示的是制度問題、南陽財政口徑比對、官方監督類別與方法依據；個案錢流與部分案例仍需補原始文書。': 'What can be publicly shown now: the institutional problem, Nanyang fiscal-scope validation, official supervision categories, and method references. Case-level money flows and some cases still require original records.',
  '南陽 2023 年第三方縣市區財政數與官方拆分後口徑高度一致。': 'Nanyang 2023 third-party county/district fiscal values closely match the official scope-adjusted figures.',
  '官方全市數扣除市本級與五個功能區後，收入 212.2678 億元；CNT_FinRev 13 縣市區收入 212.2460 億元。': 'After subtracting the city-level budget and five functional zones from the official citywide total, revenue is RMB 21.22678 billion; CNT_FinRev reports RMB 21.22460 billion for the 13 county/district units.',
  '只能升級同年度、同指標、同口徑；不能把整包第三方資料一次升級。': 'Only the same year, same variable, and same scope can be upgraded; the third-party package cannot be upgraded wholesale.',
  '大差額主要來自行政口徑混比。': 'Large gaps mainly come from mixing administrative scopes.',
  '第三方南陽表只含 13 個標準縣市區，不含市本級與五個功能區。': 'The third-party Nanyang table contains only 13 standard county/district units, excluding the city-level budget and five functional zones.',
  '2022 年仍需完整決算附表確認功能區或財政管理區口徑。': 'The 2022 rows still require full final-account annexes to confirm functional-zone or fiscal-management-area scope.',
  '財政壓力變數應先用前一期。': 'Fiscal-pressure variables should first use the previous period.',
  'Garrett & Wagner、Su 的交通罰款研究均使用 lag；Wang & Dai 是最貼近中國非本地企業執法偏誤的參照。': 'Garrett and Wagner and Su both use lagged fiscal conditions in traffic-fine studies; Wang and Dai is the closest reference for Chinese non-local firm enforcement bias.',
  'lag 支持時間設計，不等於本案已完成因果識別。': 'Lag structure supports timing design; it does not mean causal identification has already been achieved here.',
  '南陽凍品案可作行政查扣與罰沒財物處置主線。': 'The Nanyang frozen-goods case can serve as a main line for administrative seizure and confiscated-property disposal.',
  '已抓南陽市場監管局官方通報，確認 2023 年 7-8 月 17 批貨物、2023 年 10 月處置等線索。': 'The official Nanyang market-regulation notice has been captured, confirming leads involving 17 batches of goods in July-August 2023 and disposal in October 2023.',
  '仍缺 17 批公告、拍賣/評估、入庫與處置明細。': 'The 17 batch notices, auction/appraisal records, fiscal deposits, and disposal details are still missing.',
  '泌陽冷凍車案可作主案例時間線。': 'The Biyang refrigerated-truck case can serve as a main case timeline.',
  '已有地方通報、媒體調查與省級工作組線索，可建立 2025-2026 事件時間線。': 'Local notices, investigative reporting, and provincial taskforce leads support a 2025-2026 event timeline.',
  '仍需官方扣留公告、審計/財政文件、處置與救濟材料。': 'Official detention notices, audit/fiscal documents, disposal records, and remedy materials are still needed.',
  '夏津 VPN/網安案例能進模型。': 'The Xiajin VPN/cyber-police case can enter the model.',
  '目前主要是媒體與當事人敘事線索。': 'Current evidence mainly consists of media and claimant narratives.',
  '缺立案、取保、檢察、判決/不起訴、保證金與追繳等可公開文書前，不應作模型觀測。': 'Before public filing, bail, procuratorate, judgment/non-prosecution, bond, and recovery documents are found, it should not be treated as a model observation.',
  '地方財政缺口已被證明導致具體個案。': 'Local fiscal gaps have been proven to cause specific cases.',
  '目前材料足以支持機制假說與描述性比較，不足以支持強因果宣稱。': 'Current evidence supports mechanism hypotheses and descriptive comparison, not strong causal claims.',
  '需要 A-grade 罰沒收入明細、比較組、可重複 outcome proxy 與清楚時間順序。': 'A-grade fine-and-confiscation details, comparison units, repeatable outcome proxies, and clear timing are required.',
  '全市扣除市本級與五個功能區': 'Citywide total minus city-level budget and five functional zones',
  '官方縣（市、區）級': 'Official county/city/district level',
  '13 個標準縣市區，不含市本級與五個功能區': '13 standard county/district units, excluding the city-level budget and five functional zones',
  '官方全市數只能與全口徑數比；第三方縣市區表要先扣除市本級與功能區。': 'Citywide official totals should only be compared with full-scope totals. Third-party county/district tables must first be aligned by subtracting the city-level budget and functional zones.',
  '一般公共預算收入': 'General public budget revenue',
  '一般公共預算支出': 'General public budget expenditure',
};

const translatedLists = {
  '財政資料差很大，主因是口徑混比': 'Large fiscal-data gaps mainly reflect scope mismatch',
  '南陽 2023 年官方全市數扣除市本級與五個功能區後，收入為 212.2678 億元；CNT_FinRev 13 個縣市區合計為 212.2460 億元，差約 -0.01%。': 'For Nanyang 2023, after subtracting the city-level budget and five functional zones from the official citywide total, revenue is RMB 21.22678 billion; the CNT_FinRev total for 13 county/district units is RMB 21.22460 billion, a difference of about -0.01%.',
  '第三方財政表可作 B+ 種子，但不能整包升級': 'Third-party fiscal tables can be B+ seeds, not wholesale model-ready data',
  '已驗證的是南陽 2023 的同口徑收入與支出小計；2022 仍需完整決算附表與功能區口徑。': 'Only the Nanyang 2023 same-scope revenue and expenditure subtotals have been validated. The 2022 rows still require full final-account annex tables and functional-zone scope checks.',
  '財政壓力變數應使用 lag': 'Fiscal-pressure variables should be lagged',
  'Garrett & Wagner、Su、Wang & Dai 均支持財政條件先於執法反應的時間結構；baseline 用 t-1，並檢查 t-2、t-3。': 'Garrett and Wagner, Su, and Wang and Dai all support a timing structure in which fiscal conditions precede enforcement responses. Use t-1 as the baseline and test t-2 and t-3.',
  '官方財政資料大多能抓，但個案錢流不一定能靠財政報告證明': 'Most official fiscal data can be captured, but case-level money flows require other records',
  '一般預算、非稅、債務、部門決算多可由官方文件補；罰沒財物處置、拍賣、入庫、凍結資金去向要另抓公告、審計、處罰或監督文書。': 'General budgets, non-tax revenue, debt, and departmental final accounts can often be recovered from official documents. Disposal of confiscated property, auctions, fiscal deposits, and frozen-fund flows require announcements, audit records, penalty documents, or supervisory records.',
  '政策、官方監督、案例線索、財政資料、方法文獻。': 'Policy documents, official supervision materials, case leads, fiscal data, and methods literature.',
  '泌陽、南陽、夏津、壹健康、邢燕軍等線索分級保存。': 'Biyang, Nanyang, Xiajin, Yijiankang, Xing Yanjun, and related leads are retained with evidence tiers.',
  '含 2022/2023 全市與縣市區小計；2023 小計為 validated_bplus。': 'Includes 2022/2023 citywide and county/district subtotals; the 2023 subtotal is validated B+.',
  '需逐樣本與官方口徑比對，不可整包升級。': 'Must be sample-validated against official scopes; cannot be upgraded as a whole package.',
  '縣級案例只能作 prefecture_proxy。': 'For county-level cases, this can only serve as a prefecture proxy.',
  'Garrett & Wagner、Su、Wang & Dai 已抓取或入庫。': 'Garrett and Wagner, Su, and Wang and Dai have been captured or added to the library.',
};

const contentEn = {
  hypotheses: {
    H1: {
      name: 'Core Hypothesis',
      claim: 'Larger local fiscal gaps are associated with higher frequency and amounts of profit-driven cross-regional enforcement.',
      observableImplication: 'After fiscal self-sufficiency falls or non-tax dependence rises, cross-regional case counts, fine/confiscation revenue, recovered proceeds, or offsite freezing events increase in the following period.',
    },
    H2: {
      name: 'Heterogeneity Hypothesis',
      claim: 'The fiscal-gap transmission effect is stronger in economically weaker regions.',
      observableImplication: 'Regions with lower GDP, lower income, or higher transfer-payment dependence should show a steeper relationship between fiscal gaps and enforcement proxies.',
    },
    H3: {
      name: 'Target Selection Hypothesis',
      claim: 'Targets concentrate in cash-rich, legally ambiguous, non-local, weakly protected sectors.',
      observableImplication: 'Game accelerators, VPN/proxy services, cryptocurrency, e-commerce, payment, and gray-traffic sectors should appear disproportionately in cross-regional cases.',
    },
    H4: {
      name: 'Timing Pressure Hypothesis',
      claim: 'Profit-driven enforcement events concentrate around higher fiscal-settlement pressure windows.',
      observableImplication: 'Arrests, freezing, recovery, and fiscal deposits should rise in Q4 or around year-end settlement periods.',
    },
  },
  typology: {
    '行政凍品/貨物查扣': {
      type: 'Administrative frozen-goods / cargo seizure',
      mechanism: 'Seizure, unclaimed-property classification, disposal, auction, or fiscal deposit.',
      evidenceNeed: 'Disposal notices, auction appraisal records, confiscated-property deposits, and administrative-remedy records.',
    },
    '公安網安/平台型案件': {
      type: 'Cyber-police / platform cases',
      mechanism: 'Expanded criminal labels, cross-province arrests, bail, recovery, or confiscation.',
      evidenceNeed: 'Filing records, bail documents, prosecution/non-prosecution decisions, judgments, bond and recovery records.',
    },
    '警稅合成作戰': {
      type: 'Police-tax synthetic operations',
      mechanism: 'Tax-data and police-investigation cooperation can strengthen extraction capacity in enterprise-related cases.',
      evidenceNeed: 'Official center-establishment documents, procurement records, coordination mechanisms, and case documents.',
    },
    '帳戶凍結/解凍監督': {
      type: 'Account freezing / unfreezing supervision',
      mechanism: 'Offsite freezes create operating pressure, later corrected through procuratorate or superior-level supervision.',
      evidenceNeed: 'Freezing-assistance records, procuratorate supervision, unfreezing lists, and company disclosures.',
    },
    '非本地企業執法偏誤': {
      type: 'Bias against non-local firms',
      mechanism: 'Under fiscal pressure, non-local firms may be easier targets because they lack local political protection.',
      evidenceNeed: 'Origin-target dyads, firm registration location, enforcement-origin fiscal pressure, and comparable local-firm controls.',
    },
  },
};

function tr(text, lang) {
  if (lang !== 'en') return text;
  return i18n[text] || translatedLists[text] || text;
}

const toneClass = {
  high: 'fer-badge fer-badge-green',
  medium: 'fer-badge fer-badge-amber',
  low: 'fer-badge fer-badge-red',
};

function Badge({ children, tone = 'slate' }) {
  return <span className={`fer-badge fer-badge-${tone}`}>{children}</span>;
}

function Stat({ icon: Icon, label, value, note }) {
  return (
    <div className="fer-stat">
      <div className="fer-stat-icon"><Icon size={18} /></div>
      <div>
        <div className="fer-stat-label">{label}</div>
        <div className="fer-stat-value">{value}</div>
        {note ? <div className="fer-stat-note">{note}</div> : null}
      </div>
    </div>
  );
}

function coverageDisplay(item, lang = 'zh') {
  const map = {
    來源清單: { label: '政策與案例來源', value: '68 組來源' },
    案件事件表: { label: '事件時間線', value: '20 筆事件' },
    財政面板: { label: '南陽財政比對', value: '2022-2023' },
    第三方縣級財政: { label: '縣級財政序列', value: '2000-2024' },
    地級市債務資料: { label: '債務壓力序列', value: '2006-2023' },
    'lag 文獻': { label: '方法依據', value: '3 篇核心文獻' },
  };
  const display = map[item.label] ?? { label: item.label, value: item.value };
  return { label: tr(display.label, lang), value: tr(display.value, lang) };
}

function SectionTitle({ eyebrow, title, lang = 'zh', children }) {
  return (
    <div className="fer-section-title">
      <div>
        <p>{eyebrow}</p>
        <h2>{tr(title, lang)}</h2>
      </div>
      {children ? <div className="fer-section-title-extra">{children}</div> : null}
    </div>
  );
}

function Overview({ lang }) {
  return (
    <div className="fer-stack">
      <section className="fer-panel fer-panel-strong">
        <SectionTitle eyebrow="Research Question" title={ds.researchQuestion.title} lang={lang}>
          <Badge tone="blue">{tr(initial.status.phase, lang)}</Badge>
        </SectionTitle>
        <p className="fer-lead">{tr(ds.researchQuestion.subtitle, lang)}</p>
        <p className="fer-body">{tr(ds.researchQuestion.thesis, lang)}</p>
        <div className="fer-callout">
          <ShieldAlert size={18} />
          <span>{tr(initial.status.readiness, lang)}</span>
        </div>
      </section>

      <div className="fer-grid fer-grid-2">
        {ds.hypotheses.map((item) => {
          const enItem = contentEn.hypotheses[item.id];
          return (
            <article className="fer-card" key={item.id}>
              <div className="fer-card-head">
                <Badge tone="slate">{item.id}</Badge>
                <span>{lang === 'en' ? enItem?.name : item.name}</span>
              </div>
              <h3>{lang === 'en' ? enItem?.claim : item.claim}</h3>
              <p>{lang === 'en' ? enItem?.observableImplication : item.observableImplication}</p>
            </article>
          );
        })}
      </div>

      <section className="fer-panel">
        <SectionTitle eyebrow="Typology" title="遠洋捕撈的類型化" lang={lang} />
        <div className="fer-typology-grid">
          {initial.typologySummary.map((item, index) => {
            const enItem = contentEn.typology[item.type];
            return (
              <article className="fer-typology-card" key={item.type}>
                <div className="fer-typology-head">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{lang === 'en' ? enItem?.type : item.type}</h3>
                </div>
                <div className="fer-typology-body">
                  <div>
                    <strong>{lang === 'en' ? 'Mechanism' : '機制'}</strong>
                    <p>{lang === 'en' ? enItem?.mechanism : item.mechanism}</p>
                  </div>
                  <div>
                    <strong>{lang === 'en' ? 'Evidence to collect' : '待證資料'}</strong>
                    <p>{lang === 'en' ? enItem?.evidenceNeed : item.evidenceNeed}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Materials({ lang }) {
  return (
    <div className="fer-stack">
      <div className="fer-stats-grid">
        {initial.materialCoverage.map((item) => {
          const display = coverageDisplay(item, lang);
          return (
            <Stat
              key={item.label}
              icon={item.status.includes('已') || item.status.includes('可用') ? BadgeCheck : FileSearch}
              label={display.label}
              value={display.value}
              note={tr(item.status, lang)}
            />
          );
        })}
      </div>
      <section className="fer-panel">
        <SectionTitle eyebrow="Evidence Base" title="目前證據能支撐什麼" lang={lang} />
        <div className="fer-list">
          {initial.materialCoverage.map((item) => (
            <div className="fer-list-row" key={item.label}>
              <div>
                <strong>{coverageDisplay(item, lang).label}</strong>
                <p>{tr(item.note, lang)}</p>
              </div>
              <Badge tone={item.status.includes('B') || item.status.includes('剛') ? 'amber' : 'green'}>
                {tr(item.status, lang)}
              </Badge>
            </div>
          ))}
        </div>
      </section>
      <section className="fer-panel">
        <SectionTitle eyebrow="Inference Boundary" title="目前不能直接推出的結論" lang={lang} />
        <div className="fer-warning-list">
          {initial.methodPlan.blockers.map((item) => (
            <div key={item}><AlertTriangle size={16} />{tr(item, lang)}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FactCheck({ lang }) {
  const toneByStatus = {
    已核實: 'green',
    部分核實: 'amber',
    待核實: 'blue',
    不可作結論: 'red',
  };
  return (
    <div className="fer-stack">
      <section className="fer-panel fer-panel-strong">
        <SectionTitle eyebrow="Fact Check" title="事實查核小表" lang={lang} />
        <p className="fer-lead">{tr(initial.factCheck.summary, lang)}</p>
      </section>
      <section className="fer-panel">
        <div className="fer-fact-list">
          {initial.factCheck.items.map((item) => (
            <article className="fer-fact" key={item.claim}>
              <div className="fer-fact-head">
                <h3>{tr(item.claim, lang)}</h3>
                <Badge tone={toneByStatus[item.status] ?? 'slate'}>{tr(item.status, lang)}</Badge>
              </div>
              <div className="fer-fact-grid">
                <div>
                  <span>{tr('依據', lang)}</span>
                  <p>{tr(item.basis, lang)}</p>
                </div>
                <div>
                  <span>{tr('限制', lang)}</span>
                  <p>{tr(item.caution, lang)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Findings({ lang }) {
  const rows = initial.fiscalValidation.nanyang.rows;
  return (
    <div className="fer-stack">
      <section className="fer-panel fer-panel-strong">
        <SectionTitle eyebrow="Headline Findings" title="初步結果" lang={lang} />
        <div className="fer-grid fer-grid-2">
          {initial.headlineFindings.map((item) => (
            <article className="fer-finding" key={item.title}>
              <div className="fer-card-head">
                <span className={toneClass[item.confidence] || toneClass.medium}>
                  {tr('信心', lang)} {confidenceLabel[lang][item.confidence] || item.confidence}
                </span>
              </div>
              <h3>{tr(item.title, lang)}</h3>
              <p>{tr(item.detail, lang)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fer-panel">
        <SectionTitle eyebrow="Nanyang Validation" title="南陽官方數與第三方縣市區表抽樣比對" lang={lang}>
          <Badge tone="blue">{tr(initial.fiscalValidation.nanyang.thirdPartyScope, lang)}</Badge>
        </SectionTitle>
        <div className="fer-table-wrap">
          <table className="fer-table">
            <thead>
              <tr>
                <th>{tr('年度', lang)}</th>
                <th>{tr('指標', lang)}</th>
                <th>{tr('官方口徑', lang)}</th>
                <th>{tr('官方', lang)}</th>
                <th>{tr('第三方', lang)}</th>
                <th>{tr('差異', lang)}</th>
                <th>{tr('狀態', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.year}-${row.metric}`}>
                  <td>{row.year}</td>
                  <td>{tr(row.metric, lang)}</td>
                  <td>{tr(row.officialScope, lang)}</td>
                  <td>{row.official.toFixed(4)}</td>
                  <td>{row.thirdParty.toFixed(4)}</td>
                  <td>{row.pctDifference}%</td>
                  <td><Badge tone={row.status.includes('B+') ? 'green' : 'amber'}>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fer-footnote">{tr(initial.fiscalValidation.nanyang.rule, lang)}</p>
      </section>
    </div>
  );
}

function Methods({ lang }) {
  return (
    <div className="fer-stack">
      <section className="fer-panel fer-panel-strong">
        <SectionTitle eyebrow="Model Gate" title="現在先不急著上強因果模型" lang={lang}>
          <Badge tone="amber">baseline: {initial.methodPlan.baselineTiming}</Badge>
        </SectionTitle>
        <p className="fer-body">{tr(initial.status.currentModelGate, lang)}</p>
        <div className="fer-callout">
          <TimerReset size={18} />
          <span>{tr('財政壓力先用 t-1；panel 足夠時再檢查 t-2、t-3。', lang)}</span>
        </div>
      </section>
      <div className="fer-grid fer-grid-2">
        <section className="fer-panel">
          <SectionTitle eyebrow="First Usable Design" title="第一個可用研究形態" lang={lang} />
          <p className="fer-lead">{tr(initial.methodPlan.firstUsableDesign, lang)}</p>
          <div className="fer-chip-row">
            {initial.methodPlan.alternatives.map((item) => <Badge key={item} tone="blue">{tr(item, lang)}</Badge>)}
          </div>
        </section>
        <section className="fer-panel">
          <SectionTitle eyebrow="Blocked" title="暫時不該宣稱的模型" lang={lang} />
          <div className="fer-warning-list">
            {initial.methodPlan.blockedDesigns.map((item) => (
              <div key={item}><Scale size={16} />{tr(item, lang)}</div>
            ))}
          </div>
        </section>
      </div>
      <section className="fer-panel">
        <SectionTitle eyebrow="Research Path" title="從材料到模型的路徑" lang={lang} />
        <div className="fer-pipeline">
          {ds.pipeline.map((stage) => (
            <div className="fer-step" key={stage.stage}>
              <strong>{tr(stage.label, lang)}</strong>
              <p>{tr(stage.output, lang)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NextWork({ lang }) {
  return (
    <div className="fer-stack">
      <section className="fer-panel fer-panel-strong">
        <SectionTitle eyebrow="Research Queue" title="下一輪研究工作" lang={lang} />
        <div className="fer-next-list">
          {initial.immediateNextWork.map((item, index) => (
            <div className="fer-next-item" key={item}>
              <span>{index + 1}</span>
              <p>{tr(item, lang)}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="fer-panel">
        <SectionTitle eyebrow="Risk Register" title="展示時保留的風險邊界" lang={lang} />
        <div className="fer-grid fer-grid-2">
          {ds.riskRegister.map((item) => (
            <article className="fer-mini" key={item.risk}>
              <h3>{tr(item.risk, lang)}</h3>
              <p>{tr(item.mitigation, lang)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const tabViews = {
  overview: Overview,
  materials: Materials,
  findings: Findings,
  factcheck: FactCheck,
  methods: Methods,
  next: NextWork,
};

export default function FiscalEnforcementRisk() {
  const [activeTab, setActiveTab] = useState('overview');
  const { lang, setLang } = useLang();
  const ActiveView = tabViews[activeTab];

  const counts = useMemo(() => ({
    sources: '68 組來源',
    events: '20 筆事件',
    panel: '南陽 2022-2023',
  }), []);

  useEffect(() => {
    document.title = lang === 'en' ? 'Local Fiscal Enforcement Risk' : '地方財政缺口風險研究';
  }, [lang]);

  return (
    <main className="fer-page">
      <style>{styles}</style>
      <div className="fer-shell">
        <header className="fer-hero">
          <div className="fer-hero-copy">
            <div className="fer-hero-topline">
              <div className="fer-eyebrow">Fiscal Enforcement Risk</div>
              <LangSwitch
                lang={lang}
                onChange={setLang}
                className="fer-lang-toggle"
                buttonClassName=""
                activeClassName="fer-lang-active"
              />
            </div>
            <h1 className={lang === 'en' ? 'fer-title-en' : 'fer-title-zh'}>
              {tr(ds.researchQuestion.title, lang)}
            </h1>
            <p>{tr(ds.researchQuestion.subtitle, lang)}</p>
          </div>
          <div className="fer-hero-stats">
            <Stat icon={Database} label={tr('證據來源', lang)} value={tr(counts.sources, lang)} note={tr('政策、案例、文獻', lang)} />
            <Stat icon={Layers3} label={tr('事件時間線', lang)} value={tr(counts.events, lang)} note={tr('依可信度分級', lang)} />
            <Stat icon={BarChart3} label={tr('財政核對', lang)} value={tr(counts.panel, lang)} note={tr('官方與第三方口徑比對', lang)} />
          </div>
        </header>

        <nav className="fer-tabs" aria-label="研究分頁">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={active ? 'fer-tab fer-tab-active' : 'fer-tab'}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{lang === 'en' ? tab.en : tab.label}</span>
              </button>
            );
          })}
        </nav>

        <ActiveView lang={lang} />

        <footer className="fer-footer">
          <span>{tr('初步展示：問題意識、證據基礎、事實查核與方法邊界', lang)}</span>
          <span><ArrowUpRight size={13} /> {tr('更新日', lang)} {data.generatedAt}</span>
        </footer>
      </div>
    </main>
  );
}

// token-exempt: page palette lives in the .fer-page variable block below
const styles = `
.fer-page {
  /* fer palette tokens (page-scoped; see font-clearance/design-token exemption) */
  --fer-bg: #f6f1ea;
  --fer-ink: #27312f;
  --fer-line: #d7d0c5;
  --fer-card-bg: #fffaf2;
  --fer-bg-soft: #ede7de;
  --fer-text-muted: #5d6965;
  --fer-dark: #1f2b29;
  --fer-dark-alt: #263633;
  --fer-text-sage: #68766f;
  --fer-text-deep: #44504c;
  --fer-card-bg-alt: #fffdf8;
  --fer-accent-green: #2d635d;
  --fer-green-tint: #e4efeb;
  --fer-text-grey: #77817d;
  --fer-text-slate: #52605c;
  --fer-green-deep: #305853;
  --fer-green-border: #bdd3cc;
  --fer-text-forest: #22302d;
  --fer-text-brown: #7a6661;
  --fer-tan-border: #eadfce;
  --fer-green-border-light: #c9ddd5;
  --fer-cream: #fbf6ee;
  --fer-badge-slate-bg: #e8e4dc;
  --fer-badge-slate-text: #4b5652;
  --fer-badge-blue-bg: #e0ebf0;
  --fer-badge-blue-text: #24566c;
  --fer-badge-green-bg: #dfeee6;
  --fer-badge-green-text: #246045;
  --fer-badge-amber-bg: #f2e8c9;
  --fer-badge-amber-text: #765820;
  --fer-badge-red-bg: #f1d9d3;
  --fer-badge-red-text: #884232;
  --fer-border-tan-light: #eee6da;
  --fer-text-brown-dark: #68483f;
  --fer-peach: #f7ede6;
  --fer-peach-border: #ead1c6;
  --fer-warm-border: #ded5c9;
  --fer-border-light: #ebe2d6;
  --fer-text-grey-green: #63716c;
  --fer-text-grey-muted: #87908c;
  min-height: 100vh;
  background: var(--fer-bg);
  color: var(--fer-ink);
  font-family: var(--font-body);
  font-synthesis: none;
}
.fer-page button,
.fer-page table,
.fer-page input,
.fer-page textarea,
.fer-page select {
  font: inherit;
}
.fer-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}
.fer-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 20px;
  align-items: stretch;
  margin-bottom: 16px;
}
.fer-hero-copy {
  border: 1px solid var(--fer-line);
  background: var(--fer-card-bg);
  border-radius: 8px;
  padding: 28px;
}
.fer-hero-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.fer-lang-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--fer-line);
  background: var(--fer-bg-soft);
  border-radius: 8px;
}
.fer-lang-toggle button {
  border: 0;
  background: transparent;
  color: var(--fer-text-muted);
  min-height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}
.fer-lang-toggle button:hover {
  background: rgba(255, 255, 255, 0.55);
}
.fer-lang-toggle .fer-lang-active {
  background: var(--fer-dark);
  color: var(--fer-card-bg);
}
.fer-lang-toggle .fer-lang-active:hover,
.fer-lang-toggle .fer-lang-active:focus-visible {
  background: var(--fer-dark-alt);
  color: var(--fer-card-bg);
  outline: 2px solid rgba(45, 99, 93, 0.28);
  outline-offset: 2px;
}
.fer-eyebrow,
.fer-section-title p,
.fer-stat-label {
  color: var(--fer-text-sage);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.fer-hero h1 {
  margin: 12px 0 10px;
  font-size: clamp(30px, 5vw, 56px);
  line-height: 1.02;
  letter-spacing: 0;
  color: var(--fer-dark);
}
.fer-title-zh {
  font-family: var(--font-body);
  font-weight: 700;
}
.fer-title-en {
  font-family: var(--font-display);
  font-weight: 700;
}
.fer-hero-copy p,
.fer-lead {
  margin: 0;
  color: var(--fer-text-deep);
  font-size: 17px;
  line-height: 1.65;
}
.fer-hero-stats,
.fer-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.fer-hero-stats {
  grid-template-columns: 1fr;
}
.fer-stat,
.fer-panel,
.fer-card,
.fer-mini,
.fer-finding {
  border: 1px solid var(--fer-line);
  background: var(--fer-card-bg-alt);
  border-radius: 8px;
}
.fer-stat {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
}
.fer-stat-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--fer-accent-green);
  background: var(--fer-green-tint);
  border-radius: 8px;
}
.fer-stat-value {
  margin-top: 4px;
  color: var(--fer-dark);
  font-size: 20px;
  font-weight: 850;
  line-height: 1.2;
}
.fer-stat-note {
  margin-top: 4px;
  color: var(--fer-text-grey);
  font-size: 12px;
}
.fer-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px;
  margin: 16px 0;
  border: 1px solid var(--fer-line);
  background: var(--fer-bg-soft);
  border-radius: 8px;
}
.fer-tab {
  border: 0;
  background: transparent;
  color: var(--fer-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 13px;
  border-radius: 6px;
  font-weight: 780;
  white-space: nowrap;
  cursor: pointer;
}
.fer-tab:hover {
  background: rgba(255, 255, 255, 0.55);
}
.fer-tab-active {
  background: var(--fer-dark);
  color: var(--fer-card-bg);
}
.fer-tab-active:hover,
.fer-tab-active:focus-visible {
  background: var(--fer-dark-alt);
  color: var(--fer-card-bg);
  outline: 2px solid rgba(45, 99, 93, 0.28);
  outline-offset: 2px;
}
.fer-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fer-panel {
  padding: 22px;
}
.fer-panel-strong {
  background: var(--fer-card-bg);
}
.fer-section-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}
.fer-section-title h2 {
  margin: 4px 0 0;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 18px;
  line-height: 1.35;
  letter-spacing: 0;
}
.fer-section-title-extra {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.fer-body,
.fer-card p,
.fer-mini p,
.fer-finding p,
.fer-step p,
.fer-list-row p {
  color: var(--fer-text-slate);
  line-height: 1.65;
}
.fer-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 18px;
  padding: 12px 14px;
  color: var(--fer-green-deep);
  background: var(--fer-green-tint);
  border: 1px solid var(--fer-green-border);
  border-radius: 8px;
  font-weight: 700;
}
.fer-grid {
  display: grid;
  gap: 12px;
}
.fer-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.fer-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.fer-card,
.fer-mini,
.fer-finding {
  padding: 16px;
}
.fer-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--fer-text-sage);
  font-size: 12px;
  font-weight: 800;
}
.fer-card h3,
.fer-mini h3,
.fer-finding h3 {
  margin: 0 0 8px;
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--fer-text-forest);
  font-size: 15px;
  line-height: 1.45;
  letter-spacing: 0;
}
.fer-mini small {
  display: block;
  color: var(--fer-text-brown);
  line-height: 1.55;
}
.fer-typology-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.fer-typology-card {
  border: 1px solid var(--fer-line);
  background: var(--fer-card-bg-alt);
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
}
.fer-typology-card:nth-child(5) {
  grid-column: 1 / -1;
}
.fer-typology-head {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: stretch;
  border-bottom: 1px solid var(--fer-tan-border);
  background: var(--fer-card-bg);
}
.fer-typology-head span {
  display: grid;
  place-items: center;
  color: var(--fer-accent-green);
  background: var(--fer-green-tint);
  border-right: 1px solid var(--fer-green-border-light);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 700;
}
.fer-typology-head h3 {
  margin: 0;
  padding: 13px 14px;
  color: var(--fer-text-forest);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}
.fer-typology-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
}
.fer-typology-body div {
  padding: 14px;
}
.fer-typology-body div + div {
  border-left: 1px solid var(--fer-tan-border);
  background: var(--fer-cream);
}
.fer-typology-body strong {
  display: block;
  margin-bottom: 6px;
  color: var(--fer-text-sage);
  font-size: 11px;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.fer-typology-body p {
  margin: 0;
  color: var(--fer-text-slate);
  line-height: 1.65;
}
.fer-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 760;
  white-space: nowrap;
}
.fer-badge-slate { background: var(--fer-badge-slate-bg); color: var(--fer-badge-slate-text); }
.fer-badge-blue { background: var(--fer-badge-blue-bg); color: var(--fer-badge-blue-text); }
.fer-badge-green { background: var(--fer-badge-green-bg); color: var(--fer-badge-green-text); }
.fer-badge-amber { background: var(--fer-badge-amber-bg); color: var(--fer-badge-amber-text); }
.fer-badge-red { background: var(--fer-badge-red-bg); color: var(--fer-badge-red-text); }
.fer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fer-list-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 13px 0;
  border-top: 1px solid var(--fer-border-tan-light);
}
.fer-list-row:first-child {
  border-top: 0;
}
.fer-warning-list {
  display: grid;
  gap: 10px;
}
.fer-warning-list div {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: var(--fer-text-brown-dark);
  background: var(--fer-peach);
  border: 1px solid var(--fer-peach-border);
  border-radius: 8px;
  padding: 11px 12px;
  font-weight: 720;
}
.fer-fact-list {
  display: grid;
  gap: 12px;
}
.fer-fact {
  border: 1px solid var(--fer-warm-border);
  background: var(--fer-card-bg);
  border-radius: 8px;
  padding: 15px;
}
.fer-fact-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.fer-fact-head h3 {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--fer-text-forest);
  font-size: 15px;
  line-height: 1.45;
}
.fer-fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.fer-fact-grid div {
  border-top: 1px solid var(--fer-tan-border);
  padding-top: 10px;
}
.fer-fact-grid span {
  display: block;
  color: var(--fer-text-sage);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin-bottom: 5px;
}
.fer-fact-grid p {
  margin: 0;
  color: var(--fer-text-slate);
  line-height: 1.65;
}
.fer-table-wrap {
  overflow-x: auto;
}
.fer-table {
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
  font-size: 13px;
}
.fer-table th,
.fer-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid var(--fer-border-light);
}
.fer-table th {
  color: var(--fer-text-grey-green);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.fer-footnote {
  margin: 14px 0 0;
  color: var(--fer-text-sage);
  font-size: 13px;
  line-height: 1.6;
}
.fer-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.fer-pipeline {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.fer-step {
  min-height: 126px;
  border: 1px solid var(--fer-warm-border);
  border-radius: 8px;
  padding: 13px;
  background: var(--fer-card-bg);
}
.fer-step strong {
  display: block;
  margin-bottom: 8px;
  color: var(--fer-text-forest);
}
.fer-next-list {
  display: grid;
  gap: 10px;
}
.fer-next-item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
  align-items: start;
  padding: 13px;
  background: var(--fer-card-bg-alt);
  border: 1px solid var(--fer-warm-border);
  border-radius: 8px;
}
.fer-next-item span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: var(--fer-card-bg);
  background: var(--fer-dark);
  border-radius: 8px;
  font-weight: 850;
}
.fer-next-item p {
  margin: 3px 0 0;
  color: var(--fer-text-deep);
  line-height: 1.6;
  font-weight: 680;
}
.fer-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  color: var(--fer-text-grey-muted);
  font-size: 12px;
}
.fer-footer span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
@media (max-width: 900px) {
  .fer-hero,
  .fer-grid-2,
  .fer-grid-3,
  .fer-typology-grid,
  .fer-pipeline {
    grid-template-columns: 1fr;
  }
  .fer-typology-card:nth-child(5) {
    grid-column: auto;
  }
  .fer-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 620px) {
  .fer-shell {
    width: min(100% - 20px, 1180px);
    padding-top: 12px;
  }
  .fer-hero-copy,
  .fer-panel {
    padding: 16px;
  }
  .fer-stats-grid {
    grid-template-columns: 1fr;
  }
  .fer-section-title,
  .fer-footer,
  .fer-list-row,
  .fer-fact-head,
  .fer-hero-topline {
    flex-direction: column;
    align-items: flex-start;
  }
  .fer-fact-grid {
    grid-template-columns: 1fr;
  }
  .fer-typology-body {
    grid-template-columns: 1fr;
  }
  .fer-typology-body div + div {
    border-left: 0;
    border-top: 1px solid var(--fer-tan-border);
  }
}
`;
