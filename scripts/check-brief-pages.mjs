/*
 * 實跑 /brief、/brief/reading 與 /brief/events，檢查畫面上的話跟資料對不對得起來。
 *
 *   npm run dev            （另一個視窗）
 *   npm run check:brief
 *
 * 為什麼要有這支：第七輪的錯是「售票節目 480 檔」，實際只有 444——前端拿「不在預設視圖」
 * 當「售票」，於是 36 場沒被追蹤的中研院講座被算成戲票。build 四道閘門全綠、eslint 全綠、
 * 零 console error，**每一道都過，而畫面在說謊**。會咬到它的只有一件事：真的把頁面打開，
 * 拿畫面上的數字去對資料。
 *
 * 所以這裡的檢查一律「從 JSON 自己算一次，再跟畫面上的字比」，不是比對寫死的期望值——
 * 寫死的話，資料一換這支就得跟著改，然後有人會把它改成通過為止。
 *
 * 第九輪加的檢查，各對應一個「四閘全綠而畫面在說謊」的新機會：
 *
 * 1. **區塊是不是真的從資料長出來。** 這一輪的整件事就是把寫死的六區改成照 sources[] 的
 *    collection＋kind 生成。寫死的區塊跟生成的區塊在畫面上長得一模一樣——分辨得出來的只有
 *    一件事：拿資料裡實際有幾種 kind 去數畫面上有幾區。所以這支不再檢查「有沒有那六個
 *    標題」（舊版就是那樣寫的，而它會在區塊被改回寫死時照樣通過），改成每一種 kind 都要
 *    有它自己的區、每一區的數字都要是那一區的來源自己數出來的。
 * 2. **datePrecision 有沒有被吃掉。** NBER 與 IMF 只講得出月份，日期是資料倉補的 1 號。
 *    前端照 md() 印會印出「7/1」——一個沒有人講過的日子，而且看起來完全正常。
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BRIEF_BASE ?? 'http://localhost:5173';
const data = JSON.parse(readFileSync(new URL('../src/data/brief-events.json', import.meta.url), 'utf8'));

const SOURCE = Object.fromEntries(data.sources.map((s) => [s.id, s]));
const followed = new Set(data.followed.map((f) => `${f.source} ${f.host}`));
const sourcesWithFollowed = new Set(data.followed.map((f) => f.source));
const inDefaultView = (e) => {
  const s = SOURCE[e.source];
  if (!s?.inDefaultView) return false;
  if (!sourcesWithFollowed.has(e.source)) return true;
  return followed.has(`${e.source} ${e.host}`);
};
const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
const dayDiff = (from, to) => Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 864e5);
const isOngoing = (e) => Boolean(e.endDate) && e.date < today && e.endDate >= today;

const kindsOf = (collection) => [...new Set(data.sources.filter((s) => s.collection === collection).map((s) => s.kind))];
const itemSources = data.sources.filter((s) => s.collection === 'items');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  通過' : '未通過'}｜${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

/* innerText 不會因為 span 的 margin 補空格：「預印本12 篇」。比對前把空白全部去掉，
   免得這支咬到的是排版而不是數字。 */
const headings = async () => (await page.locator('h2, h3').allInnerTexts()).map((t) => t.replace(/\s/g, ''));
const sectionOf = (id) => page.locator(`#${id}`).locator('xpath=ancestor::section[1]');

