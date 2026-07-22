import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import AppearanceMenu from '../components/AppearanceMenu';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParams } from '../components/lab/Tabs';
import Badge from '../components/lab/Badge';
import data from '../data/xiaohongshuRisk.json';

const { source, corpus, structure, layers, eliteracyContext, context, closing, sources, crossCheck } = data;

const CN = ['零', '一', '二', '三', '四', '五'];

const LAYER_TAG = {
  'text-synthesis': '文本經加工',
  'attribution-inflation': '關鍵字灌水',
  'official-construction': '官方建構',
};

// Evidence-strength → semantic token tone: green = established, blue = quantified, amber = suspected.
const STRENGTH_TONE = {
  'text-synthesis': 'success',
  'attribution-inflation': 'info',
  'official-construction': 'warning',
};

function SectionHead({ id, children }) {
  return <h2 id={id} className="font-display text-token-xl leading-tight text-ink">{children}</h2>;
}

function SubHead({ id, children }) {
  return <h3 id={id} className="mb-3 mt-6 font-display text-token-base text-ink-muted">{children}</h3>;
}

// Left-border callout on paper — no filled card (the big empty rounded card is banned).
function KeyPoint({ children }) {
  return (
    <p className="border-l-2 border-accent pl-4 text-token-base font-medium leading-relaxed text-ink">
      {children}
    </p>
  );
}

