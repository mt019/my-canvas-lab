import React, { useState, useEffect } from 'react';
import {
  Landmark, Globe, BookOpen, AlertTriangle, Building2,
  ChevronDown, Scale, Network, ArrowDown, BarChart2,
  ExternalLink, Info, TrendingDown, Layers, ArrowRight,
} from 'lucide-react';

// ─── Global debt data (General Government Gross Debt, % GDP, IMF 2024) ───────

const COUNTRY_DEBT = [
  { country: '日本',           en: 'Japan',              debt: 252, color: '#b8a8d4', textColor: '#50388a' },
  { country: '希臘',           en: 'Greece',             debt: 163, color: '#d4b8a8', textColor: '#7a4030' },
  { country: '義大利',         en: 'Italy',              debt: 135, color: '#d4b8a8', textColor: '#7a4030' },
  { country: '美國',           en: 'USA',                debt: 122, color: '#a8b8d4', textColor: '#305878' },
  { country: '法國',           en: 'France',             debt: 113, color: '#d4b8a8', textColor: '#7a4030' },
  { country: '中國（含LGFV）', en: 'China (incl. LGFV)', debt: 116, color: '#d4a8a8', textColor: '#783030', highlight: true },
  { country: '英國',           en: 'UK',                 debt: 100, color: '#d4b8a8', textColor: '#7a4030' },
  { country: '中國（官方）',   en: 'China (official)',   debt: 89,  color: '#f0d0d0', textColor: '#a05050', shadow: true },
  { country: '德國',           en: 'Germany',            debt: 64,  color: '#b8d4b8', textColor: '#386838' },
  { country: '澳洲',           en: 'Australia',          debt: 48,  color: '#b8d4b8', textColor: '#386838' },
  { country: '韓國',           en: 'South Korea',        debt: 46,  color: '#b8d4b8', textColor: '#386838' },
  { country: '台灣',           en: 'Taiwan',             debt: 28,  color: '#b8d4b8', textColor: '#386838' },
];

// ─── LGFV flow steps ──────────────────────────────────────────────────────────

const LGFV_FLOW = [
  { label: '地方政府', sub: '省、市、縣級政府', color: '#c8d8e8', textColor: '#305878' },
  { label: '成立融資平台（LGFV）', sub: '注入土地、資產作資本', color: '#d8c8e8', textColor: '#503878' },
  { label: '發行城投債 ／ 銀行貸款', sub: '隱含政府信用背書，利率介於國債與企業債間', color: '#e8d8c8', textColor: '#785030' },
  { label: '投資基礎建設', sub: '道路、地鐵、工業園區、保障性住房', color: '#d8e8c8', textColor: '#386838' },
  { label: '土地出讓收入償債', sub: '2021 年後土地市場下行，此鏈條承壓', color: '#f0d0d0', textColor: '#783030' },
];

// ─── China timeline ───────────────────────────────────────────────────────────

const CHINA_TIMELINE = [
  { year: '2008', event: '四兆刺激', detail: '全球金融危機後，中央推出 4 兆元刺激計畫，地方配套資金催生 LGFV 大爆發。' },
  { year: '2010', event: '首次審計', detail: '審計署首次披露地方政府性債務約 10.7 兆元，引發外界關注。' },
  { year: '2013', event: '全面審計', detail: '史上最大規模地方債審計，結果顯示總額達 17.9 兆元（廣義含或有債務 30.3 兆）。' },
  { year: '2014', event: '預算法修訂', detail: '修訂《預算法》，允許地方以債券形式合法舉債；《43 號文》規範地方債管理。' },
  { year: '2015', event: '專項債元年', detail: '地方政府債券大規模擴張，「專項債」作為基建融資主渠道正式啟動。' },
  { year: '2018', event: '去槓桿', detail: '中央收緊隱性債務，嚴禁新增城投隱性債務，LGFV 融資受限。' },
  { year: '2020', event: '疫情擴張', detail: '抗疫與穩增長需求，專項債額度大幅擴大，地方債規模急速上升。' },
  { year: '2023', event: '一攬子化債', detail: '多省「隱性債務化解」方案出台；部分城投出現技術性違約，市場信心動搖。' },
  { year: '2024', event: '10 兆化債', detail: '全國人大批准 10 兆元再融資方案，以低息地方債置換隱性城投債，暫緩流動性壓力。' },
];

