// 部署之後對真實網址發請求，確認線上那一份是對的。
//
// 來歷：現有的兩道檢查（deploy.yml 的 [REDACTED] 掃描與空殼檢查）查的都是「上傳前的
// 產物」。產物對、上線的東西不對，這中間還有 CDN、vercel.json 的轉址與代理、以及
// 「部署根本沒送上去」三種故障，前面兩道一種都看不到——2026-07-30 免費方案上傳次數
// 用完那次，症狀正是建置全綠而站沒更新。
//
// 這支查的是使用者真的會拿到的東西。判準一律看內容，不看狀態碼，理由是 vercel.json
// 最後一條 `{"src": "/.*", "dest": "/index.html"}`：**不存在的網址在這個站回的是
// 200 加首頁外殼**，狀態碼在這裡完全沒有鑑別力。所以本腳本開頭先去抓一個保證不存在
// 的路徑，把那份外殼的長相記下來，之後每個要檢查的頁都必須跟它不一樣——一個頁如果
// 哪天不再被預先渲染，它就會塌回那份外殼，這條檢查看得出來，狀態碼看不出來。
//
// 用法：
//   node scripts/smoke-live.mjs --base https://phenomcanvas.com
//   node scripts/smoke-live.mjs --base https://phenomcanvas.com --expect-build-id <sha>
//
// --expect-build-id 給的是這次建置的 commit SHA，對照線上的 /build-id.txt，答的是
// 「線上這份到底是不是我剛剛建的那一份」。邊緣傳播有延遲，這一項會有界重試。

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};

const base = (arg('--base') ?? '').replace(/\/$/, '');
const expectBuildId = arg('--expect-build-id');
const retries = Number(arg('--retries') ?? 10);
const retryDelayMs = Number(arg('--retry-delay-ms') ?? 6000);

if (!base.startsWith('http')) {
  console.error('用法：node scripts/smoke-live.mjs --base https://<網域> [--expect-build-id <sha>]');
  process.exit(2);
}

// 保證不存在的路徑。用來取得「查無此頁」時回的那份外殼，當作底線樣本。
const MISSING_PATH = '/__smoke_probe_this_route_does_not_exist';

// 每個項目都要有一個只有那一頁才有的字串。用 <title> 是因為預先渲染會把每頁自己的
// 標題寫進 HTML，塌回外殼時標題就變成首頁那一個。
const PAGES = [
  { path: '/', marker: 'Phenom Canvas Lab', sameAsShell: true, why: '首頁本身就是那份外殼，只驗根節點有內容' },
  { path: '/taxlitigation', marker: '稅務訴訟計量研究' },
  { path: '/chenyinke', marker: '柳如是別傳' },
  { path: '/vocaltraining', marker: 'Metastasio' },
  // 這條走 vercel.json 的代理，實際內容在 Cloudflare Pages 上（phenom-notes.pages.dev）。
  // 跨主機的依賴最容易在沒人注意的時候斷掉，所以放進來。
  { path: '/notes/', marker: '手記' },
];

