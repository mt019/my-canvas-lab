/*
 * Small pieces shared by the three tax-litigation views. Same visual language
 * as XiaohongshuRisk.jsx's dashboard bars (pale fill + accent keyline, no
 * filled cards) — kept here instead of duplicated per view.
 */
export function SectionHead({ id, children }) {
  return <h2 id={id} className="font-display text-token-xl leading-tight text-ink">{children}</h2>;
}

export function SubHead({ id, children }) {
  return <h3 id={id} className="mb-3 mt-6 font-display text-token-base text-ink-muted">{children}</h3>;
}

export function KeyPoint({ children }) {
  return (
    <p className="border-l-2 border-accent pl-4 text-token-base font-medium leading-relaxed text-ink">
      {children}
    </p>
  );
}

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

// A labeled percentage bar, with an optional n/N count alongside the pct —
// the shape the P1–P0 breakdown and the by-court breakdown both need.
export function MetricBar({ label, pct, count, note }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-token-sm text-ink">{label}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-ink-muted">
          <span className="text-token-sm font-semibold text-ink">{pct}%</span>
          {typeof count === 'number' ? <span className="ml-2 text-token-xs">{count} 件</span> : null}
        </span>
      </div>
      {bar(pct)}
      {note ? <p className="mt-1 text-token-xs leading-relaxed text-ink-muted">{note}</p> : null}
    </div>
  );
}

// A floor–ceiling range as two stacked bars — the recurring shape in the
// verdict-scope numbers, where every headline is an interval, not a point.
export function RangeBar({ label, floorPct, ceilingPct, n }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-token-sm text-ink">{label}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-token-sm text-ink-muted">
          {floorPct}%–{ceilingPct}%
          {typeof n === 'number' ? <span className="ml-2 text-token-xs text-ink-muted">{n} 件</span> : null}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-surface">
        <div
          className="h-2.5 rounded-full border border-line-strong bg-surface"
          style={{ width: `${Math.max(3, Math.min(100, ceilingPct))}%` }}
        />
        <div
          className="-mt-2.5 h-2.5 rounded-full border border-accent bg-accent-soft"
          style={{ width: `${Math.max(3, Math.min(100, floorPct))}%` }}
        />
      </div>
    </div>
  );
}

// A count (not a percentage) shown as a bar scaled to the largest value in its
// own list — for breakdowns that are a subset's internal shape, not a share of
// some exhaustive whole (a percentage there would imply a denominator that
// doesn't exist).
export function CountBar({ label, n, max }) {
  const pct = max > 0 ? (n / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-token-sm text-ink">{label}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-token-sm text-ink-muted">{n} 件</span>
      </div>
      {bar(pct, true)}
    </div>
  );
}

// One case as evidence: a plain citation a reader can look up, plus a
// paraphrased summary. Not a full-text quote — the public projection never
// carries full judgment text.
export function CaseVignette({ citation, summary, note }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="font-accent text-token-xs text-ink-muted">{citation}</p>
      <p className="mt-1.5 text-token-sm leading-relaxed text-ink-muted">{summary}</p>
      {note ? <p className="mt-1.5 text-token-xs leading-relaxed text-ink-muted">{note}</p> : null}
    </div>
  );
}

// A short verbatim quote from a judgment, set off from paraphrase — used
// sparingly, only where the exact wording is the point (the legal-basis
// holding in VerdictScopeView).
export function Quote({ citation, quote, source }) {
  return (
    <blockquote className="border-l-2 border-line-strong pl-4">
      <p className="text-token-sm leading-relaxed text-ink">「{quote}」</p>
      <p className="mt-1.5 font-accent text-token-xs text-ink-muted">
        {citation}{source ? `・${source}` : ''}
      </p>
    </blockquote>
  );
}
