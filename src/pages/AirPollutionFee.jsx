import React, { useState, useEffect } from 'react';
import {
  Wind, Factory, Car, Building2, Scale, Calculator,
  ChevronRight, Info, Shield, BookOpen, TrendingUp,
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────

const POLLUTANTS = {
  SOx: {
    name: '硫氧化物', abbr: 'SOx',
    color: '#d4c4a8', textColor: '#6a5030', bgLight: '#f8f2e8',
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
    color: '#a8c4b4', textColor: '#2a6048', bgLight: '#edf5f0',
    desc: '高溫燃燒過程產生，為臭氧與 PM2.5 的前驅物。',
    tiers: [
      { label: '第一級', range: '季排放 > 70 公噸' },
      { label: '第二級', range: '24 ～ 70 公噸' },
      { label: '第三級', range: '1 ～ 24 公噸' },
      { label: '第四級', range: '0.01 ～ 1 公噸', flat: true },
    ],
    rates: {
      zone2:  { q23: [10, 8, 6,   '450 元/季'], q14: [14, 12, 10,  '450 元/季'] },
      zone13: { q23: [12, 10, 7.5, '450 元/季'], q14: [16, 14, 12, '450 元/季'] },
    },
  },
  VOCs: {
    name: '揮發性有機物', abbr: 'VOCs',
    color: '#b8a8d4', textColor: '#50388a', bgLight: '#f2eef8',
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
    color: '#c4b4a4', textColor: '#6a5848', bgLight: '#f5f0eb',
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

const ELEMENTS = [
  {
    id: 'auth', no: '01', title: '法律授權', subtitle: '空污法第 16 條',
    icon: BookOpen, color: '#d0dce8', textColor: '#3a5878', badge: '特別公課',
    content: [
      '空污法第16條第1項：「各級主管機關應依污染源排放空氣污染物之種類及排放量，徵收空氣污染防制費。」',
      '費率由中央主管機關會商有關機關及徵詢學者、專家意見後訂定公告。',
      '性質為特別公課（大法官釋字第 426 號），非稅捐；與稅的最大差異在於專款專用，不納入一般財政收入。',
    ],
  },
  {
    id: 'subject', no: '02', title: '義務主體', subtitle: '誰應繳納',
    icon: Factory, color: '#d0e8d8', textColor: '#3a6848', badge: '三類',
    content: [
      '固定污染源：排放空氣污染物之公私場所，包括工廠、電廠、焚化廠、石化廠等。',
      '移動污染源：燃料之銷售者或進口者（以燃料含硫量作為計費基礎，由供應端繳費）。',
      '營建工程：承攬或辦理達一定規模之工程業者，依工程類別、施工面積與工期計費，由地方主管機關徵收。',
    ],
  },
  {
    id: 'object', no: '03', title: '課徵客體', subtitle: '對什麼課費',
    icon: Wind, color: '#e0d0e8', textColor: '#683878', badge: '6 類污染物',
    content: [
      '固定源：SOx（硫氧化物）、NOx（氮氧化物）、VOCs（揮發性有機物）、PM（粒狀污染物，含 PM2.5）、重金屬（鉛、鎘、汞、砷、六價鉻）、戴奧辛。',
      '移動源：汽柴油依含硫量分三級，使用天然氣、液化石油氣等潔淨燃料者享零費率（SOx）或優惠費率。',
      '起徵門檻（固定源）：SOx、NOx 季排放量 > 0.01 公噸；VOCs > 1 公噸/季。低於門檻者免徵，但仍須申報排放量。',
    ],
  },
  {
    id: 'basis', no: '04', title: '計費基準', subtitle: '如何計算費額',
    icon: Calculator, color: '#e8e0c8', textColor: '#686030', badge: '累進費率',
    content: [
      '費額 = 【Σ（各級排放量 × 各級費率）】× 優惠係數(D) × 減量係數(E)',
      '三層分級結構：① 防制區等級（二級 vs. 一三級，依當地空品等級）② 季節（Q1/Q4 冬季費率較高）③ 排放量累進分級（排放量越大適用費率越高，具累進懲罰效果）。',
      '計算方式：先依各級距拆分排放量，分別乘以對應費率後加總，再乘以係數調整。',
    ],
  },
  {
    id: 'discount', no: '05', title: '調整機制', subtitle: '優惠係數 D · 減量係數 E',
    icon: Shield, color: '#e0e8d0', textColor: '#488038', badge: '雙重誘因',
    content: [
      '優惠係數 D（40%～100%）：裝設控制設備且達排放標準50%以下者，依「符合條件排放量占全廠比率」適用 D = 40%（最優，費率打四折）至 D = 100%（無優惠）。',
      '減量係數 E（70%～100%，Q1/Q4 專用）：當季排放量與基準年同季相比，降低愈多折扣愈大，最低 E = 70%（費率七折）。',
      '設計邏輯：「污染者付費」確保外部成本內部化；「改善者受惠」鼓勵廠商投資防制設備，形成持續減排的經濟誘因。',
    ],
  },
  {
    id: 'authority', no: '06', title: '徵收機關', subtitle: '誰來收費',
    icon: Scale, color: '#d0dce8', textColor: '#3a5070', badge: '央地分工',
    content: [
      '固定污染源及移動污染源：中央主管機關（環境部）徵收，統一撥入空氣污染防制基金。',
      '營建工程：地方主管機關（直轄市、縣市環保局）自行徵收，由地方空污基金管理統籌運用。',
      '固定源業者每季申報排放量並繳納費用；逾期未繳除加徵延滯金外，主管機關得移送強制執行。',
    ],
  },
  {
    id: 'effect', no: '07', title: '法律效果', subtitle: '費款與基金用途',
    icon: TrendingUp, color: '#dcd0e8', textColor: '#583878', badge: '專款專用',
    content: [
      '費款存入「空氣污染防制基金」（特別收入基金），不納入政府一般財政收入，具專款專用性質。',
      '主要支出：移動源管制 37.5%、固定源管制 11.9%、空品淨化區設置 19.6%、執行空污防制計畫 19.6%、空污防制策略研發 9.3%、空品監測 1.4%。',
      '政策成效：1995至2008年累計徵收逾 355 億元；SOx 排放量較 1999 年削減 86,761 公噸、NOx 削減 63,880 公噸。',
    ],
  },
];

const SOURCE_TYPES = [
  {
    id: 'fixed', name: '固定污染源',
    icon: Factory, color: '#d0e8d4', textColor: '#387850',
    examples: '電廠、工廠、焚化廠、石化廠',
    pollutants: 'SOx、NOx、VOCs、PM、重金屬、戴奧辛',
    basis: '實際排放量（季申報）',
    authority: '環境部（中央）',
  },
  {
    id: 'mobile', name: '移動污染源',
    icon: Car, color: '#d0dce8', textColor: '#385878',
    examples: '汽機車（透過燃料銷售者徵收）',
    pollutants: '汽柴油依含硫量分三級費率',
    basis: '燃料銷售/進口量',
    authority: '環境部（中央）',
  },
  {
    id: 'construction', name: '營建工程',
    icon: Building2, color: '#e8e0d0', textColor: '#786038',
    examples: '建築、道路、橋樑、區域開發工程',
    pollutants: '粒狀污染物（依工程類別計費）',
    basis: '施工面積 × 工期',
    authority: '縣市環保局（地方）',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function AirPollutionFee() {
  const [section, setSection] = useState('overview');
  const [activeTab, setActiveTab] = useState('SOx');
  const [zone, setZone] = useState('zone2');
  const [season, setSeason] = useState('q23');
  const [openEl, setOpenEl] = useState(null);

  useEffect(() => { document.title = '台灣空氣污染防制費'; }, []);

  const p = POLLUTANTS[activeTab];
  const rates = p.rates[zone][season];
  const numericRates = rates.filter(r => typeof r === 'number');
  const maxRate = Math.max(...numericRates);

  const SECTIONS = [
    { id: 'overview',  label: '制度概覽' },
    { id: 'elements',  label: '構成要件' },
    { id: 'rates',     label: '費率查詢' },
    { id: 'discount',  label: '優惠機制' },
  ];

  const FUND_USAGE = [
    { label: '移動源管制',     pct: 37.5, color: '#a8c4b4' },
    { label: '空品淨化區',     pct: 19.6, color: '#b8a8d4' },
    { label: '執行防制計畫',   pct: 19.6, color: '#d4c4a8' },
    { label: '固定源管制',     pct: 11.9, color: '#c4d4a8' },
    { label: '策略推動/研發',  pct: 9.3,  color: '#c4b4a4' },
    { label: '空品監測',       pct: 1.4,  color: '#b4c4d4' },
    { label: '一般行政建設',   pct: 0.8,  color: '#d4c4b8' },
  ];

  return (
    <div className="min-h-screen bg-[#f5eceb] font-sans" style={{ paddingBottom: 64 }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-[#f5eceb]/90 backdrop-blur-md border-b border-[#e8d3d1] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#d0dce8] flex items-center justify-center">
          <Wind size={16} className="text-[#3a5878]" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#b09e9c]">Taiwan · Air Pollution Control</p>
          <p className="text-xs font-black text-[#6b5b58] leading-none">空氣污染防制費</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* Section nav */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                section === s.id
                  ? 'bg-[#6b5b58] text-white shadow-sm'
                  : 'bg-white/70 text-[#8a7a78] border border-[#e8d3d1] hover:border-[#d4bcb9]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {section === 'overview' && (
          <div className="space-y-4">

            {/* Key facts */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-6 py-5 shadow-sm shadow-rose-100/60">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-3">法規基本資料</p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {[
                  { k: '法源依據', v: '空污法第 16 條' },
                  { k: '法律性質', v: '特別公課' },
                  { k: '大法官釋字', v: '第 426 號' },
                  { k: '開徵時間', v: '1995 年 7 月 1 日' },
                  { k: '收費對象', v: '三大污染源' },
                  { k: '費款用途', v: '空污基金（專款專用）' },
                ].map(item => (
                  <div key={item.k}>
                    <p className="text-[9px] font-bold text-[#b09e9c] uppercase tracking-wider mb-0.5">{item.k}</p>
                    <p className="text-[13px] font-bold text-[#6b5b58]">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax vs Fee */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-6 py-5 shadow-sm shadow-rose-100/60">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-3">稅 vs. 費（特別公課）</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f5eceb] px-4 py-3">
                  <p className="text-xs font-black text-[#8a7a78] mb-1.5">稅（Tax）</p>
                  <p className="text-[11px] text-[#a09088] leading-relaxed">統收統支，納入政府一般財政，由各部會編列預算支用。對污染改善缺乏直接回饋誘因。</p>
                </div>
                <div className="rounded-2xl bg-[#e8f0ec] px-4 py-3">
                  <p className="text-xs font-black text-[#3a6848] mb-1.5">費（特別公課）</p>
                  <p className="text-[11px] text-[#5a8868] leading-relaxed">專款專用，存入空污基金。排放越少繳越少，改善者直接受益，具持續性減排誘因。</p>
                </div>
              </div>
            </div>

            {/* Three source types */}
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] px-1">三大污染源分類</p>
            {SOURCE_TYPES.map(src => {
              const Icon = src.icon;
              return (
                <div key={src.id} className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm shadow-rose-100/60">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: src.color }}>
                      <Icon size={18} style={{ color: src.textColor }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[#6b5b58] mb-1">{src.name}</p>
                      <p className="text-[11px] text-[#a09088] mb-2">{src.examples}</p>
                      <div className="space-y-0.5">
                        {[
                          { k: '課徵客體', v: src.pollutants },
                          { k: '計費基準', v: src.basis },
                          { k: '徵收機關', v: src.authority },
                        ].map(row => (
                          <div key={row.k} className="flex gap-2">
                            <span className="text-[10px] font-bold text-[#b09e9c] w-14 shrink-0">{row.k}</span>
                            <span className="text-[10px] text-[#7a6a68]">{row.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Timeline */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-6 py-5 shadow-sm shadow-rose-100/60">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-4">制度沿革</p>
              <div className="space-y-3">
                {[
                  { year: '1992', event: '空污法修正公布，第10條（現第16條）確立空污費法源' },
                  { year: '1995', event: '7月1日正式開徵；初期依燃料使用量及含硫量徵收' },
                  { year: '1998', event: '大法官釋憲後，改依SOx、NOx實際排放量徵收' },
                  { year: '2007', event: '重大改革：SOx/NOx改採排放量累進費率；新徵VOCs空污費' },
                  { year: '2010', event: 'VOCs進入第二期，回歸質量平衡計算、三級累進費率' },
                  { year: '近年', event: '新增PM（含PM2.5）、重金屬（鉛鎘汞砷六價鉻）、戴奧辛收費項目' },
                ].map(item => (
                  <div key={item.year} className="flex gap-4">
                    <span className="shrink-0 w-10 text-right text-[11px] font-black text-[#b09e9c]">{item.year}</span>
                    <div className="flex-1 border-l-2 border-[#e8d3d1] pl-4 pb-0.5">
                      <p className="text-[11px] text-[#7a6a68] leading-relaxed">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ELEMENTS ─────────────────────────────────────────── */}
        {section === 'elements' && (
          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm shadow-rose-100/60">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-1">分析框架</p>
              <p className="text-[12px] text-[#8a7a78] leading-relaxed">依行政法學理，特別公課之構成要件包含七個層次。點選各要件展開說明。</p>
            </div>

            {ELEMENTS.map(el => {
              const Icon = el.icon;
              const isOpen = openEl === el.id;
              return (
                <button
                  key={el.id}
                  onClick={() => setOpenEl(isOpen ? null : el.id)}
                  className="w-full text-left rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm shadow-rose-100/60 transition-all duration-200 hover:shadow-md hover:shadow-rose-100/80"
                >
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: el.color }}>
                      <Icon size={15} style={{ color: el.textColor }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-[#b09e9c]">{el.no}</span>
                        <span className="text-sm font-black text-[#6b5b58]">{el.title}</span>
                        <span
                          className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: el.color, color: el.textColor }}
                        >
                          {el.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a09088]">{el.subtitle}</p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-[#c5b4b2] transition-transform duration-200"
                      style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                    />
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-4 border-t border-[#f5eceb]">
                      <div className="pt-3 space-y-2.5">
                        {el.content.map((line, j) => (
                          <div key={j} className="flex gap-3">
                            <span
                              className="shrink-0 w-1.5 h-1.5 rounded-full mt-[5px]"
                              style={{ backgroundColor: el.textColor, opacity: 0.7 }}
                            />
                            <p className="text-[12px] text-[#6b5b58] leading-relaxed">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── RATES ────────────────────────────────────────────── */}
        {section === 'rates' && (
          <div className="space-y-4">

            {/* Pollutant tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {Object.entries(POLLUTANTS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                    activeTab === key
                      ? 'text-white shadow-sm border-transparent'
                      : 'bg-white/70 border-[#e8d3d1] text-[#8a7a78]'
                  }`}
                  style={activeTab === key ? { backgroundColor: val.textColor } : {}}
                >
                  {val.abbr}
                </button>
              ))}
            </div>

            {/* Pollutant description */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm shadow-rose-100/60">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <p className="text-sm font-black text-[#6b5b58]">{p.name}（{p.abbr}）</p>
              </div>
              <p className="text-[12px] text-[#8a7a78] leading-relaxed">{p.desc}</p>
            </div>

            {/* Zone & Season toggle */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-bold text-[#b09e9c] uppercase tracking-wider mb-1.5 px-0.5">防制區等級</p>
                <div className="flex rounded-xl border border-[#e8d3d1] bg-white/50 p-0.5">
                  {[['zone2', '二級區'], ['zone13', '一、三級區']].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setZone(v)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${zone === v ? 'bg-[#6b5b58] text-white shadow-sm' : 'text-[#8a7a78]'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold text-[#b09e9c] uppercase tracking-wider mb-1.5 px-0.5">季別</p>
                <div className="flex rounded-xl border border-[#e8d3d1] bg-white/50 p-0.5">
                  {[['q23', 'Q2/Q3'], ['q14', 'Q1/Q4']].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setSeason(v)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${season === v ? 'bg-[#6b5b58] text-white shadow-sm' : 'text-[#8a7a78]'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {season === 'q14' && (
              <div className="flex items-start gap-2 rounded-xl bg-[#f8f0e8] border border-[#e8d8c8] px-4 py-3">
                <Info size={12} className="text-[#b08060] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[#a07050] leading-relaxed">
                  第一、四季（冬季）費率較高。另需乘以<span className="font-bold">減量係數(E)</span>——若排放量低於基準年同季，可享最多七折優惠。
                </p>
              </div>
            )}

            {/* Rate bars */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm shadow-rose-100/60">
              <div className="px-5 py-3 border-b border-[#f5eceb]">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c]">
                  費率表｜{zone === 'zone2' ? '二級防制區' : '一、三級防制區'}｜第{season === 'q23' ? '二、三' : '一、四'}季
                </p>
              </div>
              <div className="divide-y divide-[#f8f4f3]">
                {p.tiers.map((tier, i) => {
                  const rate = rates[i];
                  const isFlat = typeof rate === 'string';
                  const barPct = isFlat ? 0 : (rate / maxRate) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="shrink-0 w-[72px]">
                        <p className="text-[12px] font-black text-[#6b5b58]">{tier.label}</p>
                        <p className="text-[9px] text-[#b09e9c] leading-tight mt-0.5">{tier.range}</p>
                      </div>
                      <div className="flex-1 flex items-center gap-2.5">
                        {!isFlat && (
                          <div className="flex-1 h-2 rounded-full bg-[#f0e8e6] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${barPct}%`, backgroundColor: p.color }}
                            />
                          </div>
                        )}
                        <span
                          className="shrink-0 text-[13px] font-black"
                          style={{ color: p.textColor }}
                        >
                          {isFlat ? rate : `${rate} 元/kg`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VOCs extra */}
            {activeTab === 'VOCs' && (
              <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm shadow-rose-100/60">
                <p className="text-xs font-black text-[#6b5b58] mb-2.5">個別物種加徵費率</p>
                {[
                  { name: '甲苯、二甲苯', rate: '10～15 元/公斤（依季排放量分二級）' },
                  { name: '苯、乙苯、苯乙烯等 11 種有害 VOCs', rate: '35 元/公斤（加徵）' },
                  { name: '廢氣燃燒塔（Flare）排放', rate: '40 元/公斤（統一費率，另有加乘因子）' },
                ].map(item => (
                  <div key={item.name} className="flex gap-2.5 mb-2">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-[5px]" style={{ backgroundColor: p.color }} />
                    <p className="text-[11px] text-[#7a6a68] leading-relaxed">
                      <span className="font-bold text-[#6b5b58]">{item.name}：</span>{item.rate}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* PM extra */}
            {activeTab === 'PM' && (
              <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm shadow-rose-100/60">
                <p className="text-xs font-black text-[#6b5b58] mb-2.5">重金屬及戴奧辛附加費率</p>
                {[
                  { name: '鉛、鎘、砷', rate: '500～1,000 元/公斤' },
                  { name: '汞、六價鉻', rate: '1,800～3,600 元/公斤' },
                  { name: '戴奧辛', rate: '7,200～720,000 元/g I-TEQ（三級）' },
                  { name: '非營建之堆置場及接駁點', rate: '30 元/公斤（統一費率）' },
                ].map(item => (
                  <div key={item.name} className="flex gap-2.5 mb-2">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-[5px]" style={{ backgroundColor: p.color }} />
                    <p className="text-[11px] text-[#7a6a68] leading-relaxed">
                      <span className="font-bold text-[#6b5b58]">{item.name}：</span>{item.rate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DISCOUNT ─────────────────────────────────────────── */}
        {section === 'discount' && (
          <div className="space-y-4">

            {/* Coefficient D */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-5 shadow-sm shadow-rose-100/60">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={15} className="text-[#488038]" />
                <p className="text-sm font-black text-[#6b5b58]">優惠係數 D</p>
                <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-[#e0e8d0] text-[#488038]">裝設防制設備</span>
              </div>
              <p className="text-[11px] text-[#8a7a78] leading-relaxed mb-4">
                依「符合條件排放量 ÷ 全廠排放量」之比率(A)決定。適用條件：裝設控制設備或製程改善，使排放濃度低於管制限值50%以下。
              </p>
              {[
                { range: 'A ≥ 95%',           d: 40,  label: '費率打四折' },
                { range: '75% ≤ A < 95%',     d: 50,  label: '費率打五折' },
                { range: '50% ≤ A < 75%',     d: 65,  label: '費率打六五折' },
                { range: '30% ≤ A < 50%',     d: 80,  label: '費率打八折' },
                { range: 'A < 30%',            d: 100, label: '全額繳費' },
              ].map(row => (
                <div key={row.range} className="flex items-center gap-3 mb-2.5">
                  <p className="text-[11px] font-bold text-[#6b5b58] w-32 shrink-0">{row.range}</p>
                  <div className="flex-1 h-2 rounded-full bg-[#f0e8e6] overflow-hidden">
                    <div className="h-full rounded-full bg-[#a8c4b4] transition-all duration-500" style={{ width: `${100 - row.d}%` }} />
                  </div>
                  <span className="text-[12px] font-black text-[#488038] w-10 shrink-0">D={row.d}%</span>
                  <span className="text-[10px] text-[#a09088] w-20 shrink-0 text-right">{row.label}</span>
                </div>
              ))}
            </div>

            {/* Coefficient E */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-5 shadow-sm shadow-rose-100/60">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={15} className="text-[#3a5878]" />
                <p className="text-sm font-black text-[#6b5b58]">減量係數 E</p>
                <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-[#d0dce8] text-[#3a5878]">Q1/Q4 專用</span>
              </div>
              <p className="text-[11px] text-[#8a7a78] leading-relaxed mb-4">
                僅適用於第一、四季。依「當季排放量」與「基準年同季平均」比較決定。基準年 = 費率修正生效後，前三年同季平均。
              </p>
              {[
                { cond: '當季排放 ≥ 基準年 × 90%',                       e: 'E = 100%', note: '排放未明顯減少，無折扣' },
                { cond: '基準年×70% ≤ 當季排放 < 基準年×90%',           e: '線性遞減',  note: '減少愈多，折扣愈大' },
                { cond: '當季排放 < 基準年 × 70%',                       e: 'E = 70%',  note: '最大折扣，費率七折' },
              ].map(row => (
                <div key={row.cond} className="rounded-xl bg-[#f5eceb] px-4 py-3 mb-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-bold text-[#6b5b58] flex-1">{row.cond}</p>
                    <span className="shrink-0 text-[12px] font-black text-[#3a5878]">{row.e}</span>
                  </div>
                  <p className="text-[10px] text-[#a09088] mt-0.5">{row.note}</p>
                </div>
              ))}
            </div>

            {/* Formula */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-5 shadow-sm shadow-rose-100/60">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-3">費額計算總公式</p>
              <div className="rounded-xl bg-[#f5eceb] px-4 py-3 font-mono text-[12px] text-[#6b5b58] leading-relaxed">
                費額 = 【Σ（各級排放量 × 各級費率）】× D × E
              </div>
              <div className="mt-3 space-y-1.5">
                {[
                  'D = 優惠係數（40%～100%）：裝設防制設備之污染控制比率',
                  'E = 減量係數（70%～100%）：Q1/Q4 專用，依與基準年之減量幅度決定',
                  'Q2/Q3（夏季）E 固定為 100%（不適用減量折扣）',
                  '兩係數可同時適用，達最大減費效果',
                ].map((note, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="shrink-0 text-[#b09e9c] text-[10px]">·</span>
                    <p className="text-[11px] text-[#8a7a78]">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fund usage */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-5 shadow-sm shadow-rose-100/60">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-4">空污基金支出結構</p>
              {FUND_USAGE.map(item => (
                <div key={item.label} className="flex items-center gap-3 mb-2.5">
                  <p className="text-[11px] text-[#6b5b58] w-24 shrink-0">{item.label}</p>
                  <div className="flex-1 h-2 rounded-full bg-[#f0e8e6] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <p className="text-[12px] font-black text-[#8a7a78] w-10 text-right">{item.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-[9px] font-bold text-[#c5b4b2] leading-relaxed">
          資料依據：空污法第16條、固定污染源空氣污染防制費收費費率附表<br />
          僅供學術研究參考，實務請以環境部官方公告為準
        </p>
      </div>
    </div>
  );
}
