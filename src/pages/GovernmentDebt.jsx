import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark, Globe, BookOpen, AlertTriangle, Building2,
  ChevronDown, Scale, Network, ArrowDown, BarChart2,
  ExternalLink, Info, Layers, Clock,
  Hash, TrendingDown,
} from 'lucide-react';
import governmentDebtData from '../data/governmentDebt.json';
import Tabs, { useTabParams } from '../components/lab/Tabs';
import { useExpandedSet } from '../components/lab/Accordion';
import ChartFrame from '../components/lab/chart/ChartFrame';
import { Grid, AxisX, AxisY } from '../components/lab/chart/Axis';
import { Line, Dots } from '../components/lab/chart/marks';
import { linearScale } from '../components/lab/chart/scale';

const GD_VARS = { // token-exempt
  '--gd-ink': '#2d3748',
  '--gd-label': '#a0aec0',
  '--gd-body': '#4a5568',
  '--gd-accent': '#305878',
  '--gd-ink-soft': '#718096',
  '--gd-border': '#e2e8f0',
  '--gd-bg': '#f0f4f8',
  '--gd-track': '#edf2f7',
  '--gd-chart-bg': '#f8fafc',
  '--gd-nav-bg': '#2d4a6e',
  '--gd-nav-bg-end': '#3a5f8a',
  '--gd-note-text': '#4a6fa5',
  '--gd-panel-border': '#c8d8e8',
  '--gd-panel-bg': '#e8f0f8',
  '--gd-src-text': '#b0bec5',
  '--gd-lit-book-bg': '#dde8c8',
  '--gd-lit-book-ink': '#386838',
  '--gd-lit-article-bg': '#e8e0c8',
  '--gd-lit-article-ink': '#686030',
  '--gd-warm-rose-bg': '#d4a8a8',
  '--gd-warm-rose-ink': '#783030',
  '--gd-slate-blue-bg': '#b8c8d4',
  '--gd-warm-tan-bg': '#d4c8a8',
  '--gd-essential-bg': '#fff8f8',
  '--gd-legend-official-bg': '#f0d0d0',
  '--gd-violet-bg': '#b8a8d4',
  '--gd-violet-ink': '#50388a',
  '--gd-green-bg': '#b8d4b8',
  '--gd-blue-bg': '#a8b8d4',
  '--gd-clay-bg': '#d4b8a8',
  '--gd-purple-ink': '#683878',
  '--gd-purple-bg': '#e0d0e8',
  '--gd-explicit-debt-bg': '#b8c8e0',
  '--gd-land-bg': '#e8d0c8',
  '--gd-crack-ink': '#784030',
  '--gd-legal-ambiguous-bg': '#d8d0e8',
  '--gd-guarantee-bg': '#d0d8e8',
  '--gd-debt-swap-bg': '#e8d8d0',
  '--gd-timeline-dot': '#a8c4d8',
};

// ═══════════════════════════════════════════════════════════════════
// DATA — synced from the government-debt-research-data repository
// ═══════════════════════════════════════════════════════════════════

const {
  COUNTRY_DEBT,
  TREND_SERIES,
  DEBT_STRUCTURE,
  LGFV_FLOW,
  PROVINCE_DATA,
  CHINA_TIMELINE,
  FISCAL_RULES,
  CASE_STUDIES,
  LITERATURE_DB,
  RESEARCH_LAYERS: RAW_RESEARCH_LAYERS,
  GLOSSARY,
  DEEP_ANALYSIS,
} = governmentDebtData.datasets;

const RESEARCH_LAYER_ICONS = {
  Scale,
  Network,
  Building2,
  Landmark,
  AlertTriangle,
  Globe,
};

const RESEARCH_LAYERS = RAW_RESEARCH_LAYERS.map((layer) => ({
  ...layer,
  Icon: RESEARCH_LAYER_ICONS[layer.icon] ?? BookOpen,
}));

// ═══════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Country -> categorical color slot. TREND_SERIES used to carry its own raw
// hex per country; the chart primitives only take cat-1..cat-8 slots, so this
// mapping is a deliberate visual change (unifying onto the shared categorical
// palette) rather than a like-for-like port.
const TREND_SERIES_CAT = { '日本': 1, '義大利': 2, '美國': 3, '中國（官方）': 4, '德國': 5 };

function TrendChart() {
  const yTicks = [0, 50, 100, 150, 200, 250];
  const xTicks = [2010, 2014, 2018, 2020, 2022, 2024];
  const xScale = linearScale({ domain: [2010, 2024], range: [48, 560 - 8] });
  const yScale = linearScale({ domain: [0, 280], range: [210 - 32, 12] });

  // Y-offsets to avoid label collisions at right edge (2024 values)
  const labelOffsets = { '日本': -4, '義大利': 4, '美國': -4, '中國（官方）': 10, '德國': -10 };

  return (
    <ChartFrame width={560} height={210} margin={{ top: 12, right: 8, bottom: 32, left: 48 }}>
      <Grid scale={yScale} ticks={yTicks} orient="horizontal" />
      <AxisY scale={yScale} ticks={yTicks} format={(v) => `${v}%`} />
      <AxisX scale={xScale} ticks={xTicks} />
      {TREND_SERIES.map(s => (
        <Line key={s.name} points={s.pts} x={xScale} y={yScale} cat={TREND_SERIES_CAT[s.name]} width={2.2} />
      ))}
      {TREND_SERIES.map(s => (
        <Dots key={s.name} points={[s.pts[s.pts.length - 1]]} x={xScale} y={yScale} cat={TREND_SERIES_CAT[s.name]} r={3} />
      ))}
      {TREND_SERIES.map(s => {
        const [yr, v] = s.pts[s.pts.length - 1];
        return (
          <text key={s.name} x={xScale(yr) - 6} y={yScale(v) + (labelOffsets[s.name] || 0)} fontSize="8.5" fill={`var(--cat-${TREND_SERIES_CAT[s.name]}-tx)`} fontWeight="700" textAnchor="end">
            {s.name} {v}%
          </text>
        );
      })}
    </ChartFrame>
  );
}

