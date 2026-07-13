import { useId, useState } from 'react';
import { ExternalLink } from 'lucide-react';

/*
 * A source marker on a claim: hover or focus shows who said it, where.
 * Deliberately narrow — no numbering, no bibliography generation, no
 * back-links. The source object comes from the data repo, where every citation
 * is checked; a citation with no locator fails validation there, not here.
 */
export default function HoverCite({ source, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!source) return children;

  const { author, title, year, locator, url, quote } = source;

  return (
    <span className="relative inline">
      <span className="border-b border-dotted border-ink-faint">{children}</span>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="ml-0.5 align-super text-token-xs text-accent transition-colors duration-fast hover:text-ink"
      >
        *
      </button>
      {open ? (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-20 mb-1.5 block w-[min(20rem,80vw)] -translate-x-1/2 rounded-token-md border border-line bg-surface-raised px-3 py-2 text-left text-token-xs leading-relaxed shadow-token-md"
        >
          <span className="block text-ink">
            {author}（{year}）。{title}
          </span>
          {locator ? <span className="mt-0.5 block text-ink-muted">{locator}</span> : null}
          {quote ? <span className="mt-1 block border-l-2 border-line pl-2 text-ink-muted">{quote}</span> : null}
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-accent hover:underline"
            >
              來源 <ExternalLink size={11} />
            </a>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
