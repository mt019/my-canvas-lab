import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/*
 * A collapsible aside for a derivation the reader can skip. It starts CLOSED,
 * which is the one deliberate exception to this site's "everything starts open"
 * rule (see Accordion.jsx): the algebra behind a confidence interval is optional
 * depth, not the content the reader came for, so the article reads straight
 * through with it folded and opens on demand.
 *
 * Injected into the MDXProvider by the article shell, so an .mdx file writes
 * <Derivation title="…">…</Derivation> with no import. The title is authored per
 * language in the prose; children are ordinary MDX (paragraphs, $$ math blocks).
 */
export default function Derivation({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-6 rounded-token-md border border-line-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-fast hover:text-accent"
      >
        <ChevronDown
          size={15}
          className={`shrink-0 text-ink-faint transition-transform duration-fast ${open ? '' : '-rotate-90'}`}
        />
        <span className="flex-1 font-accent text-token-sm text-ink-muted">{title}</span>
      </button>
      {open ? (
        <div className="border-t border-line-soft px-4 pb-1 pt-1 [&_.prose-scaled>*:first-child]:mt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
