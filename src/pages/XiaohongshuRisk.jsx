import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  Layers3,
  ListChecks,
  ShieldAlert,
} from 'lucide-react';
import data from '../data/xiaohongshuRisk.json';

const ds = data.datasets;

const tabs = [
  { id: 'overview', label: '問題意識', icon: ShieldAlert },
  { id: 'materials', label: '材料狀態', icon: Database },
  { id: 'patterns', label: '案例樣態', icon: Layers3 },
  { id: 'methods', label: '方法與下一步', icon: ListChecks },
];

const statusLabel = {
  done: '已完成',
  partial: '部分完成',
  not_started: '未開始',
};

const statusTone = {
  done: 'green',
  partial: 'gold',
  not_started: 'slate',
};

const XHS_VARS = { // token-exempt
  '--xhs-bg': '#fbf9f7',
  '--xhs-line': '#e6ded6',
  '--xhs-line-strong': '#d6c8bb',
  '--xhs-ink': '#38332d',
  '--xhs-ink-soft': '#6d6257',
  '--xhs-ink-muted': '#8b7c70',
  '--xhs-accent': '#9b5f4c',
  '--xhs-accent-soft': '#f2e4dd',
  '--xhs-accent-ink': '#7a493a',
  '--xhs-green-bg': '#e7efe4',
  '--xhs-green-ink': '#526c4e',
  '--xhs-gold-bg': '#f3ead8',
  '--xhs-gold-ink': '#806539',
  '--xhs-slate-bg': '#ece9e5',
  '--xhs-slate-ink': '#6c6258',
  '--xhs-red-bg': '#f3dfda',
  '--xhs-red-ink': '#8f4f42',
  '--xhs-bar-track': '#eee7e0',
};

function Badge({ children, tone = 'slate' }) {
  const pairs = {
    green: ['var(--xhs-green-bg)', 'var(--xhs-green-ink)'],
    gold: ['var(--xhs-gold-bg)', 'var(--xhs-gold-ink)'],
    slate: ['var(--xhs-slate-bg)', 'var(--xhs-slate-ink)'],
    red: ['var(--xhs-red-bg)', 'var(--xhs-red-ink)'],
  };
  const [background, color] = pairs[tone] ?? pairs.slate;
  return (
    <span className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold" style={{ background, color }}>
      {children}
    </span>
  );
}

