import React, { useState, useEffect } from 'react';
import {
  Wind, Factory, Car, Building2, Scale, Calculator,
  ChevronRight, Info, Shield, BookOpen, TrendingUp,
  ClipboardList, AlertTriangle, Gavel, CheckCircle,
  ArrowRight,
} from 'lucide-react';

// ─── Fee rate data ──────────────────────────────────────────────────────────

const POLLUTANTS = {
  SOx: {
    name: '硫氧化物', abbr: 'SOx',
    color: '#d4c4a8', textColor: '#6a5030',
    desc: '燃燒含硫燃料（煤、重油）產生，為酸雨與呼吸道疾病主因。',
    tiers: [
      { label: '第一級', range: '季排放 > 40 公噸' },
      { label: '第二級', range: '14 ～ 40 公噸' },
      { label: '第三級', range: '1 ～ 14 公噸' },
      { label: '第四級', range: '0.01 ～ 1 公噸', flat: true },
    ],
    rates: {
      zone2:  { q23: [9, 7, 5, '450 元/季'],  q14: [13, 11, 9,  '450 元/季'] },
      zone13: { q23: [10.5, 8.5, 6, '450 元/季'], q14: [15, 13, 10, '450 元/季'] },
    },
  },
  NOx: {
    name: '氮氧化物', abbr: 'NOx',
    color: '#a8c4b4', textColor: '#2a6048',
    desc: '高溫燃燒過程產生，為臭氧與 PM2.5 的前驅物。',
    tiers: [
      { label: '第一級', range: '季排放 > 70 公噸' },
      { label: '第二級', range: '24 ～ 70 公噸' },
      { label: '第三級', range: '1 ～ 24 公噸' },
      { label: '第四級', range: '0.01 ～ 1 公噸', flat: true },
    ],
    rates: {
      zone2:  { q23: [10, 8, 6,    '450 元/季'], q14: [14, 12, 10,  '450 元/季'] },
      zone13: { q23: [12, 10, 7.5, '450 元/季'], q14: [16, 14, 12, '450 元/季'] },
    },
  },
  VOCs: {
    name: '揮發性有機物', abbr: 'VOCs',
    color: '#b8a8d4', textColor: '#50388a',
    desc: '石化、塗料、印刷等行業排放，為臭氧前驅物，部分具毒性。',
    tiers: [
      { label: '第一級', range: '季排放 > 90 公噸' },
      { label: '第二級', range: '50 ～ 90 公噸' },
      { label: '第三級', range: '7.5 ～ 50 公噸' },
      { label: '第四級', range: '1 ～ 7.5 公噸' },
    ],
    rates: {
      zone2:  { q23: [30, 25, 20, 15], q14: [40, 35, 30, 25] },
      zone13: { q23: [35, 30, 25, 20], q14: [45, 40, 35, 30] },
    },
  },
  PM: {
    name: '粒狀污染物', abbr: 'PM',
    color: '#c4b4a4', textColor: '#6a5848',
    desc: '含細懸浮微粒（PM2.5），直接危害呼吸道與心血管健康。',
    tiers: [
      { label: '第一級', range: '製程季排放 > 15 公噸' },
      { label: '第二級', range: '10 ～ 15 公噸' },
      { label: '第三級', range: '1 ～ 10 公噸' },
      { label: '第四級', range: '0.01 ～ 1 公噸', flat: true },
    ],
    rates: {
      zone2:  { q23: [43, 38, 32, '450 元/季'], q14: [51, 46, 38, '450 元/季'] },
      zone13: { q23: [51, 46, 38, '450 元/季'], q14: [60, 55, 46, '450 元/季'] },
    },
  },
};

// ─── Section content ────────────────────────────────────────────────────────

