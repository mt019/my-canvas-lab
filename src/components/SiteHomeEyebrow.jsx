/*
 * 眉標＝站名，站內頁時它就是回這個站首頁的那顆按鈕（規矩見 src/backNav.js 與
 * docs/DESIGN.md「一頁只有兩條回頭路」）。
 *
 * 走三個殼（PageShell／DashboardLayout／ArticleLayout）的頁不需要這個元件——`PageIdentity`
 * 已經把眉標接上 `siteHomeFor`。**這個元件是給自己刻抬頭列的頁用的**：憲法法庭、ECFA、
 * 中研院法研所、國際稅法、Manus、色票試穿間、翻譯總覽、政府債務，以及統計標籤頁。這些頁
 * 各有各的 CSS 變數與字級，套不進共用殼，但「站內頁的眉標要能回站首頁」是站的規矩、
 * 不是某一頁的裝飾，所以判斷只寫這一份，頁面只交出自己的字與顏色。
 *
 * 沒有站首頁可回（站首頁本身、或這個站根本沒有內頁）時，原樣畫出 `as` 指定的標籤，
 * className 一字不動——所以把既有的 `<p className="…">` 換成這個元件，畫面不會有任何變化，
 * 變化只發生在它真的有地方可回的時候。
 *
 * 看得出能按靠點線底線，**不畫箭頭**（使用者：箭頭太醜），與 `Eyebrow` 的 `back` 同一種語言。
 * 底線畫在文字那個 span 上，不畫在外層：外層是 flex 容器，text-decoration 不會傳進 flex item。
 * 圖示走 `icon`，才不會被底線一起劃過去。
 */
import { Link, useLocation } from 'react-router-dom';
import { siteHomeFor } from '../backNav';

const UNDERLINE = 'underline decoration-dotted decoration-1 underline-offset-[5px]';

export default function SiteHomeEyebrow({
  as: Tag = 'div',
  className = '',
  style,
  icon = null,
  linkClassName = '',
  underlineClassName = '',
  children,
}) {
  const { pathname } = useLocation();
  const site = siteHomeFor(pathname);

  if (!site) {
    return <Tag className={className} style={style}>{icon}{children}</Tag>;
  }

  return (
    <Link
      to={site.href}
      aria-label={`回${site.label}`}
      style={style}
      className={`${className} inline-flex w-fit items-center gap-2 transition-colors duration-fast ${linkClassName}`.trim()}
    >
      {icon}
      <span className={`${UNDERLINE} ${underlineClassName}`.trim()}>{children}</span>
    </Link>
  );
}
