import { ExternalLink } from 'lucide-react';
import HoverCard from './HoverCard';
import MathText from './MathText';
import { useHoverCardsEnabled } from '../../styles/hoverCards';

/*
 * A source marker on a claim. Hover the cited words to see who said it and
 * where; click to pin the card so you can reach the link inside it. The floating
 * behaviour lives in HoverCard, which TermLink shares.
 *
 * The source object comes from the data repo, where a citation with no locator
 * fails validation and an id with no entry fails the build.
 *
 * No number on the marker itself — the dotted underline is the whole mark. The
 * numbering lives in the chapter-end SourcesList, which scans the article for
 * the data-cite attribute written here, assigns the anchors, and links back.
 * With hover cards turned off (styles/hoverCards.js) the underline stays and a
 * click scrolls to this citation's entry in that list.
 */
export default function HoverCite({ source, sourceId, lang = 'zh', children }) {
  const cardsOn = useHoverCardsEnabled();
  if (!source) return children;

  // The card is reader-facing: author, work, where in it, and a way to read it.
  // Anything about how the citation was checked stays in the data repo.
  const en = lang === 'en';
  const { author, title, year, container, url } = source;
  const locator = (en ? source.en?.locator : source.locator) ?? source.locator;
  const quote = (en ? source.en?.quote : source.quote) ?? source.quote;
  const linkLabel = en ? 'Read it' : '原文';

  const card = (
    <>
      <span className="block text-ink">
        {author}{en ? ` (${year}). ` : `（${year}）。`}{title}
      </span>
      {container ? <span className="mt-0.5 block text-ink-muted">{container}</span> : null}
      {quote ? (
        <span className="mt-1.5 block border-l-2 border-line pl-2 text-ink-muted">{quote}</span>
      ) : null}
      {locator ? <span className="mt-1.5 block text-ink-faint"><MathText>{locator}</MathText></span> : null}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-accent hover:underline"
        >
          {linkLabel} <ExternalLink size={11} />
        </a>
      ) : null}
    </>
  );

  // No asterisk on the marker. A marker is one more character, and Chinese breaks
  // between any two characters, so it gets orphaned onto the next line just as the
  // punctuation did. The dotted underline says the same thing and cannot be.
  //
  // 底線走 text-decoration，不用 border-bottom：行內公式的盒子比一行中文高，border
  // 畫在盒子的底緣，分數的分母因此被那條虛線穿過去（2026-08-13 站主截圖）。
  // skip-ink 在這裡是 none：漢字的墨本來就沉到基線之下，auto 會在每個字底下讓位，
  // 整條線碎掉（2026-08-13 站主第二張截圖）。只有 KaTeX 那段在 katex.css 把繼承值
  // 改回 auto，讓位只發生在分數這種真的戳進線裡的地方。
  const underline = 'underline decoration-dotted decoration-ink-faint underline-offset-[0.3em] [text-decoration-skip-ink:none] transition-colors duration-fast';

  if (!cardsOn) {
    const jump = sourceId
      ? () => document.getElementById(`source-${sourceId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      : undefined;
    return (
      <span
        data-cite={sourceId}
        role={jump ? 'link' : undefined}
        tabIndex={jump ? 0 : undefined}
        aria-label={jump ? (en ? 'Jump to the source list' : '跳到資料來源') : undefined}
        onClick={jump}
        onKeyDown={jump ? (e) => { if (e.key === 'Enter') { e.preventDefault(); jump(); } } : undefined}
        className={`scroll-mt-8 ${jump ? 'cursor-pointer' : ''} ${underline} hover:decoration-accent hover:text-accent`}
      >
        {children}
      </span>
    );
  }

  return (
    <span data-cite={sourceId} className="scroll-mt-8">
      <HoverCard
        card={card}
        className={`cursor-help ${underline} hover:decoration-accent hover:text-accent`}
      >
        {children}
      </HoverCard>
    </span>
  );
}
