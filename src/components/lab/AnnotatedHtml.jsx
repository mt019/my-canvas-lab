import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { CARD_GAP as GAP, useFloatingCard } from './useFloatingCard.js';
import MathText from './MathText';

/*
 * 已經在建置時轉成 HTML 的正文，加上編號註標。註標由建置端寫成
 * <sup class="fn-ref" data-note="3" role="button" tabindex="0">3</sup>，
 * 這裡用事件委派把它接上浮卡——正文是一整塊 HTML，沒有 React 節點可以逐個包。
 *
 * 註標編號按章內出現順序，payload 由 notes 陣列以編號對照。註標之外還有一份章末清單，
 * 那份是給列印與不用滑鼠的人看的，兩邊指的是同一組資料。
 *
 * HoverCite 用點狀底線而不用星號，理由是中文可在任兩字之間斷行、單一字元的標記會被孤立到
 * 下一行。編號註標躲不掉這件事，所以建置端把註標貼在標點之後，並用 CSS 的 nowrap 把它與
 * 前一個字綁在一起（見 styles.css 的 .fn-ref）。
 */
const CARD_W = 320;
const OPEN_DELAY = 70;
const CLOSE_DELAY = 140;

export default function AnnotatedHtml({
  html, notes = [], terms = {}, className,
}) {
  const containerRef = useRef(null);
  const [active, setActive] = useState(null); // { element, note } 或 { element, term }
  const [pinned, setPinned] = useState(false);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const byNumber = useRef(new Map());
  byNumber.current = new Map(notes.map((note) => [String(note.n), note]));
  const byTerm = useRef({});
  byTerm.current = terms;
  // 站內術語連結走 router，免得每點一個術語就整頁重載。與 TermLink 一樣，這個元件
  // 假定自己掛在 router 底下。
  const navigate = useNavigate();

  const forceClose = useCallback(() => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    setPinned(false);
    setActive(null);
  }, []);

  const getAnchor = useCallback(() => active?.element ?? null, [active]);
  const { cardRef, pos } = useFloatingCard({ open: Boolean(active), getAnchor, width: CARD_W });

  const show = useCallback((element, immediate) => {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    const payload = element.dataset.term
      ? { term: byTerm.current[element.dataset.term] }
      : { note: byNumber.current.get(element.dataset.note) };
    if (!payload.term && !payload.note) return;
    const reveal = () => setActive({ element, ...payload });
    if (immediate) reveal();
    else openTimer.current = setTimeout(reveal, OPEN_DELAY);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(openTimer.current);
    if (pinned) return;
    closeTimer.current = setTimeout(() => setActive(null), CLOSE_DELAY);
  }, [pinned]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const markerOf = (event) => event.target?.closest?.('[data-note],[data-term]');
    const onOver = (event) => { const m = markerOf(event); if (m) show(m, false); };
    const onOut = (event) => { if (markerOf(event)) hide(); };
    const onFocusIn = (event) => { const m = markerOf(event); if (m) show(m, true); };
    const onFocusOut = (event) => { if (markerOf(event)) hide(); };
    // 註標是 <sup>，點擊在原地釘住卡片；術語是 <a>，點擊走到詞條頁。
    // 手機沒有 hover，術語的那條路就是點下去進頁面，這是對的行為。
    // 站內連結交給 router 走，免得每點一個術語就整頁重載；瀏覽器自己的開新分頁、
    // 另存這些操作（按著修飾鍵、中鍵）照原樣讓給瀏覽器。
    const onClick = (event) => {
      const m = markerOf(event);
      if (m?.dataset.term) {
        const href = m.getAttribute('href');
        const plainClick = event.button === 0
          && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
        if (href?.startsWith('/') && plainClick && navigate) {
          event.preventDefault();
          forceClose();
          navigate(href);
        }
        return;
      }
      if (!m) return;
      event.preventDefault();
      show(m, true);
      setPinned((p) => !p);
    };
    const onKeyDown = (event) => {
      const m = markerOf(event);
      if (!m || m.dataset.term || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      show(m, true);
      setPinned((p) => !p);
    };
    container.addEventListener('mouseover', onOver);
    container.addEventListener('mouseout', onOut);
    container.addEventListener('focusin', onFocusIn);
    container.addEventListener('focusout', onFocusOut);
    container.addEventListener('click', onClick);
    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('mouseover', onOver);
      container.removeEventListener('mouseout', onOut);
      container.removeEventListener('focusin', onFocusIn);
      container.removeEventListener('focusout', onFocusOut);
      container.removeEventListener('click', onClick);
      container.removeEventListener('keydown', onKeyDown);
    };
  }, [forceClose, hide, navigate, show]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') forceClose(); };
    const onDown = (event) => {
      if (cardRef.current?.contains(event.target)) return;
      if (active.element.contains(event.target)) return;
      forceClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [active, cardRef, forceClose]);

  useEffect(() => () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  const note = active?.note;
  const term = active?.term;

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {(note || term) && pos
        ? createPortal(
          <div
            ref={cardRef}
            role="tooltip"
            onMouseEnter={() => { clearTimeout(closeTimer.current); }}
            onMouseLeave={hide}
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              width: CARD_W,
              maxWidth: `calc(100vw - ${GAP * 2}px)`,
              maxHeight: '45vh',
              overflowY: 'auto',
            }}
            className="z-30 rounded-token-md border border-line bg-surface-raised px-3.5 py-3 text-left text-token-xs leading-relaxed shadow-token-md"
          >
            {note ? <NoteCard note={note} /> : <TermCard term={term} />}
          </div>,
          document.body,
        )
        : null}
    </>
  );
}

/*
 * 術語卡。與註釋卡共用同一顆浮卡引擎，答的問題不同——註釋交出一份出處，術語交出一個解釋。
 * 卡片只放一行定義，其餘留給詞條頁：讀者要的是不離開句子就知道這個詞指誰。
 */
function TermCard({ term }) {
  if (!term) return null;
  return (
    <>
      <span className="block font-medium text-ink">{term.term}</span>
      {term.kind ? (
        <span className="mt-0.5 block font-accent text-token-xs uppercase tracking-[0.1em] text-ink-faint">
          {term.kind}
        </span>
      ) : null}
      <span className="mt-1.5 block text-ink-muted">{term.oneLine}</span>
      {term.route ? (
        <a
          href={term.route}
          className="mt-2 inline-flex items-center gap-1 text-accent hover:underline"
        >
          完整說明 <ArrowRight size={11} />
        </a>
      ) : null}
    </>
  );
}

function NoteCard({ note }) {
  return (
    <>
      <span className="block text-ink">
        <span className="font-accent tabular-nums text-ink-faint">{note.n}</span>
        {note.label ? <span className="ml-2">{note.label}</span> : null}
      </span>
      {note.quote ? (
        <span className="mt-1.5 block border-l-2 border-line pl-2 text-ink-muted">{note.quote}</span>
      ) : null}
      {note.text ? <span className="mt-1.5 block text-ink-muted">{note.text}</span> : null}
      {note.locator ? <span className="mt-1.5 block text-ink-faint"><MathText>{note.locator}</MathText></span> : null}
      {note.href ? (
        <a
          href={note.href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-accent hover:underline"
        >
          原文 <ExternalLink size={11} />
        </a>
      ) : null}
    </>
  );
}
