import React, { useState } from 'react';
import {
  ChevronDown, Globe, Scale, Shield, Network, Search,
  CheckCircle, XCircle, AlertCircle, ExternalLink,
  Building2, ArrowDown, FileText, BookOpen, Flag,
  DollarSign, MapPin, Users, TrendingUp, ArrowRight,
} from 'lucide-react';
import manusCase from '../data/intlTaxOps/manusCase.json';

// ─── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg: '#f2f4f8',
  card: 'rgba(255,255,255,0.82)',
  border: '#dde2ef',
  primary: '#3b4f78',
  accent: '#b87333',
  muted: '#8892a8',
  faint: '#edf0f7',
};

// Research data (timeline, corporate structure, legal analysis, research
// questions, scholar frameworks, fact-check claims, source list) lives in
// intl-tax-ops-lab/data/manus-meta-case.json -- the same data repo backing
// InternationalTaxOps, since this case study applies the same Danon x
// Ziegler analytical framework and shares its topicDomain taxonomy. Only
// rendering logic stays in this component.
const PHASES = manusCase.phases;
const STRUCTURE = manusCase.structure;
const ICONS = { Shield, Network, Scale, Globe };
const LEGAL = manusCase.legalDimensions.map((dim) => ({ ...dim, Icon: ICONS[dim.iconId] }));
const RESEARCH_QS = manusCase.researchQuestions;
const SCHOLARS = manusCase.scholars;
const FACTS = manusCase.facts;
const SOURCES = manusCase.sources;

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ManusMetaAcquisition() {
  const [lang, setLang] = useState('zh');
  const [tab, setTab] = useState(0);
  const [openPhase, setOpenPhase] = useState(() => new Set(PHASES.map((_, i) => i)));
  const [openLegal, setOpenLegal] = useState(() => new Set(LEGAL.map(d => d.id)));
  const [openLegalItem, setOpenLegalItem] = useState(() => {
    const obj = {};
    LEGAL.forEach(dim => dim.items.forEach((_, j) => { obj[`${dim.id}-${j}`] = true; }));
    return obj;
  });
  const [openRQ, setOpenRQ] = useState(() => new Set([
    ...RESEARCH_QS.map((_, i) => i),
    ...SCHOLARS.map(sc => `sc-${sc.id}`),
  ]));
  const tog = (setFn, key) => setFn(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const iZh = lang === 'zh';

  const TABS = iZh
    ? ['事實年表', '公司結構', '法律分析', '研究框架', '事實查核']
    : ['Timeline', 'Structure', 'Legal', 'Research', 'Fact-Check'];

  return (
    <div className="min-h-screen font-sans" style={{ background: P.bg }}>
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-20">

        {/* ── Header ── */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: P.muted }}>
                Research Analysis · International Economic Law
              </p>
              <h1 className="text-2xl font-black leading-tight" style={{ color: P.primary }}>
                {iZh ? 'Manus–Meta 跨境收購' : 'Manus–Meta Cross-Border Acquisition'}
              </h1>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: P.muted }}>
                {iZh
                  ? 'AI 新創跨境退出的國際經濟法研究 · 投資審查 × 技術管制 × 稅收分配'
                  : 'IEL Research on AI Startup Cross-Border Exits · Investment Screening × Tech Controls × Tax Allocation'}
              </p>
            </div>
            <button
              onClick={() => setLang(iZh ? 'en' : 'zh')}
              className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black border transition-all"
              style={{ background: P.card, borderColor: P.border, color: P.primary }}
            >
              <Globe size={12} />
              {iZh ? 'EN' : '中文'}
            </button>
          </div>

          {/* Latest update banner */}
          <div className="rounded-2xl px-4 py-3 border" style={{ background: '#fff3e0', borderColor: '#f0a040' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e07000' }} />
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#804000' }}>
                {iZh ? '最新進展（2026 年 6 月）' : 'Latest Development (June 2026)'}
              </p>
            </div>
            <p className="text-[11px] leading-relaxed font-medium" style={{ color: '#5a3000' }}>
              {iZh
                ? '2026 年 4 月 27 日，中國 NDRC 依 FISR 第 12 條強制解除 Meta 對 Manus 的收購——此為中國安全審查機制首次公開適用於解除已完成的跨境 AI 交易。Meta 已切斷與 Manus 的數據連結，創始人正尋求 10 億美元回購資金，計劃以 20 億美元原價買回。'
                : 'On April 27, 2026, China\'s NDRC mandated unwinding of Meta\'s Manus acquisition under FISR Article 12 — the first public use of China\'s security review mechanism to reverse a completed cross-border AI deal. Meta has severed data access; founders seek USD 1B to buy back at the original USD 2B valuation.'}
            </p>
          </div>

          {/* Research question banner */}
          <div className="rounded-2xl px-4 py-3 border" style={{ background: '#eef1fa', borderColor: '#c8d0e8' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: P.muted }}>
              {iZh ? '核心研究問題' : 'Central Research Question'}
            </p>
            <p className="text-[12px] leading-relaxed font-medium italic" style={{ color: P.primary }}>
              {iZh
                ? '當可移動的戰略性資產、公司結構、監管控制與稅收實現分散於不同管轄區時，國際經濟法應如何理解並規範 AI 新創的跨境退出？'
                : 'How should international economic law understand and govern the cross-border exit of AI startups when mobile strategic assets, corporate structuring, regulatory control, and tax realization are distributed across different jurisdictions?'}
            </p>
          </div>
        </header>

        {/* ── Tab bar ── */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className="shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition-all border"
              style={tab === i
                ? { background: P.primary, color: 'white', borderColor: P.primary }
                : { background: P.card, color: P.muted, borderColor: P.border }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Tab 0: Timeline                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 0 && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl px-4 py-3 border" style={{ background: P.card, borderColor: P.border }}>
              <p className="text-[11px] leading-relaxed" style={{ color: P.muted }}>
                {iZh
                  ? '以下七個階段的事實敘述均以英文主流媒體可確認之報導為基礎，標注來源編號。「稅法意義」欄為學術分析，非事實陳述。'
                  : 'Factual events below are grounded in verifiable mainstream English-language media reporting, with source citations. "Tax note" sections are academic analysis, not factual claims.'}
              </p>
            </div>

            {PHASES.map((ph, i) => {
              const open = openPhase.has(i);
              return (
                <div key={ph.no} className="rounded-2xl border overflow-hidden" style={{ borderColor: ph.color, background: P.card }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => tog(setOpenPhase, i)}
                  >
                    <div
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                      style={{ background: ph.color, color: ph.tc }}
                    >
                      {ph.no}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black" style={{ color: ph.tc }}>
                        {iZh ? ph.zh.title : ph.en.title}
                      </div>
                      <div className="text-[10px]" style={{ color: P.muted }}>
                        {ph.period} · {iZh ? ph.zh.sub : ph.en.sub}
                      </div>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{ color: P.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
                    />
                  </button>

                  {open && (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                      {/* Events */}
                      {ph.events.map((ev, j) => (
                        <div key={j} className="rounded-xl px-3 py-2.5" style={{ background: ph.color + '44' }}>
                          <div className="text-[10px] font-black mb-1" style={{ color: ph.tc }}>{ev.date} {ev.src && <span className="font-normal opacity-70">{ev.src}</span>}</div>
                          <p className="text-[11px] leading-relaxed" style={{ color: '#3a4a5a' }}>
                            {iZh ? ev.zh : ev.en}
                          </p>
                        </div>
                      ))}

                      {/* Tax note */}
                      <div className="rounded-xl px-3 py-2.5 border" style={{ background: '#fffbf0', borderColor: '#e8d8a0' }}>
                        <div className="text-[10px] font-black mb-1" style={{ color: '#806020' }}>
                          {iZh ? '稅法意義（學術分析）' : 'Tax Law Note (Academic Analysis)'}
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: '#5a4820' }}>
                          {iZh ? ph.taxNote.zh : ph.taxNote.en}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Tab 1: Corporate Structure                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 1 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border px-4 py-3" style={{ background: P.card, borderColor: P.border }}>
              <h2 className="text-sm font-black mb-1" style={{ color: P.primary }}>
                {iZh ? '公司結構與收購路徑' : 'Corporate Structure & Acquisition Path'}
              </h2>
              <p className="text-[11px]" style={{ color: P.muted }}>
                {iZh
                  ? '「開曼 → 新加坡 → 中國」三層結構，退出價值在開曼層面實現，中國法人實體仍存續但不再承擔核心功能。'
                  : '"Cayman → Singapore → China" three-tier structure. Exit value realized at Cayman level; Chinese legal entity remains but bears no core function.'}
              </p>
            </div>

            {/* Acquisition arrow */}
            <div className="flex flex-col items-center gap-0">
              {/* Meta acquirer */}
              <div className="w-full rounded-2xl border px-4 py-3" style={{ background: '#d0e8d0', borderColor: '#70b870' }}>
                <div className="flex items-center gap-2">
                  <Flag size={14} style={{ color: '#306030' }} />
                  <div>
                    <div className="text-xs font-black" style={{ color: '#306030' }}>Meta Platforms Inc.</div>
                    <div className="text-[10px]" style={{ color: '#508050' }}>Delaware, USA · {iZh ? '收購方' : 'Acquirer'} · Dec 2025 · &gt;USD 2B</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center py-2 gap-0.5">
                <div className="text-[9px] font-black" style={{ color: P.accent }}>
                  {iZh ? '收購（股份／資產結構未公開）' : 'Acquisition (structure undisclosed)'}
                </div>
                <ArrowDown size={18} style={{ color: P.accent }} />
              </div>

              {/* Cayman */}
              <div className="w-full rounded-2xl border px-4 py-3" style={{ background: '#e8d0f0', borderColor: '#a870c8' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={14} style={{ color: '#604070' }} />
                  <div className="text-xs font-black" style={{ color: '#604070' }}>Butterfly Effect</div>
                  <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: '#a870c833', color: '#604070' }}>
                    {iZh ? '開曼群島控股' : 'Cayman · Holding'}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: '#503060' }}>
                  {iZh
                    ? '最終控股主體。資本利得於此層面實現。開曼無資本利得稅、無所得稅，為「稅收實現地」。早期投資人（騰訊、真格、HongShan）及 Benchmark 均持有此層股份。'
                    : 'Ultimate holding entity. Capital gains realized at this level. Cayman: no capital gains tax, no income tax — the "realization jurisdiction." Tencent, ZhenFund, HongShan, Benchmark hold equity here.'}
                </p>
              </div>

              <div className="flex flex-col items-center py-1.5">
                <ArrowDown size={14} style={{ color: P.muted }} />
              </div>

              {/* Singapore */}
              <div className="w-full rounded-2xl border px-4 py-3" style={{ background: '#d0e0f8', borderColor: '#6890d8' }}>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} style={{ color: '#304878' }} />
                  <div className="text-xs font-black" style={{ color: '#304878' }}>Manus AI Pte. Ltd.</div>
                  <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: '#6890d833', color: '#304878' }}>
                    {iZh ? '新加坡 · 核心營運' : 'Singapore · Core Ops'}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: '#203858' }}>
                  {iZh
                    ? '2025 年 7 月後的主要研發與管理主體。約 40 名核心技術人員集中於此。併購的實際標的（操作層面）。新加坡稅收居住地。'
                    : 'Post-July 2025 primary R&D and management entity. ~40 key technical staff concentrated here. Actual transaction target (operational level). Singapore tax resident.'}
                </p>
              </div>

              <div className="flex flex-col items-center py-1.5">
                <ArrowDown size={14} style={{ color: P.muted }} />
              </div>

              {/* China entity */}
              <div className="w-full rounded-2xl border px-4 py-3" style={{ background: '#f0d8d0', borderColor: '#d87860' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={14} style={{ color: '#803020' }} />
                  <div className="text-xs font-black" style={{ color: '#803020' }}>北京蝴蝶效應科技有限公司</div>
                  <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: '#d8786033', color: '#803020' }}>
                    {iZh ? '中國 · 仍存續' : 'China · Still Extant'}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: '#602010' }}>
                  {iZh
                    ? '法律主體仍存續（新華通訊社確認）。但已不承擔核心研發、營運或退出功能。中國境內服務已終止，社群帳號已清空。Meta 聲明確認不再有中國所有權利益。'
                    : 'Legal entity remains extant (Xinhua confirmed). But no longer bears core R&D, operations, or exit functions. China services terminated; social accounts wiped. Meta confirmed no continuing Chinese ownership interests.'}
                </p>
              </div>
            </div>

            {/* Structural significance */}
            <div className="rounded-2xl border px-4 py-3" style={{ background: '#fffbf0', borderColor: '#e8d8a0' }}>
              <div className="text-xs font-black mb-2" style={{ color: '#806020' }}>
                {iZh ? '結構的制度意義' : 'Institutional Significance of the Structure'}
              </div>
              <div className="flex flex-col gap-2">
                {[
                  {
                    zh: '稅收脫鉤：價值創造地（中國）與資本利得實現地（開曼）之間的制度性分離，是本案國際稅法分析的核心問題。',
                    en: 'Tax decoupling: The institutional separation between value creation (China) and capital gain realization (Cayman) is the core international tax law problem.',
                  },
                  {
                    zh: '安全穿透：中國安全審查框架以「實質聯繫」為由可穿透法律形式，追及已境外化的控股架構——這是安全審查法與公司法之間的根本張力。',
                    en: 'Security piercing: China\'s security review framework uses "substantive connection" to pierce legal form and reach offshore holding structures — a fundamental tension between security review law and corporate law.',
                  },
                  {
                    zh: '技術鎖定：無論法律形式如何，技術資產（模型、算法、訓練數據）的實際轉移路徑受技術管制法約束，不隨公司結構自動遷移。',
                    en: 'Technology lock-in: Regardless of legal form, the actual transfer path of technology assets (models, algorithms, training data) is governed by technology control law — it does not automatically follow corporate restructuring.',
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl px-3 py-2" style={{ background: '#f8f0d8' }}>
                    <p className="text-[10px] leading-relaxed" style={{ color: '#5a4820' }}>
                      {iZh ? item.zh : item.en}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Tab 2: Legal Analysis                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 2 && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border px-4 py-3" style={{ background: P.card, borderColor: P.border }}>
              <p className="text-[11px] leading-relaxed" style={{ color: P.muted }}>
                {iZh
                  ? '以下四個法律維度的分析均以 Manus 案事實為基礎，連結研究方案中的五個子研究問題。'
                  : 'The following four legal dimensions are grounded in Manus case facts and linked to the five research sub-questions in the research proposal.'}
              </p>
            </div>

            {LEGAL.map((dim) => {
              const open = openLegal.has(dim.id);
              return (
                <div key={dim.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: dim.color, background: P.card }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => tog(setOpenLegal, dim.id)}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: dim.color }}>
                      <dim.Icon size={16} style={{ color: dim.tc }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black" style={{ color: dim.tc }}>
                        {iZh ? dim.zh.title : dim.en.title}
                      </div>
                      <div className="text-[10px]" style={{ color: P.muted }}>
                        {iZh ? dim.zh.sub : dim.en.sub}
                      </div>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{ color: P.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
                    />
                  </button>

                  {open && (
                    <div className="px-4 pb-4 flex flex-col gap-2.5">
                      {dim.items.map((item, j) => {
                        const itemKey = `${dim.id}-${j}`;
                        const itemOpen = openLegalItem[itemKey];
                        return (
                          <div key={j} className="rounded-xl border overflow-hidden" style={{ borderColor: dim.color + '88', background: dim.color + '22' }}>
                            <button
                              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
                              onClick={() => setOpenLegalItem((prev) => ({ ...prev, [itemKey]: !itemOpen }))}
                            >
                              <span className="text-[11px] font-black" style={{ color: dim.tc }}>
                                {iZh ? item.zh.h : item.en.h}
                              </span>
                              <ChevronDown
                                size={12}
                                style={{ color: dim.tc, transform: itemOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
                              />
                            </button>
                            {itemOpen && (
                              <p className="px-3 pb-3 text-[11px] leading-relaxed" style={{ color: '#3a4a5a' }}>
                                {iZh ? item.zh.b : item.en.b}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Tab 3: Research Framework                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 3 && (
          <div className="flex flex-col gap-4">
            {/* Overview */}
            <div className="rounded-2xl border px-4 py-3" style={{ background: P.card, borderColor: P.border }}>
              <h2 className="text-sm font-black mb-2" style={{ color: P.primary }}>
                {iZh ? '研究方案概覽' : 'Research Proposal Overview'}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { zh: '方法論', en: 'Methodology', val: iZh ? '法釋義學 × 比較法' : 'Doctrinal × Comparative Law' },
                  { zh: '比較對象', en: 'Jurisdictions', val: 'CN · US · EU · CH' },
                  { zh: '核心案例', en: 'Leading Case', val: 'Manus–Meta (2025)' },
                  { zh: '章節', en: 'Chapters', val: iZh ? '六章' : '6 Chapters' },
                ].map((kv, i) => (
                  <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: P.faint }}>
                    <div className="text-[9px] font-black uppercase tracking-wider mb-0.5" style={{ color: P.muted }}>{iZh ? kv.zh : kv.en}</div>
                    <div className="text-xs font-black" style={{ color: P.primary }}>{kv.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Research questions */}
            <div className="flex flex-col gap-2.5">
              {RESEARCH_QS.map((rq, i) => {
                const open = openRQ.has(i);
                return (
                  <div key={rq.no} className="rounded-2xl border overflow-hidden" style={{ borderColor: rq.color, background: P.card }}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      onClick={() => tog(setOpenRQ, i)}
                    >
                      <div
                        className="shrink-0 w-9 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
                        style={{ background: rq.color, color: rq.tc }}
                      >
                        {rq.no}
                      </div>
                      <p className="flex-1 text-[11px] font-bold leading-snug" style={{ color: rq.tc }}>
                        {iZh ? rq.zh.q : rq.en.q}
                      </p>
                      <ChevronDown
                        size={13}
                        style={{ color: P.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
                      />
                    </button>
                    {open && (
                      <div className="px-4 pb-4">
                        <div className="rounded-xl px-3 py-2.5" style={{ background: rq.color + '33' }}>
                          <div className="text-[10px] font-black mb-1" style={{ color: rq.tc }}>
                            {iZh ? '問題意識分析' : 'Analytical Note'}
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: '#3a4a5a' }}>
                            {iZh ? rq.zh.analysis : rq.en.analysis}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chapter structure */}
            <div className="rounded-2xl border px-4 py-4" style={{ background: P.card, borderColor: P.border }}>
              <h2 className="text-xs font-black mb-3" style={{ color: P.primary }}>
                {iZh ? '暫定章節結構' : 'Provisional Chapter Structure'}
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { ch: 1, zh: 'AI 新創退出作為國際經濟法問題', en: 'AI startup exits as an IEL problem' },
                  { ch: 2, zh: '投資審查與國家對技術收購的重新管控', en: 'Investment screening and state reassertion over technology acquisitions' },
                  { ch: 3, zh: '技術轉讓管制、資料治理與貿易管制邏輯', en: 'Technology transfer controls, data governance, and trade-control logic' },
                  { ch: 4, zh: '課稅權、境外結構與退出階段實現問題', en: 'Taxing rights, offshore structuring, and the exit-stage realization problem' },
                  { ch: 5, zh: '碎片化、協調與跨境創新市場中的經濟安全', en: 'Fragmentation, coordination, and economic security in cross-border innovation markets' },
                  { ch: 6, zh: '規範評估與改革方案', en: 'Normative assessment and reform options' },
                ].map((c) => (
                  <div key={c.ch} className="flex items-start gap-3 rounded-xl px-3 py-2" style={{ background: P.faint }}>
                    <div
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black"
                      style={{ background: P.primary, color: 'white' }}
                    >
                      {c.ch}
                    </div>
                    <p className="text-[11px] leading-snug font-medium" style={{ color: P.primary }}>
                      {iZh ? c.zh : c.en}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Scholars ── */}
            <div className="rounded-2xl border px-4 py-3" style={{ background: '#f8f4ee', borderColor: '#d8c8a8' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] mb-1" style={{ color: '#906030' }}>
                {iZh ? '學術視角：UNIL 洛桑大學研究脈絡' : 'Scholarly Perspectives: UNIL Research Context'}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: '#604020' }}>
                {iZh
                  ? '以下兩位教授均任職於本研究申請機構（洛桑大學）。其研究視角與方法論直接構成本研究的學術對話對象，並提供最新的分析工具。'
                  : 'Both professors are based at the target institution (UNIL). Their research perspectives and methodologies directly constitute the scholarly interlocutors for this research and provide the latest analytical tools.'}
              </p>
            </div>

            {SCHOLARS.map((sc) => {
              const s = iZh ? sc.zh : sc.en;
              const isJoint = sc.id === 'joint';
              const openSc = openRQ.has(`sc-${sc.id}`);
              return (
                <div key={sc.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: sc.color, background: P.card }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => tog(setOpenRQ, `sc-${sc.id}`)}
                  >
                    <div
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black"
                      style={{ background: sc.color, color: sc.tc }}
                    >
                      {sc.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black" style={{ color: sc.tc }}>{s.name}</div>
                      <div className="text-[10px] leading-snug mt-0.5" style={{ color: P.muted }}>{s.position}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: sc.tc + 'aa' }}>{s.affil}</div>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{ color: P.muted, transform: openSc ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
                    />
                  </button>

                  {openSc && (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                      {/* Lens badge */}
                      <div className="rounded-xl px-3 py-2" style={{ background: sc.color + '55' }}>
                        <p className="text-[10px] font-black" style={{ color: sc.tc }}>{s.lens}</p>
                        {s.methodology && (
                          <p className="text-[10px] leading-relaxed mt-1" style={{ color: '#4a5a6a' }}>{s.methodology}</p>
                        )}
                      </div>

                      {/* Books (joint only) */}
                      {(iZh ? sc.zh.books : sc.en.books) && (iZh ? sc.zh.books : sc.en.books).map((bk, bi) => (
                        <div key={bi} className="rounded-xl border px-3 py-2.5" style={{ background: '#fffbf2', borderColor: '#e0c880' }}>
                          <div className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: '#806020' }}>{bk.label}</div>
                          <div className="text-[11px] font-black italic mb-0.5" style={{ color: '#604020' }}>{bk.title}</div>
                          {bk.sub && <div className="text-[10px] mb-0.5" style={{ color: '#806020' }}>{bk.sub}</div>}
                          <div className="text-[10px] font-bold mb-1" style={{ color: P.muted }}>{bk.pub}</div>
                          <p className="text-[10px] leading-relaxed" style={{ color: '#5a4a20' }}>{bk.desc}</p>
                        </div>
                      ))}

                      {/* Individual analysis points */}
                      {s.points && s.points.map((pt, pi) => (
                        <div key={pi} className="rounded-xl border px-3 py-2.5" style={{ background: sc.color + '33', borderColor: sc.color + '88' }}>
                          <div className="text-[11px] font-black mb-1.5" style={{ color: sc.tc }}>{pt.h}</div>
                          <p className="text-[11px] leading-relaxed" style={{ color: '#3a4a5a' }}>{pt.b}</p>
                        </div>
                      ))}

                      {/* Joint body */}
                      {isJoint && sc.zh.body && (
                        <div className="rounded-xl px-3 py-3" style={{ background: sc.color + '33' }}>
                          {(iZh ? sc.zh.body.zh : sc.zh.body.en).split('\n\n').map((para, pi) => (
                            <p key={pi} className="text-[11px] leading-relaxed mb-2 last:mb-0" style={{ color: '#3a4a5a' }}>
                              {para}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Tab 4: Fact-Check + Sources                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 4 && (
          <div className="flex flex-col gap-4">
            {/* Fact checks */}
            <div className="rounded-2xl border px-4 py-3" style={{ background: P.card, borderColor: P.border }}>
              <h2 className="text-sm font-black mb-1" style={{ color: P.primary }}>
                {iZh ? '主要事實主張查核' : 'Key Claim Verification'}
              </h2>
              <div className="flex gap-3 text-[10px] mt-2 mb-1">
                {[
                  { s: 'confirmed', icon: CheckCircle, color: '#307050', bg: '#d0f0e0', zh: '已確認', en: 'Confirmed' },
                  { s: 'partial', icon: AlertCircle, color: '#805020', bg: '#f0e0c0', zh: '部分確認', en: 'Partial' },
                  { s: 'unknown', icon: XCircle, color: '#705030', bg: '#f0e0d0', zh: '待查核', en: 'Unverified' },
                ].map((leg) => (
                  <div key={leg.s} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: leg.bg }}>
                    <leg.icon size={10} style={{ color: leg.color }} />
                    <span style={{ color: leg.color }}>{iZh ? leg.zh : leg.en}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {FACTS.map((f, i) => {
                const cfg = {
                  confirmed: { Icon: CheckCircle, color: '#307050', bg: '#d0f0e0', border: '#90d0b0' },
                  partial: { Icon: AlertCircle, color: '#805020', bg: '#f0e0c0', border: '#d0a060' },
                  unknown: { Icon: XCircle, color: '#705030', bg: '#f0e0d0', border: '#d0a080' },
                }[f.status];
                return (
                  <div key={i} className="rounded-2xl border px-4 py-3" style={{ background: P.card, borderColor: cfg.border }}>
                    <div className="flex items-start gap-2 mb-1">
                      <cfg.Icon size={14} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
                      <p className="text-[11px] font-black leading-snug" style={{ color: cfg.color }}>
                        {iZh ? f.zh.claim : f.en.claim}
                      </p>
                    </div>
                    <p className="text-[10px] leading-relaxed pl-5" style={{ color: P.muted }}>
                      {iZh ? f.zh.note : f.en.note}
                    </p>
                    {f.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 pl-5">
                        {f.sources.map((s, j) => (
                          <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-md font-bold" style={{ background: cfg.bg, color: cfg.color }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sources */}
            <div className="rounded-2xl border px-4 py-4" style={{ background: P.card, borderColor: P.border }}>
              <h2 className="text-xs font-black mb-3" style={{ color: P.primary }}>
                {iZh ? '來源總覽' : 'Source List'}
              </h2>

              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: P.muted }}>
                {iZh ? '英文媒體' : 'English-Language Sources'}
              </p>
              <div className="flex flex-col gap-1.5 mb-4">
                {SOURCES.en.map((s) => (
                  <div key={s.no} className="flex gap-2 items-start">
                    <span className="shrink-0 text-[9px] font-black w-8 text-right" style={{ color: P.muted }}>{s.no}</span>
                    <div>
                      <span className="text-[10px] font-black" style={{ color: P.primary }}>{s.pub}</span>
                      <span className="text-[10px]" style={{ color: P.muted }}> · {s.title} · {s.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: P.muted }}>
                {iZh ? '中文媒體' : 'Chinese-Language Sources'}
              </p>
              <div className="flex flex-col gap-1.5 mb-4">
                {SOURCES.zh.map((s) => (
                  <div key={s.no} className="flex gap-2 items-start">
                    <span className="shrink-0 text-[9px] font-black w-8 text-right" style={{ color: P.muted }}>{s.no}</span>
                    <div>
                      <span className="text-[10px] font-black" style={{ color: P.primary }}>{s.pub}</span>
                      <span className="text-[10px]" style={{ color: P.muted }}> · {s.title} · {s.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: '#804000' }}>
                {iZh ? '最新進展來源（2026 年）' : 'Latest Development Sources (2026)'}
              </p>
              <div className="flex flex-col gap-1.5">
                {SOURCES.latest.map((s) => (
                  <div key={s.no} className="flex gap-2 items-start">
                    <span className="shrink-0 text-[9px] font-black w-8 text-right" style={{ color: '#804000' }}>{s.no}</span>
                    <div>
                      <span className="text-[10px] font-black" style={{ color: '#804000' }}>{s.pub}</span>
                      <span className="text-[10px]" style={{ color: P.muted }}> · {s.title} · {s.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