function LitCard({ paper }) {
  const typeColors = {
    book: { bg: 'var(--gd-lit-book-bg)', text: 'var(--gd-lit-book-ink)', label: '書籍' },
    article: { bg: 'var(--gd-lit-article-bg)', text: 'var(--gd-lit-article-ink)', label: '期刊論文' },
    report: { bg: 'var(--gd-panel-border)', text: 'var(--gd-accent)', label: '報告' },
  };
  const tc = typeColors[paper.type] || typeColors.article;
  const impBorder = paper.importance === 'essential' ? 'var(--gd-warm-rose-bg)' : paper.importance === 'core' ? 'var(--gd-slate-blue-bg)' : paper.importance === 'high' ? 'var(--gd-warm-tan-bg)' : 'var(--gd-border)';
  const impBg = paper.importance === 'essential' ? 'var(--gd-essential-bg)' : 'white';

  return (
    <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: impBorder, background: impBg }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex gap-1.5 flex-wrap">
          {paper.importance === 'essential' && <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'var(--gd-warm-rose-bg)', color: 'var(--gd-warm-rose-ink)' }}>必讀</span>}
          {paper.importance === 'core' && <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'var(--gd-slate-blue-bg)', color: 'var(--gd-accent)' }}>奠基</span>}
          {paper.importance === 'high' && <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'var(--gd-warm-tan-bg)', color: 'var(--gd-lit-article-ink)' }}>重要</span>}
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: tc.bg, color: tc.text }}>{tc.label}</span>
        </div>
        <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--gd-label)' }}>{paper.year}</span>
      </div>
      <p className="text-[11px] font-black leading-snug mb-1" style={{ color: 'var(--gd-ink)' }}>{paper.title}</p>
      <p className="text-[10px] mb-1.5" style={{ color: 'var(--gd-ink-soft)' }}>
        {paper.authors}{paper.journal ? ` — ${paper.journal}` : ''}{paper.publisher ? ` — ${paper.publisher}` : ''}
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{paper.note}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_SUBTABS = { overview: 'rank', china: 'summary', research: 'framework', compare: 'rules' };

