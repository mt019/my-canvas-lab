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
 * **預設隱形，滑過去才浮出來**（2026-07-28 使用者裁定）。它照樣佔著位置（不是
 * display:none），浮出來時不會把旁邊的東西推開。**鍵盤一定看得見**（`focus-visible`）——
 * 只靠 hover 的隱形控制項對鍵盤使用者等於不存在，那不是安靜，是壞掉。
 *
 * **外觀與隱形全在這個檔裡，呼叫端一個字都不傳**（2026-07-30 使用者：「這應該是通用元件
 * 啊不是應該提出去統一管理嗎」）。前一版把 `className` 當成整份替換（`className || QUIET`），
 * 於是九個自己刻抬頭列的頁各自傳了一組字級與顏色，隱形樣式連帶被換掉——箭頭在那些頁上
 * 從來沒有隱形過，而且九頁九種字級（12px／13px／token-sm）與九種 hover 色。
 * 現在呼叫端只決定它放在哪、要不要留下方間距；顏色與字級由這裡定：
 *
 * - **顏色跟著所在容器的文字色走**（不設 `text-*`，就是 `inherit`），所以它自動落在每頁
 *   自己的墨色裡，不必逐頁傳變數。
 * - **hover 色吃 `--backlink-accent`，沒設就用全站 accent。** 有自己色盤的頁把這一行加進
 *   它本來就有的頁面級變數表（`CC_VARS` 這種），不要傳 class。
 * - **熱區就在箭頭身上**，外圈只多 4px（負外距補回來，版面不動）。曾經是「整條抬頭列
 *   掛 `group`」，於是游標掃過標題或內文都會讓它浮出來（2026-07-30 使用者：「hover 顯示
 *   箭頭的範圍也太大了吧」）。隱形的東西要靠近它才顯形，一整列都算靠近就等於沒有隱形。
 *   所以三個殼那一列的 `group` 已經拿掉，熱區只由這個元件決定，全站一種行為。
 *
 * `floating` 給沒有抬頭列可掛的滿版工具頁：貼左上角，同樣隱形，靠自身那塊內距接住游標。
 */
const HIDDEN = 'opacity-0 transition duration-fast '
  + 'group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100';

const ARROW = 'inline-block whitespace-nowrap text-token-sm '
  + 'hover:text-[var(--backlink-accent,var(--c-accent))]';

// 負外距把內距抵掉，熱區比箭頭大一圈而版面不動。
const ZONE = 'group -m-1 block w-fit shrink-0 p-1';

const FLOATING_ZONE = 'group fixed left-1 top-1 z-50 block p-2';
const FLOATING_ARROW = 'inline-block rounded-token-md px-1 text-token-xs '
  + 'hover:bg-paper hover:text-[var(--backlink-accent,var(--c-accent))] focus-visible:bg-paper';

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

export default function BackLink({ back, floating = false }) {
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
    <span className={floating ? FLOATING_ZONE : ZONE}>
      <Link
        to={link.href}
        aria-label={link.title || label_}
        onClick={onClick}
        className={`${HIDDEN} ${floating ? FLOATING_ARROW : ARROW}`}
      >
        {label ? `← ${label}` : '←'}
      </Link>
    </span>
  );
}
