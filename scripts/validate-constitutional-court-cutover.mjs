// 憲法法庭已完全移出本倉（2026-08-02）：頁面、私有元件、資料快照、意見書投影全部刪除，
// canvas 只留 /all 上的一張外鏈卡與舊路徑的 308 轉址。這支從「確認排除設定還在」改成
// 「確認檔案不在」——排除 glob 沒了以後，唯一能防止它被複製回來的就是這幾條 existsSync。
// 現役副本在 phenom-court（cc.phenomcanvas.com），那邊的閘見它自己的 verify:policy。
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const app = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
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
];
for (const rel of 不得存在) {
  assert.equal(existsSync(join(ROOT, rel)), false, `${rel} 又回到 canvas 了——憲法法庭的現役副本在 phenom-court，改那邊`);
}

// 按 src 找，不按位置取。原本寫的是 `const [exact, deep] = config.routes`，於是 2026-08-02
// 在前面插兩條設快取標頭的路由就把這支弄紅了——它報的是「第一條不是憲法法庭」，而那不是
// 它要守的東西。位置是別人的自由，src 才是這支的契約。
const byExactSrc = (src) => {
  const found = config.routes.filter((route) => route.src === src);
  assert.equal(found.length, 1, `vercel.json 裡 src 為 ${src} 的路由應該剛好一條，實際 ${found.length} 條`);
  return found[0];
};
const exact = byExactSrc('/constitutionalcourt');
const deep = byExactSrc('/constitutionalcourt/(.*)');
assert.deepEqual(exact, {
  src: '/constitutionalcourt',
  dest: 'https://cc.phenomcanvas.com/constitutionalcourt/',
  status: 308,
});
assert.deepEqual(deep, {
  src: '/constitutionalcourt/(.*)',
  dest: 'https://cc.phenomcanvas.com/constitutionalcourt/$1',
  status: 308,
});

// Vercel preserves an incoming query string when a redirect destination does
// not replace it. Keeping both destinations query-free is therefore part of the
// contract for old search/filter links such as ?q= and ?tab=.
assert.equal(exact.dest.includes('?'), false);
assert.equal(deep.dest.includes('?'), false);

console.log(`constitutional court cutover ok: /all → standalone; 0 local routes among ${routes.length}; ${不得存在.length} 個舊路徑確認不存在; exact/deep 308 redirects preserve query strings`);
