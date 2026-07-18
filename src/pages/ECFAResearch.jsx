import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarClock,
  Database,
  FileText,
  GitBranch,
  Layers3,
  ListChecks,
  ScrollText,
  Search,
  Sparkles,
} from 'lucide-react';
import data from '../data/ecfaResearch.json';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';

const ds = data.datasets;
const thesis = ds.thesisMeta;
const core = ds.ecfaCore;

const ECFA_VARS = { // token-exempt
  '--ecfa-bg': '#fbf8f9',
  '--ecfa-line': '#eadde2',
  '--ecfa-ink': '#44343d',
  '--ecfa-ink-strong': '#3f3339',
  '--ecfa-ink-soft': '#74636a',
  '--ecfa-ink-mid': '#5b4e55',
  '--ecfa-ink-muted': '#76666d',
  '--ecfa-accent': '#8f6071',
  '--ecfa-icon': '#9b6b7b',
  '--ecfa-eyebrow': '#a77b89',
  '--ecfa-title-ink': '#45343c',
  '--ecfa-figure-note': '#7d7076',
  '--ecfa-note': '#8a6472',
  '--ecfa-muted': '#9a8790',
  '--ecfa-body-text': '#6f6369',
  '--ecfa-heading': '#2f2a2d',
  '--ecfa-eyebrow-header': '#987483',
  '--ecfa-label-dark': '#493842',
  '--ecfa-tag-text': '#665862',
  '--ecfa-topic-fallback': '#7b7078',
  '--ecfa-placeholder': '#aa9aa1',
  '--ecfa-link-underline': '#d9b8c3',
  '--ecfa-risk-text': '#955c6d',
  '--ecfa-warning-text': '#8f5264',
  '--ecfa-next-text': '#4b3b43',
  '--ecfa-table-border': '#e6ded2',
  '--ecfa-table-head-bg': '#f7edf0',
  '--ecfa-table-head-ink': '#7f5b69',
  '--ecfa-row-border': '#f0e3e8',
  '--ecfa-toggle-bg': '#f5edf0',
  '--ecfa-toggle-text': '#765866',
  '--ecfa-tab-active-bg': '#f1e3e8',
  '--ecfa-tab-active-text': '#704c5a',
  '--ecfa-tab-inactive-text': '#806b74',
  '--ecfa-topicbar-count': '#987888',
  '--ecfa-topicbar-track': '#f0e2e7',
  '--ecfa-chart-line': '#a86f80',
  '--ecfa-chart-wash': '#d9a7b5',
  '--ecfa-chart-grid': '#efe4e8',
  '--ecfa-chart-tick': '#eadce2',
  '--ecfa-chart-dot': '#fffafa',
  '--ecfa-chart-count-text': '#735765',
  '--ecfa-chart-baseline': '#e2d2d9',
  '--ecfa-chart-event-line': '#c9a1ae',
  '--ecfa-chart-event-date': '#805f6b',
  '--ecfa-chart-event-label': '#9a7380',
  '--ecfa-badge-slate-bg': '#eef1f2',
  '--ecfa-badge-slate-ink': '#52616a',
  '--ecfa-badge-gold-bg': '#f2e3e7',
  '--ecfa-badge-gold-ink': '#945d70',
  '--ecfa-badge-green-bg': '#e8efe5',
  '--ecfa-badge-green-ink': '#566d50',
  '--ecfa-badge-red-bg': '#f5dfe3',
  '--ecfa-badge-red-ink': '#984f62',
  '--ecfa-badge-blue-bg': '#e8e5f1',
  '--ecfa-badge-blue-ink': '#615982',
  '--ecfa-badge-violet-bg': '#eee4f2',
  '--ecfa-badge-violet-ink': '#755b82',
};

const tabs = [
  { id: 'core', label: 'ECFA 本體', icon: ScrollText },
  { id: 'events', label: '事件時間軸', icon: GitBranch },
  { id: 'exposure', label: '2024 中止影響', icon: BarChart3 },
  { id: 'methods', label: '實證設計', icon: Search },
  { id: 'thesis', label: '論文研究史', icon: CalendarClock },
  { id: 'factchecks', label: '事實查核', icon: Search },
  { id: 'glossary', label: '名詞解釋', icon: BookOpen },
  { id: 'sources', label: '資料來源', icon: Database },
  { id: 'next', label: '研究進度', icon: ListChecks },
];

const topicTone = { // token-exempt
  trade_tariff: '#8f6f95',
  industry_firm: '#b8788a',
  political_policy: '#796f98',
  agriculture_food: '#74896f',
  finance_investment: '#a1667d',
  other: '#7b7078',
};

