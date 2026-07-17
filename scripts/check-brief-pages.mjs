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
const isAside = (e) => !SOURCE[e.source]?.inDefaultView;
const inDefaultView = (e) => {
  const s = SOURCE[e.source];
  if (!s?.inDefaultView) return false;
  if (!sourcesWithFollowed.has(e.source)) return true;
  return followed.has(`${e.source} ${e.host}`);
};
const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
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
  // ---- 錯過就沒了的東西不能藏在分頁後面：三個分頁切過去，它都要還在。
  const pinned = [];
  for (const view of ['reading', 'events', 'sources']) {
    await page.goto(`${BASE}/brief?view=${view}`, { waitUntil: 'networkidle' });
    pinned.push((await page.locator('#closing').count()) === 1);
  }
  check('「這 7 天關門的」釘在分頁之上，三個分頁都看得到', pinned.every(Boolean));

  // ---- 門口 /brief，預設分頁＝讀的東西
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

  // 論文沒有「來不及」——讀的東西那些區不准出現倒數
  /* 倒數一定帶數字（inDays() 印的是「21 天後」）。不能只找「天後」——OECD 的來源說明裡
     資料倉自己寫著「出版日有時排在幾天後」，那是散文，咬它只會訓練人忽略這道檢查。 */
  const COUNTDOWN = /\d+ 天後|\d+ 天前|剩 \d+ 天|今天最後一天/;
  const afterTabs = brief.slice(brief.indexOf('資料來自哪裡'));
  check('讀的東西沒有倒數', !COUNTDOWN.test(afterTabs), afterTabs.match(COUNTDOWN)?.[0] ?? '');

  // ---- 活動分頁
  await page.goto(`${BASE}/brief?view=events`, { waitUntil: 'networkidle' });
  const eventsTab = (await page.locator('main').innerText()).replace(/\n/g, ' ');
  const eventHeads = await headings();
  const eventKinds = kindsOf('events');
  check(`活動：${eventKinds.length} 種 kind 各有一區`, eventKinds.every((k) => eventHeads.some((h) => h.startsWith(k))));

  const defaultEventCount = data.events.filter((e) => inDefaultView(e)).length;
  check(`分頁標籤「活動 ${defaultEventCount}」＝預設視圖自己數的`, new RegExp(`活動\\s*${defaultEventCount}`).test(eventsTab));

  const ongoingShown = data.events.filter((e) => inDefaultView(e) && isOngoing(e));
  check('進行中的場次標「進行中」，不標「天前」', ongoingShown.length === 0 || eventsTab.includes('進行中'));

  // 收起來的那一區＝來源層的事實。一個講座不會因為我沒追蹤它就變成一齣戲。
  const asideCount = data.events.filter(isAside).length;
  const asideKinds = eventKinds.filter((k) =>
    data.sources.filter((s) => s.collection === 'events' && s.kind === k).every((s) => !s.inDefaultView),
  );
  check(
    `整區都是預設不跳出來的來源就收起來（${asideKinds.join('、')} 共 ${asideCount} 場）`,
    asideKinds.every((k) => eventHeads.includes(`${k}${asideCount}場`)),
  );

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

  check('來源逐個可切', (await page.locator('nav button[aria-pressed]').count()) >= itemSources.length);

  // 篩選進網址
  const one = itemSources[0];
  const oneCount = data.items.filter((i) => i.source === one.id).length;
  await page.goto(`${BASE}/brief/reading?sources=${one.id}`, { waitUntil: 'networkidle' });
  check(
    `篩選進網址：?sources=${one.id} 只剩 ${oneCount} 篇`,
    (await page.locator('main').innerText()).replace(/\s/g, '').includes(`這一批${oneCount}篇`),
  );

  // ---- 活動曆 /brief/events
  await page.goto(`${BASE}/brief/events`, { waitUntil: 'networkidle' });
  const events = await page.locator('main').innerText();
  check('沒有單一來源的內部詞彙（所／院）', !/全院|關注的所|中研院 \d+ 個所/.test(events));
  check(
    '來源逐個可切',
    (await page.locator('nav button[aria-pressed]').count()) === data.sources.filter((s) => s.collection === 'events').length,
  );
  check(
    `預設場次數＝${defaultEventCount}（不含預設收起來的來源）`,
    new RegExp(`場次\\s*${defaultEventCount}\\s*場`).test((await page.locator('#all-events').innerText()).replace(/\n/g, '')),
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
