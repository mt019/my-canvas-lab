import { useEffect, useState } from 'react';

// 捲動時停在吸頂列下方的小標，像 VS Code 捲長檔案時停在上緣的那一行。
// 一筆內容很長（一本書幾十篇目次、一位作者幾十件著作）時，捲到中段就看不到自己在誰底下；
// 這條把「現在讀的是哪一本／哪一位」留在畫面上。
//
// 用法：
//   const barRef = useRef(null);
//   useStickyTop(barRef);                        // 量吸頂列高度，寫成 --lab-sticky-top
//   <nav ref={barRef} className="sticky top-0">…分頁列…</nav>
//   <article>                                     // 一組長內容
//     <StickyHeading>第 38 期・2026-03</StickyHeading>
//     …幾十列…
//   </article>
//
// 兩個常見的失效原因，都不會報錯、只會安靜地不黏：
//   1. 中間任何祖先有 overflow: hidden／auto／scroll。改成 overflow: clip 就好（clip 不建立捲動容器）。
//   2. 直接父層的高度等於小標本身（沒有可黏的行程）。小標要跟長內容當兄弟，不要自己包一層。

// 量一個吸頂元素的高度，寫進 CSS 變數供 StickyHeading 當 top 用。
// 高度會隨字級、換行、視窗寬度變，所以用 ResizeObserver 跟著更新，不寫死數字。
//
// 凡是要停在吸頂列下緣的東西都吃這個變數：`StickyHeading`、凍結的表頭、圖表的年份軸。
// 尤其**標籤多的分頁列會換行**（憲法法庭十個標籤在 900px 以下是兩行，49px → 90px），
// 寫死 `top-[49px]` 的東西那時有一半藏在分頁列後面。
//
// 另外回傳量到的數字（px），給只能在 JS 裡算的消費端用（如 IndexView 那條隨捲動收合的
// 工具列要算「已捲過貼齊點多少」）。沒用到就忽略，不影響既有呼叫端。
export function useStickyTop(ref, { varName = '--lab-sticky-top', target } = {}) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const host = target?.current || document.documentElement;
    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      host.style.setProperty(varName, `${h}px`);
      setHeight(h);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, varName, target]);
  return height;
}

export default function StickyHeading({ children, className = '', style }) {
  return (
    <div
      className={`sticky z-[3] flex items-baseline gap-2 ${className}`}
      style={{
        top: 'var(--lab-sticky-top, 0px)',
        // 底色跟著所在容器走：卡片裡是卡片色，清單裡是紙色。頁面用 --lab-sticky-bg 指定。
        background: 'var(--lab-sticky-bg, var(--c-paper))',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
