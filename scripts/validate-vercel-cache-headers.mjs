// vercel.json 的快取標頭：設在哪裡、有沒有真的送出去。
//
// 來歷（2026-08-02，實測，不是推論）：這個部署裡只要有 `routes`，**頂層的 `headers` 就完全
// 不生效**。給 /notes/deployment-manifest.json 設的 no-store 掛了一整天沒人發現，因為設定看
// 起來完全正確、部署也不會報錯，只有去打線上的網址才量得出來。後來又拿 /assets/(.*) 加一條
// 頂層 headers 當實驗，部署後同樣沒生效，才確定成因在 routes 而不在那條路徑本身。
// （Vercel 現行文件說兩者可以並用。以量到的為準。）
//
// 所以這支擋兩件事：頂層 headers 不准再出現（它是死的，寫了會讓人以為設好了），以及那兩條
// 靠 routes 原生寫法設的標頭不准消失。線上實際回什麼由 scripts/smoke-live.mjs 在部署後驗，
// 這裡只驗設定——兩層都要有，設定對而線上沒送出去，正是這次踩到的形狀。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

assert.equal(
  Object.prototype.hasOwnProperty.call(config, 'headers'),
  false,
  'vercel.json 不要用頂層 headers——這個部署裡有 routes 就不吃它，設了不會報錯也不會生效。要設標頭就在 routes 裡加一條帶 headers 與 continue: true 的路由。',
);

const 必備 = [
  {
    src: '/assets/(.*)',
    value: 'public, max-age=31536000, immutable',
    why: '/assets 底下全是內容雜湊的檔名，沒有這條就退回 max-age=0，每次載入都白問一次',
  },
  {
    src: '/notes/deployment-manifest.json',
    value: 'no-store, max-age=0',
    why: '這個檔是用來答「線上這份是不是這次部署的」，被任何一層快取存起來，部署驗證就會讀到舊的答案',
  },
];

for (const { src, value, why } of 必備) {
  const route = config.routes.find((candidate) => candidate.src === src);
  assert.ok(route, `vercel.json 少了 src 為 ${src} 的快取標頭路由：${why}`);
  assert.equal(route.headers?.['Cache-Control'], value, `${src} 的 Cache-Control 應該是「${value}」：${why}`);
  assert.equal(route.continue, true, `${src} 這條要有 continue: true，否則路由會停在這裡、不再往下走到檔案系統`);
}

console.log(`vercel 快取標頭檢查通過：無頂層 headers（在此部署為死設定），${必備.length} 條 routes 原生標頭齊全`);
