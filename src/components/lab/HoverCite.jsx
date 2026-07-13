import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

/*
 * A source marker on a claim. Hover (or focus) the cited words to see who said
 * it and where; click the marker to pin the card open so you can reach the link
 * inside it.
 *
 * Two things this has to get right, both learned the hard way:
 * - The card must stay open while the pointer travels into it. So the open
 *   state belongs to the wrapper that contains both the text and the card, not
 *   to the marker.
 * - The card is positioned from the marker's real screen coordinates and
 *   clamped to the viewport. Centering it on the marker with a CSS transform
 *   pushes it off-screen whenever the citation sits near a margin.
 *
 * Deliberately narrow: no numbering, no bibliography, no back-links. The source
 * object comes from the data repo, where a citation with no locator fails
 * validation.
 */
const CARD_W = 320;
const GAP = 8;

export default function HoverCite({ source, children }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState(null);
  const markerRef = useRef(null);
  const cardRef = useRef(null);
  const closeTimer = useRef(null);
  const id = useId();

  const place = useCallback(() => {
    const m = markerRef.current?.getBoundingClientRect();
    if (!m) return;
    const cardH = cardRef.current?.offsetHeight ?? 140;
    const above = m.top > cardH + GAP + 8;
    const left = Math.min(
      Math.max(GAP, m.left + m.width / 2 - CARD_W / 2),
      window.innerWidth - CARD_W - GAP,
    );
    const wanted = above ? m.top - cardH - GAP : m.bottom + GAP;
    const top = Math.min(Math.max(GAP, wanted), window.innerHeight - cardH - GAP);
    setPos({ left, top });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    // Twice: the first pass has no card to measure, so it places from an
    // estimate; the second runs once the card is mounted and uses its real
    // height. Without it, a citation near the top of the page opens off-screen.
    place();
    const frame = requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!pinned) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setPinned(false); setOpen(false); } };
    const onDown = (e) => {
      if (cardRef.current?.contains(e.target) || markerRef.current?.contains(e.target)) return;
      setPinned(false);
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [pinned]);

  if (!source) return children;

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // A short grace period: the pointer has to cross a few pixels of prose to get
  // from the marker into the card.
  const hide = () => {
    if (pinned) return;
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  const { author, title, year, container, locator, url, quote, accessibility } = source;

  return (
    <span
      className="relative inline"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span className="cursor-help border-b border-dotted border-ink-faint">{children}</span>
      <button
        ref={markerRef}
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onFocus={show}
        onBlur={hide}
        onClick={() => { setPinned((p) => !p); setOpen(true); }}
        className="ml-0.5 align-super text-token-xs text-accent transition-colors duration-fast hover:text-ink"
      >
        *
      </button>
      {open && pos ? (
        <span
          ref={cardRef}
          role="tooltip"
          id={id}
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{ position: 'fixed', left: pos.left, top: pos.top, width: CARD_W, maxHeight: '45vh', overflowY: 'auto' }}
          className="z-30 block rounded-token-md border border-line bg-surface-raised px-3.5 py-3 text-left text-token-xs leading-relaxed shadow-token-md"
        >
          <span className="block text-ink">
            {author}（{year}）。{title}
          </span>
          {container ? <span className="mt-0.5 block text-ink-muted">{container}</span> : null}
          {quote ? (
            <span className="mt-1.5 block border-l-2 border-line pl-2 text-ink-muted">{quote}</span>
          ) : null}
          {locator ? <span className="mt-1.5 block text-ink-faint">{locator}</span> : null}
          <span className="mt-2 flex items-center gap-3">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                原文 <ExternalLink size={11} />
              </a>
            ) : null}
            {accessibility ? <span className="text-ink-faint">{accessibility}</span> : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}
