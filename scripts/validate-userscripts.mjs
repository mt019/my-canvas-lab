// 固定檢查：public/scripts/ 底下的使用者腳本，與 src/data/userscripts.json 說的一致。
//
// 來歷（2026-07-29）：三支腳本原本沒有宣告 @updateURL／@downloadURL，Tampermonkey 因此拿
// 「使用者當初安裝的那個網址」查更新——那個網址寫在別人的機器裡，改帳號名、改 repo 名、
// jsDelivr 改政策，所有已安裝的副本就安靜地不再更新，不報錯也沒人通知。改成宣告固定網址
// （https://<站>/scripts/<檔名>）之後，來源檔在別的 repo、發佈的那一份在這裡，兩邊會漂。
//
// 漂掉的失敗方式最難發現的是版號：落地頁寫著 1.10.0、public/ 那支還是 1.9.2，站上看起來
// 完全正常，只有已安裝的使用者永遠拿不到新版。所以這裡逐欄比對，不只看檔案在不在。
//
// **哪些東西不在這個倉編輯**：`public/scripts/*.user.js` 整份，以及 userscripts.json 每一筆的
// `version`／`file`／`matches[].pattern`／`grants[].name`，都由來源倉的 `sync-to-canvas.mjs`
// 送過來（三個倉：law-item-labeler、social-auto-expand-userscript、fjud-userscript）。canvas
// 只寫落地頁的文案——介紹、每條 @match 為什麼要、版本紀錄。在這裡手改事實欄位，下一次同步
// 就會被蓋掉，而且蓋掉之前這支檢查會先擋下來。
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, SITE_URL } from './site-config.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'userscripts.json'), 'utf8'));
const failures = [];

// metadata block 只認 `// @key value` 這一種寫法，跟 Tampermonkey 自己的解析一致。
function parseMetadata(source, where) {
  const start = source.indexOf('// ==UserScript==');
  const end = source.indexOf('// ==/UserScript==');
  if (start === -1 || end === -1 || end < start) {
    failures.push(`${where}：找不到完整的 ==UserScript== metadata block`);
    return null;
  }
  const out = {};
  for (const line of source.slice(start, end).split('\n')) {
    const m = /^\/\/\s*@(\S+)\s+(.*)$/.exec(line.trim());
    if (!m) continue;
    const [, key, value] = m;
    (out[key] ??= []).push(value.trim());
  }
  return out;
}

const one = (meta, key) => (meta[key] ?? [])[0] ?? null;

function expectSet(actual, expected, label, where) {
  const a = [...new Set(actual)].sort();
  const b = [...new Set(expected)].sort();
  if (a.join('\n') !== b.join('\n')) {
    failures.push(
      `${where}：${label}與 userscripts.json 對不上\n`
      + `    腳本裡：${a.join('、') || '（無）'}\n`
      + `    json 裡：${b.join('、') || '（無）'}`,
    );
  }
}

for (const entry of data.scripts) {
  const where = `public/scripts/${entry.file}`;
  const path = join(ROOT, 'public', 'scripts', entry.file);
  if (!existsSync(path)) {
    failures.push(`${where}：檔案不存在。userscripts.json 列了它，安裝網址會 404`);
    continue;
  }

  const meta = parseMetadata(readFileSync(path, 'utf8'), where);
  if (!meta) continue;

  const version = one(meta, 'version');
  if (version !== entry.version) {
    failures.push(`${where}：@version 是 ${version}，userscripts.json 寫 ${entry.version}。落地頁會顯示一個沒人裝得到的版號`);
  }
  if (entry.changelog?.[0]?.version !== entry.version) {
    failures.push(`${entry.id}：版本紀錄最上面那條是 ${entry.changelog?.[0]?.version}，版號是 ${entry.version}。發版時漏了一條`);
  }

  const install = `${SITE_URL}/scripts/${entry.file}`;
  for (const key of ['updateURL', 'downloadURL']) {
    const got = one(meta, key);
    if (got !== install) {
      failures.push(`${where}：@${key} 是 ${got ?? '（沒有宣告）'}，應該是 ${install}。沒有它，已安裝的副本會去查它當初的安裝網址`);
    }
  }

  const home = `${SITE_URL}/userscripts/${entry.id}`;
  if (one(meta, 'homepageURL') !== home) {
    failures.push(`${where}：@homepageURL 是 ${one(meta, 'homepageURL') ?? '（沒有宣告）'}，應該是落地頁 ${home}`);
  }

  expectSet(meta.match ?? [], entry.matches.map((m) => m.pattern), '@match', where);

  const grants = (meta.grant ?? []).filter((g) => g !== 'none');
  expectSet(grants, (entry.grants ?? []).map((g) => g.name), '@grant', where);

  // 落地頁是路由頁，不是 public 靜態檔——漏建的話 @homepageURL 會指到 SPA 回退的首頁。
  const pageFile = join(ROOT, 'src', 'pages', 'userscripts', `${entry.id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}.jsx`);
  if (!existsSync(pageFile)) {
    failures.push(`${entry.id}：找不到落地頁 ${pageFile.replace(ROOT + '/', '')}，@homepageURL 會指到不存在的路由`);
  }
}

if (failures.length) {
  console.error(`使用者腳本檢查未通過：${failures.length} 項。`);
  console.error('修法：改完來源 repo 之後，把新的 .user.js 複製到 public/scripts/，並在同一次改動更新 src/data/userscripts.json。');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`使用者腳本檢查通過：${data.scripts.length} 支，版號、安裝網址、@match 與 @grant 都與 userscripts.json 一致。`);
