import HoverCard from '../../components/lab/HoverCard';

const reEsc = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function opinionSegments(paragraph, footnotes) {
  const numbers = Object.keys(footnotes ?? {}).sort((a, b) => Number(b) - Number(a));
  if (!numbers.length) return [paragraph];
  const pattern = numbers.map(reEsc).join('|');
  const regex = new RegExp(`([^\\d\\s第\\[［(（])([ \\t]?)(${pattern})(?!\\d)(?=\\S)`, 'g');
  const segments = [];
  let cursor = 0;
  for (const match of paragraph.matchAll(regex)) {
    const numberAt = (match.index ?? 0) + match[1].length + match[2].length;
    const after = paragraph.slice(numberAt + match[3].length, numberAt + match[3].length + 1);
    if (/[年年月日條項款號%％]/.test(after)) continue;
    segments.push(paragraph.slice(cursor, numberAt));
    segments.push({ number: match[3], text: footnotes[match[3]] });
    cursor = numberAt + match[3].length;
  }
  segments.push(paragraph.slice(cursor));
  return segments;
}

export function opinionPlainText(opinion) {
  if (!opinion?.paragraphs) return '';
  const notes = Object.entries(opinion.footnotes ?? {}).map(([number, note]) => `${number}. ${note}`);
  return [...opinion.paragraphs, ...notes].join('\n\n');
}

export default function OpinionText({ text, className = '' }) {
  const { paragraphs = [], leadCount = 0, footnotes = {} } = text ?? {};
  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => {
        const isLead = index < leadCount;
        const isNote = /^註[一二三四五六七八九十百]+：/.test(paragraph);
        return (
          <p
            key={`${index}-${paragraph.slice(0, 16)}`}
            className={`mt-2 whitespace-pre-wrap text-[13.5px] leading-[1.95] text-[var(--cc-ink-mid)] ${isLead ? 'font-bold text-[var(--cc-ink-strong)]' : ''} ${isNote ? 'pl-6 -indent-6 text-[12.5px]' : ''}`}
          >
            {opinionSegments(paragraph, footnotes).map((segment, part) => (
              typeof segment === 'string' ? segment : (
                <HoverCard
                  key={`${segment.number}-${part}`}
                  className="relative -top-[0.38em] mx-[0.08em] inline-block cursor-help text-[0.68em] font-bold leading-none text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cc-accent)]"
                  card={(
                    <div className="text-[var(--cc-ink-mid)]">
                      <p className="mb-1 font-bold text-[var(--cc-accent)]">註 {segment.number}</p>
                      <p>{segment.text}</p>
                    </div>
                  )}
                >
                  {segment.number}
                </HoverCard>
              )
            ))}
          </p>
        );
      })}
      {Object.keys(footnotes).length ? (
        <section className="mt-5 border-t border-[var(--cc-line)] pt-3" aria-label="腳註">
          <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-[var(--cc-eyebrow)]">腳註</p>
          {Object.entries(footnotes).map(([number, note]) => (
            <p key={number} className="mt-1.5 grid grid-cols-[1.4rem_1fr] gap-1 text-[12.5px] leading-[1.8] text-[var(--cc-ink-soft)]">
              <span className="font-bold text-[var(--cc-accent)]">{number}</span>
              <span>{note}</span>
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
