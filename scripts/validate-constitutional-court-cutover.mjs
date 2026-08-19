// 憲法法庭已完全移出本倉（2026-08-02）：頁面、私有元件、資料快照、意見書投影全部刪除，
// canvas 只留 /all 上的一張外鏈卡與舊路徑的 308 轉址。這支從「確認排除設定還在」改成
// 「確認檔案不在」——排除 glob 沒了以後，唯一能防止它被複製回來的就是這幾條 existsSync。
// 現役副本在 phenom-court（cc.phenomcanvas.com），那邊的閘見它自己的 verify:policy。
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';
import { readRedirects, redirectFor, deepRedirectFor } from './redirects.mjs';

const app = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const redirects = readRedirects();
const routes = collectRoutes();

assert.match(app, /externalUrl:\s*'https:\/\/cc\.phenomcanvas\.com\/constitutionalcourt\/'/);
assert.doesNotMatch(app, /<Route path="\/constitutionalcourt/);
assert.doesNotMatch(app, /import\([^\n]*_constitutional-court/);
assert.equal(routes.filter((route) => route === '/constitutionalcourt' || route.startsWith('/constitutionalcourt/')).length, 0);

// 檔案一律不得回到本倉。改壞這幾條的典型情境是「從 git 歷史還原一份來對照」，
// 而還原出來的副本與 phenom-court 的現役檔長得一模一樣，改錯了不會有任何提示。
const 不得存在 = [
  'src/pages/ConstitutionalCourt.jsx',
  'src/pages/_constitutional-court',
  'src/data/constitutionalCourt.json',
  'src/data/constitutionalCourt-reasoning-fulltext.json',
  'src/data/constitutionalCourt-pre1947-fulltext.json',
  'src/data/daliyuanCollation.json',
  'src/data/typologyReport.md',
  'public/data/constitutionalCourt-opinions',
  // 大理院校勘的紙本影像。2026-08-09 才發現它留在本倉：獨立站的校勘資料照舊寫著
  // /research-assets/daliyuan/*.jpg，檔案卻沒跟著搬，線上整欄影像 404 而兩邊建置都是綠的。
  // 現役副本在 phenom-court/public/research-assets/daliyuan/，那邊的 validate-build 會驗
  // 「資料點名的每個影像 dist 裡都有檔」。
  'public/research-assets/daliyuan',
];
for (const rel of 不得存在) {
  assert.equal(existsSync(join(ROOT, rel)), false, `${rel} 又回到 canvas 了——憲法法庭的現役副本在 phenom-court，改那邊`);
}

// 轉址查 public/_redirects：canvas 由 Cloudflare Pages 服務，Pages 讀的是那一份。
// 先前這裡查的是 vercel.json，於是 2026-08-20 實測線上 /constitutionalcourt 回 404
// 而這支照樣綠——它驗的設定檔在這個部署平台不生效。
const exact = redirectFor(redirects, '/constitutionalcourt');
const deep = deepRedirectFor(redirects, '/constitutionalcourt');
assert.ok(exact, 'public/_redirects 少了 /constitutionalcourt');
assert.ok(deep, 'public/_redirects 少了 /constitutionalcourt/*');
assert.equal(exact.to, 'https://cc.phenomcanvas.com/constitutionalcourt/');
assert.equal(exact.status, '308');
assert.equal(deep.to, 'https://cc.phenomcanvas.com/constitutionalcourt/:splat');
assert.equal(deep.status, '308');

// 目的地自己不帶查詢字串時，原網址的 ?q=、?tab= 會被保留，所以兩邊都要維持乾淨。
assert.equal(exact.to.includes('?'), false);
assert.equal(deep.to.includes('?'), false);

console.log(`constitutional court cutover ok: /all → standalone; 0 local routes among ${routes.length}; ${不得存在.length} 個舊路徑確認不存在; exact/deep 308 redirects preserve query strings`);
