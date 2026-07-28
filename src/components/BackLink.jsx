import { Link, useLocation } from 'react-router-dom';
import { resolveBack } from '../backNav';

/*
 * 全站唯一的返回鍵。三個殼（PageShell／DashboardLayout／SiteHeader）與所有自己刻版型的
 * 頁面都畫這一個元件，落點來自 `src/backNav.js`。
 *
 * 之前是每頁自己寫：有的回素首頁、有的回專案清單、有的把人送回 canvas 根、十一頁乾脆
 * 沒有。返回鍵不是頁面的內容，是站的規矩，所以它只該有一份實作。
 *
 * **安靜。** 回自己家的路不必掛招牌——落點沒有 `label` 時只畫一個箭頭，站名不印在每一頁的
 * 左上角（那是廣告不是導覽）。平常是淡墨，滑過去才轉深。帶字的只有主題站的落點
 * （「朱家驊研究室」），那是在告訴讀者他正要回到哪個站。
 *
 * `className` 拿來接該頁自己的顏色（頁面級 CSS 變數、CSS Module class）。位置由呼叫端
 * 決定——這個元件不假設自己被放在哪裡。
 *
 * `floating` 給沒有抬頭列可掛的滿版工具頁：貼左上角、近乎透明、滑過去才浮出來。
 */
const QUIET = 'text-token-sm text-ink-faint opacity-70 transition-colors duration-fast hover:text-accent hover:opacity-100';
const FLOATING = 'fixed left-3 top-3 z-50 rounded-token-md px-2 py-1 text-token-xs '
  + 'text-ink-faint opacity-40 transition duration-fast hover:bg-paper hover:opacity-100 hover:text-accent '
  + 'focus-visible:bg-paper focus-visible:opacity-100';

export default function BackLink({ className = '', back, floating = false }) {
  const { pathname } = useLocation();
  const link = resolveBack(back, pathname);
  if (!link) return null;

  const label = link.label || '';
  const title = link.title || (label ? `回${label}` : '回首頁');

  return (
    <Link
      to={link.href}
      title={title}
      aria-label={title}
      className={className || (floating ? FLOATING : QUIET)}
    >
      {label ? `← ${label}` : '←'}
    </Link>
  );
}