const ELEMENTS_DATA = [
  {
    id: 'subject', no: '01', title: '義務主體',
    icon: Factory, color: '#d0e8d8', textColor: '#3a6848', badge: '三類',
    content: [
      '固定污染源：排放空氣污染物之公私場所（工廠、電廠、焚化廠等），每季申報排放量並繳費。',
      '移動污染源：燃料之銷售者或進口者（由供應端代繳，依燃料含硫量分三級計費），再由市場機制轉嫁消費者。',
      '營建工程：承攬或辦理達一定規模之工程業者，依工程類別、施工面積與工期計費，由地方主管機關徵收。',
    ],
  },
  {
    id: 'object', no: '02', title: '課徵客體',
    icon: Wind, color: '#e0d0e8', textColor: '#683878', badge: '6 類污染物',
    content: [
      '固定源課徵項目：SOx（硫氧化物）、NOx（氮氧化物）、VOCs（揮發性有機物）、PM（粒狀污染物含 PM2.5）、重金屬（鉛鎘汞砷六價鉻）、戴奧辛。',
      '起徵門檻（固定源）：SOx、NOx 季排放量 > 0.01 公噸；VOCs > 1 公噸/季。低於門檻者免徵，但仍負申報義務。',
      '移動源：汽柴油依含硫量分三級（一級最潔淨，費率最低；使用天然氣或液化石油氣者，SOx 適用零費率）。',
    ],
  },
  {
    id: 'basis', no: '03', title: '計費基準',
    icon: Calculator, color: '#e8e0c8', textColor: '#686030', badge: '累進費率',
    content: [
      '基本公式：費額 = 【Σ（各級排放量 × 各級費率）】× 優惠係數(D)',
      '三層分級結構：①防制區等級（二級 vs. 一三級，依當地空品等級；一三級費率較高）②季節差別（Q1/Q4 冬季費率高於 Q2/Q3 夏季）③排放量累進分級（排放量越大適用費率越高）。',
      '優惠係數 D（40%～100%）：裝設控制設備使排放濃度低於管制限值50%以下，依符合條件排放量比率適用最低四折優惠。目的：鼓勵超前合規、投資防制設備。',
    ],
  },
];

const PROCEDURE_STEPS = [
  {
    step: '01', title: '申報義務',
    icon: ClipboardList, color: '#d0dce8', textColor: '#3a5878',
    items: [
      '固定源業者每季（1-3月、4-6月、7-9月、10-12月）申報排放量，並於規定期限內繳納費額。',
      '申報方式：登入環境部「固定污染源空污費申報系統」線上申報，逾期申報除補繳費用外，另有罰則。',
      '達重大排放門檻之固定源（如排放量達一定規模）須裝設連續自動監測設施（CEMS），數據即時上傳主管機關，不得以手動申報替代。',
    ],
  },
  {
    step: '02', title: '排放量計量',
    icon: Calculator, color: '#d0e8d8', textColor: '#3a6848',
    items: [
      '連續自動監測（CEMS）：排放量大之固定源須設置，數值具最高公信力，主管機關可即時掌握。',
      '質量平衡法：依原料投入量、產品產出量及廢棄物推估排放量，適用 VOCs 等具逸散特性之污染物；計算精度較 CEMS 低，但成本低廉。',
      '公告排放係數法：環境部公告各行業製程排放係數，乘以生產量計算排放量，適用中小型固定源；可申請「自廠排放係數」替代，反映個廠實際排放情況。',
    ],
  },
  {
    step: '03', title: '計費與繳納',
    icon: Scale, color: '#e8e0c8', textColor: '#686030',
    items: [
      '計費流程：確認各季排放量 → 依防制區等級及季別選定適用費率 → 套用累進分級公式 → 乘以優惠係數(D) → 第一、四季另乘減量係數(E)。',
      '繳費期限：環境部發出繳費通知後，業者應於期限內繳納。逾期繳納加計延滯金（每逾一日按應繳費額之一定比率加計）。',
      '分期繳納：費額龐大者得申請分期繳納，惟需提供擔保。',
    ],
  },
  {
    step: '04', title: '稽查機制',
    icon: Shield, color: '#e0d0e8', textColor: '#683878',
    items: [
      '書面稽查：主管機關審核申報資料與監測紀錄，核對是否與生產量、燃料使用量相符；異常者列為現場稽查對象。',
      '現場稽查：稽查人員可要求業者提供生產紀錄、燃料採購憑證及防制設備運轉紀錄，並得委託機關或技術服務機構執行排放量查核。',
      '比對交叉查核：以海關進出口燃料量、電力使用量、原料消耗等外部資料交叉驗證申報數據，降低低報空間。',
    ],
  },
  {
    step: '05', title: '爭議救濟',
    icon: Gavel, color: '#e8d8d0', textColor: '#784030',
    items: [
      '申請復查：對費額有異議者，得於繳費通知送達後一定期間內，向徵收機關申請復查（相當於稅法之復查申請）。',
      '訴願：對復查決定不服者，依訴願法提起訴願，向主管機關上級機關或訴願管轄機關聲明不服。',
      '行政訴訟：對訴願決定仍不服者，得向行政法院提起撤銷訴訟或課予義務訴訟，為最終司法救濟途徑。',
    ],
  },
];

