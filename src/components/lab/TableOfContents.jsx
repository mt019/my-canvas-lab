import { useEffect, useState } from 'react';

/*
 * "On this page": the headings of the article that is actually on screen, read
 * out of the DOM rather than declared by hand, so a heading added to the .mdx
 * shows up here without anyone maintaining a list. The entry for the section the
 * reader is currently in stays marked as they scroll.
 *
 * Headings get their ids from rehype-slug at build time (see vite.config.ts).
 */
export default function TableOfContents({ containerRef, label = '本頁目次', refreshKey }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  // refreshKey re-reads the headings when the article underneath changes — the
  // language switch swaps the whole body, and a table of contents built once at
  // mount would keep listing the previous language's headings.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const headings = [...root.querySelectorAll('h2[id], h3[id]')];
    setItems(headings.map((h) => ({ id: h.id, text: h.textContent, level: Number(h.tagName[1]) })));

    // The section counts as current once its heading reaches the top third of the
    // window; without the bottom margin the last section could never win, since
    // its heading never scrolls that far up on a short page.
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: '0px 0px -66% 0px', threshold: 0 },
    );
    headings.forEach((h) => spy.observe(h));
    return () => spy.disconnect();
  }, [containerRef, refreshKey]);

  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="text-token-xs leading-relaxed">
      <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <ul className="space-y-1.5 border-l border-line-soft">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id} style={{ paddingLeft: it.level === 3 ? 22 : 12 }}>
              <a
                href={`#${it.id}`}
                className="-ml-px block border-l-2 py-0.5 pl-2 transition-colors duration-fast"
                style={{
                  borderColor: on ? 'var(--c-accent)' : 'transparent',
                  color: on ? 'var(--c-ink)' : 'var(--c-ink-faint)',
                }}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
