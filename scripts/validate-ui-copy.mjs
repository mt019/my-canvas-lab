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
  // 以下這批是「站在賣東西的位置介紹自己」的文案：把實際內容換成抽象名詞，
  // 再用一個空間比喻兜起來。要寫這一格有什麼，就直接寫那幾件東西的名字。
  ['把內容說成地圖', /(研究|現況|成果|議題|知識)地圖/g],
  ['把網站說成場域', /(互動)?(實驗場|體驗場|知識殿堂)/g],
  ['行銷語氣的形容', /可操作的(資料|研究|知識)/g],
  ['內容農場式標題', /前世今生/g],
  ['行銷套語', /一站式|全方位|沉浸式|賦能|助力|一應俱全/g],
  // 2026-07-29 使用者指定的禁語。「圈子」把一群人講成一個有邊界的東西，實際要說的是
  // 哪一種讀者；「來吵」把使用者回報講成一個帶脾氣的動作。兩個都寫它實際是什麼就好。
  // 「撞上」把讀者遇到一個問題寫成撞到東西（2026-07-29 使用者明令）。直接寫他會發現什麼。
  ['指定禁語', /圈子|來吵|撞上/g],
  // 翻轉揭曉：先立一個假想再推翻它（「本來以為只是方便。後來發現不是。」）。第二拍
  // 沒有內容，只負責製造轉折，而那個假想通常是編的。直接寫真正的差別在哪。
  // 2026-07-29 使用者明令。
  ['翻轉揭曉', /(後來|結果)(才)?(發現|知道|明白)不是[。！？]/g],
  ['翻轉揭曉', /(本來|原本|一開始|起初)以為[^。\n]{0,50}[。][^。\n]{0,15}(其實|後來|結果)/g],
  // 把一件工作說成「一條線」。前面接數量詞或「字」的是門檻的字面意思（「一百二十字這條線」），
  // 不在此限。
  ['把工作說成一條線', /(?<![0-9〇一二三四五六七八九十百千萬字數])(這|那|整|同一)條線/g],
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
