import React, { useState } from 'react';
import {
  BarChart3,
  Clock,
  ExternalLink,
  FileSearch,
  Layers3,
  ListChecks,
  ScanSearch,
  ShieldQuestion,
} from 'lucide-react';
import data from '../data/xiaohongshuRisk.json';

const { source, corpus, structure, layers, eliteracyContext, context, closing, sources } = data;

const tabs = [
  { id: 'question', label: '問題意識', icon: ShieldQuestion },
  { id: 'context', label: '當時發生了什麼', icon: Clock },
  { id: 'layers', label: '三層論證', icon: Layers3 },
  { id: 'limits', label: '界線與待補', icon: ListChecks },
];

const strengthTone = {
  'text-synthesis': 'green',
  'attribution-inflation': 'gold',
  'official-construction': 'slate',
};

const layerIcon = {
  'text-synthesis': FileSearch,
  'attribution-inflation': BarChart3,
  'official-construction': ScanSearch,
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
  '--xhs-bar-fill': '#f6efe9',
  '--xhs-bar-track': '#eee7e0',
};

function Badge({ children, tone = 'slate' }) {
  const pairs = {
    green: ['var(--xhs-green-bg)', 'var(--xhs-green-ink)'],
    gold: ['var(--xhs-gold-bg)', 'var(--xhs-gold-ink)'],
    slate: ['var(--xhs-slate-bg)', 'var(--xhs-slate-ink)'],
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
            {eyebrow ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--xhs-accent)]">{eyebrow}</p>
            ) : null}
            <h2 className="font-sans text-base font-bold leading-tight text-[var(--xhs-ink)]">{title}</h2>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
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

// Pale fill + thin ink keyline; width driven by pct (0–100).
function MetricBar({ label, pct, count, total, note }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-token-xs">
        <span className="font-bold text-[var(--xhs-ink)]">{label}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-[var(--xhs-ink-muted)]">
          <span className="font-bold text-[var(--xhs-accent-ink)]">{pct}%</span>
          {typeof count === 'number' ? <span className="ml-2">{count}/{total}</span> : null}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--xhs-bar-track)]">
        <div
          className="h-2.5 rounded-full border border-[var(--xhs-accent)] bg-[var(--xhs-bar-fill)]"
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
        />
      </div>
      {note ? <p className="mt-1 text-[11px] leading-relaxed text-[var(--xhs-ink-muted)]">{note}</p> : null}
    </div>
  );
}

