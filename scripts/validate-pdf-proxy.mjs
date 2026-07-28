// 固定檢查：資料層裡要走 /api/pdf 的網址，都必須通過 api/_pdfProxy.mjs 的白名單。
//
// 來歷（2026-07-28）：中研院出版品的 743 個篇章網址改指自有典藏的 GitHub Release 後，
// 資料檔進了版控，代理端對應的白名單規則卻留在工作樹沒有一起 commit。本機 dev 讀的是
// 工作樹，所以一切正常；線上讀的是 HEAD，每一份 PDF 都被自己的代理回 403 forbidden target。
// 資料層與代理白名單是兩個必須同步的來源，這支腳本負責在它們分岔時擋下來。
//
// 檢查兩件事：
// 1. iiasPublications.json 的每個 pdf 篇章網址都能被 resolveTarget 接受
//    （該頁的 pdfHref 無條件套代理，白名單漏一條就是整份打不開）。
// 2. constitutionalCourt.json 裡被 shared.jsx 的 PDF_PROXYABLE 判為可代理的網址，
//    resolveTarget 也要接受（那個 regex 是白名單的第二份寫法，會各自漂移）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveTarget } from '../api/_pdfProxy.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

// 與 src/pages/_constitutional-court/shared.jsx 的 PDF_PROXYABLE 同一份寫法。
const CC_PROXYABLE =
  /(^https:\/\/cons\.judicial\.gov\.tw\/download\/download\.aspx)|(^https:\/\/www\.president\.gov\.tw\/File\/Doc\/)|(^https:\/\/web\.archive\.org\/web\/\d{14}id_\/https:\/\/www\.president\.gov\.tw\/File\/Doc\/)/i;

// 深走任意 JSON，收集所有字串值中的 https 網址。
function collectUrls(node, out = []) {
  if (typeof node === 'string') {
    if (node.startsWith('https://')) out.push(node);
  } else if (Array.isArray(node)) {
    node.forEach((v) => collectUrls(v, out));
  } else if (node && typeof node === 'object') {
    Object.values(node).forEach((v) => collectUrls(v, out));
  }
  return out;
}

const failures = [];
let checked = 0;

// 1. 中研院出版品：每個篇章的 url 都無條件走代理。
{
  const data = readJson('src/data/iiasPublications.json');
  const urls = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (typeof node.url === 'string' && node.url.startsWith('https://')) urls.add(node.url);
    Object.values(node).forEach(walk);
  };
  walk(data);
  for (const url of urls) {
    checked += 1;
    if (!resolveTarget(url)) failures.push(['iiasPublications.json', url]);
  }
  if (urls.size === 0) failures.push(['iiasPublications.json', '一個 pdf 網址都沒抓到，選取邏輯可能已失效']);
}

// 2. 憲法法庭：只查那些前端會判定為可代理的網址。
{
  const urls = collectUrls(readJson('src/data/constitutionalCourt.json')).filter((u) => CC_PROXYABLE.test(u));
  for (const url of new Set(urls)) {
    checked += 1;
    if (!resolveTarget(url)) failures.push(['constitutionalCourt.json', url]);
  }
}

if (failures.length) {
  console.error(`PDF 代理白名單檢查未通過：${failures.length} 個網址前端會送進 /api/pdf，代理端卻不接受。`);
  console.error('修法：在 api/_pdfProxy.mjs 的 ALLOW 補上對應規則，與資料層同一個 commit 推送。');
  for (const [file, url] of failures.slice(0, 10)) console.error(`  ${file}  ${url}`);
  if (failures.length > 10) console.error(`  …另有 ${failures.length - 10} 個`);
  process.exit(1);
}

console.log(`PDF 代理白名單檢查通過：${checked} 個網址全部在白名單內。`);
