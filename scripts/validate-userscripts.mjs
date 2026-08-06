// 固定檢查：這個網域不端出可安裝的使用者腳本，而 src/data/userscripts.json 的落地頁資料齊全。
//
// 來歷分兩層，後一層推翻了前一層，兩層都留著免得有人把它改回去：
//
// 2026-07-29：三支腳本原本沒有宣告 @updateURL／@downloadURL，Tampermonkey 因此拿「使用者當初
// 安裝的那個網址」查更新——那個網址寫在別人的機器裡，改帳號名、改 repo 名、jsDelivr 改政策，
// 所有已安裝的副本就安靜地不再更新。當時的解法是把安裝檔搬到這個網域、宣告固定網址。
//
// 2026-08-06：那個解法讓 phenomcanvas.com 變成「散布會自我更新的瀏覽器可執行程式碼」的主機。
// Google Safe Browsing 因此把整個網域標成不實網頁（社交工程／安裝垃圾軟體），標記掛在網域層、
// 沒有範例網址，連 wealth、clay 這些子網域一起被蓋到。fjud 那支尤其扎眼：@match *://*/* 注入
// 使用者造訪的每一個網站，還帶持久化儲存與開分頁的權限。所以安裝與更新一律移回各自的 GitHub
// 倉（raw 或 Pages），這個網域只留說明頁。
//
// 這支檢查因此翻面：以前要求安裝檔存在且更新來源指向本站，現在要求它們**不在**本站。
//
// **哪些東西不在這個倉編輯**：userscripts.json 每一筆的 `version`／`file`／`matches[].pattern`／
// `grants[].name`，都由來源倉的 `sync-to-canvas.mjs` 回寫（三個倉：law-item-labeler、
// social-auto-expand-userscript、fjud-userscript）。canvas 只寫落地頁的文案——介紹、每條 @match
// 為什麼要、版本紀錄。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, SITE_URL } from './site-config.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'userscripts.json'), 'utf8'));
const failures = [];

// 第一關，也是這支檢查存在的理由：public/ 底下不准有任何 .user.js。
// 三個來源倉的 sync-to-canvas.mjs 以前會把安裝檔複製進來，改壞或改回去都會在這裡現形。
const publicDir = join(ROOT, 'public');
const strayScripts = [];
const walk = (dir, rel = '') => {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, name.name);
    const relPath = rel ? `${rel}/${name.name}` : name.name;
    if (name.isDirectory()) walk(next, relPath);
    else if (name.name.endsWith('.user.js')) strayScripts.push(`public/${relPath}`);
  }
};
walk(publicDir);
for (const f of strayScripts) {
  failures.push(
    `${f}：這個網域不可以端出可安裝的使用者腳本。\n`
    + '    Safe Browsing 會把散布會自我更新的瀏覽器程式碼的網域標成不實網頁（2026-08-06 實際發生過，\n'
    + '    整個 phenomcanvas.com 連同各子網域被標）。安裝檔放來源倉的 GitHub raw 或 Pages。',
  );
}

const siteHost = new URL(SITE_URL).host;

for (const entry of data.scripts) {
  const where = `userscripts.json／${entry.id}`;

  // 安裝網址：必須是絕對網址，而且不在本站。相對路徑等於又把檔案放回這個網域。
  const install = entry.install;
  if (!install) {
    failures.push(`${where}：沒有 install 欄位，落地頁的安裝按鈕會連到 undefined`);
  } else {
    let url = null;
    try { url = new URL(install); } catch { /* 下面統一報 */ }
    if (!url) {
      failures.push(`${where}：install 是 ${install}，不是絕對網址。相對路徑等於安裝檔又回到這個網域`);
    } else if (url.host === siteHost) {
      failures.push(`${where}：install 指向 ${url.host}，安裝檔不可以放在這個網域（見本檔開頭 2026-08-06）`);
    } else if (url.protocol !== 'https:') {
      failures.push(`${where}：install 是 ${url.protocol}，腳本管理器的安裝網址一律 https`);
    } else if (!install.endsWith('.user.js')) {
      failures.push(`${where}：install 是 ${install}，結尾不是 .user.js，腳本管理器攔不到、會變成純文字開啟`);
    }
  }

  if (entry.changelog?.[0]?.version !== entry.version) {
    failures.push(`${where}：版本紀錄最上面那條是 ${entry.changelog?.[0]?.version}，版號是 ${entry.version}。發版時漏了一條`);
  }

  // @match／@grant 由 sync 回寫，這裡只確認每一條都有人寫過「為什麼要這個權限」——
  // 落地頁把它們逐條印出來，空白的話讀者看到的是一個沒有理由的權限。
  for (const m of entry.matches ?? []) {
    if (!m.why) failures.push(`${where}：@match ${m.pattern} 還沒寫說明`);
  }
  for (const g of entry.grants ?? []) {
    if (!g.why) failures.push(`${where}：@grant ${g.name} 還沒寫說明`);
  }

  // 落地頁是路由頁，不是 public 靜態檔——漏建的話 @homepageURL 會指到 SPA 回退的首頁。
  const pageFile = join(ROOT, 'src', 'pages', 'userscripts', `${entry.id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}.jsx`);
  if (!existsSync(pageFile)) {
    failures.push(`${where}：找不到落地頁 ${pageFile.replace(ROOT + '/', '')}，@homepageURL 會指到不存在的路由`);
  }
}

if (failures.length) {
  console.error(`使用者腳本檢查未通過：${failures.length} 項。`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`使用者腳本檢查通過：${data.scripts.length} 支，安裝網址都在站外，public/ 底下沒有安裝檔。`);
