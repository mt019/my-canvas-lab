import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const extensions = new Set(['.jsx', '.tsx']);
const forbidden = [
  ['假對話式導覽', /這裡只回答一件事/g],
  ['糾正式導覽', /不用翻[^。\n]*[。]/g],
  ['危機式導覽', /別被[^。\n]*藏住/g],
  ['產品格言', /有缺口就講出來/g],
  ['產品格言', /看起來完整的清單/g],
  ['空泛強調', /真正選中的東西/g],
  ['空泛強調', /真正重要的是/g],
  ['無具體資訊的保證', /可以放心[。！]?/g],
];

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesIn(file);
    return extensions.has(path.extname(entry.name)) ? [file] : [];
  });
}

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 整行註解，以及跟在程式碼後面的行末註解。`[^:\w]` 那個條件是為了不要把
    // `https://` 當成註解起點切掉半個網址。
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/([^:\w])\/\/.*$/gm, '$1');
}

/*
 * 作業語言不准出現在畫面上（HANDOFF 開頭的全站硬規則）。
 *
 * 「資料層尚未同步」「資料倉 xxx-data」這種話講的是我怎麼做事，不是讀者要知道的事。
 * 註解與工程文件裡照寫沒問題——下面的比對已經先把註解去掉了，所以這裡抓到的一定是
 * 會被印出來的字串。空狀態最容易中招：寫「找不到（資料層尚未同步）」而不是「目前沒有」。
 */
const engineeringWords = [
  ['作業語言', /資料倉/g],
  ['作業語言', /資料層/g],
  ['作業語言', /同步過來的快照/g],
  // 資料倉目錄名逐個列，不用通則式的 `*-data`——英文正文裡的 fiscal-data、tax-data
  // 是真的在講財政資料，不是倉庫名。
  ['資料倉名', /\b(?:[a-z][a-z0-9-]*-research-data|brief-data|vocal-training-data|statistics-lab-data|iias-publications-data|jirs-foreign-law|intl-tax-ops-lab)\b/g],
];

const failures = [];
for (const file of filesIn(root)) {
  const source = withoutComments(fs.readFileSync(file, 'utf8'));
  for (const [label, pattern] of [...forbidden, ...engineeringWords]) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      failures.push(`${path.relative(process.cwd(), file)}:${line} ${label}：${match[0]}`);
    }
  }
}

/*
 * 首頁卡片的一行文案不准變成 SEO 描述那種長句。
 *
 * PAGE_META 的 `desc` 同時餵首頁卡片與 <meta name=description>，於是有人為了 SEO 把它寫成
 * 兩百字的事實密集句，首頁那張卡就變成一大段話。兩者用途不同：卡片要一眼掃過，描述要能被
 * 答案引擎整段引用。分法是 `desc` 留給卡片、長描述寫在 `seoDesc`（App.jsx 的 PageRoute 會
 * 優先用 seoDesc）。這裡守住卡片那一邊的上限。
 */
const DESC_MAX = 60; // 現況最長 74 字（JirsForeignLaw），中位數 30；60 是「還掃得完」的線
const appSource = fs.readFileSync(path.join(root, 'App.jsx'), 'utf8');
const metaBlock = appSource.slice(
  appSource.indexOf('const PAGE_META'),
  appSource.indexOf('const HOME_VARS'),
);
let currentEntry = null;
for (const line of metaBlock.split('\n')) {
  const entry = line.match(/^ {2}(\w+): \{/);
  if (entry) currentEntry = entry[1];
  const desc = line.match(/^ {4}desc: '(.*)',$/);
  if (!desc) continue;
  const length = [...desc[1]].length;
  if (length > DESC_MAX) {
    failures.push(
      `src/App.jsx PAGE_META.${currentEntry} 的 desc ${length} 字，超過 ${DESC_MAX}：`
      + `首頁卡片放不下這麼長的一段。把長版搬去 seoDesc，desc 留一行掃得完的話。`,
    );
  }
}

if (failures.length) {
  console.error(`介面文案檢查失敗：\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`介面文案檢查通過：${filesIn(root).length} 個前端檔案。`);
