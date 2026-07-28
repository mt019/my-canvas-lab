/*
 * 返回鍵的全域配置。
 *
 * 為什麼要有這個檔：返回鍵原本每頁自己寫，於是同一個站長出四種樣子——有的回素首頁
 * （`/`）、有的回專案清單（`/all`）、有的一路把人送回 canvas 根、有的乾脆沒有。讀者
 * 每進一頁都要重新猜返回鍵在哪、按下去會去哪。**返回鍵不是頁面的內容，是站的規矩**，
 * 所以它的三個問題（顯不顯示、回哪裡、寫什麼字）在這裡一次答完，頁面只在真的有例外
 * 時才覆寫。
 *
 * 要改全站行為，改這個檔就好，不必動任何一頁。
 */

/*
 * 總開關。改成 false，全站的返回鍵一次消失（含主題站內頁）；改回 true 就全部回來。
 * 這是「哪些都要／哪些都不要」的那一顆。要細到某幾頁，用下面的 NO_BACK。
 */
export const BACK_NAV_ENABLED = true;

/*
 * 預設落點：素首頁。所有專案頁的返回鍵都回這裡。
 *
 * `label` 是空的，所以畫出來只有一個箭頭——回自己家的路不必掛招牌，站名印在每一頁的
 * 左上角是廣告不是導覽。`title` 只給滑鼠停留與螢幕閱讀器。主題站的落點仍然帶字
 * （「朱家驊研究室」），因為那是在告訴讀者他正要回到哪個站，不是在報站名。
 *
 * 想讓返回鍵直接回專案清單，把這行換成 INDEX 即可（`export const HOME = INDEX;`）——
 * 這是「我可以決定」的那一格，兩個落點都是現成的。
 */
export const HOME = { href: '/', label: '', title: '回首頁' };

/*
 * 專案清單。素首頁的隱藏入口進得去，專案頁上不掛它——清單是給我自己翻的，
 * 讀者從任何一頁往回走，看到的是素首頁那張紙。
 */
export const INDEX = { href: '/all', label: '全部' };

/*
 * 例外一：主題站（自己有首頁與多個內頁的站）的內頁，回自己站的首頁，不回素首頁。
 * 讀者在深處要回的是他正在讀的那個站，素首頁從站首頁再一步就到。
 * 比對用前綴，**長的前綴要排在前面**（陣列由上往下比，第一個中的就算）。
 */
const SITE_HOMES = [
  ['/constitutionalcourt/case/', { href: '/constitutionalcourt', label: '案件索引' }],
  ['/constitutionalcourt/justices/', { href: '/constitutionalcourt', label: '案件索引' }],
  ['/statistics/', { href: '/statisticslab', label: '統計學實驗室' }],
  ['/brief/', { href: '/brief', label: '簡報' }],
  ['/zhujiahua/', { href: '/zhujiahua', label: '朱家驊研究室' }],
];

/*
 * 例外二：這幾條路徑不畫返回鍵。素首頁自己就是返回鍵的終點，清單頁往回只有素首頁
 * （而它的入口刻意藏著，見 FrontDoor），兩者都不掛。
 */
const NO_BACK = new Set(['/', '/all']);

/*
 * 一條路徑該有什麼返回鍵。回傳 `{ href, label }`，或 `null`＝這頁不畫。
 * 主題站的分頁路由（`/constitutionalcourt/research`、`/zhujiahua/xxx`）走的是預設，
 * 因為分頁換的是同一頁的內容，不是進到更深一層。
 */
export function backFor(pathname) {
  if (!BACK_NAV_ENABLED) return null;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (NO_BACK.has(path)) return null;
  /*
   * **只有站底下的頁才回站首頁，站首頁自己不算。** 這裡本來寫 `${path}/`.startsWith(prefix)，
   * 於是 `/brief` 補成 `/brief/` 剛好命中 `/brief/` 這條，站首頁的返回鍵指向它自己——按下去
   * 什麼都沒發生。2026-07-28 使用者問「brief 頁面怎麼沒有回 canvas 首頁的按鈕」，就是這個。
   */
  const hit = SITE_HOMES.find(([prefix]) => path.startsWith(prefix));
  return hit ? hit[1] : HOME;
}

/*
 * 殼共用的解析：頁面沒表示意見（`undefined`）就照配置走；頁面明講 `null` 就不畫；
 * 傳了物件就用它的。三個殼（`PageShell`／`DashboardLayout`／`SiteHeader`）都經過這裡，
 * 所以「有的有有的沒有」不可能再從某一個殼漏出去。
 */
export function resolveBack(override, pathname) {
  if (override === null) return null;
  if (override) return BACK_NAV_ENABLED ? override : null;
  return backFor(pathname);
}

/*
 * 這一頁屬於哪個主題站——給眉標用的。
 *
 * 站的兩條回頭路是兩件不同的事，所以擺在兩個地方（2026-07-28 使用者裁定）：
 *   左上角的箭頭  → 離開這個站，回 canvas 首頁。
 *   眉標上的站名  → 回這個站自己的首頁（`/brief/events` 的「BRIEF」按下去回 `/brief`）。
 * 已經在站首頁時回 null——站名不連到自己，那是一個按了沒反應的連結。
 */
export function siteHomeFor(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const hit = SITE_HOMES.find(([prefix]) => path.startsWith(prefix));
  if (!hit) return null;
  return hit[1].href === path ? null : hit[1];
}

/*
 * 報頭（眉標＋大標題）按下去要去哪。返回鍵管「離開這個站」，報頭管「回到這個站的原點」。
 *
 * 兩種原點，都是實際被問出來的：
 *
 * 1. **深一層的頁 → 站首頁。** `/brief/events` 的「BRIEF 簡報」回 `/brief`。
 * 2. **同一頁但切過分頁 → 回到沒有參數的那一頁。** 這是第二次被問的那個
 *    （2026-07-28：「這區怎麼還是沒得點回 brief 首頁？」）——當時人就站在 `/brief`，
 *    但網址帶著 `?view=reading&activityDay=day3&sources=…`，報頭卻是純文字，因為第一版
 *    只比路徑、不看參數。分頁與篩選都在網址裡，所以「回到原點」是一個真的動作：把它們
 *    全部清掉。
 *
 * 兩者都不成立（乾淨的站首頁、或不屬於任何站又沒有參數的頁）才回 null——那時候報頭
 * 連到自己，按了不會有任何事發生。
 */
export function identityHomeFor(pathname, search = '') {
  const site = siteHomeFor(pathname);
  if (site) return site;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (NO_BACK.has(path)) return null;
  return search && search !== '?' ? { href: path, label: '' } : null;
}