const EFFECTS_DATA = [
  {
    id: 'fund', title: '空氣污染防制基金',
    icon: TrendingUp, color: '#d0e8d8', textColor: '#3a6848',
    content: [
      '費款全數存入「空氣污染防制基金」（依預算法規定之特別收入基金），專款專用，不得挪作一般行政支出，此為特別公課有別於一般稅捐的核心特徵。',
      '基金管理：由環境部設置管理委員會監督運用，每年編列附屬單位預算，向立法院報告收支情形，具一定民主課責機制。',
    ],
  },
  {
    id: 'reduction', title: '減量係數 E：季節性減量誘因',
    icon: Shield, color: '#d0dce8', textColor: '#3a5878',
    content: [
      '僅適用於第一、四季（冬季）。依當季排放量與基準年同季平均相比：排放未明顯減少者 E = 100%（不折扣）；減少超過30%者 E = 70%（費率打七折）；介於其間者線性計算。',
      '基準年 = 本費率修正生效後，前三年同季申報之平均排放量，使減量比較具個廠基礎，避免「排放量本就少的小廠」無法受惠。',
      '設計邏輯：D 係數（優惠係數）鼓勵裝設防制設備；E 係數（減量係數）鼓勵實際減排——兩者形成雙軌誘因，對應「行政管制」與「經濟誘因」並行的政策架構。',
    ],
  },
  {
    id: 'outcomes', title: '空品改善成效',
    icon: CheckCircle, color: '#e0e8d0', textColor: '#488038',
    content: [
      '1995至2008年累計徵收逾355億元；以1999年為基準，至2005年SOx 已削減 86,761 公噸、NOx 削減 63,880 公噸，減量成效顯著。',
      '開徵後主要空氣污染物濃度改善：SO₂年均濃度由1994年8.07 ppb降至2008年4.35 ppb（降46%）；NO₂由24.3 ppb降至16.9 ppb（降31%）；PM₁₀由71.8 μg/m³降至58.1 μg/m³（降19%）。',
      '反面警示：O₃（臭氧）反由1994年20.9 ppb上升至2008年29.1 ppb（升39%），顯示移動源管制與 VOCs 削減（前驅物）之成效有待加強，此亦為2007年新徵VOCs空污費的政策背景。',
    ],
  },
];

const FINANCE_DATA = {
  revenue: [
    { label: '固定污染源費', pct: 72, color: '#a8c4b4', note: '工廠、電廠等每季申報繳費' },
    { label: '移動污染源費', pct: 24, color: '#b8a8d4', note: '燃料銷售商代繳，隨油品含硫量計費' },
    { label: '營建工程費', pct: 4,  color: '#d4c4a8', note: '達規模工程依面積/工期計費' },
  ],
  expenditure: [
    { label: '移動源管制', pct: 37.5, color: '#a8c4b4' },
    { label: '空品淨化區設置', pct: 19.6, color: '#b8a8d4' },
    { label: '執行空污防制計畫', pct: 19.6, color: '#d4c4a8' },
    { label: '固定源管制', pct: 11.9, color: '#c4d4a8' },
    { label: '策略推動/研發', pct: 9.3, color: '#c4b4a4' },
    { label: '空品監測', pct: 1.4, color: '#b4c4d4' },
    { label: '一般行政建設', pct: 0.8, color: '#d4c4b8' },
  ],
};