function BreakdownBars({ rows }) {
  const max = Math.max(...rows.map((r) => r.pct), 1);
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-token-xs">
            <span className="font-bold text-[var(--xhs-ink)]">{row.label}</span>
            <span className="shrink-0 whitespace-nowrap tabular-nums text-[var(--xhs-ink-muted)]">{row.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--xhs-bar-track)]">
            <div
              className="h-2 rounded-full border border-[var(--xhs-accent)] bg-[var(--xhs-bar-fill)]"
              style={{ width: `${Math.max(4, (row.pct / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Excerpt({ item }) {
  return (
    <div className="border-t border-[var(--xhs-line)] py-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge tone="slate">{item.caseType}</Badge>
        <span className="text-[11px] text-[var(--xhs-ink-muted)]">{item.date} · {item.city}</span>
      </div>
      <p className="text-token-xs leading-relaxed text-[var(--xhs-ink-soft)]">{item.excerpt}……</p>
    </div>
  );
}

function LayerCard({ layer }) {
  const Icon = layerIcon[layer.id] ?? Layers3;
  const breakdown = layer.registerSplit ?? layer.vectorBreakdown;
  const breakdownTitle = layer.registerSplit ? '語域分布' : '真正的接觸／金流媒介';
  return (
    <section className="rounded-xl border border-[var(--xhs-line-strong)] bg-white/40 p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className="mt-0.5 shrink-0 text-[var(--xhs-accent)]" size={18} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--xhs-accent)]">
              第 {layer.order} 層
            </p>
            <h2 className="font-sans text-base font-bold leading-snug text-[var(--xhs-ink)] sm:text-lg">
              {layer.claim}
            </h2>
          </div>
        </div>
        <Badge tone={strengthTone[layer.id]}>{layer.strength}</Badge>
      </div>

      <p className="mb-4 text-[11px] leading-relaxed text-[var(--xhs-ink-muted)]">{layer.strengthNote}</p>

      {layer.metrics ? (
        <div className="space-y-3">
          {layer.metrics.map((m) => (
            <MetricBar key={m.label} label={m.label} pct={m.pct} count={m.count} total={m.total} note={m.note} />
          ))}
        </div>
      ) : null}

      {layer.evidence ? (
        <ul className="space-y-2.5">
          {layer.evidence.map((line) => (
            <li key={line} className="grid grid-cols-[14px_1fr] gap-2 text-token-xs leading-relaxed text-[var(--xhs-ink-soft)]">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--xhs-accent)]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {breakdown ? (
        <div className="mt-5 border-t border-[var(--xhs-line)] pt-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--xhs-accent)]">{breakdownTitle}</p>
          <BreakdownBars rows={breakdown} />
        </div>
      ) : null}

      {layer.keyPoint ? (
        <p className="mt-5 rounded-lg bg-[var(--xhs-accent-soft)] px-4 py-3 text-token-sm font-bold leading-relaxed text-[var(--xhs-accent-ink)]">
          {layer.keyPoint}
        </p>
      ) : null}

      {layer.examples ? (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--xhs-accent)]">去識別化摘錄</p>
          {layer.examples.map((item, index) => (
            <Excerpt key={`${layer.id}-${index}`} item={item} />
          ))}
        </div>
      ) : null}

      <p className="mt-4 border-t border-dashed border-[var(--xhs-line)] pt-3 text-[11px] leading-relaxed text-[var(--xhs-ink-muted)]">
        <span className="font-bold text-[var(--xhs-ink-soft)]">本層界線：</span>{layer.weakness}
      </p>
    </section>
  );
}

export default function XiaohongshuRisk() {
  const [activeTab, setActiveTab] = useState('question');
  const layer3 = layers.find((l) => l.id === 'official-construction');

  return (
    <main className="min-h-screen bg-[var(--xhs-bg)] px-4 py-8 font-sans text-[var(--xhs-ink-soft)] sm:px-6" style={XHS_VARS}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-[var(--xhs-line-strong)] pb-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--xhs-accent)]">Credibility Audit</p>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="font-sans text-3xl font-bold leading-tight text-[var(--xhs-ink)] sm:text-4xl">{source.title}</h1>
              <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-[var(--xhs-ink-soft)]">
                {source.question}把這批案例拆開來看，會發現三件事層層疊起：文本先被改寫過、平台歸因靠關鍵字搜出來、最後由官方端聚合成一套敘事。三層的證據強度不同，這裡分層標示，不含混當成同一種確定。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <Kpi label="關鍵字命中案例" value={corpus.caseRecords} note="keyWord=小紅書" />
              <Kpi label="案情中位字數" value={corpus.contentLength.median} note={`最短 ${corpus.contentLength.min}・最長 ${corpus.contentLength.max}`} />
              <Kpi label="保存儀錶板頁" value={corpus.savedDashboardPages} note="原始 HTML" />
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

        {activeTab === 'question' && (
          <>
            <Panel eyebrow="question" title="這個敘事站得住嗎" icon={ShieldQuestion}>
              <p className="max-w-3xl text-token-sm leading-relaxed">
                {source.question}關鍵字搜尋的範圍是 {corpus.keywordSearchScope}。也就是說，「{corpus.caseRecords} 件小紅書詐騙」是對案情自由文字做子字串比對的結果，不是資料庫裡有一個「平台＝小紅書」的欄位。
              </p>
            </Panel>

            <Panel eyebrow="structure" title="資料庫結構上沒有「平台」這個維度" icon={Layers3}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-token-xs font-bold text-[var(--xhs-ink)]">每筆有的欄位</p>
                  <div className="flex flex-wrap gap-2">
                    {structure.perRecordFields.map((f) => (
                      <Badge key={f} tone="slate">{f}</Badge>
                    ))}
                  </div>
                  <p className="mb-2 mt-4 text-token-xs font-bold text-[var(--xhs-ink)]">缺的欄位</p>
                  <div className="flex flex-wrap gap-2">
                    {structure.missingFields.map((f) => (
                      <Badge key={f} tone="gold">{f}</Badge>
                    ))}
                  </div>
                </div>
                <p className="border-l-2 border-[var(--xhs-line-strong)] pl-4 text-token-xs leading-relaxed text-[var(--xhs-ink-soft)]">
                  {structure.note}
                </p>
              </div>
            </Panel>

            <Panel eyebrow="corpus" title="材料範圍" icon={FileSearch}>
              <p className="max-w-3xl text-token-xs leading-relaxed text-[var(--xhs-ink-soft)]">
                後端是 {source.backend}；本頁分析以 {corpus.caseRecords} 筆關鍵字命中案例為主，另留存 {corpus.savedDashboardPages} 份儀錶板頁與 {corpus.eliteracyFiles} 份數位素養素材作脈絡對照。{source.publicBoundary}
              </p>
            </Panel>
          </>
        )}

        {activeTab === 'context' && (
          <>
            <Panel eyebrow="timeline" title={context.title} icon={Clock}>
              <p className="mb-5 max-w-3xl text-token-sm leading-relaxed text-[var(--xhs-ink-soft)]">{context.summary}</p>
              <ol className="relative space-y-5 border-l border-[var(--xhs-line-strong)] pl-6">
                {context.timeline.map((item) => (
                  <li key={item.date} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-[var(--xhs-accent)] bg-[var(--xhs-bg)]" />
                    <div className="text-token-xs font-bold tabular-nums text-[var(--xhs-accent-ink)]">{item.date}</div>
                    <p className="mt-1 text-token-sm leading-relaxed text-[var(--xhs-ink-soft)]">{item.event}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 rounded-lg bg-[var(--xhs-accent-soft)] px-4 py-3 text-token-sm font-bold leading-relaxed text-[var(--xhs-accent-ink)]">
                {context.note}
              </p>
            </Panel>
          </>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-5">
            {layers.map((layer) => (
              <LayerCard key={layer.id} layer={layer} />
            ))}
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel eyebrow="confirm" title="要坐實第三層，還需要什麼" icon={ListChecks}>
              <p className="mb-3 text-token-xs leading-relaxed text-[var(--xhs-ink-muted)]">
                第三層是「高度可疑」而非鐵證；資料本身到不了「動機」。以下佐證若能取得，才能把它從可疑推向坐實。
              </p>
              <ol className="space-y-3 text-token-xs leading-relaxed">
                {layer3.whatWouldConfirm.map((item, index) => (
                  <li key={item} className="grid grid-cols-[24px_1fr] gap-2 border-t border-[var(--xhs-line)] pt-3">
                    <span className="font-bold tabular-nums text-[var(--xhs-accent)]">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </Panel>

            <div className="space-y-6">
              <Panel eyebrow="method" title="偵測方法可複現" icon={ScanSearch}>
                <ul className="space-y-3">
                  {layers.filter((l) => l.methodNote).map((l) => (
                    <li key={l.id} className="border-t border-[var(--xhs-line)] pt-3">
                      <p className="text-token-xs font-bold text-[var(--xhs-ink)]">第 {l.order} 層</p>
                      <p className="mt-1 text-token-xs leading-relaxed text-[var(--xhs-ink-soft)]">{l.methodNote}</p>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel eyebrow="context" title="數位素養脈絡" icon={FileSearch}>
                <p className="text-token-xs leading-relaxed text-[var(--xhs-ink-soft)]">
                  另留存 {eliteracyContext.sourceClass} {eliteracyContext.files} 份素材。{eliteracyContext.note}
                </p>
              </Panel>
            </div>

            <section className="lg:col-span-2 rounded-xl border border-[var(--xhs-line-strong)] bg-[var(--xhs-accent-soft)] p-6 sm:p-8">
              <h2 className="font-sans text-lg font-bold leading-tight text-[var(--xhs-accent-ink)]">{closing.title}</h2>
              <div className="mt-4 max-w-3xl space-y-4">
                {closing.paragraphs.map((p, index) => (
                  <p key={index} className="text-token-sm leading-relaxed text-[var(--xhs-ink)]">{p}</p>
                ))}
              </div>
            </section>

            <section className="lg:col-span-2 border-t border-[var(--xhs-line)] pt-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--xhs-accent)]">來源</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {sources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-start gap-1.5 text-token-xs leading-relaxed text-[var(--xhs-ink-soft)] hover:text-[var(--xhs-accent-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--xhs-accent)]"
                    >
                      <ExternalLink className="mt-0.5 shrink-0 text-[var(--xhs-accent)]" size={13} />
                      <span>
                        <span className="font-bold text-[var(--xhs-ink)] group-hover:text-[var(--xhs-accent-ink)]">{s.label}</span>
                        <span className="ml-1 text-[var(--xhs-ink-muted)]">· {s.publisher}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
