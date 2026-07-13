import { useRef } from 'react';
import { Link } from 'react-router-dom';
import TableOfContents from './TableOfContents';

/*
 * The shell a long article sits in: a quiet rail of everything else there is to
 * read on the left, the reading column in the middle at its own measure, and the
 * headings of the current piece on the right. GitBook and bookdown put the same
 * three things in the same places, and readers of technical prose already know
 * where to look.
 *
 * Both rails are sticky and both disappear below a wide screen, where the reading
 * column takes the whole width and the headings collapse into a summary at the top
 * — a sidebar squeezed onto a phone is worse than no sidebar.
 *
 * Neither the reading column nor the rail is a colored panel. A tinted block of
 * any hue sits against the paper's own warmth and fights it; the only colors that
 * survive next to body text are the ones already in the ink. So the rail is text
 * on paper with a hairline beside it, and the single accent in the whole shell is
 * the mark on wherever the reader currently is.
 */
export default function ArticleLayout({ title, eyebrow, summary, meta, nav, tocLabel, tocKey, children }) {
  const bodyRef = useRef(null);

  return (
    <div className="mx-auto grid max-w-[86rem] gap-10 px-4 sm:px-6 lg:grid-cols-[15rem_minmax(0,44rem)_14rem] lg:gap-12">
      <aside className="hidden lg:block">
        <div className="sticky top-10 max-h-[calc(100vh-5rem)] overflow-y-auto border-r border-line-soft pr-5">
          {nav}
        </div>
      </aside>

      {/* No fill behind the words — only a faint paper grain, so long-form text
          reads as printed on something rather than glowing off a flat white. */}
      <article className="reading-grain">
        <header className="mb-8">
          {eyebrow ? (
            <p className="mb-2 font-accent text-token-xs uppercase tracking-[0.18em] text-ink-faint">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-token-2xl leading-tight sm:text-token-3xl">{title}</h1>
          {summary ? (
            <p className="mt-4 text-token-sm leading-relaxed text-ink-muted">{summary}</p>
          ) : null}
          {meta}
        </header>

        <details className="mb-8 rounded-token-md border border-line-soft px-4 py-3 lg:hidden">
          <summary className="cursor-pointer text-token-sm text-ink-muted">{tocLabel ?? '本頁目次'}</summary>
          <div className="mt-3">
            <TableOfContents containerRef={bodyRef} label={tocLabel} refreshKey={tocKey} />
          </div>
        </details>

        <div ref={bodyRef}>{children}</div>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-10 max-h-[calc(100vh-5rem)] overflow-y-auto pb-10">
          <TableOfContents containerRef={bodyRef} label={tocLabel} refreshKey={tocKey} />
        </div>
      </aside>
    </div>
  );
}

/* The left rail: the other articles, grouped by topic. A reader who liked one
   piece is one click from the rest, without going back to the hub. */
export function ArticleNav({ topics = [], articles = [], currentSlug, homeHref, homeLabel, lang = 'zh' }) {
  const label = (t) => (lang === 'en' ? t.en?.label ?? t.label : t.label);
  const title = (a) => (lang === 'en' ? a.en?.title ?? a.title : a.title);

  return (
    <nav aria-label={homeLabel} className="text-token-xs">
      <Link
        to={homeHref}
        className="mb-4 block font-accent uppercase tracking-[0.12em] text-ink-faint transition-colors duration-fast hover:text-accent"
      >
        {homeLabel}
      </Link>
      {topics.map((t) => {
        const list = articles.filter((a) => a.topic === t.id);
        if (list.length === 0) return null;
        return (
          <div key={t.id} className="mb-5">
            <p className="mb-1.5 text-ink-muted">{label(t)}</p>
            <ul className="space-y-1 border-l border-line-soft">
              {list.map((a) => {
                const on = a.slug === currentSlug;
                return (
                  <li key={a.slug}>
                    <Link
                      to={a.route}
                      className="-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors duration-fast"
                      style={{
                        borderColor: on ? 'var(--c-accent)' : 'transparent',
                        color: on ? 'var(--c-ink)' : 'var(--c-ink-faint)',
                      }}
                    >
                      {title(a)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
