import { useEffect, useState } from 'react';

/*
 * 讀出容器裡的區塊標題，並跟著捲動標出讀者現在在哪一節。
 *
 * 抽成 hook 的理由是版型殼要在「這頁到底有沒有標題可列」之前，就決定右欄那條軌道留不留。
 * 以前那個答案由每個頁面傳 hideToc 自己宣告，於是有兩種錯法：一頁明明有標題卻關掉目次
 * （讀者不會知道自己少了什麼），或者留下一條十幾 rem 的空軌道。兩種都不是頁面作者存心的，
 * 是因為那個 prop 要求他預測一件只有 DOM 知道的事。
 *
 * 另一個好處是同一頁的手機版與桌機版兩份目次共用一次量測，不必各自掛一組 observer。
 *
 * 標題的 id 由建置時的 rehype-slug 給（見各站的 vite 設定）。沒有 id 的標題不列——
 * 列出來也跳不過去。
 */
export default function useHeadings(containerRef, { levels = [2, 3], refreshKey } = {}) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  // refreshKey 在底下那篇換掉時重讀（切換語言會整段抽換）。
  // levels 在呼叫端是字面量，比內容不比 identity。
  const levelsKey = levels.join(',');
  useEffect(() => {
    const root = containerRef?.current;
    if (!root) {
      setItems([]);
      return undefined;
    }

    // 正文是 lazy + Suspense 載進來的，掛載當下它還不在 DOM 裡。只讀一次的話，這一欄拿到的
    // 是空的（整條目次不渲染），或者更糟——上一篇還沒卸載乾淨的標題，於是每個連結都指向
    // 這一頁不存在的 id，點了完全沒有反應，看起來像連結壞掉。refreshKey 換了也救不了，
    // 它變動的時機比正文抵達早。所以改成跟著正文的 DOM 變動重讀。
    let raf = 0;
    let spy = null;

    const read = () => {
      const headings = [...root.querySelectorAll(levels.map((l) => `h${l}[id]`).join(', '))];
      // 標籤取 textContent，所以標題內部的間距要是真的字元。標題裡用 CSS margin 隔開的
      // 兩截（例如帶 ml-2 的計數）在頁面上看得到、在這裡是隱形的，大綱會把兩截黏成一個詞
      // ——空格寫進文字，不要寫進 margin。
      // 標籤優先吃 data-toc：內容欄的標題可以寫得完整，側欄那條只有 13rem 寬，長標題在那裡
      // 會斷成不成句的兩三行。頁面用 data-toc 給一個短標，就不必為了側欄把正文標題砍短。
      setItems(headings.map((h) => ({
        id: h.id,
        text: h.dataset.toc || h.textContent,
        full: h.textContent,
        level: Number(h.tagName[1]),
      })));

      // 標題進到視窗上方三分之一就算讀者在這一節。沒有下方那段負 margin 的話，最後一節
      // 永遠贏不了——短頁面上它的標題捲不到那麼高。
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

  return { items, active };
}
