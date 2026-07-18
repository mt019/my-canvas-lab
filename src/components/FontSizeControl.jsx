import { useEffect, useState } from 'react';

const STORAGE_KEY = 'canvaslab:fontScale';
export const FONT_SCALES = [0.85, 0.925, 1, 1.1, 1.25, 1.4, 1.6];

/*
 * Reader size control. The page sets --reader-scale on its root; the shared
 * .reader-scale class (index.css) carries it as `zoom` on the content wrapper
 * *inside* each shell's fixed-width frame — never on the full-width root
 * (2026-07-18). That is the difference between this and an earlier build that
 * zoomed the whole <main>: because the max-width column and the outer gutter
 * live outside the zoom, enlarging the type reflows the content but never
 * moves the margins — the way an in-page reader control behaves on Substack /
 * Kindle / NYT, as opposed to browser Cmd+/Cmd-, which scales the frame too.
 * Navigation rails and the toolbar stay unscaled. localStorage-persisted,
 * shared across pages.
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

/*
 * The control wears the same clothes as AppearanceMenu, because they always sit
 * next to each other and a reading page can afford one row of chrome, not two.
 * It used to be a filled `bg-surface` pill with a heavier border and a larger
 * type size than the button beside it: two boxes of different sizes, different
 * radii and different weights, arguing with each other above the title.
 * Hairline, no fill, same radius, same type size — chrome over an essay has to
 * be almost nothing.
 *
 * The middle slot shows the level you are actually on. Seven steps between 0.85
 * and 1.6 and the old control said only "A": pressing A− five times told you
 * nothing about how far you had gone or how much further you could. It is also
 * the reset, which is where a reader reaches for it anyway. The slot keeps its
 * width across 85%–160% so the two arrows never shift under the cursor.
 */
export default function FontSizeControl({ scale, onChange }) {
  const idx = FONT_SCALES.indexOf(scale);
  const step = (delta) => {
    const next = FONT_SCALES[Math.min(FONT_SCALES.length - 1, Math.max(0, idx + delta))];
    onChange(next);
  };

  const btn =
    'px-2 py-1 transition-colors duration-fast hover:text-ink disabled:opacity-40 disabled:hover:text-ink-muted';

  return (
    <div
      className="inline-flex items-center rounded-token-sm border border-line-soft text-token-xs text-ink-muted transition-colors duration-fast hover:border-line"
      role="group"
      aria-label="Font size"
    >
      <button type="button" className={btn} aria-label="Smaller text" disabled={idx <= 0} onClick={() => step(-1)}>
        A−
      </button>
      <button
        type="button"
        className={`${btn} min-w-[2.9rem] border-x border-line-soft text-center tabular-nums ${scale === 1 ? '' : 'text-ink'}`}
        aria-label="Reset text size"
        onClick={() => onChange(1)}
      >
        {Math.round(scale * 100)}%
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