const topicLabel = Object.fromEntries(thesis.byTopic.map((row) => [row.topic, row.label]));

const sourceTierLabel = {
  official: '官方來源',
  academic: '學術來源',
  policy_report: '政策報告',
  news_context: '背景報導',
  lead_only: '待核對線索',
};


const methodLabel = {
  staggered_did: '分期差異中之差異法',
  selection_and_utilization: '清單選擇與利用率分析',
  ex_ante_policy_analysis: '事前政策效果評估',
  deep_text_analysis: '文本語義分析',
};

function sourceUse(item) {
  const text = `${item.id} ${item.label}`;
  if (text.includes('agreement') || text.includes('協議文本')) return '確認制度基準與附件內容';
  if (text.includes('early_harvest') || text.includes('早收')) return '核對早收產品與降稅安排';
  if (text.includes('implementation') || text.includes('執行情形')) return '理解官方效益與執行口徑';
  if (text.includes('rollback') || text.includes('中止')) return '查核 2024 年優惠中止事件';
  if (text.includes('customs') || text.includes('關務署') || text.includes('稅則')) return '建立產品與貿易統計對照';
  if (text.includes('ndltd') || text.includes('學位論文')) return '整理研究史與方法線索';
  if (item.sourceTier === 'academic') return '補充實證研究參照';
  return '補足事件脈絡與證據鏈';
}

function literatureUse(item) {
  if (item.method === 'staggered_did') return '以早收清單作為受影響差異，供因果設計參照。';
  if (item.method === 'selection_and_utilization') return '用於比較清單納入、優惠利用與出口行為。';
  if (item.method === 'ex_ante_policy_analysis') return '可作為實施前預期效果的基準文獻。';
  return displayText(item.note);
}

function displayText(value) {
  return String(value ?? '')
    .replaceAll('已抓取並抽文字', '已取得正式文本')
    .replaceAll('待抓取數值資料', '待補數值資料')
    .replaceAll('目前抽出', '目前整理')
    .replaceAll('可進入初步視覺化', '已可先作事件觀察')
    .replaceAll('資料底盤', '研究基礎')
    .replaceAll('商品層級暴露度', '商品層級受影響範圍')
    .replaceAll('早收商品暴露', '早收商品範圍')
    .replaceAll('政策暴露', '政策影響')
    .replaceAll('產業曝險', '產業受影響程度')
    .replaceAll('暴露描述', '受影響範圍描述')
    .replaceAll('暴露分析', '受影響範圍分析')
    .replaceAll('描述性暴露圖', '描述性影響圖')
    .replaceAll('暴露分層', '受影響分層')
    .replaceAll('暴露', '受影響範圍')
    .replaceAll('HS code', '產品分類碼')
    .replaceAll('HS × 年 × 對象地區', '產品、年度與對象地區')
    .replaceAll('HS', '產品分類')
    .replaceAll('rollback', '中止優惠')
    .replaceAll('DID', '差異比較')
    .replaceAll('meta-analysis', '研究史分析')
    .replaceAll('PDF 文字抽取', '清單初步整理')
    .replaceAll('PDF 與 txt', '正式文本')
    .replaceAll('PDF', '正式文本')
    .replaceAll('txt', '文字稿')
    .replaceAll('機器解析', '初步整理')
    .replaceAll('正式建模', '正式分析')
    .replaceAll('建模', '分析')
    .replaceAll('章別分布圖', '單一分類圖')
    .replaceAll('深度學習/NLP', '文本分析')
    .replaceAll('語料向量', '主題材料')
    .replaceAll('embedding', '語義比較')
    .replaceAll('embeddings', '語義比較')
    .replaceAll('source-tiered', '按來源等級整理')
    .replaceAll('dedupe', '去除重複')
    .replaceAll('segment Chinese text', '整理中文段落')
    .replaceAll('validate topic labels by hand', '人工核對主題標籤')
    .replaceAll('code concordance and pre-trend checks', '產品分類對照與趨勢檢查')
    .replaceAll('event date and tariff-change verification', '事件日期與稅率變化核對');
}

