/*
 * 實跑 /brief 與 /brief/events，檢查畫面上的話跟資料對不對得起來。
 *
 *   npm run dev            （另一個視窗）
 *   npm run check:brief
 *
 * 為什麼要有這支：這一輪的錯是「售票節目 480 檔」，實際只有 444——前端拿「不在預設視圖」
 * 當「售票」，於是 36 場沒被追蹤的中研院講座被算成戲票。build 四道閘門全綠、eslint 全綠、
 * 零 console error，**每一道都過，而畫面在說謊**。會咬到它的只有一件事：真的把頁面打開，
 * 拿畫面上的數字去對資料。
 *
 * 所以這裡的檢查一律「從 JSON 自己算一次，再跟畫面上的字比」，不是比對寫死的期望值——
 * 寫死的話，資料一換這支就得跟著改，然後有人會把它改成通過為止。
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

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  通過' : '未通過'}｜${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

try {
  // ---- 門口 /brief
  await page.goto(`${BASE}/brief`, { waitUntil: 'networkidle' });
  const brief = await page.locator('main').innerText();
  const heads = (await page.locator('h2').allInnerTexts()).join(' | ').replace(/\n/g, '');

  check('六區都在', ['天關門的', '接下來的活動', '正在進行中', '讀的東西', '售票節目', '資料來自哪裡', '這裡看不到什麼'].every((s) => brief.includes(s)));

  // 售票節目的數字＝來源層的事實，不是「不在預設視圖」的那一堆
  const asideCount = data.events.filter(isAside).length;
  check(`售票節目數＝來源層筆數 ${asideCount}`, new RegExp(`售票節目\\s*${asideCount}\\s*檔`).test(heads), heads.match(/售票節目[^|]*/)?.[0]?.trim());

  const upcomingCount = data.events.filter((e) => inDefaultView(e) && !isOngoing(e)).length;
  check(`接下來的活動＝預設視圖裡沒開始的 ${upcomingCount} 場`, new RegExp(`接下來的活動\\s*${upcomingCount}\\s*場`).test(heads));

  const ongoingCount = data.events.filter((e) => inDefaultView(e) && isOngoing(e)).length;
  check(`正在進行中＝${ongoingCount} 場，且不標成「N 天前」`, new RegExp(`正在進行中\\s*${ongoingCount}\\s*場`).test(heads));
  const ongoingSection = ongoingCount > 0 ? await page.locator('section:has(#ongoing)').innerText() : '';
  check('進行中的場次標「進行中」，不標「天前」', ongoingCount === 0 || (ongoingSection.includes('進行中') && !/\d+ 天前/.test(ongoingSection)));

  const itemCount = data.items.length;
  check(`讀的東西＝${itemCount} 篇，兩個來源分開列`, new RegExp(`讀的東西\\s*${itemCount}\\s*篇`).test(heads)
    && data.sources.filter((s) => s.collection === 'items').every((s) => brief.includes(s.label)));

  // 論文沒有「來不及」——這一區不准出現倒數
  const reading = await page.locator('section:has(#reading)').innerText();
  check('讀的東西沒有倒數', !/剩 \d+ 天|天後|截止/.test(reading));

  // 快關門：預設視圖的那幾件不能被量大的來源沖掉
  const soon = (e) => e.closesAt && e.closesAt >= today && e.closesAt <= new Date(Date.now() + 8 * 3600 * 1000 + 7 * 864e5).toISOString().slice(0, 10);
  const coreSoon = data.events.filter((e) => soon(e) && inDefaultView(e));
  check('快關門區列出預設視圖裡每一件要關的門', coreSoon.every((e) => brief.includes(e.title.slice(0, 12))), `${coreSoon.length} 件`);

  // ---- 活動曆 /brief/events
  await page.goto(`${BASE}/brief/events`, { waitUntil: 'networkidle' });
  const events = await page.locator('main').innerText();

  check('沒有單一來源的內部詞彙（所／院）', !/全院|關注的所|中研院 \d+ 個所/.test(events));
  check('來源逐個可切', (await page.locator('nav button[aria-pressed]').count()) === data.sources.filter((s) => s.collection === 'events').length);

  const shownDefault = data.events.filter((e) => inDefaultView(e)).length;
  check(`預設場次數＝${shownDefault}（不含預設收起來的來源）`, new RegExp(`場次\\s*${shownDefault}\\s*場`).test((await page.locator('#all-events').innerText()).replace(/\n/g, '')));

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