function Panel({ eyebrow, title, icon: Icon, children, aside }) {
  return (
    <section className="border-t border-[var(--xhs-line)] py-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon ? <Icon className="mt-0.5 shrink-0 text-[var(--xhs-accent)]" size={16} /> : null}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--xhs-accent)]">{eyebrow}</p>
            <h2 className="font-sans text-base font-bold leading-tight text-[var(--xhs-ink)]">{title}</h2>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function BarList({ rows, maxRows = 10 }) {
  const shown = rows.slice(0, maxRows);
  const max = Math.max(...shown.map((row) => row.count), 1);
  return (
    <div className="space-y-2">
      {shown.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-token-xs">
            <span className="font-bold text-[var(--xhs-ink)]">{row.label}</span>
            <span className="tabular-nums text-[var(--xhs-ink-muted)]">{row.count}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--xhs-bar-track)]">
            <div
              className="h-2 rounded-full bg-[var(--xhs-accent)]"
              style={{ width: `${Math.max(5, (row.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Kpi({ label, value, note }) {
  return (
    <div className="border-t border-[var(--xhs-line)] py-3">
      <div className="font-sans text-2xl font-bold tabular-nums text-[var(--xhs-ink)]">{value}</div>
      <div className="mt-1 text-token-xs font-bold text-[var(--xhs-accent-ink)]">{label}</div>
      {note ? <div className="mt-1 text-[11px] leading-relaxed text-[var(--xhs-ink-muted)]">{note}</div> : null}
    </div>
  );
}

export default function XiaohongshuRisk() {
  const [activeTab, setActiveTab] = useState('overview');
  const topType = ds.caseTypeDistribution[0];
  const topCity = ds.cityDistribution[0];
  const monthCount = useMemo(() => ds.monthlyDistribution.filter((row) => row.label !== '未標示').length, []);

  return (
    <main className="min-h-screen bg-[var(--xhs-bg)] px-4 py-8 font-sans text-[var(--xhs-ink-soft)] sm:px-6" style={XHS_VARS}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-[var(--xhs-line-strong)] pb-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--xhs-accent)]">Platform Risk</p>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="font-sans text-3xl font-bold leading-tight text-[var(--xhs-ink)] sm:text-4xl">小紅書詐騙風險研究</h1>
              <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-[var(--xhs-ink-soft)]">
                這份研究整理 165 打詐案例與數位素養材料，先看小紅書相關詐騙如何出現、常見話術集中在哪裡，以及哪些材料還需要補強。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <Kpi label="案例筆數" value={ds.summary.caseRecords} note="165 打詐資料" />
              <Kpi label="保存頁面" value={ds.summary.savedDashboardPages} note="原始 HTML" />
              <Kpi label="月份跨度" value={monthCount} note={`${ds.summary.dateCoverage.first} 至 ${ds.summary.dateCoverage.last}`} />
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--xhs-line)] pb-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-token-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--xhs-accent)]"
              style={{
                borderColor: activeTab === id ? 'var(--xhs-accent)' : 'var(--xhs-line)',
                background: activeTab === id ? 'var(--xhs-accent-soft)' : 'transparent',
                color: activeTab === id ? 'var(--xhs-accent-ink)' : 'var(--xhs-ink-soft)',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <Panel eyebrow="judgment" title="值得整理成長期研究頁" icon={CheckCircle2}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="border-t border-[var(--xhs-line)] py-3">
                  <p className="text-token-sm font-bold text-[var(--xhs-ink)]">目前成熟度</p>
                  <p className="mt-2 text-token-xs leading-relaxed">{ds.summary.currentMaturity}</p>
                </div>
                <div className="border-t border-[var(--xhs-line)] py-3">
                  <p className="text-token-sm font-bold text-[var(--xhs-ink)]">最高頻類型</p>
                  <p className="mt-2 text-token-xs leading-relaxed">{topType.label}，共 {topType.count} 筆。</p>
                </div>
                <div className="border-t border-[var(--xhs-line)] py-3">
                  <p className="text-token-sm font-bold text-[var(--xhs-ink)]">最高頻縣市</p>
                  <p className="mt-2 text-token-xs leading-relaxed">{topCity.label}，共 {topCity.count} 筆。</p>
                </div>
              </div>
            </Panel>
            <Panel eyebrow="boundary" title="公開頁面只呈現聚合與去識別摘錄" icon={AlertTriangle}>
              <p className="max-w-3xl text-token-sm leading-relaxed">
                完整案例頁面與帳號線索只作研究留存；公開頁面只呈現聚合結果與去識別摘錄，避免放出原始頁面內容、不必要的內部資訊或未驗證個人資料。
              </p>
            </Panel>
          </>
        )}

        {activeTab === 'materials' && (
          <Panel eyebrow="sources" title="材料覆蓋" icon={Database}>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-token-xs">
                <thead>
                  <tr className="border-b border-[var(--xhs-line)] text-[var(--xhs-accent-ink)]">
                    <th className="py-2 pr-4">來源</th>
                    <th className="py-2 pr-4">材料</th>
                    <th className="py-2 pr-4">數量</th>
                    <th className="py-2 pr-4">狀態</th>
                    <th className="py-2">限制</th>
                  </tr>
                </thead>
                <tbody>
                  {ds.sourceCoverage.map((row) => (
                    <tr key={`${row.sourceClass}-${row.material}`} className="border-b border-[var(--xhs-line)] align-top">
                      <td className="py-3 pr-4 font-bold text-[var(--xhs-ink)]">{row.sourceClass}</td>
                      <td className="py-3 pr-4">{row.material}</td>
                      <td className="py-3 pr-4 tabular-nums">{row.count}</td>
                      <td className="py-3 pr-4"><Badge tone="gold">已保存</Badge></td>
                      <td className="py-3 leading-relaxed">{row.limitation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {activeTab === 'patterns' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel eyebrow="distribution" title="案例標題類型" icon={BarChart3}>
              <BarList rows={ds.caseTypeDistribution} />
            </Panel>
            <Panel eyebrow="geography" title="發布縣市" icon={FileSearch}>
              <BarList rows={ds.cityDistribution} />
            </Panel>
            <Panel eyebrow="typology" title="規則式樣態初分群" icon={Layers3}>
              <div className="space-y-3">
                {ds.scamPatternSummary.map((row) => (
                  <div key={row.label} className="border-t border-[var(--xhs-line)] py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-token-sm font-bold text-[var(--xhs-ink)]">{row.label}</p>
                      <Badge>{row.count} 筆</Badge>
                    </div>
                    <p className="mt-1 text-token-xs leading-relaxed">{row.note}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel eyebrow="samples" title="去識別案例摘錄" icon={FileSearch}>
              <div className="space-y-3">
                {ds.sampleCases.map((item, index) => (
                  <div key={`${item.date}-${index}`} className="border-t border-[var(--xhs-line)] py-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone="red">{item.pattern}</Badge>
                      <span className="text-[11px] text-[var(--xhs-ink-muted)]">{item.date} · {item.city}</span>
                    </div>
                    <p className="text-token-xs font-bold text-[var(--xhs-ink)]">{item.caseType}</p>
                    <p className="mt-1 text-token-xs leading-relaxed">{item.excerpt}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Panel eyebrow="method" title="從材料到可檢查研究" icon={ListChecks}>
              <div className="space-y-3">
                {ds.methodPlan.map((item) => (
                  <div key={item.step} className="border-t border-[var(--xhs-line)] py-3">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-token-sm font-bold text-[var(--xhs-ink)]">{item.step}</p>
                      <Badge tone={statusTone[item.status]}>{statusLabel[item.status] ?? item.status}</Badge>
                    </div>
                    <p className="text-token-xs leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel eyebrow="queue" title="下一輪工作" icon={CheckCircle2}>
              <ol className="space-y-3 text-token-xs leading-relaxed">
                {ds.immediateNextWork.map((item, index) => (
                  <li key={item} className="grid grid-cols-[24px_1fr] gap-2 border-t border-[var(--xhs-line)] pt-3">
                    <span className="font-bold tabular-nums text-[var(--xhs-accent)]">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        )}
      </div>
    </main>
  );
}
