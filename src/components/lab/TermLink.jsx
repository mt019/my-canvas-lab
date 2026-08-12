import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HoverCard from './HoverCard';
import { pathForLanguage } from '../../lib/siteLanguages';
import { useHoverCardsEnabled } from '../../styles/hoverCards';

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
  const cardsOn = useHoverCardsEnabled();
  if (!term) return children;

  const en = lang === 'en';

  // 浮卡關掉時（styles/hoverCards.js）虛線底線照舊，標記渲染成普通連結：
  // 點了直接進術語自己的頁，定義在那裡。
  if (!cardsOn) {
    return (
      <Link
        to={pathForLanguage(term.route, lang)}
        className="border-b border-dashed border-ink-faint transition-colors duration-fast hover:border-accent hover:text-accent"
      >
        {children}
      </Link>
    );
  }
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
        to={pathForLanguage(term.route, lang)}
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
