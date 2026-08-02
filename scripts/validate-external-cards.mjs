// 搬出本倉的站（憲法法庭、手記、司法院外國法翻譯的兩頁）在 /all 上還是要有一張卡片，
// 而那張卡片需要兩個東西同時在：PAGE_META 裡帶 externalUrl 的條目，以及 App() 裡那個
// component: null 的路由條目。/all 的清單是從路由表長出來的，只寫 PAGE_META 不會有卡片。
//
// 2026-08-02 就是這樣掉的：兩個頁面刪乾淨、轉址也對，卡片卻從語料・譯庫那一區消失，
// 三項本地驗收（gates、產物字串、grep）全綠，因為它們檢查的都不是「卡片還在不在」。
// 這支把兩邊綁在一起，任一邊漏掉就報錯。
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const app = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

const metaBlock = app.slice(app.indexOf('const PAGE_META'), app.indexOf('const HOME_VARS'));
const withExternalUrl = new Map();
let entry = null;
for (const line of metaBlock.split('\n')) {
  const head = line.match(/^ {2}(\w+): \{/);
  if (head) entry = head[1];
  const url = line.match(/^ {4}externalUrl: '([^']+)',$/);
  if (url && entry) withExternalUrl.set(entry, url[1]);
}
assert.ok(withExternalUrl.size > 0, 'PAGE_META 裡一個 externalUrl 都找不到——這支的解析壞了');

const STUB = /\{\s*name: '(\w+)',\s*path: '([^']+)',\s*component: null,\s*meta: PAGE_META\.(\w+),\s*\}/g;
const stubs = new Map();
for (const [, name, path, metaKey] of app.matchAll(STUB)) {
  assert.equal(metaKey, name, `App() 的 ${name} 條目掛到 PAGE_META.${metaKey}，兩邊名字要一致`);
  stubs.set(name, path);
}

for (const name of withExternalUrl.keys()) {
  assert.ok(
    stubs.has(name),
    `PAGE_META.${name} 有 externalUrl，App() 裡卻沒有對應的 { name: '${name}', path, component: null } 條目——`
    + '/all 的卡片是從路由表長出來的，少了這條就整張卡片消失（外站本身照樣活著，所以線上不會報錯）',
  );
}
for (const name of stubs.keys()) {
  assert.ok(
    withExternalUrl.has(name),
    `App() 有 ${name} 的外站條目，PAGE_META.${name} 卻沒有 externalUrl——卡片會連回一條沒有頁面的本地路徑`,
  );
}

// 搬出去的頁面檔不得回到本倉（典型情境：從 git 歷史還原一份來對照，就留在那裡了）。
for (const name of stubs.keys()) {
  const file = join(ROOT, 'src', 'pages', `${name}.jsx`);
  assert.equal(existsSync(file), false, `src/pages/${name}.jsx 又回到 canvas 了——現役副本在獨立站，改那邊`);
}

// 舊網址要有人接：不是 308 轉去獨立站，就是 rewrite 到現在的來源。
for (const [name, path] of stubs) {
  const rule = config.routes.find((r) => r.src === path);
  assert.ok(rule, `vercel.json 沒有接住 ${path}（${name} 已經沒有本地頁面，舊連結會落到 index.html）`);
  // Vercel 在 dest 自己不帶查詢字串時會保留原網址的 ?q=、?tab=，所以兩邊都要維持乾淨。
  assert.equal(rule.dest.includes('?'), false, `${path} 的轉址目標帶了查詢字串，舊的 ?q= / ?tab= 會被吃掉`);
  const deep = config.routes.find((r) => r.src === `${path}/(.*)`);
  assert.ok(deep, `vercel.json 少了 ${path}/(.*)——內頁連結會落到 index.html`);
  assert.equal(deep.dest.includes('?'), false, `${path}/(.*) 的轉址目標帶了查詢字串`);
}

console.log(
  `外站卡片檢查通過：${stubs.size} 個搬出去的站，PAGE_META 與路由表兩邊對得上，`
  + '頁面檔確認不在，舊網址與內頁網址都有人接。',
);