// Pale fill + thin accent keyline; width driven by pct (0–100).
function bar(pct, thin) {
  const h = thin ? 'h-2' : 'h-2.5';
  return (
    <div className={`${h} rounded-full bg-surface`}>
      <div
        className={`${h} rounded-full border border-accent bg-accent-soft`}
        style={{ width: `${Math.max(3, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

function MetricBar({ label, pct, count, total, note }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-token-sm text-ink">{label}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-ink-muted">
          <span className="text-token-sm font-semibold text-ink">{pct}%</span>
          {typeof count === 'number' ? <span className="ml-2 text-token-xs">{count}/{total}</span> : null}
        </span>
      </div>
      {bar(pct)}
      {note ? <p className="mt-1 text-token-xs leading-relaxed text-ink-faint">{note}</p> : null}
    </div>
  );
}

function BreakdownBars({ rows }) {
  const max = Math.max(...rows.map((r) => r.pct), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-token-sm text-ink">{row.label}</span>
            <span className="shrink-0 whitespace-nowrap tabular-nums text-token-sm text-ink-muted">{row.pct}%</span>
          </div>
          {bar((row.pct / max) * 100, true)}
        </div>
      ))}
    </div>
  );
}

function Excerpt({ item }) {
  return (
    <div className="border-t border-line-soft py-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{item.caseType}</Badge>
        <span className="text-token-xs text-ink-faint">{item.date} · {item.city}</span>
      </div>
      <p className="text-token-sm leading-relaxed text-ink-muted">{item.excerpt}……</p>
    </div>
  );
}

function LayerSection({ layer }) {
  const breakdown = layer.registerSplit ?? layer.vectorBreakdown;
  const breakdownTitle = layer.registerSplit ? '語域分布' : '真正的接觸／金流媒介';
  return (
    <section className="mb-14">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SectionHead id={`layer-${layer.id}`}>第 {CN[layer.order]} 層 · {LAYER_TAG[layer.id]}</SectionHead>
        <Badge tone={STRENGTH_TONE[layer.id]}>{layer.strength}</Badge>
      </div>
      <p className="font-display text-token-lg leading-snug text-ink">{layer.claim}</p>
      <p className="mt-2 mb-6 max-w-3xl text-token-sm leading-relaxed text-ink-faint">{layer.strengthNote}</p>

      {layer.metrics ? (
        <div className="space-y-4">
          {layer.metrics.map((m) => (
            <MetricBar key={m.label} label={m.label} pct={m.pct} count={m.count} total={m.total} note={m.note} />
          ))}
        </div>
      ) : null}

      {layer.evidence ? (
        <ul className="space-y-2.5">
          {layer.evidence.map((line) => (
            <li key={line} className="grid grid-cols-[14px_1fr] gap-2 text-token-sm leading-relaxed text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {breakdown ? (
        <>
          <SubHead id={`${layer.id}-breakdown`}>{breakdownTitle}</SubHead>
          <BreakdownBars rows={breakdown} />
        </>
      ) : null}

      {layer.keyPoint ? <div className="mt-6"><KeyPoint>{layer.keyPoint}</KeyPoint></div> : null}

      {layer.examples ? (
        <>
          <SubHead id={`${layer.id}-examples`}>去識別化摘錄</SubHead>
          {layer.examples.map((item, i) => (
            <Excerpt key={`${layer.id}-${i}`} item={item} />
          ))}
        </>
      ) : null}

      <p className="mt-6 border-t border-dashed border-line pt-3 text-token-xs leading-relaxed text-ink-faint">
        <span className="font-semibold text-ink-muted">本層界線：</span>{layer.weakness}
      </p>
    </section>
  );
}

export default function XiaohongshuRisk() {
  const [scale, setScale] = useFontScale();
  const [{ tab }, setTabs] = useTabParams({ tab: 'question' });

  useEffect(() => {
    document.title = '小紅書資料集查核';
  }, []);

  return (
    <DashboardLayout
      scale={scale}
      back={{ href: '/', label: 'Canvas Lab' }}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow="Credibility Audit"
      title={source.title}
      summary={`${source.question}把這批案例拆開來看，會發現三件事層層疊起：文本先被改寫過、平台歸因靠關鍵字搜出來、最後由官方端聚合成一套敘事。三層的證據強度不同，這裡分層標示，不含混當成同一種確定。`}
      tabs={{
        label: '看哪一段',
        value: tab,
        onChange: (v) => setTabs({ tab: v }, { scroll: 'top' }),
        items: [
          { id: 'question', label: '問題意識' },
          { id: 'context', label: '當時發生了什麼' },
          { id: 'layers', label: '三層論證', count: layers.length },
          { id: 'crosscheck', label: '可查證對照' },
          { id: 'limits', label: '界線與待補' },
        ],
      }}
      refreshKey={tab}
    >
      {tab === 'question' && (
        <>
          <dl className="mb-10 flex flex-wrap gap-x-10 gap-y-4 border-y border-line-soft py-4">
            <div>
              <dt className="text-token-xs text-ink-faint">關鍵字命中案例 · keyWord=小紅書</dt>
              <dd className="font-display text-token-2xl tabular-nums text-ink">{corpus.caseRecords}</dd>
            </div>
            <div>
              <dt className="text-token-xs text-ink-faint">案情中位字數 · 最短 {corpus.contentLength.min}／最長 {corpus.contentLength.max}</dt>
              <dd className="font-display text-token-2xl tabular-nums text-ink">{corpus.contentLength.median}</dd>
            </div>
            <div>
              <dt className="text-token-xs text-ink-faint">保存儀錶板頁 · 原始 HTML</dt>
              <dd className="font-display text-token-2xl tabular-nums text-ink">{corpus.savedDashboardPages}</dd>
            </div>
          </dl>

          <section className="mb-10">
            <SectionHead id="q-thesis">這個敘事站得住嗎</SectionHead>
            <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
              {source.question}關鍵字搜尋的範圍是 {corpus.keywordSearchScope}。也就是說，「{corpus.caseRecords} 件小紅書詐騙」是對案情自由文字做子字串比對的結果，資料庫裡並沒有一個「平台＝小紅書」的欄位。
            </p>
          </section>

          <section className="mb-10">
            <SectionHead id="q-structure">資料庫結構上沒有「平台」這個維度</SectionHead>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-token-sm font-semibold text-ink">每筆有的欄位</p>
                <div className="mb-5 flex flex-wrap gap-2">
                  {structure.perRecordFields.map((f) => (
                    <Badge key={f} tone="neutral">{f}</Badge>
                  ))}
                </div>
                <p className="mb-2 text-token-sm font-semibold text-ink">缺的欄位</p>
                <div className="flex flex-wrap gap-2">
                  {structure.missingFields.map((f) => (
                    <Badge key={f} tone="warning">{f}</Badge>
                  ))}
                </div>
              </div>
              <p className="border-l-2 border-line pl-4 text-token-sm leading-relaxed text-ink-muted">
                {structure.note}
              </p>
            </div>
          </section>

          <section>
            <SectionHead id="q-scope">材料範圍</SectionHead>
            <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">
              後端是 {source.backend}；本頁分析以 {corpus.caseRecords} 筆關鍵字命中案例為主，另留存 {corpus.savedDashboardPages} 份儀錶板頁與 {corpus.eliteracyFiles} 份數位素養素材作脈絡對照。{source.publicBoundary}
            </p>
          </section>
        </>
      )}

      {tab === 'context' && (
        <section>
          <SectionHead id="timeline">{context.title}</SectionHead>
          <p className="mt-3 mb-8 max-w-3xl text-token-base leading-relaxed text-ink-muted">{context.summary}</p>
          <ol className="relative space-y-6 border-l border-line pl-6">
            {context.timeline.map((item) => (
              <li key={item.date} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-paper" />
                <div className="text-token-sm font-semibold tabular-nums text-ink">{item.date}</div>
                <p className="mt-1 max-w-3xl text-token-base leading-relaxed text-ink-muted">{item.event}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <KeyPoint>{context.note}</KeyPoint>
          </div>
        </section>
      )}

      {tab === 'layers' && (
        <div>
          {layers.map((layer) => (
            <LayerSection key={layer.id} layer={layer} />
          ))}
        </div>
      )}

      {tab === 'crosscheck' && (
        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <SectionHead id="crosscheck">{crossCheck.title}</SectionHead>
            <Badge tone="success">{crossCheck.strength}</Badge>
          </div>
          <p className="font-display text-token-lg leading-snug text-ink">{crossCheck.claim}</p>
          <p className="mt-2 max-w-3xl text-token-xs leading-relaxed text-ink-faint">
            {crossCheck.source}。{crossCheck.method}
          </p>

          <div className="mt-6 flex items-baseline gap-3 border-y border-line-soft py-4">
            <span className="font-display text-token-3xl tabular-nums text-ink">{crossCheck.total}</span>
            <span className="max-w-2xl text-token-sm leading-relaxed text-ink-muted">筆有案號、可調閱全文的刑事判決。{crossCheck.totalNote}</span>
          </div>

          <SubHead id="cc-cause">案由分布</SubHead>
          <BreakdownBars rows={crossCheck.causeBreakdown.map((c) => ({ label: c.label, pct: c.count }))} />
          <p className="mt-2 text-token-xs leading-relaxed text-ink-faint">{crossCheck.causeNote}</p>

          <SubHead id="cc-sample">抽樣查證（8 則·跨 8 法院）</SubHead>
          <p className="mb-4 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{crossCheck.sampleFinding}</p>
          <ul className="space-y-2">
            {crossCheck.samples.map((s) => (
              <li key={s.caseNo} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-soft py-2">
                <span className="text-token-sm text-ink">{s.court}</span>
                <span className="font-accent text-token-xs text-ink-muted">{s.caseNo}</span>
                <Badge tone="neutral">{s.cause}</Badge>
                <span className="ml-auto flex items-center gap-2 text-token-xs text-ink-faint">
                  <span className="tabular-nums">小紅書 ×{s.xhs}</span>
                  {s.offPlatform ? <Badge tone="warning">站外媒介</Badge> : null}
                </span>
              </li>
            ))}
          </ul>

          <SubHead id="cc-compare">並排對照</SubHead>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-token-xs text-ink-faint">
                  <th className="py-2 pr-4 font-medium" />
                  <th className="py-2 pr-4 font-semibold text-ink">裁判書系統（可查證）</th>
                  <th className="py-2 font-semibold text-ink">165 儀錶板（去識別化）</th>
                </tr>
              </thead>
              <tbody>
                {crossCheck.compare.map((row) => (
                  <tr key={row.field} className="border-b border-line-soft align-top">
                    <td className="py-3 pr-4 text-token-xs font-semibold text-ink-muted">{row.field}</td>
                    <td className="py-3 pr-4 text-token-sm leading-relaxed text-ink">{row.judgment}</td>
                    <td className="py-3 text-token-sm leading-relaxed text-ink-muted">{row.dashboard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHead id="cc-synthesis">這說明了什麼</SubHead>
          <ul className="space-y-2.5">
            {crossCheck.synthesis.map((line) => (
              <li key={line} className="grid grid-cols-[14px_1fr] gap-2 text-token-base leading-relaxed text-ink">
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-accent" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-dashed border-line pt-3 text-token-xs leading-relaxed text-ink-faint">
            <span className="font-semibold text-ink-muted">界線：</span>{crossCheck.caveat}
          </p>
        </section>
      )}

      {tab === 'limits' && (
        <>
          <section className="mb-12">
            <SectionHead id="confirm">要坐實第三層，還需要什麼</SectionHead>
            <p className="mt-3 mb-4 max-w-3xl text-token-sm leading-relaxed text-ink-faint">
              第三層是「高度可疑」而非鐵證；資料本身到不了「動機」。以下佐證若能取得，才能把它從可疑推向坐實。
            </p>
            <ol className="space-y-3">
              {layers.find((l) => l.id === 'official-construction').whatWouldConfirm.map((item, i) => (
                <li key={item} className="grid grid-cols-[24px_1fr] gap-2 border-t border-line-soft pt-3 text-token-sm leading-relaxed text-ink-muted">
                  <span className="font-semibold tabular-nums text-accent">{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-12">
            <SectionHead id="method">偵測方法可複現</SectionHead>
            <ul className="mt-4 space-y-4">
              {layers.filter((l) => l.methodNote).map((l) => (
                <li key={l.id} className="border-t border-line-soft pt-3">
                  <p className="text-token-sm font-semibold text-ink">第 {CN[l.order]} 層</p>
                  <p className="mt-1 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{l.methodNote}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <SectionHead id="eliteracy">數位素養脈絡</SectionHead>
            <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">
              另留存 {eliteracyContext.sourceClass} {eliteracyContext.files} 份素材。{eliteracyContext.note}
            </p>
          </section>

          <section className="mb-12 border-l-4 pl-5" style={{ borderColor: 'var(--c-pop)' }}>
            <h2 id="closing" className="font-display text-token-xl leading-tight text-ink">{closing.title}</h2>
            <div className="mt-3 max-w-3xl space-y-4">
              {closing.paragraphs.map((p, i) => (
                <p key={i} className="text-token-base leading-relaxed text-ink">{p}</p>
              ))}
            </div>
          </section>

          <section>
            <SectionHead id="sources">來源</SectionHead>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1.5 text-token-sm leading-relaxed text-ink-muted transition-colors duration-fast hover:text-accent"
                  >
                    <ExternalLink className="mt-1 shrink-0 text-ink-faint group-hover:text-accent" size={13} />
                    <span>
                      <span className="font-semibold text-ink group-hover:text-accent">{s.label}</span>
                      <span className="ml-1 text-ink-faint">· {s.publisher}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