const EVASION_DATA = [
  {
    id: 'types', title: '常見逃漏型態',
    icon: AlertTriangle, color: '#e8d8c8', textColor: '#784830',
    badge: '行為態樣',
    items: [
      { label: '低報排放量', desc: '申報量遠低於實際排放：如以「行業排放係數」申報但實際高污染製程未列入；或調降生產量申報以縮小計費基礎。' },
      { label: '刻意切割申報單位', desc: '將同一場所分拆為多個義務人，使各單位排放量皆落在較低費率級距，逃避累進費率。' },
      { label: '設備故障期間不申報', desc: '防制設備停機時排放量驟增，業者未如實申報該期間之高排放量，或以設備異常為由主張豁免。' },
      { label: '假冒潔淨燃料', desc: '移動源：申報使用一級低硫燃料，實際使用含硫量較高之油品，以享較低費率。' },
      { label: '妨礙或規避稽查', desc: '拒絕稽查人員進入廠區、不提供生產紀錄或消耗燃料憑證，使主管機關無法核對實際排放量。' },
    ],
  },
  {
    id: 'penalties', title: '法律責任',
    icon: Gavel, color: '#e0d0d8', textColor: '#783848',
    badge: '行政責任',
    items: [
      { label: '補繳費額', desc: '查獲低報者，主管機關依查核認定之實際排放量補徵應繳費額，追溯期間依相關規定（通常五年）。' },
      { label: '加徵延滯金', desc: '逾期未繳費者，每逾一日按應繳費額加徵滯納金；長期欠繳可達本金數倍，最終移送行政執行署強制執行（拍賣財產或移送法院）。' },
      { label: '罰鍰', desc: '未依規定申報或虛偽申報者，依空污法相關罰則處以罰鍰（空污法第 76 條以下），情節重大者可連續處罰，並命停工或撤銷許可證。' },
      { label: '刑事責任', desc: '以詐術申報（如偽造檢測數據、偽造生產紀錄）者，除行政罰外，可能觸犯刑法詐欺罪或偽造文書罪，移送司法追訴。' },
    ],
  },
  {
    id: 'enforcement', title: '稽查與防逃手段',
    icon: Shield, color: '#d8d0e8', textColor: '#4a3870',
    badge: '主管機關',
    items: [
      { label: '強制安裝 CEMS', desc: '大型固定源須裝設連續自動監測系統（CEMS），數據即時傳輸主管機關，從源頭消除低報空間；設備異常期間排放量以特殊方式推估，不得自行免報。' },
      { label: '外部資料交叉稽核', desc: '以進口燃料量（海關數據）、電力使用量（台電資料）、原料採購量（工廠進料）與申報排放量交叉比對，偵測異常低報。' },
      { label: '舉報獎勵', desc: '主管機關設有環境檢舉管道，舉報查證屬實者得依規定予以獎勵，形成社會監督力量，補充官方稽查能量之不足。' },
      { label: '連帶管制誘因', desc: '空污費制度與排放許可證管制雙軌並行：業者若長期逃漏遭查獲，除補繳罰款外，許可證核定之排放量上限亦可能被調降，影響後續生產規模，形成額外嚇阻。' },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function AirPollutionFee() {
  const [section, setSection] = useState('elements');
  const [openEl, setOpenEl] = useState('subject');
  const [openProc, setOpenProc] = useState('01');
  const [openEffect, setOpenEffect] = useState('fund');
  const [openEvasion, setOpenEvasion] = useState('types');
  const [activeTab, setActiveTab] = useState('SOx');
  const [zone, setZone] = useState('zone2');
  const [season, setSeason] = useState('q23');
  const [showRates, setShowRates] = useState(false);

  useEffect(() => { document.title = '台灣空氣污染防制費'; }, []);

  const p = POLLUTANTS[activeTab];
  const rates = p.rates[zone][season];
  const maxRate = Math.max(...rates.filter(r => typeof r === 'number'));

  const SECTIONS = [
    { id: 'elements',  label: '構成要件', icon: BookOpen },
    { id: 'procedure', label: '稽徵程序', icon: ClipboardList },
    { id: 'effects',   label: '法律效果', icon: TrendingUp },
    { id: 'evasion',   label: '逃漏',     icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#f5eceb] font-sans" style={{ paddingBottom: 64 }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#f5eceb]/90 backdrop-blur-md border-b border-[#e8d3d1] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#d0dce8] flex items-center justify-center">
          <Wind size={16} className="text-[#3a5878]" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#b09e9c]">空污法 §16 · 特別公課</p>
          <p className="text-xs font-black text-[#6b5b58] leading-none">空氣污染防制費</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* Section nav */}
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl text-[10px] font-black transition-all duration-200 ${
                  section === s.id
                    ? 'bg-[#6b5b58] text-white shadow-sm'
                    : 'bg-white/70 text-[#8a7a78] border border-[#e8d3d1]'
                }`}
              >
                <Icon size={14} strokeWidth={2.2} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── 構成要件 ──────────────────────────────────────────── */}
        {section === 'elements' && (
          <div className="space-y-3">
            {/* 授權法源 — 非構成要件，另立顯示 */}
            <div className="rounded-[1.5rem] border border-[#d0dce8] bg-[#eef2f8] px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className="text-[#3a5878]" strokeWidth={2.5} />
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#3a5878]">授權法源</p>
              </div>
              <p className="text-[12px] text-[#4a6880] leading-relaxed mb-1">
                空污法第 16 條第 1 項：「各級主管機關應依污染源排放空氣污染物之種類及排放量，徵收空氣污染防制費。」費率由中央主管機關（環境部）公告。
              </p>
              <p className="text-[12px] text-[#4a6880] leading-relaxed">
                性質為「<strong>特別公課</strong>」（大法官釋字第 426 號），非稅捐。特別公課有別於稅：費款專入空污基金、不統收統支；繳費多寡直接連結排放量，內建減量誘因。
              </p>
            </div>

            {ELEMENTS_DATA.map(el => {
              const Icon = el.icon;
              const isOpen = openEl === el.id;
              return (
                <Accordion
                  key={el.id}
                  isOpen={isOpen}
                  onToggle={() => setOpenEl(isOpen ? null : el.id)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: el.color }}>
                        <Icon size={15} style={{ color: el.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-[#b09e9c]">{el.no}</span>
                          <span className="text-sm font-black text-[#6b5b58]">{el.title}</span>
                          <Tag color={el.color} text={el.badge} textColor={el.textColor} />
                        </div>
                      </div>
                    </div>
                  }
                >
                  <BulletList items={el.content} />
                </Accordion>
              );
            })}

            {/* Fee rates embedded */}
            <button
              onClick={() => setShowRates(!showRates)}
              className="w-full flex items-center gap-3 rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm shadow-rose-100/60 hover:shadow-md transition-all"
            >
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[#e8e0c8] flex items-center justify-center">
                <Calculator size={15} className="text-[#686030]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-[#6b5b58]">費率查詢</p>
                <p className="text-[11px] text-[#a09088]">SOx、NOx、VOCs、PM 各級費率互動查詢</p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-[#c5b4b2] transition-transform duration-200"
                style={{ transform: showRates ? 'rotate(90deg)' : 'none' }} />
            </button>

            {showRates && (
              <div className="space-y-3 -mt-1 pl-2">
                {/* Pollutant tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {Object.entries(POLLUTANTS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        activeTab === key ? 'text-white shadow-sm border-transparent' : 'bg-white/70 border-[#e8d3d1] text-[#8a7a78]'
                      }`}
                      style={activeTab === key ? { backgroundColor: val.textColor } : {}}
                    >
                      {val.abbr}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <ToggleGroup
                    label="防制區"
                    options={[['zone2', '二級'], ['zone13', '一三級']]}
                    value={zone}
                    onChange={setZone}
                  />
                  <ToggleGroup
                    label="季別"
                    options={[['q23', 'Q2/Q3'], ['q14', 'Q1/Q4']]}
                    value={season}
                    onChange={setSeason}
                  />
                </div>

                {season === 'q14' && (
                  <InfoBox text="第一、四季（冬季）費率較高，另乘減量係數E（詳見「法律效果」分頁）。" warn />
                )}

                <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-2.5 border-b border-[#f5eceb]">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c]">
                      {p.abbr}｜{zone === 'zone2' ? '二級防制區' : '一三級防制區'}｜第{season === 'q23' ? '二、三' : '一、四'}季
                    </p>
                  </div>
                  <div className="divide-y divide-[#f8f4f3]">
                    {p.tiers.map((tier, i) => {
                      const rate = rates[i];
                      const isFlat = typeof rate === 'string';
                      return (
                        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="shrink-0 w-[68px]">
                            <p className="text-[11px] font-black text-[#6b5b58]">{tier.label}</p>
                            <p className="text-[9px] text-[#b09e9c] leading-tight mt-0.5">{tier.range}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-2.5">
                            {!isFlat && (
                              <div className="flex-1 h-2 rounded-full bg-[#f0e8e6]">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${(rate / maxRate) * 100}%`, backgroundColor: p.color }} />
                              </div>
                            )}
                            <span className="shrink-0 text-[13px] font-black" style={{ color: p.textColor }}>
                              {isFlat ? rate : `${rate} 元/kg`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 稽徵程序 ──────────────────────────────────────────── */}
        {section === 'procedure' && (
          <div className="space-y-3">
            <InfoBox
              title="稽徵架構"
              text="固定污染源採「自行申報、按季繳納、事後稽查」模式，與稅法「核定課徵」有別，業者負主動申報義務，主管機關事後稽核。申報→繳納→稽查→救濟，構成完整行政程序鏈。"
            />

            {/* Flow diagram */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-3">稽徵流程</p>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['每季申報', '計算費額', '繳款', '稽查核對', '爭議救濟'].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <div className="shrink-0 rounded-xl bg-[#f5eceb] border border-[#e8d3d1] px-3 py-2 text-center">
                      <p className="text-[11px] font-black text-[#6b5b58] whitespace-nowrap">{step}</p>
                    </div>
                    {i < arr.length - 1 && <ArrowRight size={12} className="shrink-0 text-[#c5b4b2]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {PROCEDURE_STEPS.map(proc => {
              const Icon = proc.icon;
              const isOpen = openProc === proc.step;
              return (
                <Accordion
                  key={proc.step}
                  isOpen={isOpen}
                  onToggle={() => setOpenProc(isOpen ? null : proc.step)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: proc.color }}>
                        <Icon size={15} style={{ color: proc.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-[#b09e9c]">{proc.step}</span>
                          <span className="text-sm font-black text-[#6b5b58]">{proc.title}</span>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <BulletList items={proc.items} />
                </Accordion>
              );
            })}
          </div>
        )}

        {/* ── 法律效果 ──────────────────────────────────────────── */}
        {section === 'effects' && (
          <div className="space-y-3">
            <InfoBox
              title="正向法律效果"
              text="空污費的法律效果分為「直接效果」（繳費義務→空污基金）與「誘因效果」（優惠係數D、減量係數E→廠商主動減排）。兩者合力形成比純行政管制更有彈性的環境治理工具。"
            />

            {/* 財政收支 — 獨立呈現 */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm shadow-rose-100/60">
              <div className="px-5 py-3 border-b border-[#f5eceb]">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c]">空污基金 · 財政收支</p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#f5eceb]">
                {/* 收入面 */}
                <div className="px-4 py-4">
                  <p className="text-[9px] font-black text-[#8a7a78] uppercase tracking-wider mb-3">收入來源</p>
                  {FINANCE_DATA.revenue.map(item => (
                    <div key={item.label} className="mb-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-[11px] font-black text-[#6b5b58]">{item.label}</p>
                        <p className="text-[11px] font-black text-[#8a7a78]">~{item.pct}%</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f0e8e6]">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                      </div>
                      <p className="text-[9px] text-[#b09e9c] mt-0.5">{item.note}</p>
                    </div>
                  ))}
                  <p className="mt-2 text-[10px] text-[#a09088] leading-relaxed">累計徵收（1995–2008）：逾 <span className="font-black text-[#6b5b58]">355 億元</span></p>
                </div>
                {/* 支出面 */}
                <div className="px-4 py-4">
                  <p className="text-[9px] font-black text-[#8a7a78] uppercase tracking-wider mb-3">基金支出</p>
                  {FINANCE_DATA.expenditure.map(item => (
                    <div key={item.label} className="flex items-center gap-2 mb-2">
                      <p className="text-[10px] text-[#6b5b58] w-[88px] shrink-0 leading-tight">{item.label}</p>
                      <div className="flex-1 h-1.5 rounded-full bg-[#f0e8e6]">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                      </div>
                      <p className="text-[10px] font-black text-[#8a7a78] w-7 text-right shrink-0">{item.pct}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {EFFECTS_DATA.map(ef => {
              const Icon = ef.icon;
              const isOpen = openEffect === ef.id;
              return (
                <Accordion
                  key={ef.id}
                  isOpen={isOpen}
                  onToggle={() => setOpenEffect(isOpen ? null : ef.id)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ef.color }}>
                        <Icon size={15} style={{ color: ef.textColor }} strokeWidth={2.2} />
                      </div>
                      <span className="text-sm font-black text-[#6b5b58]">{ef.title}</span>
                    </div>
                  }
                >
                  <BulletList items={ef.content} />
                </Accordion>
              );
            })}
          </div>
        )}

        {/* ── 逃漏 ──────────────────────────────────────────────── */}
        {section === 'evasion' && (
          <div className="space-y-3">
            <InfoBox
              title="逃漏特殊性"
              text="空污費之逃漏有別於一般稅捐逃漏——課徵基礎（排放量）本身難以直接觀察，業者掌握資訊優勢，主管機關高度依賴申報誠信與稽查能量。資訊不對稱是最大執行挑戰。"
            />

            {EVASION_DATA.map(ev => {
              const Icon = ev.icon;
              const isOpen = openEvasion === ev.id;
              return (
                <Accordion
                  key={ev.id}
                  isOpen={isOpen}
                  onToggle={() => setOpenEvasion(isOpen ? null : ev.id)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ev.color }}>
                        <Icon size={15} style={{ color: ev.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#6b5b58]">{ev.title}</span>
                          <Tag color={ev.color} text={ev.badge} textColor={ev.textColor} />
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-2.5">
                    {ev.items.map(item => (
                      <div key={item.label} className="rounded-xl bg-[#f5eceb] px-4 py-3">
                        <p className="text-[11px] font-black text-[#6b5b58] mb-1">{item.label}</p>
                        <p className="text-[11px] text-[#8a7a78] leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-[9px] font-bold text-[#c5b4b2] leading-relaxed">
          依據空污法第16條及相關費率附表（固定污染源）<br />
          僅供學術研究參考，實務請以環境部官方公告為準
        </p>
      </div>
    </div>
  );
}

// ─── Shared primitives ──────────────────────────────────────────────────────

function Accordion({ isOpen, onToggle, header, children }) {
  return (
    <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm shadow-rose-100/60 transition-all duration-200 hover:shadow-md hover:shadow-rose-100/80">
      <button className="w-full flex items-center gap-2 px-5 py-4" onClick={onToggle}>
        <div className="flex-1">{header}</div>
        <ChevronRight
          size={14}
          className="shrink-0 text-[#c5b4b2] transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 border-t border-[#f5eceb]">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

function BulletList({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map((line, i) => (
        <div key={i} className="flex gap-3">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-[5px] bg-[#c5b4b2]" />
          <p className="text-[12px] text-[#6b5b58] leading-relaxed">{line}</p>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ title, text, warn }) {
  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 ${warn
      ? 'bg-[#f8f0e8] border-[#e8d8c8]'
      : 'border-[#e8d3d1] bg-white/70 backdrop-blur-xl shadow-sm shadow-rose-100/60'}`}>
      {title && <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-1.5">{title}</p>}
      <div className="flex gap-2">
        {warn && <Info size={12} className="text-[#b08060] mt-0.5 shrink-0" />}
        <p className="text-[12px] text-[#7a6a68] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function Tag({ color, text, textColor }) {
  return (
    <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: color, color: textColor }}>
      {text}
    </span>
  );
}

function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div className="flex-1">
      <p className="text-[9px] font-bold text-[#b09e9c] uppercase tracking-wider mb-1.5 px-0.5">{label}</p>
      <div className="flex rounded-xl border border-[#e8d3d1] bg-white/50 p-0.5">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${value === v ? 'bg-[#6b5b58] text-white shadow-sm' : 'text-[#8a7a78]'}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
