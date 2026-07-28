import { useLocation } from 'react-router-dom';
import Eyebrow from './Eyebrow';
import { siteHomeFor } from '../backNav';

/*
 * 一頁的識別：眉標＋大標題。兩行各有各的職責，**不是一整塊連結**（2026-07-29 使用者裁定，
 * 取代 07-28 的「這一塊能點擊回簡報首頁」）：
 *
 * - **眉標＝站名，也是站內頁那顆看得見的小按鈕**，按下去回這個站的首頁（`/notes/…` 的
 *   「手記」回 `/notes`）。左上角那個箭頭平時是透明的、手機上根本沒有 hover，所以眉標
 *   是內頁唯一一直看得見的回頭路。
 * - **大標題＝這一頁的標題，永遠不是連結。** 站內頁不連（「這個 title 區域變成返回 note
 *   主頁的按鈕了，太奇怪」），站首頁也不連（「已經在小站首頁了，點大 title 不應該把我丟回
 *   空首頁」）。要離開這個站，用最上面那支箭頭。
 *
 * 落點一律來自 `backNav.js`，這裡只決定哪一行掛哪一個。
 * 三個殼（DashboardLayout／PageShell／ArticleLayout）都畫這一個，不各寫一份。
 */
export default function PageIdentity({ eyebrow, title, titleClassName = 'font-display', summary, children }) {
  const { pathname } = useLocation();
  const site = siteHomeFor(pathname); // 站內頁：眉標回站首頁；站首頁本身回 null

  const titleEl = title ? (
    <h1 className={`${titleClassName} text-token-2xl leading-tight sm:text-token-3xl`}>{title}</h1>
  ) : null;

  return (
    <>
      {eyebrow ? <Eyebrow className="mb-2" back={site}>{eyebrow}</Eyebrow> : null}
      {titleEl}
      {summary ? <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{summary}</p> : null}
      {children}
    </>
  );
}