// ─── Research layers ──────────────────────────────────────────────────────────

const RESEARCH_LAYERS = [
  {
    id: 'public-finance',
    no: '01',
    title: '公共財政理論',
    en: 'Public Finance Theory',
    color: '#d0dce8',
    textColor: '#3a5878',
    Icon: Scale,
    summary: '所有研究的理論底層。政府為何舉債？哪類支出適合借債融資？代際公平與黃金法則。',
    concepts: [
      { term: '代際公平', def: '舉債建設讓未來世代承擔還款義務——若投資確實提升未來生產力，則合理；否則即為代際轉移負擔。' },
      { term: '黃金法則', def: '借債只用於資本支出（基礎建設等投資），不用於彌補經常性赤字（人事費、補貼）。' },
      { term: '公共選擇理論', def: '政治人物有系統性偏好舉債：好處在任期內兌現，成本留給繼任者與未來選民。' },
    ],
    readings: [
      { title: 'The Theory of Public Finance', authors: 'Richard Musgrave', year: '1959', type: 'book', note: '現代公共財政學奠基之作。三功能框架（資源配置、所得重分配、總體穩定）至今仍為教學標準。' },
      { title: 'Fiscal Federalism', authors: 'Wallace Oates', year: '1972', type: 'book', note: '地方政府舉債分析的理論基礎。提出「對應原則」：誰受益、誰負擔。' },
      { title: 'The Calculus of Consent', authors: 'James Buchanan & Gordon Tullock', year: '1962', type: 'book', note: '公共選擇理論奠基。用理性人假設解釋政府擴張與舉債的政治邏輯。' },
    ],
  },
  {
    id: 'fiscal-federalism',
    no: '02',
    title: '財政聯邦主義',
    en: 'Fiscal Federalism',
    color: '#d0e8d8',
    textColor: '#3a6848',
    Icon: Network,
    summary: '中國地方債研究幾乎全部放在這個框架。中央與地方如何分工？地方財政自主權如何影響舉債行為？',
    concepts: [
      { term: '軟預算約束', def: '（Kornai 1980）地方政府預期中央會救助，因此過度舉債。這是分析中國地方債最核心的一個概念。' },
      { term: 'Tiebout 模型', def: '居民「用腳投票」，遷至公共財配置最符合偏好的轄區，形成地方政府間財政競爭的理論基礎。' },
      { term: '財政缺口', def: '地方支出責任遠超稅收來源（1994 年分稅制後尤為嚴重），逼迫地方借債或依賴中央轉移支付。' },
    ],
    readings: [
      { title: 'Federalism, Chinese Style: The Political Basis for Economic Success in China', authors: 'Montinola, Qian & Weingast', year: '1995', journal: 'World Politics', type: 'article', note: '中國改革開放研究最具影響力的論文之一。解釋地方政府何以有強烈投資誘因。後續大量學者提出修正，認為中央仍高度集權。' },
      { title: 'Fiscal Decentralization and Economic Development', authors: 'Wallace Oates', year: '1993', journal: 'National Tax Journal', type: 'article', note: '財政分權與發展的實證綜述，提供跨國比較的理論基準。' },
    ],
  },
  {
    id: 'china-lgd',
    no: '03',
    title: '中國地方政府債務',
    en: 'China Local Government Debt',
    color: '#e8d8d0',
    textColor: '#784030',
    Icon: Building2,
    summary: '核心文獻區。從「城投隱性債務」到「專項債配額」，再到政治經濟學框架——這一層是進入中國研究的入口。',
    concepts: [
      { term: '顯性 vs 隱性債務', def: '顯性：政府名義發行的債券，計入官方統計。隱性：透過 LGFV 舉借、不計入官方數字但政府實質負有兜底責任的債務。' },
      { term: '配額制度', def: '中央按省分配地方債發行額度（quota），作為控制地方財政行為、同時傳遞政策信號的工具。' },
      { term: '專項債', def: '理論上須以特定項目收益自償，實際上大量項目缺乏真實收益，形成新的隱性負擔。' },
    ],
    readings: [
      { title: "The Political Economy of China's Local Government Debt", authors: 'Victor Shih et al.', year: '2024', journal: 'The China Quarterly', type: 'article', importance: 'high', note: '目前引用率最高的分析。不把地方債視為單純財政問題，而是政治經濟研究：中央如何利用配額制度控制地方，及中央—地方權力再集中的過程。如果只能讀一篇，讀這篇。' },
      { title: 'Local Government Debt and Municipal Bonds in China: Problems and a Framework of Analysis', authors: 'Christine Wong', year: '2014', journal: 'Copenhagen Journal of Asian Studies', type: 'article', note: '法律與制度面奠基性分析：城投債法律地位模糊、地方民主不足、財政透明度缺失，以及軟預算約束形成機制。後續研究大量引用。' },
      { title: "China's Local Government Debt: Causes, Consequences, Characteristics, Governance and Suggestions", authors: 'Yiping Huang et al.', year: '2025', publisher: 'ANU Press', type: 'report', note: '目前最新的系統性綜述。適合了解歷史演變、形成原因、系統性金融風險，以及政策改革方向的全景圖。' },
      { title: "A Geographical Approach to Understanding China's Local Government Debt", authors: 'Rui Mao & Yixuan Wang', year: '2024', journal: 'Urban Studies', type: 'article', note: '空間經濟學視角：哪些城市借最多？債務如何在空間上擴散？地方競爭如何驅動過度舉債？' },
    ],
  },
  {
    id: 'lgfv',
    no: '04',
    title: '地方融資平台（城投）',
    en: 'Local Government Financing Vehicles',
    color: '#e0d0e8',
    textColor: '#683878',
    Icon: Landmark,
    summary: '近十年國際研究焦點已從地方債券轉向 LGFV。城投是理解中國隱性債務結構的核心機制。',
    concepts: [
      { term: 'LGFV', def: '由地方政府成立、以政府信用背書、發行城投債或向銀行借款、投資基礎建設的國有企業平台。' },
      { term: '城投債', def: '城投公司發行的企業債，市場默認政府不會讓其違約（隱性擔保），利率介於國債與一般企業債之間。' },
      { term: '土地財政', def: '地方政府以出讓土地使用權收入支撐 LGFV 債務償還能力。2021 年後房地產下行使此模式面臨根本挑戰。' },
    ],
    readings: [
      { title: 'Understanding Local Government Debt Financing of Infrastructure in China', authors: 'Lisheng Dong & Yingnan Joseph Hua', year: '2023', journal: 'Journal of Public Administration Research and Theory', type: 'article', note: '最完整的 LGFV 機制解析。清晰呈現地方政府→融資平台→舉債→建設→土地收入還債的完整循環，並分析土地財政崩解的後果。' },
      { title: 'The Financial Value of Political Networks: Evidence from Local Government Financing Vehicles', authors: 'Hanming Fang, Zhe Li & Nianhang Xu', year: '2022', journal: 'Review of Finance', type: 'article', note: '政治連結如何影響城投債定價：關係強的 LGFV 發債成本更低，揭示隱性擔保的政治機制。' },
      { title: "The Impact of Implicit Government Guarantee on LGFV Bond Credit Spreads", authors: 'Various', year: '2024', type: 'article', note: '量化「隱性擔保」市場定價效應：政策信號如何改變信用利差，以及擔保預期的傳遞路徑。' },
    ],
  },
  {
    id: 'financial-risk',
    no: '05',
    title: '金融風險與市場影響',
    en: 'Financial Risk',
    color: '#e8e0c8',
    textColor: '#686030',
    Icon: AlertTriangle,
    summary: '近兩年熱門方向：地方債如何傳染至銀行體系、信評、資產價格，以及官員問責機制的設計缺陷。',
    concepts: [
      { term: '再融資風險', def: '存量債務到期需借新還舊，若市場信心動搖或利率驟升，地方或 LGFV 面臨流動性危機。' },
      { term: 'GDP 錦標賽', def: '晉升激勵使官員過度投資基建、不計成本舉債，債務留給繼任者——政治誘因結構導致系統性過度借貸。' },
      { term: '銀行壞帳傳染', def: '城投違約→中小銀行壞帳上升→銀行惜貸→地方基建停滯→財政收入進一步下滑的負向螺旋。' },
    ],
    readings: [
      { title: 'Political Accountability and Local Government Debt: Evidence from China', authors: 'Various', year: '2026', type: 'article', note: '最新研究：問責機制設計與債務擴張的因果關係。官員任期長短、晉升概率如何影響舉債行為。' },
      { title: 'The Policy Paradox: How Regulatory Tightening Amplifies LGFV Debt Risk', authors: 'Various', year: '2025', type: 'article', note: '政策悖論：監管收緊反而在短期內推高違約風險的機制，以及中央意圖與市場結果之間的落差。' },
    ],
  },
  {
    id: 'intl-orgs',
    no: '06',
    title: 'IMF、世界銀行、OECD',
    en: 'International Organizations',
    color: '#c8d8e8',
    textColor: '#305878',
    Icon: Globe,
    summary: '國際組織從比較財政學、市場紀律、財政透明度角度分析中國，提供跨國基準與改革建議。',
    concepts: [
      { term: '財政空間', def: '政府在不危害財政永續前提下可動用的借債餘地。需同時考量債務/GDP 比、利率水準、名目成長率。' },
      { term: 'r < g 條件', def: '（Blanchard 2019）若實質利率(r)低於經濟成長率(g)，政府可持續舉債而不使債務/GDP 上升——但此條件在中國地方成長放緩後逐漸不成立。' },
      { term: '財政規則', def: '法定限制舉債的規則（如歐盟 3% 赤字/GDP 上限）。中國《預算法》原本禁止地方借債，2015 年修法後開放，但配套監管尚不完善。' },
    ],
    readings: [
      { title: 'Article IV Consultation: China — Selected Issues: Local Government Bonds', authors: 'IMF', year: '2023', type: 'report', note: 'IMF 年度財政評估，從債券市場發展、財政永續性、風險管理角度分析中國地方債，並與新興市場做跨國比較。' },
      { title: 'Fiscal Monitor: Fiscal Policy in the New Normal', authors: 'IMF', year: '2024', type: 'report', note: '含主要國家債務/GDP 最新數據、債務永續性評估，以及各國財政整頓經驗的半年度全球報告。' },
      { title: 'Public Finance in China: Reform and Growth for a Harmonious Society', authors: 'Jiwei Lou & Shuilin Wang (eds.)', year: '2008', publisher: 'World Bank', type: 'book', note: '世界銀行對中國財政體制的系統性分析，提供 1994 年分稅制改革後財政格局的完整基線。' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function GovernmentDebt() {
  const [activeTab, setActiveTab] = useState('overview');
  const [openLayer, setOpenLayer] = useState('china-lgd');
  const [openTimeline, setOpenTimeline] = useState(null);

  useEffect(() => {
    document.title = '政府債務研究 — Canvas Lab';
  }, []);

  const maxDebt = Math.max(...COUNTRY_DEBT.map(d => d.debt));

  const TABS = [
    { id: 'overview',  label: '全球概覽',   Icon: BarChart2 },
    { id: 'china',     label: '中國深度',   Icon: Building2 },
    { id: 'research',  label: '研究架構',   Icon: BookOpen },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f0f4f8', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2d4a6e 0%, #3a5f8a 100%)', paddingTop: 48, paddingBottom: 32 }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Landmark size={20} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Government Debt Research
              </p>
              <h1 className="text-xl font-black text-white leading-tight">政府債務問題深度研究</h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            涵蓋全球主要國家債務現況、中國地方債（含 LGFV 城投）深度分析，以及國際學術研究架構六層次。
          </p>
          <a
            href="https://www.yicai.com/news/103249639.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
          >
            <ExternalLink size={11} />
            研究動機來源：第一財經報道
          </a>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ background: '#2d4a6e' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex gap-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all border-b-2"
              style={{
                color: activeTab === id ? 'white' : 'rgba(255,255,255,0.45)',
                borderBottomColor: activeTab === id ? 'white' : 'transparent',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">

        {/* ── Tab: Global Overview ── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={14} style={{ color: '#4a6fa5' }} />
                <h2 className="text-sm font-black" style={{ color: '#2d3748' }}>一般政府總債務 / GDP</h2>
              </div>
              <p className="text-[11px] mb-4" style={{ color: '#718096' }}>
                IMF《World Economic Outlook》2024 年估計值。中國另列含 LGFV 隱性債務的市場估算。
              </p>
              <div className="flex flex-col gap-2">
                {[...COUNTRY_DEBT].sort((a, b) => b.debt - a.debt).map((item) => (
                  <div key={item.en} className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold shrink-0 text-right"
                      style={{ width: 100, color: item.highlight ? '#783030' : '#4a5568', fontWeight: item.highlight ? 900 : 700 }}
                    >
                      {item.country}
                    </span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#edf2f7', height: 20 }}>
                      <div
                        className="h-full flex items-center justify-end pr-2 transition-all duration-500 rounded-full"
                        style={{
                          width: `${(item.debt / maxDebt) * 100}%`,
                          background: item.color,
                          minWidth: 32,
                        }}
                      >
                        <span
                          className="text-[10px] font-black"
                          style={{ color: item.textColor }}
                        >
                          {item.debt}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#718096' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: '#d4a8a8' }} />
                  中國（含LGFV）為市場估算，非 IMF 官方數字
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#718096' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: '#f0d0d0' }} />
                  中國（官方）：IMF 一般政府口徑
                </div>
              </div>
            </div>

            {/* Key observations */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} style={{ color: '#4a6fa5' }} />
                <h2 className="text-sm font-black" style={{ color: '#2d3748' }}>關鍵觀察</h2>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: '日本之謎', color: '#b8a8d4', textColor: '#50388a', text: '日本債務/GDP 超過 250%，但長期維持低利率、無違約風險——因為近 90% 國債由國內機構持有，外部壓力極低。此為「本國貨幣計價、本國人持有」的特殊案例。' },
                  { label: '中國的兩個數字', color: '#d4a8a8', textColor: '#783030', text: 'IMF 官方口徑約 89%（含地方政府債券），但若將城投 LGFV 隱性債務納入，市場估算達 110–120%。這個「影子債務」的規模認定，是當前研究最核心的爭議。' },
                  { label: '德國的刹車條款', color: '#b8d4b8', textColor: '#386838', text: '德國《基本法》第 115 條規定，聯邦政府結構性赤字不得超過 GDP 的 0.35%（Schuldenbremse，債務刹車），是目前全球最嚴格的憲法層級財政紀律規則。' },
                  { label: '台灣的低債務', color: '#b8d4c4', textColor: '#307858', text: '台灣總債務/GDP 約 28%，遠低於 OECD 平均（約 90%）。但此數字未含潛在負債（如退休金缺口、國軍年改後的隱性財政壓力）。' },
                ].map((obs) => (
                  <div key={obs.label} className="rounded-xl p-3" style={{ background: obs.color + '22' }}>
                    <div className="text-[11px] font-black mb-1" style={{ color: obs.textColor }}>{obs.label}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{obs.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sustainability note */}
            <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} style={{ color: '#305878' }} />
                <span className="text-xs font-black" style={{ color: '#305878' }}>財政永續性核心公式</span>
              </div>
              <div className="rounded-lg px-4 py-3 font-mono text-sm font-bold text-center mb-2" style={{ background: 'white', color: '#305878' }}>
                Δ(Debt/GDP) = Primary Deficit + (r − g) × Debt/GDP
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: '#4a6fa5' }}>
                <strong>r</strong> = 實質利率，<strong>g</strong> = 實質 GDP 成長率。當 r &lt; g，政府可持續舉債而不使債務比率惡化（Blanchard 2019）。
                中國地方政府面臨的困境：城投借貸利率持續高於實際地方 GDP 成長率，使此條件不再成立。
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: China Deep Dive ── */}
        {activeTab === 'china' && (
          <div className="flex flex-col gap-5">
            {/* Debt composition */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
              <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>中國政府債務構成（2024 年估計）</h2>
              <p className="text-[11px] mb-4" style={{ color: '#718096' }}>官方數字與市場估算之間存在巨大落差，「隱性債務」的認定是政策與學術爭議的核心。</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: '中央政府債務', amount: '約 30 兆元', pct: 24, color: '#a8b8d4', note: '記入官方統計，透明度較高。' },
                  { label: '地方政府顯性債務（含專項債）', amount: '約 42 兆元', pct: 34, color: '#b8c8e0', note: '2014 年後合法發行，計入官方統計。' },
                  { label: '城投 LGFV 隱性債務（估算）', amount: '約 55–70 兆元', pct: 45, color: '#d4a8a8', highlight: true, note: '不計入官方，但政府實質負有兜底責任。規模有爭議。' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold" style={{ color: item.highlight ? '#783030' : '#4a5568' }}>{item.label}</span>
                      <span className="text-[11px] font-black" style={{ color: item.highlight ? '#783030' : '#305878' }}>{item.amount}</span>
                    </div>
                    <div className="rounded-full overflow-hidden mb-1" style={{ background: '#edf2f7', height: 14 }}>
                      <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                    <p className="text-[10px]" style={{ color: '#a0aec0' }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* LGFV Flow */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
              <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>LGFV 城投運作機制</h2>
              <p className="text-[11px] mb-4" style={{ color: '#718096' }}>地方政府繞過預算限制的融資結構——「表外財政」的核心迴路。</p>
              <div className="flex flex-col items-center gap-0">
                {LGFV_FLOW.map((step, i) => (
                  <React.Fragment key={step.label}>
                    <div
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{ background: step.color + '55', borderColor: step.color }}
                    >
                      <div className="text-xs font-black" style={{ color: step.textColor }}>{step.label}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: step.textColor + 'bb' }}>{step.sub}</div>
                    </div>
                    {i < LGFV_FLOW.length - 1 && (
                      <div className="flex flex-col items-center py-1">
                        <ArrowDown size={16} style={{ color: '#a0aec0' }} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-4 rounded-xl p-3" style={{ background: '#fff3f3' }}>
                <div className="text-[11px] font-black mb-1" style={{ color: '#c53030' }}>2021 年後的裂縫</div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#783030' }}>
                  房地產市場下行導致土地出讓收入崩跌（2021–2023 年下降逾 40%），整個 LGFV 債務循環的最終還款來源大幅縮水。
                  部分城投開始出現「技術性違約」，中央於 2024 年底推出 10 兆元化債方案以低息置換高息城投債，暫緩流動性壓力，但未解決根本問題。
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
              <h2 className="text-sm font-black mb-4" style={{ color: '#2d3748' }}>中國地方政府債務歷史演進</h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: '#c8d8e8' }} />
                {CHINA_TIMELINE.map((item, i) => (
                  <div key={item.year} className="relative mb-3 last:mb-0">
                    <div
                      className="absolute left-[-20px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center cursor-pointer"
                      style={{ background: openTimeline === i ? '#305878' : '#a8c4d8' }}
                      onClick={() => setOpenTimeline(openTimeline === i ? null : i)}
                    />
                    <button
                      className="w-full text-left"
                      onClick={() => setOpenTimeline(openTimeline === i ? null : i)}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black" style={{ color: '#305878', minWidth: 32 }}>{item.year}</span>
                        <span className="text-xs font-bold" style={{ color: '#2d3748' }}>{item.event}</span>
                        <ChevronDown
                          size={12}
                          style={{ color: '#a0aec0', transform: openTimeline === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: 'auto', flexShrink: 0 }}
                        />
                      </div>
                      {openTimeline === i && (
                        <p className="text-[11px] leading-relaxed mt-1 pl-9" style={{ color: '#4a5568' }}>{item.detail}</p>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Key indicators */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '地方顯性債務', value: '~42 兆元', sub: '2024 年末，含一般債＋專項債', color: '#a8b8d4' },
                { label: 'LGFV 存量（估）', value: '~65 兆元', sub: '城投債＋城投銀行貸款合計', color: '#d4a8a8' },
                { label: '土地出讓收入跌幅', value: '↓ 40%+', sub: '2021 → 2023 年累計跌幅', color: '#e8d0c8' },
                { label: '2024 化債規模', value: '10 兆元', sub: '全國人大批准再融資置換', color: '#b8d4b8' },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="text-[10px] font-bold mb-1" style={{ color: '#718096' }}>{kpi.label}</div>
                  <div className="text-lg font-black" style={{ color: '#2d3748' }}>{kpi.value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#a0aec0' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Research Framework ── */}
        {activeTab === 'research' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={14} style={{ color: '#305878' }} />
                <span className="text-xs font-black" style={{ color: '#305878' }}>由大到小的閱讀架構</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: '#4a6fa5' }}>
                國際學術界研究中國專項債的框架，不止於制度細節。建議先掌握公共財政理論與財政聯邦主義，
                再進入中國地方債與 LGFV 的具體研究。第五、六層則可按需求選讀。
              </p>
            </div>

            {RESEARCH_LAYERS.map((layer) => {
              const isOpen = openLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-sm overflow-hidden"
                >
                  <button
                    className="w-full text-left px-5 py-4 flex items-center gap-3"
                    onClick={() => setOpenLayer(isOpen ? null : layer.id)}
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: layer.color }}
                    >
                      <layer.Icon size={16} style={{ color: layer.textColor }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black" style={{ color: layer.textColor + '88' }}>
                          Layer {layer.no}
                        </span>
                        <span className="text-sm font-black" style={{ color: '#2d3748' }}>{layer.title}</span>
                      </div>
                      <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#718096' }}>{layer.en}</p>
                    </div>
                    <ChevronDown
                      size={15}
                      style={{ color: '#a0aec0', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t px-5 py-4 flex flex-col gap-4" style={{ borderColor: '#f0f4f8' }}>
                      {/* Summary */}
                      <p className="text-xs leading-relaxed" style={{ color: '#4a5568' }}>{layer.summary}</p>

                      {/* Concepts */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#a0aec0' }}>核心概念</p>
                        <div className="flex flex-col gap-2">
                          {layer.concepts.map((c) => (
                            <div key={c.term} className="rounded-lg px-3 py-2" style={{ background: layer.color + '33' }}>
                              <span className="text-[11px] font-black" style={{ color: layer.textColor }}>{c.term}　</span>
                              <span className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{c.def}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Readings */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#a0aec0' }}>重要文獻</p>
                        <div className="flex flex-col gap-3">
                          {layer.readings.map((r) => (
                            <div
                              key={r.title}
                              className="rounded-xl border px-3 py-3"
                              style={{
                                borderColor: r.importance === 'high' ? '#d4a8a8' : '#edf2f7',
                                background: r.importance === 'high' ? '#fff8f8' : 'white',
                              }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  {r.importance === 'high' && (
                                    <span className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded mb-1 mr-1" style={{ background: '#d4a8a8', color: '#783030' }}>
                                      重點推薦
                                    </span>
                                  )}
                                  <span
                                    className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded"
                                    style={{
                                      background: r.type === 'book' ? '#dde8c8' : r.type === 'report' ? '#c8d8e8' : '#e8e0c8',
                                      color: r.type === 'book' ? '#386838' : r.type === 'report' ? '#305878' : '#686030',
                                    }}
                                  >
                                    {r.type === 'book' ? '書籍' : r.type === 'report' ? '報告' : '期刊論文'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold shrink-0" style={{ color: '#a0aec0' }}>{r.year}</span>
                              </div>
                              <p className="text-[11px] font-black leading-snug mb-1" style={{ color: '#2d3748' }}>{r.title}</p>
                              <p className="text-[10px] mb-1.5" style={{ color: '#718096' }}>
                                {r.authors}{r.journal ? ` — ${r.journal}` : ''}{r.publisher ? ` — ${r.publisher}` : ''}
                              </p>
                              <p className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{r.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Cross-cutting research themes */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight size={14} style={{ color: '#4a6fa5' }} />
                <h2 className="text-sm font-black" style={{ color: '#2d3748' }}>跨層次研究主題</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Public Finance', 'Fiscal Federalism', 'Political Economy',
                  'Debt Sustainability', 'Municipal Finance', 'Infrastructure Finance',
                  'LGFV / 城投', 'Subnational Debt', 'Soft Budget Constraint', 'Land Finance',
                ].map((theme) => (
                  <span
                    key={theme}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: '#e8f0f8', color: '#305878' }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed mt-3" style={{ color: '#718096' }}>
                從這十個角度切入，中國專項債只是全球地方政府融資制度中一個特殊案例。
                真正值得研究的是：中央與地方財政關係、債務治理、政治誘因與公共投資之間的制度邏輯。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
