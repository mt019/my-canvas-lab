import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { INDEX, resolveBack } from '../backNav';

/*
 * 全站唯一的返回鍵。三個殼（PageShell／DashboardLayout／SiteHeader）與所有自己刻版型的
 * 頁面都畫這一個元件，落點來自 `src/backNav.js`。
 *
 * 之前是每頁自己寫：有的回素首頁、有的回專案清單、有的把人送回 canvas 根、十一頁乾脆
 * 沒有。返回鍵不是頁面的內容，是站的規矩，所以它只該有一份實作。
 *
 * **安靜。** 回自己家的路不必掛招牌——落點沒有 `label` 時只畫一個箭頭，站名不印在每一頁的
 * 左上角（那是廣告不是導覽）。帶字的只有主題站的落點（「朱家驊研究室」），那是在告訴讀者
 * 他正要回到哪個站。
 *
 * **預設隱形，滑到抬頭那一列才浮出來**（2026-07-28 使用者裁定）。它照樣佔著位置（不是
 * display:none），浮出來時不會把旁邊的東西推開；殼在那一列掛了 `group`，所以游標移到
 * 左上角附近它就出現，不必精準壓在那個箭頭上。**鍵盤一定看得見**（`focus-visible`）——
 * 只靠 hover 的隱形控制項對鍵盤使用者等於不存在，那不是安靜，是壞掉。
 *
 * `className` 拿來接該頁自己的顏色（頁面級 CSS 變數、CSS Module class）。位置由呼叫端
 * 決定——這個元件不假設自己被放在哪裡。
 *
 * `floating` 給沒有抬頭列可掛的滿版工具頁：貼左上角、近乎透明、滑過去才浮出來。
 */
const QUIET = 'text-token-sm text-ink-muted opacity-0 transition duration-fast '
  + 'group-hover:opacity-100 hover:text-accent hover:opacity-100 focus-visible:opacity-100';

const FLOATING = 'fixed left-3 top-3 z-50 rounded-token-md px-2 py-1 text-token-xs '
  + 'text-ink-muted opacity-80 transition duration-fast hover:bg-paper hover:opacity-100 hover:text-accent '
  + 'focus-visible:bg-paper focus-visible:opacity-100';

/*
 * 連點兩下回專案清單（2026-07-28 使用者裁定）。
 *
 * **只有落點是素首頁的那些返回鍵才有這件事**：主題站內頁的返回鍵（「← 簡報」）連點兩下
 * 沒有第二個意思，照原樣一下就走。
 *
 * 瀏覽器沒有「這是雙擊的第一下」這種事件，所以單擊必須先等一小段（下面的 DOUBLE_MS），
 * 確認沒有第二下才走。這個延遲是這個功能的成本，不是 bug：它落在最常用的那一下。
 * 三件事一定要留著，不然就是拿一個小把戲換掉瀏覽器本來就對的行為：
 *
 * 1. `href` 照舊指向素首頁——cmd／ctrl 點開新分頁、中鍵、右鍵選單、「複製連結網址」
 *    全部走原生，那些路徑一秒都不延遲（下面看到修飾鍵就直接放行）。
 * 2. **鍵盤不等待**：Enter 觸發的 click 其 `detail` 是 0，直接走，不要讓鍵盤使用者
 *    陪這 260 毫秒。
 * 3. 元件卸載時把計時器清掉，免得在已經離開的頁面上導覽。
 */
const DOUBLE_MS = 260;

export default function BackLink({ className = '', back, floating = false }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const link = resolveBack(back, pathname);
  if (!link) return null;

  const label = link.label || '';
  const doubleClickable = link.href === '/' && INDEX.href !== link.href;
  /*
   * **不掛 `title`。** 瀏覽器那個原生提示框是系統畫的，跟這個站的字體與顏色沒有任何關係，
   * 停在箭頭上一秒就跳出來一塊灰框（使用者 2026-07-28：「這個 hover 框框也太醜了」）。
   * 而且它會把連點兩下那個隱藏入口寫成說明文字——隱藏入口一旦有說明就不是隱藏入口了。
   * 螢幕閱讀器需要的名字由 `aria-label` 給，那個不會畫出任何東西。
   */
  const label_ = label ? `回${label}` : '回首頁';

  const onClick = (e) => {
    if (!doubleClickable) return;
    // 修飾鍵與非左鍵一律讓給瀏覽器：開新分頁、複製網址這些不該被攔。
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    // detail 0＝鍵盤觸發的，不等。
    if (e.detail === 0) return;
    e.preventDefault();
    if (e.detail >= 2) {
      clearTimeout(timer.current);
      navigate(INDEX.href);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(link.href), DOUBLE_MS);
  };

  return (
    <Link
      to={link.href}
      aria-label={link.title || label_}
      onClick={onClick}
      className={className || (floating ? FLOATING : QUIET)}
    >
      {label ? `← ${label}` : '←'}
    </Link>
  );
}