function Badge({ children, tone = 'slate' }) {
  const colors = {
    slate: ['var(--ecfa-badge-slate-bg)', 'var(--ecfa-badge-slate-ink)'],
    gold: ['var(--ecfa-badge-gold-bg)', 'var(--ecfa-badge-gold-ink)'],
    green: ['var(--ecfa-badge-green-bg)', 'var(--ecfa-badge-green-ink)'],
    red: ['var(--ecfa-badge-red-bg)', 'var(--ecfa-badge-red-ink)'],
    blue: ['var(--ecfa-badge-blue-bg)', 'var(--ecfa-badge-blue-ink)'],
    violet: ['var(--ecfa-badge-violet-bg)', 'var(--ecfa-badge-violet-ink)'],
  };
  const [bg, color] = colors[tone] || colors.slate;
  return (
    <span className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function Panel({ eyebrow, title, icon: Icon, children, aside }) {
  return (
    <section className="border-t border-[var(--ecfa-line)] py-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon ? (
            <div className="mt-0.5 shrink-0 text-[var(--ecfa-icon)]">
              <Icon size={15} />
            </div>
          ) : null}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ecfa-eyebrow)]">{eyebrow}</p>
            <h2 className="font-sans text-base font-bold leading-tight text-[var(--ecfa-title-ink)]">{title}</h2>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function KeyFigures({ items }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--ecfa-line)] py-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-2">
          <span className="text-[11px] font-bold text-[var(--ecfa-icon)]">{item.label}</span>
          <span className="text-lg font-bold text-[var(--ecfa-ink-strong)]">{item.value}</span>
          <span className="text-[11px] text-[var(--ecfa-figure-note)]">{item.note}</span>
        </div>
      ))}
    </div>
  );
}

