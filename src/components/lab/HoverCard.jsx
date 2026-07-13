import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/*
 * The floating card behind both kinds of annotation in the prose: a citation on
 * a claim (HoverCite) and a term on a word (TermLink). Hover or focus the marked
 * words to open it; click to pin it so you can reach the links inside.
 *
 * Three things this has to get right, all learned the hard way:
 * - The card must stay open while the pointer travels into it. So the open state
 *   belongs here, to the wrapper that owns both the text and the card, and both
 *   surfaces feed the same show/hide pair.
 * - The card is positioned from the marker's real screen coordinates and clamped
 *   to the viewport. Centering it on the marker with a CSS transform pushes it
 *   off-screen whenever the marked words sit near a margin.
 * - The marker is a <span>, never a <button>. Chromium treats a form control as
 *   an atomic inline box even at display:inline, so the text inside it leaves the
 *   surrounding text run — and the CJK rule that forbids a line starting with a
 *   full stop can no longer reach across it, stranding the punctuation after a
 *   citation alone on the next line. A span keeps one run; role and key handling
 *   give back what the button element was providing.
 */
const CARD_W = 320;
const GAP = 8;

export default function HoverCard({ children, card, className }) {
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
    // height. Without it, a marker near the top of the page opens off-screen.
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

  return (
    <>
      <span
        ref={markerRef}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => { setPinned((p) => !p); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setPinned((p) => !p);
            setOpen(true);
          }
        }}
        className={className}
      >
        {children}
      </span>
      {open && pos
        ? createPortal(
          // Rendered at the end of <body>, not inside the paragraph. Anything
          // mounted inside the sentence — even out of flow — risks nudging the
          // line boxes around it, and the text visibly jumped on hover.
          <div
            ref={cardRef}
            role="tooltip"
            id={id}
            onMouseEnter={show}
            onMouseLeave={hide}
            style={{ position: 'fixed', left: pos.left, top: pos.top, width: CARD_W, maxHeight: '45vh', overflowY: 'auto' }}
            className="z-30 rounded-token-md border border-line bg-surface-raised px-3.5 py-3 text-left text-token-xs leading-relaxed shadow-token-md"
          >
            {card}
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