try {
  // ---- 錯過就沒了的東西不能藏在分頁後面：日報是完整那一塊，其餘分頁至少要有一行連回它。
  //      有要關的門（urgentN>0）時，每個分頁都得 surface 得到 #closing（日報＝整塊 h2、其餘＝
  //      一行 banner，兩者都掛 id="closing"）；沒有要關的門時不強制。
  const pinned = [];
  let urgentN = 0;
  for (const view of ['daily', 'week', 'month', 'sources']) {
    await page.goto(`${BASE}/brief?view=${view}`, { waitUntil: 'networkidle' });
    const has = (await page.locator('#closing').count()) === 1;
    if (view === 'daily') {
      urgentN = Number((await sectionOf('closing').innerText()).match(/(\d+)\s*件/)?.[1] ?? '0');
      pinned.push(has);
    } else {
      pinned.push(urgentN > 0 ? has : true);
    }
  }
  check('要關的門在每個分頁都 surface 得到（日報整塊、其餘一行連回日報）', pinned.every(Boolean));

  // ---- 門口 /brief，預設分頁＝日報（乾淨的瀏覽器＝一篇都沒看過）
  await page.goto(`${BASE}/brief`, { waitUntil: 'networkidle' });
  const brief = await page.locator('main').innerText();
  const closingText = await sectionOf('closing').innerText();

  const soon = (e) =>
    e.closesAt &&
    e.closesAt >= today &&
    e.closesAt <= new Date(Date.now() + 8 * 3600 * 1000 + 7 * 864e5).toISOString().slice(0, 10);
  const coreSoon = data.events.filter((e) => soon(e) && inDefaultView(e));
  check('快關門區列出預設視圖裡每一件要關的門', coreSoon.every((e) => closingText.includes(e.title.slice(0, 12))), `${coreSoon.length} 件`);

  // 另置一塊的那些＝「預設視圖以外的」，不是「售票的」（480/444 那個錯就是把這兩件事混為一談）
  const asideSoon = data.events.filter((e) => soon(e) && !inDefaultView(e));
  check(`預設視圖外要關的門＝${asideSoon.length} 件`, new RegExp(`另有 ${asideSoon.length} 件不在預設視圖`).test(closingText.replace(/\n/g, '')));

  // ---- 區塊從資料長出來：每一種 kind 都有它自己的區
  const readingHeads = await headings();
  const itemKinds = kindsOf('items');
  const missingKinds = itemKinds.filter((k) => !readingHeads.some((h) => h.startsWith(k)));
  check(`讀的東西：${itemKinds.length} 種 kind 各有一區，一種都不少`, missingKinds.length === 0, missingKinds.join('、'));

  const kindCounts = itemKinds.map((k) => {
    const ids = itemSources.filter((s) => s.kind === k).map((s) => s.id);
    return { kind: k, n: data.items.filter((i) => ids.includes(i.source)).length };
  });
  const wrongCounts = kindCounts.filter(({ kind, n }) => !readingHeads.includes(`${kind}${n}篇`));
  check('每一區的篇數＝那一區的來源自己數出來的', wrongCounts.length === 0, wrongCounts.map((x) => `${x.kind} 應為 ${x.n}`).join('、'));

  // 24 個來源全部在門口露臉，一個都沒被吃掉（BIS 那 25 則整個消失就是這樣來的）
  const missingSources = itemSources.filter((s) => !brief.includes(s.label));
  check(`讀的東西的 ${itemSources.length} 個來源都在門口列著`, missingSources.length === 0, missingSources.map((s) => s.id).join('、'));

  /* 論文沒有「來不及」——讀的東西那幾區不准出現倒數。
     **只掃那幾區**：報裡面讀的東西與活動在同一頁上，而活動的倒數是對的。舊版靠「分頁標籤
     以下」切範圍，那在切 collection 的版面成立，換成報就沒意義了——它咬到的是隔壁區。
     倒數一定帶數字（inDays() 印的是「21 天後」）：不能只找「天後」，OECD 的來源說明裡資料倉
     自己寫著「出版日有時排在幾天後」，那是散文，咬它只會訓練人忽略這道檢查。 */
  const COUNTDOWN = /\d+ 天後|\d+ 天前|剩 \d+ 天|今天最後一天/;
  const dirty = [];
  for (const kind of itemKinds) {
    /* 區不在就跳過——那件事「一種都不少」那一項已經在管了。這裡不能 await 一個不存在的
       元素：它會等 30 秒然後丟例外，而例外會讓**它後面每一項都不跑**。一支在某個情境下
       會 crash 的檢查，在那個情境下等於沒有檢查，而那通常正是出事的情境。 */
    const sec = page.locator('h2', { hasText: kind }).first().locator('xpath=ancestor::section[1]');
    if ((await sec.count()) === 0) continue;
    const hit = (await sec.innerText()).match(COUNTDOWN);
    if (hit) dirty.push(`${kind}：${hit[0]}`);
  }
  check('讀的東西沒有倒數', dirty.length === 0, dirty.join('、'));

  // ---- 日報＝我還沒看過的，不是「今天」
  /* 乾淨的 context 沒有 localStorage → 一篇都沒看過 → 日報就是全部。這一條同時擋住兩種錯：
     拿自然日當日報（今天只有 3 篇），以及自動標已讀（打開就清空）。 */
  const unreadCount = data.items.length + data.events.filter(inDefaultView).length;
  check(`日報＝還沒看過的 ${unreadCount} 件（乾淨瀏覽器＝全部）`, new RegExp(`日報\\s*${unreadCount}`).test(brief.replace(/\n/g, ' ')));

  // 月精度的 24 篇進得了日報。以日期為準的日報會讓它們只在每月 1 號出現。
  const monthly = data.items.filter((i) => i.datePrecision === 'month');
  check(
    `月精度的 ${monthly.length} 篇（${[...new Set(monthly.map((i) => SOURCE[i.source].label))].join('、')}）進得了日報`,
    monthly.every((i) => brief.includes(i.title.slice(0, 20))),
  );

  // 不自動標已讀：重新整理之後日報還在
  await page.reload({ waitUntil: 'networkidle' });
  check('不自動標已讀：重新整理後日報沒有清空', new RegExp(`日報\\s*${unreadCount}`).test((await page.locator('main').innerText()).replace(/\n/g, ' ')));

  // 按下「標為已讀」→ 日報空掉，且東西沒有不見（週報還在）
  await page.locator('button', { hasText: '標為已讀' }).first().click();
  await page.waitForTimeout(200);
  const afterMark = (await page.locator('main').innerText()).replace(/\n/g, ' ');
  check('標為已讀之後日報歸零', /日報\s*0/.test(afterMark) && afterMark.includes('這一批你都看過了'));
  await page.goto(`${BASE}/brief?view=week`, { waitUntil: 'networkidle' });
  check('標為已讀不會把東西弄丟：週報照樣在', (await page.locator('main').innerText()).includes('最近 7 天出的'));
  await page.evaluate(() => localStorage.clear());

  // ---- 週報月報：同一個天數，兩個方向
  for (const { id, label, days } of [
    { id: 'week', label: '週報', days: 7 },
    { id: 'month', label: '月報', days: 30 },
  ]) {
    await page.goto(`${BASE}/brief?view=${id}`, { waitUntil: 'networkidle' });
    const txt = (await page.locator('main').innerText()).replace(/\n/g, ' ');
    // 讀的東西往回看
    const back = data.items.filter((i) => dayDiff(i.publishedAt, today) <= days).length;
    check(`${label}：讀的東西往回看 ${days} 天＝${back} 篇`, new RegExp(`最近 ${days} 天出的 ${back} 篇`).test(txt));
    // 活動往前看
    const fwd = data.events.filter(
      (e) => inDefaultView(e) && (isOngoing(e) || (dayDiff(today, e.date) >= 0 && dayDiff(today, e.date) <= days)),
    ).length;
    check(`${label}：活動往前看 ${days} 天＝${fwd} 場`, new RegExp(`接下來 ${days} 天裡的 ${fwd} 場活動`).test(txt));
  }

  /* ---- 標記層：留著／我要去
   *
   * 這幾項要咬的是同一件事：**「留著」是不是真的留得住。** 資料倉每個來源只送最新 12 篇
   * （sync-to-canvas.mjs 的 ITEM_QUOTA_DEFAULT），你留的東西幾天內就會被新的擠出這批投影。
   * 上一版三種標記共用一份實作、一律剪掉「不在這批投影裡」的 id，於是留著的東西會在某次
   * sync 之後連同標記一起消失，**而畫面上一個字都不會說**。
   *
   * 這種錯永遠不會在今天的資料上出現——它要等資料換一批才發作，那時候沒有人在看。所以
   * 這裡直接把「已經輪替出去」那個未來狀態做出來：塞一筆 id 不在庫裡的標記進去。
   */
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/brief?view=kept`, { waitUntil: 'networkidle' });
  check('沒標過東西時，「留著的」講得出它是什麼', (await page.locator('main').innerText()).includes('還沒有標記過東西'));

  const GONE = { id: 'gone:already-rotated-out', title: '這筆已經被新的擠出投影了' };
  await page.evaluate((gone) => {
    localStorage.setItem(
      'canvaslab:brief:kept',
      JSON.stringify([
        {
          id: gone.id,
          kind: 'item',
          title: gone.title,
          url: 'https://example.org/gone',
          date: '2026-01-01',
          source: 'nope',
          sourceLabel: '某個來源',
          markedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
  }, GONE);
  await page.goto(`${BASE}/brief?view=kept`, { waitUntil: 'networkidle' });
  const keptGone = await page.locator('main').innerText();
  check('留著的東西撐得過投影輪替：id 不在這批庫裡，它照樣列著', keptGone.includes(GONE.title));
  check('而且明說它為什麼看起來不一樣，不是假裝沒事', keptGone.includes('已經不在現在這批裡了'));

  // 留著 ≠ 看過。兩個標記共用過一份實作，混起來的話按「留著」會把東西從日報裡弄不見。
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/brief`, { waitUntil: 'networkidle' });
  await page.locator('[data-mark="留著"]').first().click();
  await page.waitForTimeout(100);
  const afterKeep = (await page.locator('main').innerText()).replace(/\n/g, ' ');
  check('按了留著，分頁上就有 1 件', /留著的\s*1/.test(afterKeep));
  check('留著不等於看過：日報沒有因此少一件', new RegExp(`日報\\s*${unreadCount}`).test(afterKeep));

  await page.reload({ waitUntil: 'networkidle' });
  check('留著撐得過重新整理', /留著的\s*1/.test((await page.locator('main').innerText()).replace(/\n/g, ' ')));

  await page.goto(`${BASE}/brief?view=kept`, { waitUntil: 'networkidle' });
  check('「留著的」列得出剛才那一件', (await page.locator('main').innerText()).replace(/\s/g, '').includes('留著1篇'));

  // 我要去：活動曆按下去，門口的「留著的」看得到——兩頁同一份標記
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/brief/events`, { waitUntil: 'networkidle' });
  await page.locator('[data-mark="我要去"]').first().click();
  await page.waitForTimeout(100);
  await page.goto(`${BASE}/brief?view=kept`, { waitUntil: 'networkidle' });
  const goingText = (await page.locator('main').innerText()).replace(/\s/g, '');
  check('活動曆按的「我要去」，門口的「留著的」看得到（兩頁同一份標記）', goingText.includes('我要去1場'));
  await page.evaluate(() => localStorage.clear());

  const defaultEventCount = data.events.filter((e) => inDefaultView(e)).length;

  // ---- 讀的東西內頁 /brief/reading
  await page.goto(`${BASE}/brief/reading`, { waitUntil: 'networkidle' });
  const reading = (await page.locator('main').innerText()).replace(/\n/g, ' ');

  check(`列出全部 ${data.items.length} 篇，前端沒有第二道配額`, reading.replace(/\s/g, '').includes(`這一批${data.items.length}篇`));

  // datePrecision：只講得出月份的來源不准印出「月/日」
  const monthOnly = data.items.filter((i) => i.datePrecision === 'month');
  for (const id of [...new Set(monthOnly.map((i) => i.source))]) {
    const n = monthOnly.filter((i) => i.source === id).length;
    const rows = await page.locator(`#s-${id}`).locator('xpath=..').innerText();
    const day = rows.match(/\d+\/\d+/)?.[0];
    check(`${SOURCE[id].label} 只講得出月份 → 畫面不准出現「月/日」`, !day, day ? `印出了 ${day}` : `${n} 篇只印到月`);
  }
  // 反面：講得出日期的來源要真的印出日，別為了躲上面那條把全部都砍成月
  const dayIds = [...new Set(data.items.filter((i) => i.datePrecision === 'day').map((i) => i.source))];
  const dayShown = await page.locator(`#s-${dayIds[0]}`).locator('xpath=..').innerText();
  check(`${SOURCE[dayIds[0]].label} 講得出日期 → 畫面要印到日`, /\d+\/\d+/.test(dayShown));

  // 摘要是 null 的那些照實空著，不拿別的欄位湊
  const noSummary = data.items.filter((i) => !i.summary);
  check(`${noSummary.length} 篇沒有摘要，頁面照實講出這件事`, new RegExp(`其中 ${noSummary.length} 篇沒有摘要`).test(reading));

  // 來源按鈕帶 data-source-id（SourceFilter 元件），控制列的全選/反選/單選不算在內
  check('來源逐個可切', (await page.locator('nav button[data-source-id]').count()) === itemSources.length);

  // 篩選進網址
  const one = itemSources[0];
  const oneCount = data.items.filter((i) => i.source === one.id).length;
  await page.goto(`${BASE}/brief/reading?sources=${one.id}`, { waitUntil: 'networkidle' });
  check(
    `篩選進網址：?sources=${one.id} 只剩 ${oneCount} 篇`,
    (await page.locator('main').innerText()).replace(/\s/g, '').includes(`這一批${oneCount}篇`),
  );

  // 反選：從單一來源反選 → 剩下的都在（總數 − 這一家）。控制列抽到共用 SourceFilter，兩頁同一顆。
  await page.locator('nav button', { hasText: '反選' }).click();
  await page.waitForLoadState('networkidle');
  check(
    `反選：?sources=${one.id} 反選後剩 ${data.items.length - oneCount} 篇`,
    (await page.locator('main').innerText()).replace(/\s/g, '').includes(`這一批${data.items.length - oneCount}篇`),
  );

  // 只看有摘要：濾掉沒附摘要的那些，剩下的每一篇都有摘要
  const withSummary = data.items.filter((i) => i.summary).length;
  await page.goto(`${BASE}/brief/reading`, { waitUntil: 'networkidle' });
  await page.locator('nav button', { hasText: '只看有摘要' }).click();
  check(
    `只看有摘要：${data.items.length} 篇濾成 ${withSummary} 篇有摘要的`,
    (await page.locator('#all-items').innerText()).replace(/\s/g, '').includes(`這一批${withSummary}篇`),
  );

  // ---- 活動曆 /brief/events
  await page.goto(`${BASE}/brief/events`, { waitUntil: 'networkidle' });
  const events = await page.locator('main').innerText();
  check('沒有單一來源的內部詞彙（所／院）', !/全院|關注的所|中研院 \d+ 個所/.test(events));
  check(
    '來源逐個可切',
    (await page.locator('nav button[data-source-id]').count()) === data.sources.filter((s) => s.collection === 'events').length,
  );
  check(
    `預設場次數＝${defaultEventCount}（不含預設收起來的來源）`,
    new RegExp(`場次\\s*${defaultEventCount}\\s*場`).test((await page.locator('#all-events').innerText()).replace(/\n/g, '')),
  );

  // 全不選是合法狀態（與讀的東西一致）：內容區顯示空狀態，不是壞掉的空白頁
  await page.goto(`${BASE}/brief/events?sources=none`, { waitUntil: 'networkidle' });
  check(
    '全不選合法：?sources=none 顯示空狀態、0 場，不當機',
    new RegExp('場次\\s*0\\s*場').test((await page.locator('#all-events').innerText()).replace(/\n/g, '')) &&
      (await page.locator('main').innerText()).includes('這個篩選底下沒有場次'),
  );

  for (const mode of ['calendar', 'pivot']) {
    await page.goto(`${BASE}/brief/events?mode=${mode}`, { waitUntil: 'networkidle' });
    check(`看法 ${mode} 渲染得出來`, (await page.locator('main').innerText()).length > 500);
  }

  check('零 console error', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' / '));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通過`);
process.exit(failed.length === 0 ? 0 : 1);
