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
 * `label` 是空的，所以畫出來只有一個箭頭——回自己家的路不必掛招牌。`title` 只給滑鼠停留
 * 與螢幕閱讀器。**箭頭上不寫站名**：站名是眉標那顆按鈕的字，寫兩次就變成同一畫面上兩個
 * 同名、去處卻不同的東西（2026-07-29）。
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
 * 主題站登記表（自己有首頁與多個內頁的站）。**給眉標那顆按鈕用**：站內頁的眉標寫著站名，
 * 按下去回這個站的首頁。箭頭不看這張表（它一律回素首頁）。
 *
 * 比對用前綴，**長的前綴要排在前面**（陣列由上往下比，第一個中的就算）。新開一個有內頁的
 * 站就要在這裡加一行，否則那些內頁沒有回自己站的路——`validate:shell` 會逐條網址檢查，
 * 漏登記會擋下來。
 *
 * 落點可以帶查詢字串（統計的術語表與標籤總覽是 `/statisticslab` 的兩個分頁，沒有自己的路由）。
 * `validate:shell` 比對路由存不存在時會先把 `?…` 切掉，所以只有「?tab= 的分頁真的存在」這件事
 * 檢查不到——加一條這種落點時，要**真的點那顆眉標**看落到哪個分頁，別只看網址組得出來
 * （2026-07-28 的教訓：分頁按鈕連到一條查不到 slug 的路由，用 `?tab=` 進頁反而繞過了它）。
 */
const SITE_HOMES = [
  ['/constitutionalcourt/case/', { href: '/constitutionalcourt', label: '案件索引' }],
  ['/constitutionalcourt/justices/', { href: '/constitutionalcourt', label: '案件索引' }],
  ['/constitutionalcourt/', { href: '/constitutionalcourt', label: '案件索引' }],
  // 一個術語、一個標籤各自成頁，往回一層是那份清單，不是整個實驗室——回到「所有標籤」
  // 比回到實驗室門口精確，讀者剛才就是從那裡點進來的。
  ['/statistics/glossary/', { href: '/statisticslab?tab=glossary', label: '術語表' }],
  ['/statistics/tags/', { href: '/statisticslab?tab=tags', label: '所有標籤' }],
  ['/statistics/', { href: '/statisticslab', label: '統計學實驗室' }],
  ['/brief/', { href: '/brief', label: '簡報' }],
  ['/notes/', { href: '/notes', label: '手記' }],
  ['/chenyinke/liu-rushi/', { href: '/chenyinke', label: '陳寅恪資料庫' }],
  ['/zhujiahua/', { href: '/zhujiahua', label: '朱家驊研究室' }],
  ['/userscripts/', { href: '/userscripts', label: '使用者腳本' }],
];

/*
 * 例外二：這幾條路徑不畫返回鍵。素首頁自己就是返回鍵的終點，清單頁往回只有素首頁
 * （而它的入口刻意藏著，見 FrontDoor），兩者都不掛。
 */
const NO_BACK = new Set(['/', '/all']);

/*
 * 左上角那支箭頭該指向哪。回傳 `{ href, label }`，或 `null`＝這頁不畫。
 *
 * **一律回素首頁，而且不帶站名**（2026-07-29 使用者裁定）。它管的是「離開這個站」這一件事，
 * 站內的回頭路由眉標負責（見 siteHomeFor）。之前內頁的箭頭會寫成「← 手記」，於是同一個
 * 畫面上出現兩個寫著「手記」的東西、指向不同地方：使用者的話是「最上面那個有箭頭的地方
 * 是回素首頁的，不應該有小站的名字出現」。
 */
export function backFor(pathname) {
  if (!BACK_NAV_ENABLED) return null;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (NO_BACK.has(path)) return null;
  return HOME;
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
 * 一頁最多三個回頭的東西，各管一件事（2026-07-29 使用者重新裁定，取代 07-28 的「報頭整塊
 * 都是連結」）：
 *   左上角的箭頭  → 一律回素首頁，只有箭頭、不帶站名。
 *   眉標上的站名  → 站內頁那顆看得見的小按鈕，回這個站的首頁（`/notes/…` 的「手記」回 `/notes`）。
 *   大標題        → **全站一律不是連結**（理由見本檔最後一段）。
 *
 * 已經在站首頁時回 null——站名不連到自己，那是一個按了沒反應的連結。
 */
export function siteHomeFor(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const hit = SITE_HOMES.find(([prefix]) => path.startsWith(prefix));
  if (!hit) return null;
  return hit[1].href === path ? null : hit[1];
}

/*
 * **大標題不是導覽元件，全站一律不可點。** 這裡曾經有一支 `identityHomeFor` 決定「報頭按
 * 下去去哪」，2026-07-29 一天之內被否掉三次，最後收斂成這條規矩：
 *
 *   - 內頁的大標題連到站首頁 → 「這個 title 區域變成返回 note 主頁的按鈕了，太奇怪」。
 *   - 內頁的大標題連到素首頁 → 「不能按到我的空首頁去啊」（站沒登記時的 fallback 造成的）。
 *   - 站首頁的大標題連到素首頁 → 「已經在小站首頁了，點大 title 不應該把我丟回空首頁；
 *     要回空首頁有最上面那個小箭頭」。
 *
 * 一頁只剩兩條回頭路，各一個去處，不重疊：**左上角的箭頭回素首頁**（backFor），
 * **眉標上的站名回這個站的首頁**（siteHomeFor，站首頁本身不連——那是連到自己）。
 */
