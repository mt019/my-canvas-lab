import { useEffect, useState } from 'react';

const STORAGE_KEY = 'canvaslab:fontScale';
export const FONT_SCALES = [0.9, 1, 1.1, 1.25, 1.4];

/*
 * Reader font-size control for long-form academic pages. The scale is a
 * container-level multiplier: apply style={{ '--fs': scale }} on the prose
 * wrapper and size prose text with calc(var(--text-body) * var(--fs, 1))
 * (PageShell width="prose" does this). Deliberately does NOT touch the html
 * font-size — that would drag every Tailwind rem spacing with it and break
 * dashboard/instrument layouts.
 */
export function useFontScale() {
  const [scale, setScale] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY));
      if (FONT_SCALES.includes(saved)) return saved;
    } catch { /* ignore */ }
    return 1;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(scale));
    } catch { /* ignore */ }
  }, [scale]);

  return [scale, setScale];
}

export default function FontSizeControl({ scale, onChange }) {
  const idx = FONT_SCALES.indexOf(scale);
  const step = (delta) => {
    const next = FONT_SCALES[Math.min(FONT_SCALES.length - 1, Math.max(0, idx + delta))];
    onChange(next);
  };

  const btn =
    'rounded-token-sm px-2 py-0.5 text-ink-muted transition-colors duration-fast hover:text-ink disabled:opacity-40 disabled:hover:text-ink-muted';

  return (
    <div
      className="inline-flex items-center gap-1 rounded-token-md border border-line bg-surface p-1 text-token-sm"
      role="group"
      aria-label="Font size"
    >
      <button type="button" className={btn} aria-label="Smaller text" disabled={idx <= 0} onClick={() => step(-1)}>
        A−
      </button>
      <button
        type="button"
        className={`${btn} ${scale === 1 ? 'text-ink' : ''}`.trim()}
        aria-label="Reset text size"
        onClick={() => onChange(1)}
      >
        A
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Larger text"
        disabled={idx >= FONT_SCALES.length - 1}
        onClick={() => step(1)}
      >
        A＋
      </button>
    </div>
  );
}
