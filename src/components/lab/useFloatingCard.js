import { useCallback, useRef, useState } from 'react';
import { useLayoutEffectOnClient } from './useLayoutEffectOnClient.js';

/*
 * 浮卡的定位。HoverCard（包住一段文字的引用／術語）與 AnnotatedHtml（正文裡的編號註標）
 * 共用這一份，因為兩邊踩到的坑一樣：
 *
 * - 位置從 anchor 的實際螢幕座標算，再夾回視窗內。用 CSS transform 置中，anchor 靠近
 *   邊界時會被推出畫面。
 * - 要量兩次。第一次卡片還沒 mount，只能用估計高度；requestAnimationFrame 之後再量一次
 *   真實高度。少了第二次，頁面頂端的 anchor 會開在畫面外。
 * - scroll 要用 capture，正文可能捲在內層容器裡。
 */
export const CARD_GAP = 8;
const ESTIMATED_H = 140;

export function useFloatingCard({ open, getAnchor, width }) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const anchor = getAnchor()?.getBoundingClientRect();
    if (!anchor) return;
    const cardW = cardRef.current?.offsetWidth ?? Math.min(width, window.innerWidth - CARD_GAP * 2);
    const cardH = cardRef.current?.offsetHeight ?? ESTIMATED_H;
    const above = anchor.top > cardH + CARD_GAP + 8;
    const left = Math.min(
      Math.max(CARD_GAP, anchor.left + anchor.width / 2 - cardW / 2),
      window.innerWidth - cardW - CARD_GAP,
    );
    const wanted = above ? anchor.top - cardH - CARD_GAP : anchor.bottom + CARD_GAP;
    const top = Math.min(Math.max(CARD_GAP, wanted), window.innerHeight - cardH - CARD_GAP);
    setPos({ left, top });
  }, [getAnchor, width]);

  useLayoutEffectOnClient(() => {
    if (!open) { setPos(null); return undefined; }
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

  return { cardRef, pos };
}