function InsightRows({ rows }) {
  return (
    <div className="divide-y divide-[var(--ecfa-line)]">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-2 py-3 sm:grid-cols-[140px_1fr]">
          <div className="text-[12px] font-bold text-[var(--ecfa-accent)]">{row.label}</div>
          <div>
            <div className="text-scaled-xs font-bold leading-relaxed text-[var(--ecfa-ink)]">{row.value}</div>
            <div className="mt-1 text-[0.65em] leading-relaxed text-[var(--ecfa-ink-soft)]">{row.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoreView() {
  const product = core.productSummary;
  const official = product.officialEarlyHarvestBenchmark;
  const rollbackByBatch = Object.fromEntries(product.rollbackByBatch.map((row) => [row.batch, row.count]));
  const rollbackEvents = ds.eventTimeline.filter((item) => item.type === '優惠中止');

  return (
    <div>
      <KeyFigures
        items={[
          {
            label: '早收清單',
            value: `${official.taiwanConcessionToMainland}/${official.mainlandConcessionToTaiwan}`,
            note: '台方減讓 / 陸方減讓',
          },
          {
            label: '2024 中止',
            value: `${rollbackByBatch.first || 0}+${rollbackByBatch.second || 0}`,
            note: '兩批官方清單',
          },
        ]}
      />
      <Panel eyebrow="中止優惠" title="2024 年優惠中止怎麼讀" icon={AlertTriangle}>
        <InsightRows
          rows={[
            {
              label: '事件節點',
              value: rollbackEvents.map((item) => `${item.date} ${item.title}`).join('；'),
              note: '公告日與生效日要分開看：前者影響預期，後者影響訂單與出口資料。',
            },
            {
              label: '受影響範圍',
              value: '石化、紡織、機械、鋼鐵及金屬、運輸工具等產品。',
              note: '這些產業不是同質群體；後續分析要回到產品分類、稅率變化與出口依賴度。',
            },
            {
              label: '研究用途',
              value: '短期看市場反應，長期看出口結構與市場分散。',
              note: '同一事件可以導出不同研究設計，不宜只用產品分類數量概括。'
            },
          ]}
        />
      </Panel>

      <Panel eyebrow="研究門檻" title="進入實證分析前要先補齊什麼" icon={Search}>
        <InsightRows
          rows={core.analysisReadiness
            .filter((item) => !item.layer.includes('深度學習') && !item.layer.includes('NLP'))
            .map((item) => ({
              label: displayText(item.layer),
              value: displayText(item.status),
              note: displayText(item.note),
            }))}
        />
      </Panel>

      <Panel eyebrow="樣本核對" title="2024 中止清單樣本" icon={FileText}>
        <div className="overflow-x-auto rounded-lg border border-[var(--ecfa-table-border)]">
          <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[11px]">
            <thead className="bg-[var(--ecfa-table-head-bg)] text-[var(--ecfa-table-head-ink)]">
              <tr>
                <th className="px-3 py-2">批次</th>
                <th className="px-3 py-2">生效日</th>
                <th className="px-3 py-2">產品分類碼</th>
                <th className="px-3 py-2">品名</th>
                <th className="px-3 py-2">原早收</th>
              </tr>
            </thead>
            <tbody>
              {core.rollbackSample.map((row) => (
                <tr key={`${row.batch}-${row.seq}-${row.hsCode}`} className="border-t border-[var(--ecfa-row-border)]">
                  <td className="px-3 py-2 font-bold text-[var(--ecfa-accent)]">{row.batch === 'first' ? '第一批' : '第二批'}</td>
                  <td className="px-3 py-2 text-[var(--ecfa-ink-muted)]">{row.effectiveDate}</td>
                  <td className="px-3 py-2 font-bold text-[var(--ecfa-ink)]">{row.hsCode}</td>
                  <td className="px-3 py-2 text-[var(--ecfa-ink-mid)]">{row.product}</td>
                  <td className="px-3 py-2 text-[var(--ecfa-ink-muted)]">{row.inOriginalMainlandEarlyHarvest ? '早收內' : '待核對'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ExposureView() {
  const exposure = core.rollbackExposure;
  const maxSector = Math.max(...(exposure?.bySector || []).map((row) => row.count), 1);
  const eventDateText = Object.fromEntries((exposure?.eventDates || []).map((row) => [row.batch, row]));

  return (
    <div className="space-y-4">
      <Panel eyebrow="2024 中止影響" title="哪些產品受到優惠中止影響" icon={BarChart3}>
        <InsightRows
          rows={[
            {
              label: '處理組',
              value: `${exposure.total} 項產品，第一批 ${eventDateText.first?.products || 0}，第二批 ${eventDateText.second?.products || 0}`,
              note: '兩批清單已閉合到官方口徑，可作為 2024 年中止優惠事件的產品集合。',
            },
            {
              label: '事件日',
              value: `第一批 ${eventDateText.first?.announcementDate} 公告、${eventDateText.first?.effectiveDate} 生效；第二批 ${eventDateText.second?.announcementDate} 公告、${eventDateText.second?.effectiveDate} 生效`,
              note: '公告日適合觀察預期與訂單調整；生效日適合觀察稅率適用後變化。',
            },
            {
              label: '核對狀態',
              value: `${exposure.originalEarlyHarvestMatched} 項已對上原早收代碼，${exposure.needsCodeOrNameAudit} 項需再核對`,
              note: '未核對完成者不可直接當作控制組或未受影響樣本。',
            },
          ]}
        />
      </Panel>

      <Panel eyebrow="產業分布" title="受影響產品集中在哪些產業" icon={Layers3}>
        <div className="divide-y divide-[var(--ecfa-line)]">
          {exposure.bySector.map((row) => (
            <div key={row.key} className="grid gap-2 py-2.5 sm:grid-cols-[150px_1fr_42px] sm:items-center">
              <div className="text-[12px] font-bold text-[var(--ecfa-label-dark)]">{row.key}</div>
              <div className="h-px bg-[var(--ecfa-line)]">
                <div className="h-px bg-[var(--ecfa-chart-line)]" style={{ width: `${(row.count / maxSector) * 100}%` }} />
              </div>
              <div className="text-right text-[12px] font-bold text-[var(--ecfa-accent)]">{row.count}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--ecfa-ink-soft)]">
          這張表把 2024 年中止事件轉成後續可接出口資料的受影響分層。
        </p>
      </Panel>

      <Panel eyebrow="下一步" title="如何接到貿易資料" icon={Search}>
        <InsightRows
          rows={[
            {
              label: '分析單位',
              value: ds.methodPlan.empiricalDesign2024.unit,
              note: '產品分類碼仍需處理年版對照，避免 2010、2024 與出口統計口徑錯接。',
            },
            {
              label: '結果變數',
              value: ds.methodPlan.empiricalDesign2024.outcomeCandidates.join('、'),
              note: displayText('月資料最適合 2024 事件；年資料只能先做描述性暴露圖。'),
            },
            {
              label: '目前結論',
              value: displayText(ds.methodPlan.empiricalDesign2024.currentConclusion),
              note: '現在已可描述受影響範圍，但不能把變化解釋為政策效果。',
            },
          ]}
        />
      </Panel>
    </div>
  );
}

function ThesisTimeline() {
  const rows = thesis.byYear.filter((row) => /^\d+$/.test(row.rocYear));
  const max = Math.max(...rows.map((row) => row.count), 1);
  const W = 1080;
  const H = 300;
  const L = 42;
  const R = 28;
  const T = 44;
  const B = 52;
  const x = (idx) => L + (idx / Math.max(rows.length - 1, 1)) * (W - L - R);
  const y = (value) => T + (1 - value / max) * (H - T - B);
  const points = rows.map((row, idx) => ({ ...row, x: x(idx), y: y(row.count) }));
  const linePath = points.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${H - B} L ${points[0].x.toFixed(1)} ${H - B} Z`;
  const eventMarks = [
    { rocYear: '99', label: '簽署', date: '2010' },
    { rocYear: '100', label: '早收降稅', date: '2011' },
    { rocYear: '102', label: '零關稅完成', date: '2013' },
    { rocYear: '113', label: '部分中止', date: '2024' },
  ];

  return (
    <Panel
      eyebrow="學位論文研究史"
      title="ECFA 學位論文年度時間軸"
      icon={CalendarClock}
      aside={<span className="text-[12px] font-bold text-[var(--ecfa-icon)]">{thesis.corpus.totalParsed} 筆論文</span>}
    >
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[820px]" role="img" aria-label="ECFA 學位論文年度時間軸">
          <defs>
            <linearGradient id="ecfaTimelineWash" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--ecfa-chart-wash)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--ecfa-chart-wash)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const gy = T + ratio * (H - T - B);
            return <line key={ratio} x1={L} x2={W - R} y1={gy} y2={gy} stroke="var(--ecfa-chart-grid)" strokeWidth="1" />;
          })}
          <path d={areaPath} fill="url(#ecfaTimelineWash)" />
          <path d={linePath} fill="none" stroke="var(--ecfa-chart-line)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => {
            const countX = point.rocYear === '99' ? point.x - 10 : point.x;
            const countAnchor = point.rocYear === '99' ? 'end' : 'middle';
            return (
            <g key={point.rocYear}>
              <line x1={point.x} x2={point.x} y1={point.y + 8} y2={H - B} stroke="var(--ecfa-chart-tick)" strokeWidth="1" />
              <circle cx={point.x} cy={point.y} r={point.count >= 15 ? 5 : 4} fill="var(--ecfa-chart-dot)" stroke="var(--ecfa-chart-line)" strokeWidth="2" />
              {(point.count >= 15 || point.rocYear === '113') ? (
                <text x={countX} y={point.y - 12} textAnchor={countAnchor} fontSize="12" fontWeight="700" fill="var(--ecfa-chart-count-text)">{point.count}</text>
              ) : null}
              <text x={point.x} y={H - 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ecfa-muted)">{point.rocYear}</text>
            </g>
            );
          })}
          <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ecfa-chart-baseline)" strokeWidth="1" />
          {eventMarks.map((event, idx) => {
            const point = points.find((row) => row.rocYear === event.rocYear);
            if (!point) return null;
            const labelY = idx % 2 === 0 ? 18 : 34;
            const nearRight = point.x > W - 150;
            const labelX = nearRight ? point.x - 10 : point.x + 9;
            const anchor = nearRight ? 'end' : 'start';
            return (
              <g key={event.rocYear}>
                <line x1={point.x} x2={point.x} y1={labelY + 13} y2={H - B} stroke="var(--ecfa-chart-event-line)" strokeWidth="1" strokeDasharray="3 5" />
                <circle cx={point.x} cy={labelY + 13} r="3" fill="var(--ecfa-chart-line)" />
                <text x={labelX} y={labelY + 3} textAnchor={anchor} fontSize="11" fontWeight="700" fill="var(--ecfa-chart-event-date)">{event.date}</text>
                <text x={labelX} y={labelY + 17} textAnchor={anchor} fontSize="10" fill="var(--ecfa-chart-event-label)">{event.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--ecfa-ink-soft)]">
        橫軸為民國年。資料來自 NDLTD 題名精準檢索結果，並已先依題名整理研究主題與方法線索。
      </p>
    </Panel>
  );
}

function TopicBars() {
  const max = Math.max(...thesis.byTopic.map((row) => row.count), 1);
  return (
    <Panel eyebrow="主題分布" title="論文題目初步分類" icon={Layers3}>
      <div className="space-y-3">
        {thesis.byTopic.map((row) => (
          <div key={row.topic}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
              <span className="font-bold text-[var(--ecfa-label-dark)]">{row.label}</span>
              <span className="font-bold text-[var(--ecfa-topicbar-count)]">{row.count}</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--ecfa-topicbar-track)]">
              <div className="h-2 rounded-full" style={{ width: `${(row.count / max) * 100}%`, background: topicTone[row.topic] }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ThesisTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--ecfa-table-border)]">
      <table className="w-full min-w-[760px] border-collapse bg-white text-left text-[11px]">
        <thead className="bg-[var(--ecfa-table-head-bg)] text-[var(--ecfa-table-head-ink)]">
          <tr>
            <th className="px-3 py-2">年</th>
            <th className="px-3 py-2">題名</th>
            <th className="px-3 py-2">校系</th>
            <th className="px-3 py-2">研究線索</th>
            <th className="px-3 py-2 text-right">引用</th>
            <th className="px-3 py-2 text-right">下載</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.rank}-${row.title}`} className="border-t border-[var(--ecfa-row-border)]">
              <td className="px-3 py-2 font-bold text-[var(--ecfa-accent)]">{row.rocYear}</td>
              <td className="px-3 py-2 font-bold leading-snug text-[var(--ecfa-ink)]">{row.title}</td>
              <td className="px-3 py-2 text-[var(--ecfa-ink-muted)]">{row.university}／{row.department}</td>
              <td className="px-3 py-2">
                <CategoryTag row={row} />
              </td>
              <td className="px-3 py-2 text-right font-bold text-[var(--ecfa-ink-muted)]">{row.cited}</td>
              <td className="px-3 py-2 text-right font-bold text-[var(--ecfa-ink-muted)]">{row.downloads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryTag({ row }) {
  return (
    <span className="block min-w-[120px] text-[11px] leading-snug text-[var(--ecfa-tag-text)]">
      <span className="inline-flex items-center gap-1.5 font-bold">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: topicTone[row.topic] || 'var(--ecfa-topic-fallback)' }} />
        <span>{topicLabel[row.topic] || '待分類'}</span>
      </span>
      {row.methodTag ? <span className="mt-1 block text-[10px] text-[var(--ecfa-muted)]">{row.methodTag}</span> : null}
    </span>
  );
}

function ThesisView() {
  const [mode, setMode] = useState('top');
  const rows = mode === 'recent' ? thesis.recent : thesis.topCited;

  return (
    <div>
      <ThesisTimeline />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <TopicBars />
        <Panel
          eyebrow="閱讀優先序"
          title={mode === 'top' ? '引用與下載訊號最高的論文' : '最近期論文'}
          icon={BookOpen}
          aside={
            <div className="flex rounded-md bg-[var(--ecfa-toggle-bg)] p-1">
              {[
                ['top', '熱門'],
                ['recent', '近期'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className="rounded px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: mode === id ? 'white' : 'transparent', color: 'var(--ecfa-toggle-text)', boxShadow: mode === id ? '0 1px 2px rgba(103, 71, 84, 0.12)' : 'none' }}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          <ThesisTable rows={rows} />
        </Panel>
      </div>
    </div>
  );
}

function EventTimelineView() {
  return (
    <Panel eyebrow="事件時間軸" title="已查核的 ECFA 關鍵事件" icon={GitBranch}>
      <div className="relative">
        <div className="absolute bottom-2 left-[78px] top-2 w-px bg-[var(--ecfa-line)]" />
        <div className="space-y-5">
          {ds.eventTimeline.map((item) => (
            <article key={`${item.date}-${item.title}`} className="grid gap-3 sm:grid-cols-[92px_1fr]">
              <div className="relative text-[11px] font-bold text-[var(--ecfa-accent)]">
                <span className="relative z-10 bg-[var(--ecfa-bg)] pr-2">{item.date}</span>
              </div>
              <div className="border-t border-[var(--ecfa-line)] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-sans text-scaled-sm font-bold text-[var(--ecfa-ink)]">{item.title}</h3>
                  <Badge tone="green">{item.factCheck}</Badge>
                  <span className="text-[10px] font-bold text-[var(--ecfa-muted)]">{item.type}</span>
                </div>
                <p className="mt-2 text-scaled-xs leading-relaxed text-[var(--ecfa-ink-mid)]">{item.evidence}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--ecfa-note)]">{item.researchMeaning}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function GlossaryView() {
  return (
    <div className="space-y-4">
      <Panel eyebrow="名詞解釋" title="讀 ECFA 研究前先釐清的概念" icon={BookOpen}>
        <div className="grid gap-3 md:grid-cols-2">
          {ds.glossary.map((item) => (
            <article key={item.term} className="border-t border-[var(--ecfa-line)] pt-3">
              <div className="flex items-baseline gap-2">
                <h3 className="font-sans text-scaled-sm font-bold text-[var(--ecfa-ink)]">{item.term}</h3>
                <span className="text-[10px] text-[var(--ecfa-muted)]">{item.fullName}</span>
              </div>
              <p className="mt-2 text-scaled-xs leading-relaxed text-[var(--ecfa-ink-mid)]">{item.plain}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--ecfa-note)]">{item.whyItMatters}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function FactChecksView() {
  return (
    <div className="space-y-4">
      <Panel eyebrow="事實查核" title="目前可確認的核心事實" icon={Search}>
        <div className="space-y-3">
          {ds.factChecks.map((item) => (
            <article key={item.claim} className="border-t border-[var(--ecfa-line)] pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.confidence === '高' ? 'green' : 'gold'}>信心 {item.confidence}</Badge>
                <span className="text-[11px] font-bold text-[var(--ecfa-accent)]">{item.finding}</span>
              </div>
              <h3 className="mt-2 font-sans text-sm font-bold text-[var(--ecfa-ink)]">{item.claim}</h3>
              <p className="mt-1 text-scaled-xs leading-relaxed text-[var(--ecfa-body-text)]">{item.evidence}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="研究判斷" title="從事實到研究設計" icon={Sparkles}>
        <div className="grid gap-3 md:grid-cols-2">
          {ds.analysisNotes.map((item) => (
            <article key={item.title} className="border-t border-[var(--ecfa-line)] pt-3">
              <h3 className="font-sans text-scaled-sm font-bold text-[var(--ecfa-ink)]">{item.title}</h3>
              <p className="mt-2 text-scaled-xs leading-relaxed text-[var(--ecfa-ink-mid)]">{item.summary}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--ecfa-note)]">{item.researchUse}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SourcesView() {
  return (
    <div className="space-y-4">
      <Panel eyebrow="資料來源" title="可查核來源" icon={Database}>
        <div className="overflow-x-auto border-t border-[var(--ecfa-line)]">
          <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
            <thead className="text-[var(--ecfa-accent)]">
              <tr className="border-b border-[var(--ecfa-line)]">
                <th className="py-2 pr-4">類型</th>
                <th className="px-3 py-2">來源</th>
                <th className="px-3 py-2">用途</th>
                <th className="py-2 pl-3 text-right">連結</th>
              </tr>
            </thead>
            <tbody>
          {ds.sourceInventory.map((item) => (
            <tr key={item.id} className="border-b border-[var(--ecfa-row-border)]">
              <td className="py-2 pr-4 text-[var(--ecfa-accent)]">{sourceTierLabel[item.sourceTier] || '研究來源'}</td>
              <td className="px-3 py-2 font-bold leading-relaxed text-[var(--ecfa-ink)]">{item.label.replace(' PDF', '')}</td>
              <td className="px-3 py-2 leading-relaxed text-[var(--ecfa-ink-soft)]">{sourceUse(item)}</td>
              <td className="py-2 pl-3 text-right">
                {item.url ? (
                  <a className="font-bold text-[var(--ecfa-accent)] underline decoration-[var(--ecfa-link-underline)] underline-offset-4" href={item.url} target="_blank" rel="noreferrer">
                    來源頁
                  </a>
                ) : (
                  <span className="text-[var(--ecfa-placeholder)]">待補</span>
                )}
              </td>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel eyebrow="文獻入口" title="實證研究入口" icon={FileText}>
        <div className="divide-y divide-[var(--ecfa-line)]">
          {ds.literatureMap.map((item) => (
            <article key={item.id} className="grid gap-2 py-3 md:grid-cols-[130px_1fr]">
              <div className="text-[11px] font-bold text-[var(--ecfa-accent)]">{item.year} · {methodLabel[item.method] || displayText(item.method)}</div>
              <div>
                <h3 className="font-sans text-scaled-sm font-bold leading-snug text-[var(--ecfa-ink)]">{item.title}</h3>
                <p className="mt-1 text-scaled-xs leading-relaxed text-[var(--ecfa-ink-soft)]">{literatureUse(item)}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MethodsView() {
  const design = ds.methodPlan.empiricalDesign2024;
  return (
    <div className="space-y-4">
      <Panel eyebrow="方法設計" title={design.title} icon={Search}>
        <p className="text-scaled-sm leading-relaxed text-[var(--ecfa-ink-mid)]">{design.researchQuestion}</p>
        <InsightRows
          rows={[
            {
              label: '分析單位',
              value: design.unit,
              note: '這個單位能把中止清單、事件日與出口資料接在同一張表。',
            },
            {
              label: '處理組',
              value: `${design.treatment.treatmentRows} 項中止優惠產品`,
              note: `其中 ${design.treatment.matchedOriginalEarlyHarvest} 項已對上原早收代碼，${design.treatment.needsAudit} 項需再核對。`,
            },
            {
              label: '目前能說',
              value: displayText(design.currentConclusion),
              note: '先守住研究邊界，避免在貿易數值還沒接上前過度推論。',
            },
          ]}
        />
      </Panel>

      <Panel eyebrow="事件窗口" title="公告日與生效日分開觀察" icon={GitBranch}>
        <div className="divide-y divide-[var(--ecfa-line)]">
          {design.eventWindows.map((item) => (
            <article key={`${item.event}-${item.date}`} className="grid gap-2 py-3 md:grid-cols-[120px_150px_1fr]">
              <div className="text-[12px] font-bold text-[var(--ecfa-accent)]">{item.date}</div>
              <h3 className="font-sans text-scaled-sm font-bold text-[var(--ecfa-ink)]">{item.event}</h3>
              <div>
                <p className="text-scaled-xs leading-relaxed text-[var(--ecfa-ink-soft)]">{item.window}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--ecfa-note)]">{item.purpose}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="比較組" title="候選比較方式與風險" icon={Layers3}>
        <div className="divide-y divide-[var(--ecfa-line)]">
          {design.comparisonCandidates.map((item) => (
            <article key={item.label} className="grid gap-2 py-3 md:grid-cols-[180px_1fr]">
              <h3 className="font-sans text-scaled-sm font-bold text-[var(--ecfa-ink)]">{item.label}</h3>
              <div>
                <p className="text-scaled-xs leading-relaxed text-[var(--ecfa-ink-soft)]">{displayText(item.use)}</p>
                <p className="mt-1 text-scaled-xs leading-relaxed text-[var(--ecfa-risk-text)]">{displayText(item.risk)}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel eyebrow="研究限制" title="目前不能假裝已經解決的事" icon={AlertTriangle}>
        <div className="divide-y divide-[var(--ecfa-line)]">
          {design.blockers.map((item) => (
            <div key={item} className="flex gap-2 py-3 text-scaled-xs font-bold leading-relaxed text-[var(--ecfa-warning-text)]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {displayText(item)}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function NextView() {
  return (
    <Panel eyebrow="研究進度" title="接下來要回答的問題" icon={ListChecks}>
      <div className="divide-y divide-[var(--ecfa-line)]">
        {ds.immediateNextWork.map((item, idx) => (
          <div key={item} className="grid gap-3 py-3 sm:grid-cols-[36px_1fr]">
            <div className="font-display text-lg text-[var(--ecfa-icon)]">{idx + 1}</div>
            <div className="text-scaled-xs font-bold leading-relaxed text-[var(--ecfa-next-text)]">{displayText(item)}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function ECFAResearch() {
  const [active, setActive] = useState('core');
  const [fontScale, setFontScale] = useFontScale();

  useEffect(() => {
    document.title = 'ECFA 研究地圖';
  }, []);

  return (
    <div className="min-h-screen paper-texture bg-[var(--ecfa-bg)] font-sans text-[var(--ecfa-ink-strong)]" style={{ ...ECFA_VARS, paddingBottom: 60, '--reader-scale': fontScale }}>
      <header className="border-b border-[var(--ecfa-line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="reader-scale max-w-4xl">
              <div className="mb-3 inline-flex items-center gap-2 font-accent text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ecfa-eyebrow-header)]">
                <ScrollText size={13} />
                ECFA Research Lab
              </div>
                <h1 className="max-w-3xl leading-tight text-[var(--ecfa-heading)]">
                  <span className="font-display text-3xl font-normal sm:text-4xl">ECFA</span>
                  <span className="ml-3 align-baseline font-sans text-2xl font-semibold sm:text-[2.15rem]">的前世今生與實證研究地圖</span>
                </h1>
                <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-[var(--ecfa-body-text)]">
                  從 WTO 脈絡、江陳會談、協議文本、五個附件、早收清單一路整理到 2024 年中止優惠與商品範圍。
                </p>
            </div>
            <FontSizeControl scale={fontScale} onChange={setFontScale} />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-[var(--ecfa-line)] bg-white/94 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition"
              style={{ background: active === id ? 'var(--ecfa-tab-active-bg)' : 'transparent', color: active === id ? 'var(--ecfa-tab-active-text)' : 'var(--ecfa-tab-inactive-text)' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 prose-scaled">
       <div className="reader-scale">
        {active === 'core' ? <CoreView /> : null}
        {active === 'events' ? <EventTimelineView /> : null}
        {active === 'exposure' ? <ExposureView /> : null}
        {active === 'methods' ? <MethodsView /> : null}
        {active === 'thesis' ? <ThesisView /> : null}
        {active === 'factchecks' ? <FactChecksView /> : null}
        {active === 'glossary' ? <GlossaryView /> : null}
        {active === 'sources' ? <SourcesView /> : null}
        {active === 'next' ? <NextView /> : null}
       </div>
      </main>
    </div>
  );
}
