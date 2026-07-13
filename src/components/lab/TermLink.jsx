import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HoverCard from './HoverCard';

/*
 * A term marker on a word. Hover it and the definition arrives in place — one
 * line, one example, and a way through to the full entry. Click to pin, then
 * follow the link.
 *
 * The card answers the question without making the reader leave the sentence;
 * the page is there for the reader who wants the rest. Both come from the same
 * data-repo term, so a card and its page can never say different things.
 *
 * Distinct from a citation marker on purpose: a dashed underline against the
 * citation's dotted one. Same interaction, different promise — a citation hands
 * you a source, a term hands you an explanation.
 */
export default function TermLink({ term, lang = 'zh', children }) {
  if (!term) return children;

  const en = lang === 'en';
  const name = (en ? term.en?.term : term.term) ?? term.term;
  const oneLine = (en ? term.en?.oneLine : term.oneLine) ?? term.oneLine;
  const example = (en ? term.en?.example : term.example) ?? term.example;

  const card = (
    <>
      <span className="block font-medium text-ink">{name}</span>
      <span className="mt-1 block text-ink-muted">{oneLine}</span>
      {example ? (
        <span className="mt-1.5 block border-l-2 border-line pl-2 text-ink-faint">{example}</span>
      ) : null}
      <Link
        to={term.route}
        className="mt-2 inline-flex items-center gap-1 text-accent hover:underline"
      >
        {en ? 'Full entry' : '完整說明'} <ArrowRight size={11} />
      </Link>
    </>
  );

  return (
    <HoverCard
      card={card}
      className="cursor-help border-b border-dashed border-ink-faint transition-colors duration-fast hover:border-accent hover:text-accent"
    >
      {children}
    </HoverCard>
  );
}
