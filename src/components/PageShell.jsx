import { useEffect } from 'react';
import Eyebrow from './Eyebrow';

const WIDTHS = {
  prose: 'max-w-3xl', // ~65ch at body size — Notion/Vercel-style reading measure
  wide: 'max-w-6xl',
};

/*
 * Common page chrome: clean --c-paper backdrop (the only allowed prose
 * background), reading measure, document.title, and a header slot for
 * LangSwitch / FontSizeControl. In prose mode the content wrapper carries
 * --fs so FontSizeControl can scale long-form text via
 * calc(var(--text-body) * var(--fs, 1)).
 */
export default function PageShell({
  title,
  eyebrow,
  width = 'prose',
  controls,
  fontScale,
  backHref = '/',
  children,
}) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  // zoom scales the whole page content proportionally (browser-zoom-like).
  // Deliberately does NOT also set --fs: that would compound with zoom on
  // .prose-scaled / text-scaled-* text.
  const scaleStyle = fontScale != null ? { zoom: fontScale } : undefined;

  return (
    <main className="min-h-screen bg-paper text-ink" style={scaleStyle}>
      <div className={`mx-auto px-4 py-10 sm:px-6 ${WIDTHS[width] ?? WIDTHS.prose}`}>
        <header className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <a
              href={backHref}
              className="text-token-sm text-ink-faint transition-colors duration-fast hover:text-accent"
            >
              ← Canvas Lab
            </a>
            {controls ? <div className="flex items-center gap-2">{controls}</div> : null}
          </div>
          {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
          {title ? (
            <h1 className="font-display text-token-2xl leading-tight sm:text-token-3xl">
              {title}
            </h1>
          ) : null}
        </header>
        <div className={width === 'prose' ? 'prose-scaled' : undefined}>
          {children}
        </div>
      </div>
    </main>
  );
}
