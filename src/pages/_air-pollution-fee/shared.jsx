/*
 * 六個分頁共用的小零件。視覺語言跟 _tax-litigation/shared.jsx 同一套：淡底＋細框，
 * 不做填滿的卡片，長條一律近白淡底加一圈墨色細框（DESIGN.md 的圖表用色規則）。
 *
 * 顏色只從 tokens.css 的色槽來（cat-* 或語意槽），這裡不出現任何色碼。
 */

function slot(tone) {
  const prefix = tone.startsWith('cat-') ? tone : `status-${tone}`;
  return { tx: `var(--${prefix}-tx)`, bg: `var(--${prefix}-bg)` };
}

export function SectionHead({ id, children }) {
  return <h2 id={id} className="font-display text-token-xl leading-tight text-ink">{children}</h2>;
}

export function SubHead({ id, children }) {
  return <h3 id={id} className="mb-3 mt-6 font-display text-token-base text-ink-muted">{children}</h3>;
}

// 一段有分量的說明，靠左邊一條線與正文區隔——不做成有底色的方塊。
export function Note({ children }) {
  return (
    <p className="border-l-2 border-accent pl-4 text-token-sm leading-relaxed text-ink-muted">
      {children}
    </p>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((line, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-ink-faint" />
          <span className="text-token-sm leading-relaxed text-ink-muted">{line}</span>
        </li>
      ))}
    </ul>
  );
}

// 一個標籤＋一條比例長條。tone 可省略：不帶分類意義的單一序列（基金支出）就用
// 預設的 accent，不要一項一個色相。
export function ShareBar({ label, pct, tone, right, note }) {
  const c = tone ? slot(tone) : null;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-token-sm text-ink">{label}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-token-sm text-ink-muted">
          {right ?? `${pct}%`}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-surface">
        <div
          className="h-2.5 rounded-full border"
          style={{
            width: `${Math.max(2, Math.min(100, pct))}%`,
            borderColor: c ? c.tx : 'var(--c-accent)',
            background: c ? c.bg : 'var(--c-accent-soft)',
          }}
        />
      </div>
      {note ? <p className="mt-1 text-token-xs leading-relaxed text-ink-muted">{note}</p> : null}
    </div>
  );
}

// 條文／型態一則：標題加說明，靠左線區隔。逃漏那頁一次要排四五則。
export function Provision({ label, children }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="text-token-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