// 拆出去的獨立站，canvas 這邊只留轉址。轉址斷掉的話舊連結會落回 SPA 外殼、
// 回 200，同樣不會有人發現。
const REDIRECTS = [
  { path: '/constitutionalcourt', to: 'https://cc.phenomcanvas.com/constitutionalcourt/' },
  { path: '/legalglossary', to: 'https://judicial-translations.phenomcanvas.com/glossary/' },
  { path: '/jirsforeignlaw', to: 'https://judicial-translations.phenomcanvas.com/' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const titleOf = (html) => (html.match(/<title>([^<]*)<\/title>/) ?? [, ''])[1].trim();
const failures = [];

async function get(path, redirect = 'follow') {
  const res = await fetch(`${base}${path}`, { redirect });
  const text = redirect === 'manual' ? '' : await res.text();
  return { status: res.status, location: res.headers.get('location'), text };
}

// 上面那支 get() 一律打原本的網址，因為這支腳本要驗的就是使用者實際拿到什麼——繞過快取
// 等於繞過了要檢查的東西。下面這支只給 build-id 的收尾診斷用。
//
// 換 query 參數（換掉快取鍵）與送 Cache-Control: no-cache 請求標頭（MDN 快取指南
// 「Reload and force reload」）兩件事一起做：只做前者會被「兩次剛好用同一個值」漏掉，
// 只做後者遇到不理會請求端指令的快取就沒有用。
// phenom-ops 的 `scripts/lib/fetch-uncached.mjs` 是這段的雙胞胎，改一邊要順手看另一邊。
async function getUncached(path) {
  const url = new URL(`${base}${path}`);
  url.searchParams.set('__nocache', `${Date.now()}`);
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  return { status: res.status, text: await res.text() };
}

// 一、先取「查無此頁」的外殼樣本。
const shell = await get(MISSING_PATH);
const shellTitle = titleOf(shell.text);
console.log(`外殼樣本：${MISSING_PATH} → ${shell.status}、${shell.text.length} bytes、標題「${shellTitle}」`);
if (shell.status >= 500) {
  failures.push(`取外殼樣本時回 ${shell.status}，整站可能是壞的`);
}

// 二、逐頁驗內容。
for (const page of PAGES) {
  const res = await get(page.path);
  const title = titleOf(res.text);
  const label = `${page.path}`;

  if (res.status !== 200) {
    failures.push(`${label} — 回 ${res.status}`);
    continue;
  }
  if (/<div id="root"><\/div>/.test(res.text)) {
    failures.push(`${label} — 根節點是空的，這一頁沒有被預先渲染`);
    continue;
  }
  if (!res.text.includes(page.marker)) {
    failures.push(`${label} — 找不到只有這一頁才有的字串「${page.marker}」，實際標題「${title}」`);
    continue;
  }
  if (!page.sameAsShell && res.text.length === shell.text.length && title === shellTitle) {
    failures.push(`${label} — 回來的跟「查無此頁」那份外殼一模一樣，這一頁塌掉了`);
    continue;
  }
  console.log(`${label} — ${res.text.length} bytes、「${title}」✓`);
}

// 三、轉址。要看 Location 的實際值，不能只看它有沒有轉。
for (const r of REDIRECTS) {
  const res = await get(r.path, 'manual');
  if (res.status !== 308 || res.location !== r.to) {
    failures.push(`${r.path} — 應該 308 到 ${r.to}，實際 ${res.status} → ${res.location ?? '（沒有 Location）'}`);
    continue;
  }
  console.log(`${r.path} — 308 → ${res.location} ✓`);
}

// 四、線上這份是不是這次建的。傳播有延遲，只有這一項重試。
if (expectBuildId) {
  // 這個檔不存在時，SPA fallback 會回 200 加整份首頁 HTML——不是 404。所以除了狀態碼，
  // 還要驗回來的東西長得像不像一個 commit SHA；不像就是「這個檔根本沒上去」。
  // （寫這支的時候自己先踩了一次：原本只看 status === 200，於是把整份 HTML 當成了 build-id。）
  const looksLikeSha = (s) => /^[0-9a-f]{7,40}$/.test(s);
  const brief = (s) => (s.length > 60 ? `${s.slice(0, 60)}…（${s.length} bytes，不是一個 SHA）` : s);
  let live = null;
  for (let i = 0; i < retries; i += 1) {
    const res = await get('/build-id.txt');
    const body = res.text.trim();
    live = res.status === 200 && looksLikeSha(body) ? body : `（HTTP ${res.status}、內容 ${brief(body)}）`;
    if (live === expectBuildId) break;
    if (i < retries - 1) {
      console.log(`build-id 還是 ${live}，等 ${retryDelayMs} ms 再看（${i + 1}/${retries}）`);
      await sleep(retryDelayMs);
    }
  }
  if (live === expectBuildId) {
    console.log(`build-id — ${live} ✓（線上這份就是這次建的）`);
  } else {
    // 重試次數用完還是舊的，成因有兩個：某一層快取還在把舊的送給使用者，或部署本身
    // 沒生效。兩者在外面長得一模一樣，修法相反，所以再打一次繞過快取的來分辨。
    // 前一版沒有這一步，於是十次重試打的都是同一個網址——中間留著舊的一份的話，
    // 十次讀到的是同一份，重試本身沒有作用（見 phenom-ops 的 ops-learning 快取筆記）。
    let why = '';
    try {
      const bypass = await getUncached('/build-id.txt');
      const body = bypass.text.trim();
      why = bypass.status === 200 && looksLikeSha(body) && body === expectBuildId
        ? '；繞過快取拿到的是這次建的，所以部署成功，中間有一層快取還在送舊的'
        : `；繞過快取拿到的是 ${brief(body)}，所以是部署沒有生效`;
    } catch (error) {
      why = `；繞過快取那次請求也失敗了：${error.message}`;
    }
    failures.push(`build-id — 線上是 ${live}，這次建的是 ${expectBuildId}${why}`);
  }
}

if (failures.length) {
  console.error(`\n線上檢查沒過（${failures.length} 項）：`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\n線上檢查通過：${PAGES.length} 頁、${REDIRECTS.length} 條轉址${expectBuildId ? '、build-id 相符' : ''}`);
