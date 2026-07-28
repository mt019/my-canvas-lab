import { useEffect, useState } from 'react';

/*
 * "On this page": the headings of the article that is actually on screen, read
 * out of the DOM rather than declared by hand, so a heading added to the .mdx
 * shows up here without anyone maintaining a list. The entry for the section the
 * reader is currently in stays marked as they scroll.
 *
 * Headings get their ids from rehype-slug at build time (see vite.config.ts).
 */
export default function TableOfContents({ containerRef, label = '本頁目次', refreshKey, levels = [2, 3] }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  // refreshKey re-reads the headings when the article underneath changes — the
  // language switch swaps the whole body, and a table of contents built once at
  // mount would keep listing the previous language's headings.
  // levels is a literal at the call site; compare by content, not identity.
  const levelsKey = levels.join(',');
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    // 正文是 lazy + Suspense 載進來的，掛載當下它還不在 DOM 裡。只讀一次的話，這一欄拿到的
    // 是空的（整條目次不渲染），或者更糟——上一篇還沒卸載乾淨的標題，於是每個連結都指向
    // 這一頁不存在的 id，點了完全沒有反應，看起來像連結壞掉。refreshKey 換了也救不了，
    // 它變動的時機比正文抵達早。所以改成跟著正文的 DOM 變動重讀。
    let raf = 0;
    let spy = null;

    const read = () => {
      const headings = [...root.querySelectorAll(levels.map((l) => `h${l}[id]`).join(', '))];
    // Labels come from textContent, so any spacing inside a heading has to be a
    // real character. CSS margin between a heading's parts (e.g. a count span with
    // ml-2) shows on the page but is invisible here, so the outline would jam the
    // parts together — put the space in the text, not in the margin.
      // 標籤優先吃 data-toc：內容欄的標題可以寫得完整，側欄那條只有 13rem 寬，長標題在那裡
      // 會斷成不成句的兩三行。頁面用 data-toc 給一個短標，就不必為了側欄把正文標題砍短。
      setItems(headings.map((h) => ({
        id: h.id,
        text: h.dataset.toc || h.textContent,
        full: h.textContent,
        level: Number(h.tagName[1]),
      })));

      // The section counts as current once its heading reaches the top third of the
      // window; without the bottom margin the last section could never win, since
      // its heading never scrolls that far up on a short page.
      spy?.disconnect();
      spy = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length > 0) setActive(visible[0].target.id);
        },
        { rootMargin: '0px 0px -66% 0px', threshold: 0 },
      );
      headings.forEach((h) => spy.observe(h));
    };

    read();
    // 正文抵達、換頁、語言切換都是同一件事：底下的標題換了一組。用一個 rAF 併掉同一幀內的
    // 連續變動，免得正文一次插入幾百個節點就重讀幾百次。
    const watch = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    });
    watch.observe(root, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      watch.disconnect();
      spy?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, refreshKey, levelsKey]);

  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="text-token-xs leading-relaxed">
      <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <ul className="space-y-1.5 border-l border-line-soft">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id} style={{ paddingLeft: it.level === 3 ? 22 : 12 }}>
              {/*
                * 側欄只有 13rem 寬，長標題在這裡最多折兩行，第三行起截斷（滑過去看完整標題）。
                * line-break: strict 讓中日文的斷行避開「（」「）」「、」這些位置——沒有它，
                * 「倚音（上方與下方）」會斷成「…（上方與下」＋「方）」，讀起來像壞掉。
                * text-wrap: pretty 讓最後一行不會只剩一兩個字。
                */}
              <a
                href={`#${it.id}`}
                title={it.full}
                className="-ml-px block border-l-2 py-0.5 pl-2 transition-colors duration-fast [line-break:strict] [text-wrap:pretty] line-clamp-2"
                style={{
                  borderColor: on ? 'var(--c-accent)' : 'transparent',
                  color: on ? 'var(--c-ink)' : 'var(--c-ink-faint)',
                }}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