export default function GovernmentDebt() {
  // One hook for both dimensions: picking a main tab also resets the sub-tab, and
  // the two values have to reach the URL in a single write (see useTabParams).
  const [{ tab: mainTab, sub: subTab }, setTabs] = useTabParams({ tab: 'overview', sub: 'rank' });
  const setSubTab = (sub) => setTabs({ sub });
  const handleMainTab = (tab) => setTabs({ tab, sub: DEFAULT_SUBTABS[tab] });
  const layerAcc = useExpandedSet(RESEARCH_LAYERS.map(l => l.id));
  const timelineAcc = useExpandedSet(CHINA_TIMELINE.map((_, i) => i));
  const glossaryAcc = useExpandedSet(GLOSSARY.map((_, i) => i));
  const caseAcc = useExpandedSet(CASE_STUDIES.map((_, i) => i));
  const [litFilters, setLitFilters] = useState({ type: 'all', topic: 'all' });

  useEffect(() => { document.title = '政府債務研究 — Canvas Lab'; }, []);

  const maxDebt = Math.max(...COUNTRY_DEBT.map(d => d.debt));

  const filteredLit = useMemo(() => LITERATURE_DB.filter(p => {
    if (litFilters.type !== 'all' && p.type !== litFilters.type) return false;
    if (litFilters.topic !== 'all' && !p.topics.includes(litFilters.topic)) return false;
    return true;
  }), [litFilters]);

  const MAIN_TABS = [
    { id: 'overview',  label: (<span className="inline-flex items-center gap-1.5"><BarChart2 size={13} />全球概覽</span>) },
    { id: 'china',     label: (<span className="inline-flex items-center gap-1.5"><Building2 size={13} />中國深度</span>) },
    { id: 'research',  label: (<span className="inline-flex items-center gap-1.5"><BookOpen size={13} />學術架構</span>) },
    { id: 'compare',   label: (<span className="inline-flex items-center gap-1.5"><Scale size={13} />制度比較</span>) },
  ];

  return (
    <div className="min-h-screen paper-texture font-sans" style={{ ...GD_VARS, background: 'var(--gd-bg)', paddingBottom: 60 }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, var(--gd-nav-bg) 0%, var(--gd-nav-bg-end) 100%)', paddingTop: 48, paddingBottom: 28 }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Landmark size={20} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.45)' }}>Government Debt Research</p>
              <h1 className="text-xl font-black text-white leading-tight">政府債務問題深度研究</h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            涵蓋全球主要國家現況、中國 LGFV 城投深度分析、35+ 篇文獻庫、概念辭典、制度比較與歷史案例。
          </p>
          <a href="https://www.yicai.com/news/103249639.html" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
            <ExternalLink size={11} /> 研究動機：第一財經報道
          </a>
        </div>
      </div>

      {/* ── Main tab nav: the dark strip belongs to this page's masthead, so the
          bar variant carries the page's own navy rather than the shared accent. */}
      <div style={{ background: 'var(--gd-nav-bg)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Tabs
            items={MAIN_TABS}
            value={mainTab}
            onChange={handleMainTab}
            variant="bar"
            style={{ background: 'var(--gd-nav-bg)', paddingLeft: 0, paddingRight: 0 }}
            label="主分頁"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5">

        {/* ════════════════════════════════════════
            TAB: 全球概覽
        ════════════════════════════════════════ */}
        {mainTab === 'overview' && (<>
          <Tabs className="mb-5" items={[
            { id: 'rank',   label: '排行比較' },
            { id: 'trend',  label: '歷史趨勢' },
            { id: 'struct', label: '中央 vs 地方' },
          ]} value={subTab} onChange={setSubTab} variant="pill" label="次分頁" />

          {subTab === 'rank' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 size={14} style={{ color: 'var(--gd-note-text)' }} />
                  <h2 className="text-sm font-black" style={{ color: 'var(--gd-ink)' }}>一般政府總債務 / GDP</h2>
                </div>
                <p className="text-[11px] mb-4" style={{ color: 'var(--gd-ink-soft)' }}>IMF《World Economic Outlook》2024 年估計值。中國另列含 LGFV 隱性債務的市場估算。</p>
                <div className="flex flex-col gap-2">
                  {[...COUNTRY_DEBT].sort((a, b) => b.debt - a.debt).map((item) => (
                    <div key={item.en} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold shrink-0 text-right" style={{ width: 108, color: item.highlight ? 'var(--gd-warm-rose-ink)' : 'var(--gd-body)', fontWeight: item.highlight ? 900 : 700 }}>
                        {item.country}
                      </span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'var(--gd-track)', height: 19 }}>
                        <div className="h-full flex items-center justify-end pr-2 rounded-full"
                          style={{ width: `${(item.debt / maxDebt) * 100}%`, background: item.color, minWidth: 32 }}>
                          <span className="text-[10px] font-black" style={{ color: item.textColor }}>{item.debt}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-3 flex-wrap">
                  {[['var(--gd-warm-rose-bg)', '中國（含LGFV）：市場估算，非 IMF 官方數字'],['var(--gd-legend-official-bg)','中國（官方）：IMF 一般政府口徑']].map(([c,t])=>(
                    <div key={t} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--gd-ink-soft)' }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: c }} />{t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><Info size={14} style={{ color: 'var(--gd-note-text)' }} /><h2 className="text-sm font-black" style={{ color: 'var(--gd-ink)' }}>關鍵觀察</h2></div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: '日本之謎', color: 'var(--gd-violet-bg)', tC: 'var(--gd-violet-ink)', text: '252% GDP 卻無違約風險：90%+ 由國內機構持有，日本央行大規模購債，通縮環境中實質利率接近零。此為「本國貨幣計價、本國人持有」的極端案例——但一旦通膨預期翻轉，此平衡可能劇烈震盪。' },
                    { label: '中國的兩個數字', color: 'var(--gd-warm-rose-bg)', tC: 'var(--gd-warm-rose-ink)', text: 'IMF 官方口徑約 89%，若含 LGFV 城投隱性債務，市場估算達 110–120%。這個「影子債務」的規模認定，是當前研究最核心的數字爭議——不同估算方法可差距逾 30 個百分點。' },
                    { label: '德國的刹車條款', color: 'var(--gd-green-bg)', tC: 'var(--gd-lit-book-ink)', text: '《基本法》第 115 條規定聯邦結構性赤字不得超過 GDP 0.35%（Schuldenbremse），是全球最嚴格的憲法層級財政規則。2023–2024 年圍繞該條款的政治爭議，為憲法財政規則的極限提供了最新的現實驗證。' },
                    { label: '美國：規則的缺席', color: 'var(--gd-blue-bg)', tC: 'var(--gd-accent)', text: '美國無聯邦層級財政規則，「債務上限」（debt ceiling）每次觸頂均通過立法提高，實質約束力弱。但各州幾乎均有憲法層級的平衡預算條款，地方財政紀律反而強於聯邦。' },
                  ].map((obs) => (
                    <div key={obs.label} className="rounded-xl p-3" style={{ background: obs.color + '22' }}>
                      <div className="text-[11px] font-black mb-1" style={{ color: obs.tC }}>{obs.label}</div>
                      <div className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{obs.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: 'var(--gd-panel-border)', background: 'var(--gd-panel-bg)' }}>
                <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} style={{ color: 'var(--gd-accent)' }} /><span className="text-xs font-black" style={{ color: 'var(--gd-accent)' }}>財政永續性核心公式</span></div>
                <div className="rounded-lg px-4 py-2.5 font-mono text-sm font-bold text-center mb-2" style={{ background: 'white', color: 'var(--gd-accent)' }}>
                  Δ(Debt/GDP) = Primary Deficit + (r − g) × Debt/GDP
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-note-text)' }}>
                  <strong>r</strong> = 實質利率，<strong>g</strong> = 實質 GDP 成長率。r &lt; g 時政府可持續舉債（Blanchard 2019）。
                  中國地方政府的困境：城投借貸利率長期高於許多地方的實際 GDP 成長率，r &gt; g 使債務動態自我強化。
                </p>
              </div>
            </div>
          )}

          {subTab === 'trend' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: 'var(--gd-ink)' }}>一般政府總債務歷史趨勢（2010–2024）</h2>
                <p className="text-[11px] mb-3" style={{ color: 'var(--gd-ink-soft)' }}>IMF WEO 數據，% of GDP。三個重要節點：2008 金融危機後擴張、2015 歐洲財政緊縮、2020 COVID 衝擊。</p>
                <div className="rounded-xl overflow-hidden p-2" style={{ background: 'var(--gd-chart-bg)' }}>
                  <TrendChart />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TREND_SERIES.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--gd-body)' }}>
                      <div className="w-4 h-1.5 rounded-full" style={{ background: s.color }} />{s.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-3" style={{ color: 'var(--gd-ink)' }}>三個轉折點</h2>
                {[
                  { yr: '2008–2010', label: '全球金融危機', color: 'var(--gd-clay-bg)', text: '各國大規模財政刺激。美國債務/GDP 從 68%（2008）飆升至 95%（2010）；中國「四兆計畫」雖未直接以中央借債體現，但催生了 LGFV 爆炸性擴張。' },
                  { yr: '2010–2015', label: '歐洲緊縮vs新興市場擴張', color: 'var(--gd-violet-bg)', text: '歐元區在 IMF/ECB/EC「三駕馬車」壓力下推行財政緊縮。同期中國、新興市場繼續擴張，成為全球成長主引擎，但債務基礎同步累積。' },
                  { yr: '2020', label: 'COVID 衝擊', color: 'var(--gd-blue-bg)', text: '全球各國最大規模同步財政擴張。日本 2020 年達到 259% 的峰值；美國跳升至 129%；中國官方口徑從 52% 升至 68%，實際含隱性債務的擴張更為顯著。' },
                ].map(t => (
                  <div key={t.yr} className="flex gap-3 mb-3 last:mb-0">
                    <div className="shrink-0 rounded-lg px-2 py-1 h-fit text-[9px] font-black" style={{ background: t.color + '44', color: 'var(--gd-body)' }}>{t.yr}</div>
                    <div>
                      <div className="text-xs font-black mb-0.5" style={{ color: 'var(--gd-ink)' }}>{t.label}</div>
                      <div className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{t.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'struct' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: 'var(--gd-ink)' }}>中央 vs 地方債務結構</h2>
                <p className="text-[11px] mb-4" style={{ color: 'var(--gd-ink-soft)' }}>各國「地方政府債務」定義與重要性差異極大。聯邦制國家地方借貸能力通常更強。</p>
                {DEBT_STRUCTURE.map((item) => (
                  <div key={item.country} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black" style={{ color: 'var(--gd-ink)' }}>{item.country}</span>
                      <span className="text-[10px]" style={{ color: 'var(--gd-label)' }}>% of GDP</span>
                    </div>
                    <div className="flex gap-1 items-center mb-1">
                      <div className="text-[9px] font-bold w-14 text-right shrink-0" style={{ color: 'var(--gd-accent)' }}>中央</div>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'var(--gd-track)', height: 14 }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(item.central / 3, 100)}%`, background: 'var(--gd-blue-bg)' }} />
                      </div>
                      <div className="text-[10px] font-black w-8 shrink-0" style={{ color: 'var(--gd-accent)' }}>{item.central}%</div>
                    </div>
                    <div className="flex gap-1 items-center mb-1">
                      <div className="text-[9px] font-bold w-14 text-right shrink-0" style={{ color: 'var(--gd-warm-rose-ink)' }}>地方</div>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'var(--gd-track)', height: 14 }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(item.local / 3, 100)}%`, background: 'var(--gd-warm-rose-bg)' }} />
                      </div>
                      <div className="text-[10px] font-black w-8 shrink-0" style={{ color: 'var(--gd-warm-rose-ink)' }}>{item.local}%</div>
                    </div>
                    {item.lgfv && (
                      <div className="flex gap-1 items-center mb-1">
                        <div className="text-[9px] font-bold w-14 text-right shrink-0" style={{ color: 'var(--gd-purple-ink)' }}>LGFV（估）</div>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'var(--gd-track)', height: 14 }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(item.lgfv / 3, 100)}%`, background: 'var(--gd-purple-bg)' }} />
                        </div>
                        <div className="text-[10px] font-black w-8 shrink-0" style={{ color: 'var(--gd-purple-ink)' }}>{item.lgfv}%</div>
                      </div>
                    )}
                    <p className="text-[10px] mt-1 pl-16" style={{ color: 'var(--gd-ink-soft)' }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {/* ════════════════════════════════════════
            TAB: 中國深度
        ════════════════════════════════════════ */}
        {mainTab === 'china' && (<>
          <Tabs className="mb-5" items={[
            { id: 'summary',  label: '總體分析' },
            { id: 'lgfv',     label: 'LGFV 機制' },
            { id: 'province', label: '省級分佈' },
            { id: 'timeline', label: '政策時間軸' },
          ]} value={subTab} onChange={setSubTab} variant="pill" label="次分頁" />

          {subTab === 'summary' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: 'var(--gd-ink)' }}>中國政府債務構成（2024 年估計）</h2>
                <p className="text-[11px] mb-4" style={{ color: 'var(--gd-ink-soft)' }}>官方口徑與市場估算之間存在巨大落差，「隱性債務」的認定是政策與學術爭議的核心。</p>
                {[
                  { label: '中央政府債務', amount: '約 30 兆元', pct: 23, color: 'var(--gd-blue-bg)', note: '國債及中央政府特別國債，計入 IMF 官方數字，透明度較高。' },
                  { label: '地方政府顯性債務', amount: '約 42 兆元', pct: 33, color: 'var(--gd-explicit-debt-bg)', note: '含一般債券（彌補收支缺口）＋專項債券（基建），2015 年後合法發行，納入官方統計。' },
                  { label: '城投 LGFV 隱性債務（市場估算）', amount: '約 55–70 兆元', pct: 45, color: 'var(--gd-warm-rose-bg)', highlight: true, note: '不計入官方，但政府實質負有兜底責任。不同研究機構估算差距逾 15 兆元，為最大不確定因素。' },
                ].map(item => (
                  <div key={item.label} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold" style={{ color: item.highlight ? 'var(--gd-warm-rose-ink)' : 'var(--gd-body)' }}>{item.label}</span>
                      <span className="text-[11px] font-black" style={{ color: item.highlight ? 'var(--gd-warm-rose-ink)' : 'var(--gd-accent)' }}>{item.amount}</span>
                    </div>
                    <div className="rounded-full overflow-hidden mb-1" style={{ background: 'var(--gd-track)', height: 13 }}>
                      <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--gd-label)' }}>{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '地方顯性債務', value: '~42 兆元', sub: '2024 年末，含一般債＋專項債', color: 'var(--gd-blue-bg)' },
                  { label: 'LGFV 隱性（估）', value: '~65 兆元', sub: '城投債＋城投銀行貸款合計', color: 'var(--gd-warm-rose-bg)' },
                  { label: '土地出讓跌幅', value: '↓ 40%+', sub: '2021 → 2023 年累計跌幅', color: 'var(--gd-land-bg)' },
                  { label: '2024 化債規模', value: '10 兆元', sub: '全國人大批准再融資置換', color: 'var(--gd-green-bg)' },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--gd-ink-soft)' }}>{kpi.label}</div>
                    <div className="text-lg font-black" style={{ color: 'var(--gd-ink)' }}>{kpi.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--gd-label)' }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: 'var(--gd-legend-official-bg)', background: 'var(--gd-essential-bg)' }}>
                <div className="text-xs font-black mb-2" style={{ color: 'var(--gd-warm-rose-ink)' }}>2021 年後的結構性裂縫</div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-crack-ink)' }}>
                  房地產市場下行導致土地出讓收入崩跌（2021–2023 年下降逾 40%），LGFV 債務循環的最終還款來源大幅縮水。
                  城投再融資壓力上升，部分三四線城市城投出現技術性延遲兌付。2024 年底 10 兆元化債方案暫緩流動性壓力，
                  但地方財政收支的結構性缺口（支出責任 &gt;&gt; 稅收來源）仍未解決——根本矛盾指向 1994 年分稅制的重新設計。
                </p>
              </div>
            </div>
          )}

          {subTab === 'lgfv' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: 'var(--gd-ink)' }}>LGFV 城投運作機制</h2>
                <p className="text-[11px] mb-4" style={{ color: 'var(--gd-ink-soft)' }}>地方政府繞過預算限制的融資結構——「表外財政」的核心迴路。</p>
                <div className="flex flex-col items-stretch gap-0">
                  {LGFV_FLOW.map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div className="rounded-xl px-4 py-3 border" style={{ background: step.color + '55', borderColor: step.color }}>
                        <div className="text-xs font-black" style={{ color: step.textColor }}>{step.label}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: step.textColor + 'aa' }}>{step.sub}</div>
                      </div>
                      {i < LGFV_FLOW.length - 1 && (
                        <div className="flex justify-center py-1"><ArrowDown size={14} style={{ color: 'var(--gd-label)' }} /></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-3" style={{ color: 'var(--gd-ink)' }}>城投債的特殊性質</h2>
                {[
                  { title: '法律地位模糊', color: 'var(--gd-legal-ambiguous-bg)', text: '城投公司法律上是獨立法人企業，發行的是「企業債」而非「政府債」。但地方政府透過股權、資產注入、隱性信用背書實際控制城投，形成「企業之名、政府之實」的灰色地帶。' },
                  { title: '隱性擔保機制', color: 'var(--gd-guarantee-bg)', text: '市場默認地方政府不會讓城投違約（至少對重要城投）。此預期使城投能以低於正常企業的利率借款，但也使隱性負擔無法透過市場定價顯現，形成系統性低估。' },
                  { title: '化債的困境', color: 'var(--gd-debt-swap-bg)', text: '政府介入置換（化債）短期緩解流動性，但強化市場對政府兜底的信念，反而可能鼓勵更多城投過度舉債——這是系統性道德風險的自我強化螺旋。' },
                ].map(item => (
                  <div key={item.title} className="rounded-xl p-3 mb-2 last:mb-0" style={{ background: item.color + '44' }}>
                    <div className="text-[11px] font-black mb-1" style={{ color: 'var(--gd-ink)' }}>{item.title}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'province' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: 'var(--gd-ink)' }}>省級城投債務風險概況</h2>
                <p className="text-[11px] mb-4" style={{ color: 'var(--gd-ink-soft)' }}>
                  以「城投有息負債 / 地方 GDP」為主要指標，數字為市場機構估算值，各家研究差異約 ±10 個百分點。
                </p>
                {[3, 2, 1].map(tier => {
                  const tierConfig = { 3: { label: '高風險', color: 'var(--gd-warm-rose-bg)', textColor: 'var(--gd-warm-rose-ink)' }, 2: { label: '中等風險', color: 'var(--gd-warm-tan-bg)', textColor: 'var(--gd-lit-article-ink)' }, 1: { label: '相對穩健', color: 'var(--gd-green-bg)', textColor: 'var(--gd-lit-book-ink)' } };
                  const tc = tierConfig[tier];
                  const provinces = PROVINCE_DATA.filter(p => p.tier === tier);
                  return (
                    <div key={tier} className="mb-4 last:mb-0">
                      <div className="text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: tc.textColor }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: tc.color }} />{tc.label}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {provinces.map(p => (
                          <div key={p.province} className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: tc.color + '88', background: tc.color + '18' }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black" style={{ color: 'var(--gd-ink)' }}>{p.province}</span>
                              <span className="text-xs font-black" style={{ color: tc.textColor }}>{p.ratio}</span>
                            </div>
                            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{p.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] mt-2" style={{ color: 'var(--gd-label)' }}>
                  數據來源：Wind 資訊、各省審計報告、IMF 估算綜合。因隱性債務定義差異，各機構數字出入較大，以上為研究引用範圍中點。
                </p>
              </div>
            </div>
          )}

          {subTab === 'timeline' && (
            <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
              <h2 className="text-sm font-black mb-4" style={{ color: 'var(--gd-ink)' }}>中國地方政府債務政策演進</h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: 'var(--gd-panel-border)' }} />
                {CHINA_TIMELINE.map((item, i) => (
                  <div key={item.year} className="relative mb-3 last:mb-0">
                    <div className="absolute left-[-20px] top-1 w-4 h-4 rounded-full border-2 border-white cursor-pointer"
                      style={{ background: timelineAcc.isOpen(i) ? 'var(--gd-accent)' : 'var(--gd-timeline-dot)' }}
                      onClick={() => timelineAcc.toggle(i)} />
                    <button className="w-full text-left" onClick={() => timelineAcc.toggle(i)}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black" style={{ color: 'var(--gd-accent)', minWidth: 32 }}>{item.year}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--gd-ink)' }}>{item.event}</span>
                        <ChevronDown size={12} style={{ color: 'var(--gd-label)', transform: timelineAcc.isOpen(i) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto', flexShrink: 0 }} />
                      </div>
                      {timelineAcc.isOpen(i) && (
                        <p className="text-[11px] leading-relaxed mt-1.5 pl-9 pr-2" style={{ color: 'var(--gd-body)' }}>{item.detail}</p>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {/* ════════════════════════════════════════
            TAB: 學術架構
        ════════════════════════════════════════ */}
        {mainTab === 'research' && (<>
          <Tabs className="mb-5" items={[
            { id: 'framework',   label: '研究框架' },
            { id: 'deepanalysis',label: '深度分析' },
            { id: 'litdb',       label: `文獻庫（${LITERATURE_DB.length}篇）` },
            { id: 'glossary',    label: '概念辭典' },
          ]} value={subTab} onChange={setSubTab} variant="pill" label="次分頁" />

          {subTab === 'framework' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: 'var(--gd-panel-border)', background: 'var(--gd-panel-bg)' }}>
                <div className="flex items-center gap-2 mb-2"><Layers size={14} style={{ color: 'var(--gd-accent)' }} /><span className="text-xs font-black" style={{ color: 'var(--gd-accent)' }}>由大到小的閱讀架構</span></div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-note-text)' }}>
                  先掌握公共財政理論與財政聯邦主義的理論語言，再進入中國地方債與 LGFV 的具體文獻。
                  不從制度細節出發——先問「為什麼政府會舉債」，再問「中國地方政府為什麼特別舉債」。
                </p>
              </div>

              {RESEARCH_LAYERS.map(layer => {
                const isOpen = layerAcc.isOpen(layer.id);
                const layerPapers = LITERATURE_DB.filter(p => p.topics.includes(layer.id));
                return (
                  <div key={layer.id} className="rounded-2xl border border-white/60 bg-white/80 shadow-sm overflow-hidden">
                    <button className="w-full text-left px-5 py-4 flex items-center gap-3" onClick={() => layerAcc.toggle(layer.id)}>
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: layer.color }}>
                        <layer.Icon size={16} style={{ color: layer.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black" style={{ color: layer.textColor + '88' }}>Layer {layer.no}</span>
                          <span className="text-sm font-black" style={{ color: 'var(--gd-ink)' }}>{layer.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: layer.color + '66', color: layer.textColor }}>{layerPapers.length} 篇</span>
                        </div>
                        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--gd-ink-soft)' }}>{layer.en}</p>
                      </div>
                      <ChevronDown size={15} style={{ color: 'var(--gd-label)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </button>
                    {isOpen && (
                      <div className="border-t px-5 py-4 flex flex-col gap-4" style={{ borderColor: 'var(--gd-bg)' }}>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--gd-body)' }}>{layer.summary}</p>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--gd-label)' }}>核心概念</p>
                          <div className="flex flex-col gap-1.5">
                            {layer.concepts.map(c => (
                              <div key={c.term} className="rounded-lg px-3 py-2" style={{ background: layer.color + '33' }}>
                                <span className="text-[11px] font-black" style={{ color: layer.textColor }}>{c.term}　</span>
                                <span className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{c.def}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--gd-label)' }}>本層文獻</p>
                          <div className="flex flex-col gap-2.5">
                            {layerPapers.map(p => <LitCard key={p.id} paper={p} />)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {subTab === 'litdb' && (
            <div className="flex flex-col gap-4">
              {/* Filters */}
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--gd-label)' }}>類型</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[['all','全部'],['book','書籍'],['article','期刊論文'],['report','報告']].map(([v,l]) => (
                      <button key={v} onClick={() => setLitFilters(f => ({ ...f, type: v }))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                        style={{ background: litFilters.type === v ? 'var(--gd-nav-bg)' : 'var(--gd-bg)', color: litFilters.type === v ? 'white' : 'var(--gd-ink-soft)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--gd-label)' }}>研究層次</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[['all','全部'],['public-finance','公共財政'],['fiscal-fed','財政聯邦主義'],['china-lgd','中國地方債'],['lgfv','LGFV'],['risk','金融風險'],['political-econ','政治經濟'],['intl-orgs','國際組織']].map(([v,l]) => (
                      <button key={v} onClick={() => setLitFilters(f => ({ ...f, topic: v }))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                        style={{ background: litFilters.topic === v ? 'var(--gd-nav-bg)' : 'var(--gd-bg)', color: litFilters.topic === v ? 'white' : 'var(--gd-ink-soft)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] mt-2" style={{ color: 'var(--gd-label)' }}>顯示 {filteredLit.length} / {LITERATURE_DB.length} 篇</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {filteredLit.length === 0
                  ? <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-8 text-center text-sm" style={{ color: 'var(--gd-label)' }}>此篩選條件下無文獻</div>
                  : filteredLit.sort((a, b) => b.year - a.year).map(p => <LitCard key={p.id} paper={p} />)
                }
              </div>
            </div>
          )}

          {subTab === 'glossary' && (
            <div className="flex flex-col gap-2">
              <div className="rounded-2xl border px-5 py-3 shadow-sm mb-1" style={{ borderColor: 'var(--gd-panel-border)', background: 'var(--gd-panel-bg)' }}>
                <p className="text-[11px]" style={{ color: 'var(--gd-note-text)' }}>
                  {GLOSSARY.length} 個核心概念，涵蓋公共財政、財政聯邦主義、中國制度、風險分析。點擊展開完整定義。
                </p>
              </div>
              {GLOSSARY.map((g, i) => (
                <div key={g.term} className="rounded-xl border border-white/60 bg-white/80 overflow-hidden">
                  <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => glossaryAcc.toggle(i)}>
                    <Hash size={12} style={{ color: 'var(--gd-label)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-black" style={{ color: 'var(--gd-ink)' }}>{g.term}</span>
                      <span className="text-[10px] ml-2" style={{ color: 'var(--gd-label)' }}>{g.en}</span>
                    </div>
                    {g.src && <span className="text-[9px] font-bold shrink-0" style={{ color: 'var(--gd-src-text)' }}>{g.src}</span>}
                    <ChevronDown size={13} style={{ color: 'var(--gd-label)', transform: glossaryAcc.isOpen(i) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  {glossaryAcc.isOpen(i) && (
                    <div className="border-t px-4 py-3" style={{ borderColor: 'var(--gd-bg)' }}>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{g.def}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>)}

          {subTab === 'deepanalysis' && (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: 'var(--gd-panel-border)', background: 'var(--gd-panel-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} style={{ color: 'var(--gd-accent)' }} />
                  <span className="text-xs font-black" style={{ color: 'var(--gd-accent)' }}>分析方法</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-note-text)' }}>
                  以下依據六個研究層次，對中國政府債務問題展開實質性分析——不只是列舉文獻，而是從各理論框架的視角提出具體論點、揭示制度矛盾、指出研究爭議的核心。
                </p>
              </div>

              {DEEP_ANALYSIS.map((layer, li) => {
                const matchedLayer = RESEARCH_LAYERS.find(l => l.id === layer.id);
                return (
                  <div key={layer.id} className="rounded-2xl border border-white/60 bg-white/80 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center gap-3" style={{ background: layer.color + '33' }}>
                      {matchedLayer && <matchedLayer.Icon size={16} style={{ color: layer.textColor }} strokeWidth={2.2} />}
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: layer.textColor + '88' }}>
                          Layer {String(li + 1).padStart(2, '0')}
                        </div>
                        <div className="text-sm font-black" style={{ color: 'var(--gd-ink)' }}>{layer.title}</div>
                      </div>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-5">
                      {layer.sections.map((sec, si) => (
                        <div key={si}>
                          <div className="flex items-start gap-2 mb-2">
                            <div className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[9px] font-black" style={{ background: layer.color, color: layer.textColor }}>
                              {si + 1}
                            </div>
                            <h3 className="text-xs font-black leading-snug" style={{ color: 'var(--gd-ink)' }}>{sec.heading}</h3>
                          </div>
                          <p className="text-[11px] leading-[1.75] pl-7" style={{ color: 'var(--gd-body)' }}>{sec.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* ════════════════════════════════════════
            TAB: 制度比較
        ════════════════════════════════════════ */}
        {mainTab === 'compare' && (<>
          <Tabs className="mb-5" items={[
            { id: 'rules', label: '財政規則比較' },
            { id: 'cases', label: '歷史案例' },
          ]} value={subTab} onChange={setSubTab} variant="pill" label="次分頁" />

          {subTab === 'rules' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: 'var(--gd-ink)' }}>各國財政規則比較</h2>
                <p className="text-[11px] mb-4" style={{ color: 'var(--gd-ink-soft)' }}>財政規則的設計原則、法律基礎與實際執行成效差異巨大。強制力來源是分析的核心問題。</p>
                <div className="flex flex-col gap-3">
                  {FISCAL_RULES.map(rule => (
                    <div key={rule.country} className="rounded-xl border p-4" style={{ borderColor: rule.color + '88', background: rule.color + '18' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-black" style={{ color: 'var(--gd-ink)' }}>{rule.country}</span>
                          <span className="text-[10px] ml-2 font-bold" style={{ color: rule.textColor }}>{rule.rule}</span>
                        </div>
                        {rule.since && <span className="text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded" style={{ background: rule.color, color: rule.textColor }}>since {rule.since}</span>}
                      </div>
                      <div className="flex gap-1.5 mb-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--gd-border)', color: 'var(--gd-body)' }}>{rule.basis}</span>
                      </div>
                      <p className="text-[10px] font-bold mb-1" style={{ color: rule.textColor }}>限制：{rule.limit}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{rule.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: 'var(--gd-panel-border)', background: 'var(--gd-panel-bg)' }}>
                <div className="flex items-center gap-2 mb-2"><Info size={14} style={{ color: 'var(--gd-accent)' }} /><span className="text-xs font-black" style={{ color: 'var(--gd-accent)' }}>財政規則的設計邏輯</span></div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: '強制力基礎', text: '憲法層級（德國、瑞士）> 條約層級（歐盟）> 法律層級（中國）> 政策目標（日本）。強制力越高，規則越難靈活調整，但也越難被政治力量繞過。' },
                    { label: '景氣調整 vs 名目限制', text: '名目赤字上限（如歐盟 3%）在經濟衰退時反向緊縮，加劇景氣循環。景氣調整後的結構性餘額目標（德國、瑞士）在理論上更優，但計算複雜，政治可操縱空間更大。' },
                    { label: '豁免條款', text: '所有財政規則都需要「緊急豁免」條款（COVID 是最大壓力測試）。德國 2020 年豁免執行，2023 年恢復——違憲裁定的政治衝擊顯示，財政規則的政治合法性比其技術設計更重要。' },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg px-3 py-2" style={{ background: 'white' }}>
                      <span className="text-[11px] font-black" style={{ color: 'var(--gd-accent)' }}>{item.label}　</span>
                      <span className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {subTab === 'cases' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border px-5 py-3 shadow-sm mb-1" style={{ borderColor: 'var(--gd-panel-border)', background: 'var(--gd-panel-bg)' }}>
                <p className="text-[11px]" style={{ color: 'var(--gd-note-text)' }}>
                  四個案例橫跨主權違約、市政破產、可持續高債務。每個案例均標注「對中國研究的啟示」，協助建立跨國比較的分析框架。
                </p>
              </div>
              {CASE_STUDIES.map((cs, i) => (
                <div key={cs.title} className="rounded-2xl border border-white/60 bg-white/80 shadow-sm overflow-hidden">
                  <button className="w-full text-left px-5 py-4 flex items-center gap-3" onClick={() => caseAcc.toggle(i)}>
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cs.color }}>
                      <Clock size={16} style={{ color: cs.textColor }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black" style={{ color: 'var(--gd-ink)' }}>{cs.title}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cs.color + '66', color: cs.textColor }}>{cs.type}</span>
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--gd-ink-soft)' }}>{cs.year}　債務峰值：{cs.peak}</p>
                    </div>
                    <ChevronDown size={15} style={{ color: 'var(--gd-label)', transform: caseAcc.isOpen(i) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  {caseAcc.isOpen(i) && (
                    <div className="border-t px-5 py-4 flex flex-col gap-3" style={{ borderColor: 'var(--gd-bg)' }}>
                      {[
                        { label: '觸發因素', text: cs.trigger },
                        { label: '傳導機制', text: cs.mechanism },
                        { label: '核心教訓', text: cs.lesson },
                      ].map(sec => (
                        <div key={sec.label}>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--gd-label)' }}>{sec.label}</p>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{sec.text}</p>
                        </div>
                      ))}
                      <div className="rounded-xl p-3 mt-1" style={{ background: cs.color + '33' }}>
                        <p className="text-[10px] font-black mb-1" style={{ color: cs.textColor }}>對中國研究的啟示</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gd-body)' }}>{cs.china}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
