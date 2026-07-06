import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  History,
  Info,
  Network,
  Search,
  Users,
  CalendarClock,
} from 'lucide-react';
import data from '../data/constitutionalCourt.json';

const CC_VARS = { // token-exempt
  '--cc-accent': '#8f6071',
  '--cc-line': '#eadde2',
  '--cc-eyebrow': '#a77b89',
  '--cc-ink-soft': '#74636a',
  '--cc-ink-strong': '#4b3b43',
  '--cc-title-ink': '#45343c',
  '--cc-highlight': '#a84f6e',
  '--cc-ink-mid': '#5b4e55',
  '--cc-border': '#e3d5da',
  '--cc-link-hover': '#5f3f4b',
  '--cc-link-underline': '#d8b7c2',
  '--cc-hover-bg': '#f7edf0',
  '--cc-track': '#f0e2e7',
  '--cc-blue-ink': '#615982',
  '--cc-type-judgment': '#5a5fb0',
  '--cc-ink': '#3f3339',
  '--cc-bg': '#fbf8f9',
  '--cc-axis-text': '#8d7e85',
  '--cc-table-head-ink': '#7f5b69',
  '--cc-body-text': '#6f6369',
  '--cc-ink-heavy': '#44343d',
  '--cc-blue-ink-hover': '#3f3a5e',
  '--cc-node-fill': '#fff',
  '--cc-heat-text-light': '#fdf7f9',
  '--cc-opinion-bg': '#f9f2f4',
  '--cc-heat-zero': '#f7f3f4',
  '--cc-badge-red-bg': '#f5dfe3',
  '--cc-badge-gold-bg': '#f2e8d9',
  '--cc-badge-plum-bg': '#f2e3e7',
  '--cc-tab-active-bg': '#f1e3e8',
  '--cc-row-border': '#f0e3e8',
  '--cc-badge-slate-bg': '#eef1f2',
  '--cc-badge-green-bg': '#e8efe5',
  '--cc-badge-blue-bg': '#e8e5f1',
  '--cc-table-border': '#e6ded2',
  '--cc-node-related-fill': '#e3b6c4',
  '--cc-edge-line': '#c9b3bc',
  '--cc-dim-text': '#c4b4ba',
  '--cc-placeholder': '#b09aa2',
  '--cc-icon': '#9b6b7b',
  '--cc-eyebrow-header': '#987483',
  '--cc-badge-red-ink': '#984f62',
  '--cc-badge-plum-ink': '#945d70',
  '--cc-badge-gold-ink': '#8a6d3b',
  '--cc-tab-inactive-text': '#806b74',
  '--cc-figure-note': '#7d7076',
  '--cc-tab-active-text': '#704c5a',
  '--cc-heat-text-dark': '#6d5a62',
  '--cc-badge-green-ink': '#566d50',
  '--cc-badge-slate-ink': '#52616a',
  '--cc-type-ruling': '#3f7d44',
  '--cc-heading': '#2f2a2d',
};

const docs = data.文件;
const justices = data.大法官;
const coSign = data.共同具名;
const citeEdges = data.引用網絡;
const presidents = data.總統任期 ?? [];

const TYPE_COLOR = { 解釋: 'var(--cc-highlight)', 判決: 'var(--cc-type-judgment)', 實體裁定: 'var(--cc-type-ruling)' };

const OUTCOME_TONE = {
  違憲: 'red',
  違憲即失效: 'red',
  違憲定期失效: 'gold',
  合憲: 'green',
  '其他/待人工': 'slate',
  未分類: 'slate',
};

const STANDARD_TONE = { 嚴格: 'red', 中度: 'gold', 寬鬆: 'green', '多重（待人工）': 'slate' };

const tabs = [
  { id: 'index', label: '案件索引', icon: Search },
  { id: 'timeline', label: '案件時間軸', icon: CalendarClock },
  { id: 'justices', label: '大法官', icon: Users },
  { id: 'tenure', label: '任期時間軸', icon: History },
  { id: 'graph', label: '意見書圖譜', icon: Network },
  { id: 'about', label: '資料說明', icon: Info },
];

function Badge({ children, tone = 'slate' }) {
  const colors = {
    slate: ['var(--cc-badge-slate-bg)', 'var(--cc-badge-slate-ink)'],
    gold: ['var(--cc-badge-gold-bg)', 'var(--cc-badge-gold-ink)'],
    green: ['var(--cc-badge-green-bg)', 'var(--cc-badge-green-ink)'],
    red: ['var(--cc-badge-red-bg)', 'var(--cc-badge-red-ink)'],
    blue: ['var(--cc-badge-blue-bg)', 'var(--cc-blue-ink)'],
    plum: ['var(--cc-badge-plum-bg)', 'var(--cc-badge-plum-ink)'],
  };
  const [bg, color] = colors[tone] || colors.slate;
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function citeString(d) {
  const dt = d.日期 ? `（${d.日期}）` : '';
  if (d.類型 === '解釋') return `司法院${d.字號}解釋${dt}`;
  return `憲法法庭${d.字號}${d.類型 === '實體裁定' ? '裁定' : '判決'}${dt}`;
}

function bibKey(d) {
  const m1 = d.字號.match(/^釋字第(\d+)號$/);
  if (m1) return `jy_interp_${m1[1]}`;
  const m2 = d.字號.match(/^(\d+)年憲(暫?)裁?判?字第(\d+)號$/);
  if (m2) return `tcc_${m2[1]}_${m2[2] ? 'inj_' : ''}${m2[3]}`;
  return d.字號.replace(/[^\w]/g, '');
}

function toBibtex(list) {
  return list
    .map((d) => {
      const year = d.日期 ? d.日期.slice(0, 4) : '';
      return `@misc{${bibKey(d)},\n  title = {${citeString(d).replace(/（.*?）/, '')}},\n  year = {${year}},\n  note = {${d.日期 ?? ''}${d.爭點 ? '，' + d.爭點.slice(0, 60) : ''}},\n  howpublished = {\\url{${d.官方頁}}}\n}`;
    })
    .join('\n\n');
}

function toCsv(list) {
  const esc = (s) => `"${String(s ?? '').replaceAll('"', '""')}"`;
  const head = ['字號', '類型', '日期', '主題', '原理原則', '審查結論', '意見書數', '官方頁'];
  const rows = list.map((d) =>
    [d.字號, d.類型, d.日期, d.主題.join('；'), d.原理原則.join('；'), d.審查結論?.結論, d.意見書.length, d.官方頁].map(esc).join(','),
  );
  return '﻿' + [head.join(','), ...rows].join('\n');
}

function toManifest(list) {
  return JSON.stringify(
    {
      說明: '此清單供本機批次下載使用：到資料庫 repo 執行 npm run fetch-batch -- --manifest <本檔>',
      產生時間: new Date().toISOString(),
      文件: list.map((d) => ({
        字號: d.字號,
        官方頁: d.官方頁,
        意見書: d.意見書.map((o) => ({ 文件名: o.文件名, 下載網址: o.下載網址 })),
        ...(d.立場表下載 ? { 立場表: d.立場表下載 } : {}),
      })),
    },
    null,
    1,
  );
}

function OpinionLine({ op }) {
  const who =
    op.作者類別 === '大法官'
      ? `${(op.提出 ?? []).join('、')}${op.加入?.length ? `（${op.加入.join('、')}加入）` : ''}`
      : op.文件名.replace(/\.(pdf|doc|docx)$/i, '');
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Badge tone={op.類型.includes('不同') ? 'red' : op.類型.includes('協同') ? 'blue' : 'slate'}>{op.類型}</Badge>
      {op.作者類別 !== '大法官' ? <Badge tone="slate">{op.作者類別}</Badge> : null}
      <span className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{who}</span>
      <a
        href={op.下載網址}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-link-hover)]"
      >
        官方 PDF <ExternalLink size={11} />
      </a>
    </div>
  );
}

function CaseCard({ d }) {
  return (
    <article className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href={d.官方頁}
          target="_blank"
          rel="noreferrer"
          className="text-[16px] font-bold text-[var(--cc-ink)] underline decoration-[var(--cc-link-underline)] underline-offset-4 hover:text-[var(--cc-accent)]"
        >
          {d.字號}
        </a>
        <span className="text-[12px] text-[var(--cc-figure-note)]">{d.日期}</span>
        <span className="inline-flex h-2.5 w-2.5 rounded-sm" style={{ background: TYPE_COLOR[d.類型] }} aria-hidden />
        <Badge tone="plum">{d.類型}{d.子類 ? `・${d.子類}` : ''}</Badge>
        {d.審查結論?.結論 && d.審查結論.結論 !== '未分類' ? (
          <Badge tone={OUTCOME_TONE[d.審查結論.結論] ?? 'slate'}>
            {d.審查結論.結論 === '其他/待人工' ? '結論待人工判讀' : d.審查結論.結論}
          </Badge>
        ) : null}
        {d.審查基準 && d.審查基準.基準 !== '未明示' ? (
          <Badge tone={STANDARD_TONE[d.審查基準.基準] ?? 'slate'}>
            {d.審查基準.基準 === '多重（待人工）' ? '審查基準待人工' : `${d.審查基準.基準}審查`}
          </Badge>
        ) : null}
        {d.主題.map((t) => (
          <Badge key={t} tone="blue">{t}</Badge>
        ))}
        {(d.子主題 ?? []).filter((t) => t !== '稅法：未細分').map((t) => (
          <Badge key={t} tone="plum">{t}</Badge>
        ))}
      </div>

      {d.爭點 ? (
        <p className="mt-2 max-w-4xl text-[13px] font-bold leading-relaxed text-[var(--cc-ink-heavy)]">{d.爭點}</p>
      ) : null}
      {d.主文 ? (
        <p className="mt-2 max-w-4xl whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{d.主文}</p>
      ) : null}

      {(d.憲法依據?.length || d.系爭法令?.length) ? (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[var(--cc-ink-soft)]">
          {d.憲法依據?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">憲法依據</strong>　{d.憲法依據.join('、')}
            </span>
          ) : null}
          {d.系爭法令?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">系爭法令</strong>　{d.系爭法令.slice(0, 6).join('、')}
              {d.系爭法令.length > 6 ? `　等 ${d.系爭法令.length} 項` : ''}
            </span>
          ) : null}
        </div>
      ) : null}

      {(d.主筆 || d.參與大法官?.length) ? (
        <div className="mt-2 text-[11px] text-[var(--cc-ink-soft)]">
          {d.主筆 ? (
            <span className="mr-4">
              <strong className="text-[var(--cc-accent)]">主筆</strong>　{d.主筆}
            </span>
          ) : null}
          {d.參與大法官?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">參與大法官</strong>　{d.參與大法官.join('、')}
            </span>
          ) : null}
        </div>
      ) : null}

      {d.意見書.length ? (
        <div className="mt-3 rounded-lg bg-[var(--cc-opinion-bg)] px-3 py-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">意見書 {d.意見書.length} 份</p>
          {d.意見書.map((op, i) => (
            <OpinionLine key={i} op={op} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px]">
        <a href={d.官方頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
          官方頁面（全文、理由書與下載） <ExternalLink size={11} />
        </a>
        {d.立場表下載 ? (
          <a href={d.立場表下載} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]">
            主文立場表 PDF <ExternalLink size={11} />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--cc-ink-soft)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--cc-border)] bg-white px-2 py-1.5 text-[12px] font-bold text-[var(--cc-ink-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link-underline)]"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function IndexView() {
  const [type, setType] = useState('全部');
  const [topic, setTopic] = useState('全部');
  const [outcome, setOutcome] = useState('全部');
  const [standard, setStandard] = useState('全部');
  const [decade, setDecade] = useState('全部');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(30);

  // 主題兩級選單：大類依件數排序；有子主題的大類（目前是稅法）之後緊接其子主題（縮排顯示）
  const { topicOptions, subtopicSet } = useMemo(() => {
    const c = new Map();
    const sub = new Map();
    for (const d of docs) {
      for (const t of d.主題) c.set(t, (c.get(t) ?? 0) + 1);
      for (const s of d.子主題 ?? []) sub.set(s, (sub.get(s) ?? 0) + 1);
    }
    const opts = [];
    for (const [t, n] of [...c.entries()].sort((a, b) => b[1] - a[1])) {
      opts.push([t, `${t}（${n}）`]);
      if (t === '稅法') {
        for (const [s, m] of [...sub.entries()].sort((a, b) => b[1] - a[1])) opts.push([s, `└ ${s}（${m}）`]);
      }
    }
    return { topicOptions: opts, subtopicSet: new Set(sub.keys()) };
  }, []);

  const decades = useMemo(() => {
    const s = new Set(docs.map((d) => d.日期?.slice(0, 3)).filter(Boolean));
    return [...s].sort().map((p) => `${p}0`);
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim();
    return docs.filter((d) => {
      if (type !== '全部' && d.類型 !== type) return false;
      if (topic !== '全部') {
        if (subtopicSet.has(topic) ? !d.子主題?.includes(topic) : !d.主題.includes(topic)) return false;
      }
      if (outcome !== '全部') {
        const c = d.審查結論?.結論 ?? '未分類';
        if (outcome === '違憲（含定期失效）' ? !c.startsWith('違憲') : c !== outcome) return false;
      }
      if (standard !== '全部' && (d.審查基準?.基準 ?? '') !== standard) return false;
      if (decade !== '全部' && d.日期?.slice(0, 3) !== decade.slice(0, 3)) return false;
      if (kw && !(d.字號.includes(kw) || d.爭點.includes(kw) || d.主文.includes(kw) || d.系爭法令?.some((x) => x.includes(kw)) || d.原理原則.some((x) => x.includes(kw)))) return false;
      return true;
    });
  }, [type, topic, outcome, standard, decade, q, subtopicSet]);

  const shown = filtered.slice(0, limit);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="sticky top-[49px] z-10 -mx-4 border-b border-[var(--cc-line)] bg-[var(--cc-bg)]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-[var(--cc-border)] bg-white px-2.5 py-1.5">
            <Search size={13} className="text-[var(--cc-eyebrow)]" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(30); }}
              placeholder="搜尋字號、爭點、主文、系爭法令、原理原則"
              className="w-full bg-transparent text-[12px] text-[var(--cc-ink-strong)] placeholder-[var(--cc-placeholder)] focus:outline-none"
            />
          </label>
          <Select label="類型" value={type} onChange={(v) => { setType(v); setLimit(30); }} options={[['全部', '全部'], ['解釋', '釋字解釋'], ['判決', '憲法法庭判決'], ['實體裁定', '實體裁定']]} />
          <Select label="主題" value={topic} onChange={(v) => { setTopic(v); setLimit(30); }} options={[['全部', '全部'], ...topicOptions]} />
          <Select label="結論" value={outcome} onChange={(v) => { setOutcome(v); setLimit(30); }} options={[['全部', '全部'], ['違憲（含定期失效）', '違憲（含定期失效）'], ['合憲', '合憲'], ['其他/待人工', '待人工判讀']]} />
          <Select label="審查基準" value={standard} onChange={(v) => { setStandard(v); setLimit(30); }} options={[['全部', '全部'], ['嚴格', '嚴格'], ['中度', '中度'], ['寬鬆', '寬鬆'], ['多重（待人工）', '多重（待人工）'], ['未明示', '未明示']]} />
          <Select label="年代" value={decade} onChange={(v) => { setDecade(v); setLimit(30); }} options={[['全部', '全部'], ...decades.map((d) => [d, `${d} 年代`])]} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--cc-ink-soft)]">
          <span className="font-bold text-[var(--cc-ink-strong)]">符合 {filtered.length} 件</span>
          <span className="text-[var(--cc-eyebrow)]">匯出目前篩選集：</span>
          <button onClick={() => downloadFile(toCsv(filtered), `憲法案件_${stamp}.csv`, 'text/csv')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />CSV</button>
          <button onClick={() => downloadFile(JSON.stringify(filtered, null, 1), `憲法案件_${stamp}.json`, 'application/json')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />JSON</button>
          <button onClick={() => downloadFile(toBibtex(filtered), `憲法案件_${stamp}.bib`, 'text/plain')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />BibTeX</button>
          <button onClick={() => downloadFile(filtered.map(citeString).join('\n'), `引註清單_${stamp}.txt`, 'text/plain')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />引註清單</button>
          <button onClick={() => downloadFile(toManifest(filtered), `下載清單_${stamp}.json`, 'application/json')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]"><Download size={11} />批次下載清單</button>
        </div>
      </div>

      {shown.map((d) => (
        <CaseCard key={d.字號} d={d} />
      ))}
      {filtered.length > limit ? (
        <div className="py-6 text-center">
          <button
            onClick={() => setLimit(limit + 50)}
            className="rounded-lg border border-[var(--cc-border)] bg-white px-5 py-2 text-[12px] font-bold text-[var(--cc-accent)] hover:bg-[var(--cc-hover-bg)]"
          >
            顯示更多（尚有 {filtered.length - limit} 件）
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TimelineView() {
  const [hover, setHover] = useState(null);
  const byYear = useMemo(() => {
    const m = new Map();
    for (const d of docs) {
      if (!d.日期) continue;
      const y = Number(d.日期.slice(0, 4));
      if (!m.has(y)) m.set(y, { 解釋: 0, 判決: 0, 實體裁定: 0 });
      m.get(y)[d.類型]++;
    }
    return m;
  }, []);
  const years = [...byYear.keys()].sort();
  const y0 = years[0];
  const y1 = years[years.length - 1];
  const span = [];
  for (let y = y0; y <= y1; y++) span.push(y);
  const max = Math.max(...[...byYear.values()].map((v) => v.解釋 + v.判決 + v.實體裁定));

  const W = 12;
  const H = 190;
  const chartW = span.length * W;

  const cited = useMemo(() => {
    const c = new Map();
    for (const e of citeEdges) c.set(e.引, (c.get(e.引) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, []);
  const docByNo = useMemo(() => new Map(docs.map((d) => [d.字號, d])), []);

  return (
    <div>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">年度密度</p>
        <h2 className="text-base font-bold text-[var(--cc-title-ink)]">每年作成件數（1949–{y1}）</h2>
        <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-[var(--cc-ink-soft)]">
          {Object.entries(TYPE_COLOR).map(([k, c]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
              {k === '解釋' ? '大法官解釋' : k === '判決' ? '憲法法庭判決' : '實體裁定'}
            </span>
          ))}
        </div>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={chartW + 40} height={H + 40} role="img" aria-label="每年案件數長條圖">
            {span.map((y, i) => {
              const v = byYear.get(y) ?? { 解釋: 0, 判決: 0, 實體裁定: 0 };
              const total = v.解釋 + v.判決 + v.實體裁定;
              let acc = 0;
              return (
                <g key={y} transform={`translate(${i * W + 20}, 0)`}
                  onMouseEnter={() => setHover({ y, ...v, total })}
                  onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={0} width={W} height={H} fill="transparent" />
                  {['解釋', '判決', '實體裁定'].map((k) => {
                    if (!v[k]) return null;
                    const h = (v[k] / max) * (H - 10);
                    acc += h;
                    return <rect key={k} x={1.5} y={H - acc} width={W - 3} height={Math.max(h - 2, 1)} rx={2} fill={TYPE_COLOR[k]} opacity={hover && hover.y !== y ? 0.45 : 1} />;
                  })}
                  {y % 10 === 0 ? (
                    <text x={W / 2} y={H + 16} textAnchor="middle" fontSize={10} fill="var(--cc-axis-text)">{y}</text>
                  ) : null}
                  {y === 2022 ? (
                    <>
                      <line x1={0} y1={6} x2={0} y2={H} stroke="var(--cc-type-judgment)" strokeDasharray="3 3" strokeWidth={1} />
                      <text x={3} y={12} fontSize={9} fill="var(--cc-type-judgment)">憲訴法施行</text>
                    </>
                  ) : null}
                </g>
              );
            })}
          </svg>
          {hover ? (
            <div className="pointer-events-none absolute left-4 top-1 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[11px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{hover.y} 年</strong>　共 {hover.total} 件
              {hover.解釋 ? `　解釋 ${hover.解釋}` : ''}{hover.判決 ? `　判決 ${hover.判決}` : ''}{hover.實體裁定 ? `　裁定 ${hover.實體裁定}` : ''}
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-[var(--cc-ink-soft)]">
          2022 年 1 月 4 日憲法訴訟法施行後，大法官解釋制度走入歷史，改由憲法法庭以判決與裁定行使職權；2024 年底起因大法官人數不足，作成件數明顯下降。
        </p>
      </section>

      <TopicHeatmaps />

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">引用網絡</p>
        <h2 className="text-base font-bold text-[var(--cc-title-ink)]">被後案引用最多的解釋（官方「相關法令」欄互引統計）</h2>
        <div className="mt-3 max-w-3xl divide-y divide-[var(--cc-line)]">
          {cited.map(([no, n]) => {
            const d = docByNo.get(no);
            return (
              <div key={no} className="grid items-baseline gap-2 py-2 sm:grid-cols-[130px_56px_1fr]">
                {d ? (
                  <a href={d.官方頁} target="_blank" rel="noreferrer" className="text-[12.5px] font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">{no}</a>
                ) : (
                  <span className="text-[12.5px] font-bold text-[var(--cc-ink-strong)]">{no}</span>
                )}
                <span className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{n} 次</span>
                <span className="text-[11.5px] leading-relaxed text-[var(--cc-ink-soft)]">{d?.爭點?.slice(0, 56) ?? ''}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// 熱圖單一色相深淺（量的編碼）：頁面主色 plum，sqrt 比例讓低值仍可辨
const heatFill = (v, max) => (v ? `hsl(338 34% ${94 - 58 * Math.sqrt(v / max)}%)` : 'var(--cc-heat-zero)');

function TopicHeatmaps() {
  const [cell, setCell] = useState(null);

  const { topics, bins, grid, maxCell } = useMemo(() => {
    const counts = new Map();
    for (const d of docs) for (const t of d.主題) counts.set(t, (counts.get(t) ?? 0) + 1);
    const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
    const years = docs.map((d) => d.日期 && Number(d.日期.slice(0, 4))).filter(Boolean);
    const b0 = Math.floor(Math.min(...years) / 5) * 5;
    const b1 = Math.floor(Math.max(...years) / 5) * 5;
    const bins = [];
    for (let b = b0; b <= b1; b += 5) bins.push(b);
    const grid = new Map();
    for (const d of docs) {
      if (!d.日期) continue;
      const b = Math.floor(Number(d.日期.slice(0, 4)) / 5) * 5;
      for (const t of d.主題) {
        const k = `${t}|${b}`;
        grid.set(k, (grid.get(k) ?? 0) + 1);
      }
    }
    return { topics, bins, grid, maxCell: Math.max(...grid.values()) };
  }, []);

  const outcomes = ['違憲', '違憲定期失效', '合憲', '其他/待人工'];
  const { oGrid, oMax } = useMemo(() => {
    const g = new Map();
    for (const d of docs) {
      let c = d.審查結論?.結論 ?? '未分類';
      if (c === '違憲即失效') c = '違憲';
      if (c === '未分類') c = '其他/待人工';
      for (const t of d.主題) g.set(`${t}|${c}`, (g.get(`${t}|${c}`) ?? 0) + 1);
    }
    return { oGrid: g, oMax: Math.max(...g.values()) };
  }, []);

  const LABEL_W = 130;
  const CW = 17;
  const RH = 17;
  const H = topics.length * RH;

  return (
    <>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×年代</p>
        <h2 className="text-base font-bold text-[var(--cc-title-ink)]">哪個年代在吵哪些問題（每 5 年一格，色深＝件數）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={LABEL_W + bins.length * CW + 12} height={H + 26} role="img" aria-label="主題與年代分布熱圖">
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + 3.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {bins.map((b, c) => (b % 10 === 0 ? (
              <text key={b} x={LABEL_W + c * CW + CW / 2} y={H + 16} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{b}</text>
            ) : null))}
            {topics.map((t, r) => bins.map((b, c) => {
              const v = grid.get(`${t}|${b}`) ?? 0;
              return (
                <rect
                  key={`${t}${b}`}
                  x={LABEL_W + c * CW} y={r * RH}
                  width={CW - 2} height={RH - 2} rx={3}
                  fill={heatFill(v, maxCell)}
                  stroke={cell?.t === t && cell?.b === b ? 'var(--cc-highlight)' : 'none'}
                  strokeWidth={1.5}
                  onMouseEnter={() => setCell({ t, b, v, kind: 'year' })}
                  onMouseLeave={() => setCell(null)}
                />
              );
            }))}
          </svg>
          {cell?.kind === 'year' ? (
            <div className="pointer-events-none absolute left-4 top-0 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[11px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{cell.t}</strong>　{cell.b}–{cell.b + 4} 年　<strong className="text-[var(--cc-accent)]">{cell.v} 件</strong>
            </div>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10.5px] text-[var(--cc-ink-soft)]">
          少
          {[0.08, 0.25, 0.5, 0.75, 1].map((f) => (
            <span key={f} className="inline-block h-3 w-3 rounded-[3px]" style={{ background: heatFill(f * maxCell, maxCell) }} />
          ))}
          多（單格最高 {maxCell} 件）
        </div>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×審查結論</p>
        <h2 className="text-base font-bold text-[var(--cc-title-ink)]">哪些領域最常被宣告違憲（機標結論，待人工欄為尚未覆核件）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={LABEL_W + outcomes.length * 74 + 12} height={H + 30} role="img" aria-label="主題與審查結論矩陣">
            {outcomes.map((o, c) => (
              <text key={o} x={LABEL_W + c * 74 + 34} y={12} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--cc-table-head-ink)">{o === '其他/待人工' ? '待人工' : o}</text>
            ))}
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + 21.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {topics.map((t, r) => outcomes.map((o, c) => {
              const v = oGrid.get(`${t}|${o}`) ?? 0;
              const dark = Math.sqrt(v / oMax) > 0.55;
              return (
                <g key={`${t}${o}`}>
                  <rect
                    x={LABEL_W + c * 74} y={r * RH + 18}
                    width={68} height={RH - 2} rx={3}
                    fill={heatFill(v, oMax)}
                    onMouseEnter={() => setCell({ t, o, v, kind: 'outcome' })}
                    onMouseLeave={() => setCell(null)}
                  />
                  {v ? (
                    <text x={LABEL_W + c * 74 + 34} y={r * RH + 18 + RH / 2 + 3} textAnchor="middle" fontSize={9.5} fill={dark ? 'var(--cc-heat-text-light)' : 'var(--cc-heat-text-dark)'} pointerEvents="none">{v}</text>
                  ) : null}
                </g>
              );
            }))}
          </svg>
          {cell?.kind === 'outcome' ? (
            <div className="pointer-events-none absolute left-4 top-0 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[11px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{cell.t}</strong>　{cell.o}　<strong className="text-[var(--cc-accent)]">{cell.v} 件</strong>
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-[var(--cc-ink-soft)]">
          審查結論為文字規則機標（違憲即失效併入違憲欄），僅供分布觀察；個案請以卡片上的官方連結查證原文。
        </p>
      </section>
    </>
  );
}

function JusticesView({ onOpen }) {
  const [sortKey, setSortKey] = useState('提出意見書');
  const list = useMemo(
    () => [...justices].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0)),
    [sortKey],
  );
  const max = Math.max(...justices.map((j) => j.提出意見書));

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">逐人統計</p>
          <h2 className="text-base font-bold text-[var(--cc-title-ink)]">大法官意見書行為（{justices.length} 位，來源：官方意見書檔名與判決欄位）</h2>
        </div>
        <Select label="排序" value={sortKey} onChange={setSortKey} options={[['提出意見書', '提出意見書數'], ['加入意見書', '加入意見書數'], ['主筆判決', '主筆判決數'], ['參與判決', '參與判決數']]} />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--cc-table-border)]">
        <table className="w-full min-w-[760px] border-collapse bg-white text-left text-[11.5px]">
          <thead className="bg-[var(--cc-hover-bg)] text-[var(--cc-table-head-ink)]">
            <tr>
              <th className="px-3 py-2">大法官</th>
              <th className="px-3 py-2">提出意見書</th>
              <th className="px-3 py-2 w-[180px]"></th>
              <th className="px-3 py-2">加入意見書</th>
              <th className="px-3 py-2">主筆判決</th>
              <th className="px-3 py-2">參與判決</th>
              <th className="px-3 py-2">意見書類型</th>
            </tr>
          </thead>
          <tbody>
            {list.map((j) => (
              <tr key={j.姓名} className="border-t border-[var(--cc-row-border)]">
                <td className="px-3 py-2">
                  <button onClick={() => onOpen?.(j.姓名)} className="font-bold text-[var(--cc-ink-heavy)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{j.姓名}</button>
                </td>
                <td className="px-3 py-2 font-bold text-[var(--cc-accent)]">{j.提出意見書}</td>
                <td className="px-3 py-2">
                  <div className="h-1.5 rounded-full bg-[var(--cc-track)]">
                    <div className="h-1.5 rounded-full" style={{ width: `${(j.提出意見書 / max) * 100}%`, background: 'var(--cc-highlight)' }} />
                  </div>
                </td>
                <td className="px-3 py-2 text-[var(--cc-ink-mid)]">{j.加入意見書}</td>
                <td className="px-3 py-2 text-[var(--cc-ink-mid)]">{j.主筆判決 || '—'}</td>
                <td className="px-3 py-2 text-[var(--cc-ink-mid)]">{j.參與判決 || '—'}</td>
                <td className="px-3 py-2 text-[var(--cc-ink-soft)]">
                  {Object.entries(j.意見書類型 ?? {}).map(([k, v]) => `${k.replace('意見書', '')} ${v}`).join('・') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-[var(--cc-ink-soft)]">
        統計基礎：{data.統計.總數} 件案件中具名的大法官意見書。屆次、任期、提名總統與出身欄位整理中；主筆與參與欄位僅新制憲法法庭判決有官方記載，釋字時期無此欄。
      </p>
    </section>
  );
}

// 大法官個人頁（?tab=justices&j=姓名）：基本資料、意見書清單、參與判決、共同具名、打包匯出
function JusticeDetail({ name, onBack, onOpen }) {
  const j = justices.find((x) => x.姓名 === name);

  const opinions = useMemo(() => {
    const ops = [];
    for (const d of docs) {
      for (const op of d.意見書) {
        if (op.作者類別 !== '大法官') continue;
        const role = op.提出?.includes(name) ? '提出' : op.加入?.includes(name) ? '加入' : null;
        if (role) ops.push({ d, op, role });
      }
    }
    return ops.sort((a, b) => (b.d.日期 ?? '').localeCompare(a.d.日期 ?? ''));
  }, [name]);

  const participated = useMemo(
    () => docs.filter((d) => d.參與大法官?.includes(name)).sort((a, b) => (b.日期 ?? '').localeCompare(a.日期 ?? '')),
    [name],
  );

  const partners = useMemo(() => coSign
    .filter((e) => e.甲 === name || e.乙 === name)
    .map((e) => ({ 對象: e.甲 === name ? e.乙 : e.甲, 次數: e.次數 }))
    .sort((a, b) => b.次數 - a.次數), [name]);

  const involvedCases = useMemo(() => {
    const m = new Map();
    for (const { d } of opinions) m.set(d.字號, d);
    for (const d of participated) m.set(d.字號, d);
    return [...m.values()].sort((a, b) => (b.日期 ?? '').localeCompare(a.日期 ?? ''));
  }, [opinions, participated]);

  if (!j) {
    return (
      <div className="py-8">
        <button onClick={onBack} className="text-[12px] font-bold text-[var(--cc-accent)] hover:underline">← 回大法官總覽</button>
        <p className="mt-4 text-[13px] text-[var(--cc-ink-mid)]">名冊裡查無「{name}」。</p>
      </div>
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const opinionCite = ({ d, op }) =>
    `${citeString(d).replace(/（.*?）$/, '')}${(op.提出 ?? []).join('、')}大法官${op.類型}${d.日期 ? `（${d.日期}）` : ''}`;
  const exportCites = () => downloadFile(
    [...opinions.map(opinionCite), ...participated.map(citeString)].join('\n'),
    `${name}_引註清單_${stamp}.txt`, 'text/plain',
  );
  const exportBib = () => downloadFile(toBibtex(involvedCases), `${name}_案件_${stamp}.bib`, 'text/plain');
  const exportManifest = () => downloadFile(JSON.stringify({
    說明: '此清單供本機批次下載使用：到資料庫 repo 執行 npm run fetch-batch -- --manifest <本檔>',
    大法官: name,
    產生時間: new Date().toISOString(),
    文件: involvedCases.map((d) => ({
      字號: d.字號,
      官方頁: d.官方頁,
      意見書: d.意見書
        .filter((op) => op.提出?.includes(name) || op.加入?.includes(name))
        .map((op) => ({ 文件名: op.文件名, 下載網址: op.下載網址 })),
      ...(d.立場表下載 && d.參與大法官?.includes(name) ? { 立場表: d.立場表下載 } : {}),
    })),
  }, null, 1), `${name}_下載清單_${stamp}.json`, 'application/json');

  const tenureText = (j.任期 ?? [])
    .map((t) => `${t.職 !== '大法官' ? `${t.職} ` : ''}${String(t.起)}–${t.訖 ? String(t.訖) : '現任'}`)
    .join('；');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cc-line)] py-4">
        <button onClick={onBack} className="text-[12px] font-bold text-[var(--cc-accent)] hover:underline">← 回大法官總覽</button>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="text-[var(--cc-eyebrow)]">打包這位大法官的全部資料：</span>
          <button onClick={exportCites} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />引註清單</button>
          <button onClick={exportBib} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />BibTeX</button>
          <button onClick={exportManifest} className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]"><Download size={11} />批次下載清單</button>
        </div>
      </div>

      <section className="py-5">
        <h2 className="text-2xl font-bold text-[var(--cc-heading)]">{j.姓名}</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[var(--cc-ink-mid)]">
          {j.屆次?.length ? <span><strong className="text-[var(--cc-accent)]">屆次</strong>　{j.屆次.join('、')}</span> : null}
          {tenureText ? <span><strong className="text-[var(--cc-accent)]">任期</strong>　{tenureText}{j.任期來源 !== '簡歷頁' ? `（${j.任期來源}）` : ''}</span> : null}
          {j.提名總統 ? <span><strong className="text-[var(--cc-accent)]">提名</strong>　{j.提名總統}{j.提名總統標註 === '依就任日推定' ? '（推定）' : ''}</span> : null}
          {j.出身 && j.出身 !== '待確認' ? <span><strong className="text-[var(--cc-accent)]">出身</strong>　{j.出身}</span> : null}
          {j.留學國 ? <span><strong className="text-[var(--cc-accent)]">留學</strong>　{j.留學國}</span> : null}
          {j.性別 === '女' ? <span><strong className="text-[var(--cc-accent)]">性別</strong>　女</span> : null}
          {j.簡歷頁 ? (
            <a href={j.簡歷頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
              官方簡歷 <ExternalLink size={11} />
            </a>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
          {[['提出意見書', j.提出意見書], ['加入意見書', j.加入意見書], ['主筆判決', j.主筆判決], ['參與判決', j.參與判決]].map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold text-[var(--cc-icon)]">{label}</span>
              <span className="font-display text-lg font-bold text-[var(--cc-ink)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {opinions.length ? (
        <section className="border-t border-[var(--cc-line)] py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">意見書 {opinions.length} 份</p>
          <h3 className="text-base font-bold text-[var(--cc-title-ink)]">
            {Object.entries(j.意見書類型 ?? {}).map(([k, v]) => `${k.replace('意見書', '')} ${v}`).join('・') || '意見書'}
          </h3>
          <div className="mt-2 divide-y divide-[var(--cc-row-border)]">
            {opinions.map(({ d, op, role }, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 text-[12px]">
                <span className="w-[76px] text-[11px] text-[var(--cc-figure-note)]">{d.日期}</span>
                <a href={d.官方頁} target="_blank" rel="noreferrer" className="w-[130px] font-bold text-[var(--cc-ink-strong)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{d.字號}</a>
                <Badge tone={op.類型.includes('不同') ? 'red' : op.類型.includes('協同') ? 'blue' : 'slate'}>{op.類型}</Badge>
                {role === '加入' ? <Badge tone="slate">加入</Badge> : null}
                {op.收於抄本 ? <Badge tone="gold">收於抄本</Badge> : null}
                <span className="max-w-[400px] truncate text-[11px] text-[var(--cc-ink-soft)]">{d.爭點?.slice(0, 40)}</span>
                <a href={op.下載網址} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">PDF <ExternalLink size={10} /></a>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {participated.length ? (
        <section className="border-t border-[var(--cc-line)] py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">參與裁判 {participated.length} 件（憲法法庭時期）</p>
          <div className="mt-2 divide-y divide-[var(--cc-row-border)]">
            {participated.map((d) => (
              <div key={d.字號} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 text-[12px]">
                <span className="w-[76px] text-[11px] text-[var(--cc-figure-note)]">{d.日期}</span>
                <a href={d.官方頁} target="_blank" rel="noreferrer" className="w-[130px] font-bold text-[var(--cc-ink-strong)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{d.字號}</a>
                {d.主筆 === name ? <Badge tone="plum">主筆</Badge> : null}
                {d.審查結論?.結論 && d.審查結論.結論 !== '未分類' ? (
                  <Badge tone={OUTCOME_TONE[d.審查結論.結論] ?? 'slate'}>{d.審查結論.結論 === '其他/待人工' ? '待人工' : d.審查結論.結論}</Badge>
                ) : null}
                <span className="max-w-[440px] truncate text-[11px] text-[var(--cc-ink-soft)]">{d.爭點?.slice(0, 44)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {partners.length ? (
        <section className="border-t border-[var(--cc-line)] py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">共同具名對象</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {partners.map((p) => (
              <button key={p.對象} onClick={() => onOpen(p.對象)}
                className="rounded-md border border-[var(--cc-border)] bg-white px-2.5 py-1 text-[11.5px] font-bold text-[var(--cc-accent)] hover:bg-[var(--cc-hover-bg)]">
                {p.對象} × {p.次數}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <p className="border-t border-[var(--cc-line)] py-4 text-[11px] leading-relaxed text-[var(--cc-ink-soft)]">
        意見書清單解析自官方附件檔名；「收於抄本」表示該意見書僅收於全案合訂 PDF。參與裁判僅憲法法庭時期
        （2022 起）有官方合議庭記載，釋字時期的參與名單待屆次名冊回填。批次下載清單需回研究資料庫執行
        <code className="mx-1 rounded bg-[var(--cc-hover-bg)] px-1">npm run fetch-batch -- --manifest</code>下載官方 PDF。
      </p>
    </div>
  );
}

// 任期時間軸（生涯甘特圖）。124 人官方名冊＋簡歷/屆次/人工核定三層任期。
// 著色四色已跑過 dataviz palette 驗證（light surface）。
const TENURE_BG_COLOR = { // token-exempt: dataviz categorical palette, validated
  學者: '#a84f6e', 法官: '#5a5fb0', 律師: '#3f7d44', 檢察官: '#a06a1f', 待確認: '#b3a8ad',
};
// 留學地分群：null 再分「國內」（逐人查核確認無外國學位）與「待確認」（查不到可靠線索）
const ABROAD_GROUP = (j) => {
  const c = j.留學國;
  if (c === '德國' || c === '奧地利' || c === '瑞士') return '德語圈';
  if (c === '美國' || c === '英國') return '英美';
  if (c === '日本') return '日本';
  if (c) return '其他';
  return (j.留學國來源 ?? '').includes('查核') ? '國內' : '待確認';
};
const TENURE_ABROAD_COLOR = { // token-exempt: dataviz categorical palette, validated
  德語圈: '#a84f6e', 英美: '#5a5fb0', 日本: '#3f7d44', 其他: '#a06a1f', 國內: '#b3a8ad', 待確認: '#b3a8ad',
};
// 提名總統 8 色（依年代固定順序指派；dataviz validator 通過，CVD 落在 8–12 警戒帶，
// 靠總統背景帶＋tooltip 作輔助編碼）token-exempt: dataviz categorical palette, validated
const PRES_COLOR = {
  蔣中正: '#a84f6e', '李宗仁（代）': '#5a5fb0', 嚴家淦: '#3f7d44', 蔣經國: '#a06a1f',
  李登輝: '#0e7fa8', 陳水扁: '#7a4fa8', 馬英九: '#b3435c', 蔡英文: '#5f7a2f', 賴清德: '#b3a8ad',
};

function tenureYear(s, isEnd) {
  if (!s) return null;
  const str = String(s);
  const y = Number(str.slice(0, 4));
  const m = str.length >= 7 ? Number(str.slice(5, 7)) : (isEnd ? 12 : 1);
  return y + (m - 0.5) / 12;
}

function TenureView({ onOpen }) {
  const [colorBy, setColorBy] = useState('出身');
  const [onlyAuthors, setOnlyAuthors] = useState(false);
  const [hover, setHover] = useState(null);

  const rows = useMemo(() => {
    const list = justices
      .filter((j) => j.任期?.length)
      .map((j) => ({ ...j, start: tenureYear(j.任期[0].起, false) }))
      .sort((a, b) => a.start - b.start || a.姓名.localeCompare(b.姓名));
    return onlyAuthors ? list.filter((j) => j.提出意見書 + j.加入意見書 > 0) : list;
  }, [onlyAuthors]);

  const Y0 = 1948, Y1 = 2027;
  const ROW = 14, LABEL = 62, CHART = 830, COUNT = 52;
  const H = rows.length * ROW;
  const x = (yr) => LABEL + ((yr - Y0) / (Y1 - Y0)) * CHART;
  const maxOps = Math.max(...justices.map((j) => j.提出意見書 + j.加入意見書), 1);
  const colorOf = (j) => (colorBy === '出身'
    ? TENURE_BG_COLOR[j.出身] ?? TENURE_BG_COLOR.待確認
    : colorBy === '提名總統'
      ? PRES_COLOR[j.提名總統] ?? TENURE_BG_COLOR.待確認
      : TENURE_ABROAD_COLOR[ABROAD_GROUP(j)]);
  // 留學地「待確認」畫空心條（描邊無填滿），與「國內」灰實心區分
  const isHollow = (j) => colorBy === '留學國' && ABROAD_GROUP(j) === '待確認';
  const legend = colorBy === '出身' ? TENURE_BG_COLOR : colorBy === '提名總統' ? PRES_COLOR : TENURE_ABROAD_COLOR;

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">制度 77 年</p>
          <h2 className="text-base font-bold text-[var(--cc-title-ink)]">歷任大法官任期時間軸（{rows.length} 人）</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select label="著色" value={colorBy} onChange={setColorBy} options={[['出身', '按出身'], ['留學國', '按留學地'], ['提名總統', '按提名總統']]} />
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--cc-ink-soft)]">
            <input type="checkbox" checked={onlyAuthors} onChange={(e) => setOnlyAuthors(e.target.checked)} />
            僅顯示有具名意見書者
          </label>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--cc-ink-soft)]">
        {Object.entries(legend).map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            {colorBy === '留學國' && k === '待確認'
              ? <span className="h-2.5 w-2.5 rounded-sm border" style={{ borderColor: c }} />
              : <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />}
            {k}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <svg width={11} height={11} aria-hidden>
            <rect width={11} height={11} rx={2} fill="var(--cc-dim-text)" />
            <path d="M-2 5 l8 -8 M0 13 l13 -13 M6 13 l8 -8" stroke="var(--cc-bg)" strokeWidth={1.6} />
          </svg>
          斜紋＝女性大法官
        </span>
        <span className="ml-2">右欄細條＝具名意見書數；底色帶＝總統任期</span>
      </div>

      {/* 圖已攤開全高，資訊列 sticky 貼在頁面導覽下緣，滾到圖底仍看得到 */}
      <div className="sticky top-[49px] z-10 mt-2 rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg)]/95 px-3 py-1.5 text-[11.5px] backdrop-blur">
        {hover ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-[var(--cc-ink-strong)]">
            <strong>{hover.姓名}</strong>
            <span>{hover.任期.map((t) => `${t.職 !== '大法官' ? `${t.職} ` : ''}${String(t.起)}–${t.訖 ? String(t.訖) : '現任'}`).join('；')}</span>
            <span><span className="text-[var(--cc-ink-soft)]">出身</span> {hover.出身}</span>
            <span><span className="text-[var(--cc-ink-soft)]">留學</span> {hover.留學國 ?? ((hover.留學國來源 ?? '').includes('查核') ? '無（國內）' : '待確認')}</span>
            {hover.提名總統 ? <span><span className="text-[var(--cc-ink-soft)]">提名</span> {hover.提名總統}</span> : null}
            {hover.性別 === '女' ? <span><span className="text-[var(--cc-ink-soft)]">性別</span> 女</span> : null}
            {hover.提出意見書 + hover.加入意見書 > 0
              ? <span><span className="text-[var(--cc-ink-soft)]">意見書</span> 提出 {hover.提出意見書}／加入 {hover.加入意見書}</span>
              : null}
            {hover.任期來源 !== '簡歷頁' ? <span className="text-[var(--cc-ink-soft)]">（任期{hover.任期來源}）</span> : null}
          </div>
        ) : (
          <span className="text-[var(--cc-ink-soft)]">游標移到列上看任期細節；點姓名開個人頁（意見書清單、參與裁判與打包下載）。</span>
        )}
      </div>

      <div className="mt-1 overflow-x-auto">
        <div style={{ width: LABEL + CHART + COUNT + 10 }}>
          <svg width={LABEL + CHART + COUNT + 10} height={H + 50} role="img" aria-label="歷任大法官任期甘特圖">
            <defs>
              {/* 女性大法官的 45° 斜紋覆層：紙色細線疊在任何 bar 色上都可辨（非僅顏色編碼） */}
              <pattern id="tenure-hatch-f" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={4} stroke="var(--cc-bg)" strokeWidth={1.6} />
              </pattern>
            </defs>
            {/* 總統任期背景直帶（交錯淡染＋帶頂總統名） */}
            {presidents.map((p, i) => {
              const a = Math.max(tenureYear(p.起, false), Y0);
              const b = Math.min(p.訖 === '9999-12-31' ? Y1 : tenureYear(p.訖, true), Y1);
              if (b <= Y0 || a >= Y1) return null;
              const w = x(b) - x(a);
              return (
                <g key={`${p.總統}${p.起}`}>
                  {i % 2 ? <rect x={x(a)} y={18} width={w} height={H + 2} fill="var(--cc-hover-bg)" opacity={0.55} /> : null}
                  {w >= 26 ? (
                    <text x={x(a) + w / 2} y={H + 46} textAnchor="middle" fontSize={8.5} fill="var(--cc-eyebrow)">{p.總統.replace('（代）', '')}</text>
                  ) : null}
                </g>
              );
            })}
            {/* 十年格線 */}
            {Array.from({ length: 8 }, (_, i) => 1950 + i * 10).map((yr) => (
              <g key={yr}>
                <line x1={x(yr)} y1={18} x2={x(yr)} y2={H + 20} stroke="var(--cc-line)" strokeWidth={1} />
                <text x={x(yr)} y={12} textAnchor="middle" fontSize={10} fill="var(--cc-axis-text)">{yr}</text>
                {/* 全圖攤開後頂軸會滾出視野，底部重標一次年份 */}
                <text x={x(yr)} y={H + 33} textAnchor="middle" fontSize={10} fill="var(--cc-axis-text)">{yr}</text>
              </g>
            ))}
            {/* 憲訴法施行 */}
            <line x1={x(2022)} y1={18} x2={x(2022)} y2={H + 20} stroke="var(--cc-type-judgment)" strokeDasharray="3 3" strokeWidth={1} />
            <text x={x(2022) + 3} y={12} fontSize={9} fill="var(--cc-type-judgment)">憲訴法</text>

            {rows.map((j, i) => {
              const y = 20 + i * ROW;
              const dim = hover && hover.姓名 !== j.姓名;
              const ops = j.提出意見書 + j.加入意見書;
              return (
                <g key={j.姓名}
                  onMouseEnter={() => setHover(j)} onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={y} width={LABEL + CHART + COUNT} height={ROW} fill={hover?.姓名 === j.姓名 ? 'var(--cc-hover-bg)' : 'transparent'} />
                  <text x={LABEL - 6} y={y + ROW / 2 + 3.5} textAnchor="end" fontSize={10.5}
                    fontWeight={hover?.姓名 === j.姓名 ? 700 : 500}
                    fill={dim ? 'var(--cc-dim-text)' : 'var(--cc-ink-strong)'} className="cursor-pointer"
                    onClick={() => onOpen?.(j.姓名)}>
                    {j.姓名}
                  </text>
                  {j.任期.map((t, k) => {
                    const a = tenureYear(t.起, false);
                    const b = t.訖 ? tenureYear(t.訖, true) : Y1 - 0.4;
                    const w = Math.max(x(b) - x(a), 2.5);
                    return (
                      <g key={k}>
                        <rect x={x(a)} y={y + 3} width={w} height={ROW - 6} rx={2}
                          fill={isHollow(j) ? 'var(--cc-bg)' : colorOf(j)}
                          stroke={isHollow(j) ? colorOf(j) : 'none'} strokeWidth={isHollow(j) ? 1 : 0}
                          opacity={dim ? 0.25 : t.訖 ? 0.92 : 0.65} />
                        {j.性別 === '女' && !isHollow(j) ? (
                          <rect x={x(a)} y={y + 3} width={w} height={ROW - 6} rx={2}
                            fill="url(#tenure-hatch-f)" opacity={dim ? 0.25 : 1} />
                        ) : null}
                      </g>
                    );
                  })}
                  {ops > 0 ? (
                    <rect x={LABEL + CHART + 6} y={y + 4.5}
                      width={Math.max((ops / maxOps) * (COUNT - 8), 1.5)} height={ROW - 9} rx={1.5}
                      fill="var(--cc-highlight)" opacity={dim ? 0.25 : 0.85} />
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="mt-2 max-w-4xl text-[11px] leading-relaxed text-[var(--cc-ink-soft)]">
        任期資料三層來源：官方個人簡歷（48 人，精確到月日，含早逝、辭職與連任）、官方屆次區間（其餘多數）、
        逐人查核後的人工核定（現任八人與翁岳生、城仲模等特殊任期）。淺色未封口的橫條＝現任。
        出身與留學地由官方經歷與維基百科條目逐人查核標註；留學地「國內」（灰實心）＝查核後確認無外國學位，
        「待確認」（灰空心）＝尚查不到可靠線索。
        提名總統依各段任期起始日反查總統任期推定（人工核定者除外）；性別由維基條目語彙機標（女 14 人），
        無條目的 20 人（多為第一、二屆與部分現任）尚待人工補注，圖上暫不標。
      </p>
    </section>
  );
}

function GraphView() {
  const [selected, setSelected] = useState(null);
  const MIN_EDGE = 2;

  const { nodes, edges } = useMemo(() => {
    const strong = coSign.filter((e) => e.次數 >= MIN_EDGE);
    const names = new Set();
    for (const e of strong) { names.add(e.甲); names.add(e.乙); }
    const arr = [...names].map((n) => justices.find((j) => j.姓名 === n)).filter(Boolean)
      .sort((a, b) => b.提出意見書 + b.加入意見書 - a.提出意見書 - a.加入意見書);
    const R = 200, cx = 260, cy = 250;
    const pos = new Map();
    arr.forEach((j, i) => {
      const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const vertical = Math.abs(cos) <= 0.4;
      const r = 14 + (vertical && i % 2 ? 15 : 0);
      pos.set(j.姓名, {
        x: cx + R * cos,
        y: cy + R * sin,
        lx: r * cos,
        ly: r * sin + 4,
        anchor: cos > 0.4 ? 'start' : cos < -0.4 ? 'end' : 'middle',
      });
    });
    return { nodes: arr.map((j) => ({ ...j, ...pos.get(j.姓名) })), edges: strong.map((e) => ({ ...e, a: pos.get(e.甲), b: pos.get(e.乙) })) };
  }, []);

  const maxEdge = Math.max(...edges.map((e) => e.次數));
  const partners = useMemo(() => {
    if (!selected) return [];
    return coSign
      .filter((e) => e.甲 === selected || e.乙 === selected)
      .map((e) => ({ 對象: e.甲 === selected ? e.乙 : e.甲, 次數: e.次數 }))
      .sort((a, b) => b.次數 - a.次數);
  }, [selected]);

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">共同具名網絡</p>
      <h2 className="text-base font-bold text-[var(--cc-title-ink)]">誰常和誰一起署名意見書（共同具名 ≥ {MIN_EDGE} 次）</h2>
      <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-[var(--cc-ink-soft)]">
        邊的粗細＝兩人共同出現在同一份意見書（提出或加入）的次數。點選姓名可查看合作對象清單；資料來自官方意見書檔名，涵蓋釋字後期與憲法法庭時期。
      </p>
      <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,540px)_1fr]">
        <div className="overflow-x-auto">
          <svg width={520} height={505} role="img" aria-label="大法官共同具名網絡圖">
            {edges.map((e, i) => {
              const active = selected && (e.甲 === selected || e.乙 === selected);
              const dim = selected && !active;
              return (
                <line
                  key={i}
                  x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
                  stroke={active ? 'var(--cc-highlight)' : 'var(--cc-edge-line)'}
                  strokeWidth={0.6 + (e.次數 / maxEdge) * 3.4}
                  opacity={dim ? 0.08 : active ? 0.85 : 0.3}
                />
              );
            })}
            {nodes.map((n) => {
              const active = selected === n.姓名;
              const related = selected && partners.some((p) => p.對象 === n.姓名);
              const dim = selected && !active && !related;
              return (
                <g key={n.姓名} transform={`translate(${n.x}, ${n.y})`} className="cursor-pointer"
                  onClick={() => setSelected(active ? null : n.姓名)}>
                  <circle r={9} fill={active ? 'var(--cc-highlight)' : related ? 'var(--cc-node-related-fill)' : 'var(--cc-node-fill)'} stroke="var(--cc-highlight)" strokeWidth={1.5} opacity={dim ? 0.25 : 1} />
                  <text
                    x={n.lx} y={n.ly}
                    textAnchor={n.anchor}
                    fontSize={11} fontWeight={active ? 700 : 500}
                    fill={dim ? 'var(--cc-dim-text)' : 'var(--cc-ink-strong)'}
                  >
                    {n.姓名}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div>
          {selected ? (
            <div>
              <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">{selected} 的共同具名對象</h3>
              <div className="mt-2 max-w-sm divide-y divide-[var(--cc-line)]">
                {partners.map((p) => (
                  <div key={p.對象} className="grid grid-cols-[80px_44px_1fr] items-center gap-2 py-1.5 text-[12px]">
                    <button onClick={() => setSelected(p.對象)} className="text-left font-bold text-[var(--cc-accent)] hover:underline">{p.對象}</button>
                    <span className="font-bold text-[var(--cc-ink-strong)]">{p.次數} 次</span>
                    <div className="h-1.5 rounded-full bg-[var(--cc-track)]">
                      <div className="h-1.5 rounded-full bg-[var(--cc-highlight)]" style={{ width: `${(p.次數 / partners[0].次數) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">最常共同具名的組合</h3>
              <div className="mt-2 max-w-sm divide-y divide-[var(--cc-line)]">
                {coSign.slice(0, 12).map((e) => (
                  <div key={`${e.甲}${e.乙}`} className="grid grid-cols-[150px_44px_1fr] items-center gap-2 py-1.5 text-[12px]">
                    <span className="font-bold text-[var(--cc-ink-strong)]">{e.甲}・{e.乙}</span>
                    <span className="font-bold text-[var(--cc-accent)]">{e.次數} 次</span>
                    <div className="h-1.5 rounded-full bg-[var(--cc-track)]">
                      <div className="h-1.5 rounded-full bg-[var(--cc-highlight)]" style={{ width: `${(e.次數 / coSign[0].次數) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AboutView() {
  return (
    <div className="max-w-3xl">
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">資料來源</p>
        <h2 className="text-base font-bold text-[var(--cc-title-ink)]">全部資料取自憲法法庭官方網站的公開頁面</h2>
        <div className="mt-2 space-y-2 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          <p>
            收錄範圍：司法院大法官解釋全部 {data.統計.解釋} 件（釋字第 1–813 號，1949–2021）、憲法法庭判決 {data.統計.判決} 件（2022 年憲法訴訟法施行起）、實體裁定 {data.統計.實體裁定} 件（含暫時處分）。程序性不受理裁定未收錄。
          </p>
          <p>
            每件案件的爭點、主文、相關法令、意見書清單與立場表連結均解析自官方頁面；文件下載一律連回官方網站，本站不代管任何檔案副本。
          </p>
          <p>
            主題分類、稅法子主題與審查結論由規則初步標註（卡片上標示「結論待人工判讀」者即尚未人工覆核），意見書作者與共同具名關係解析自官方檔名；早期意見書僅收於抄本合訂檔者，已從抄本檔名拆出（卡片上仍連向抄本 PDF）。中期釋字（約第 100–400 號）的意見書常整卷收於抄本且檔名未列作者，該時期的意見書統計為下限而非全貌。
          </p>
          <p>
            「審查基準」欄依湯德宗三級架構（寬鬆／中度／嚴格）機標：本院自釋字第 578 號起才明確區分寬嚴審查基準，之前案件不標；機標只認理由書明示字樣，多數案件為「未明示」，同案命中多級者標「待人工」。參與大法官名單僅憲法法庭判決與裁定的官方頁有記載，釋字時期需另建大法官屆次名冊回填（整理中）。
          </p>
        </div>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">批次下載</p>
        <h2 className="text-base font-bold text-[var(--cc-title-ink)]">篩選後想把檔案抓回本機讀？</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          瀏覽器無法代替你向官方網站批次下載。作法：在「案件索引」匯出「批次下載清單」，回到研究資料庫在本機執行批次下載命令，官方 PDF 就會下載到本機資料夾。清單裡每一筆都是官方網址，來源可驗證。
        </p>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">更新</p>
        <h2 className="text-base font-bold text-[var(--cc-title-ink)]">資料怎麼保持最新</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          資料庫以官方清單頁差分更新：偵測新公布的判決與裁定、只抓新增案件、重建統計後同步到本頁。本頁資料產生於 {data.產生時間?.slice(0, 10)}。
        </p>
      </section>
    </div>
  );
}

export default function ConstitutionalCourt() {
  // 分頁與大法官個人頁都掛在 URL（?tab=…&j=姓名）：可深連結、可分享、可返回
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') ?? 'index';
  const justiceName = params.get('j');
  const setActive = (id) => setParams(id === 'index' ? {} : { tab: id });
  const openJustice = (name) => setParams({ tab: 'justices', j: name });

  useEffect(() => {
    document.title = justiceName ? `${justiceName}｜憲法法庭案例庫` : '憲法法庭案例庫';
  }, [justiceName]);

  return (
    <div className="min-h-screen bg-[var(--cc-bg)] font-sans text-[var(--cc-ink)]" style={{ ...CC_VARS, paddingBottom: 60 }}>
      <header className="border-b border-[var(--cc-line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-2 font-accent text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow-header)]">
            <Gavel size={13} />
            Constitutional Court Archive
          </div>
          <h1 className="max-w-3xl leading-tight text-[var(--cc-heading)]">
            <span className="font-sans text-2xl font-semibold sm:text-[2.15rem]">憲法法庭案例庫</span>
            <span className="ml-3 align-baseline text-base text-[var(--cc-body-text)]">釋字・憲判・暫時處分</span>
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--cc-body-text)]">
            把官方網站的 {data.統計.總數} 件解釋與裁判做成可檢索的研究工作台：主題與年代篩選、意見書作者與立場、
            共同具名網絡、引用統計，以及可直接進論文的引註與 BibTeX 匯出。
          </p>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            {[
              ['大法官解釋', data.統計.解釋],
              ['憲法法庭判決', data.統計.判決],
              ['實體裁定', data.統計.實體裁定],
              ['具名意見書', docs.reduce((s, d) => s + d.意見書.filter((o) => o.作者類別 === '大法官').length, 0)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-[11px] font-bold text-[var(--cc-icon)]">{label}</span>
                <span className="font-display text-lg font-bold text-[var(--cc-ink)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-[var(--cc-line)] bg-white/94 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition hover:bg-[var(--cc-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cc-highlight)]"
              style={{ background: active === id ? 'var(--cc-tab-active-bg)' : undefined, color: active === id ? 'var(--cc-tab-active-text)' : 'var(--cc-tab-inactive-text)' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {active === 'index' ? <IndexView /> : null}
        {active === 'timeline' ? <TimelineView /> : null}
        {active === 'justices' ? (
          justiceName
            ? <JusticeDetail name={justiceName} onBack={() => setParams({ tab: 'justices' })} onOpen={openJustice} />
            : <JusticesView onOpen={openJustice} />
        ) : null}
        {active === 'tenure' ? <TenureView onOpen={openJustice} /> : null}
        {active === 'graph' ? <GraphView /> : null}
        {active === 'about' ? <AboutView /> : null}
      </main>
    </div>
  );
}
