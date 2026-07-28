// 部署完成後，把全站網址推給 IndexNow，讓 Bing 立刻知道有東西更新，不必等它自己
// 來爬。Bing 的索引是 ChatGPT 網頁搜尋的來源，所以進得去 Bing 才有機會被引用。
//
// 金鑰的擺法是 IndexNow 規定的：檔名就是金鑰、內容也是同一串，放在網站根目錄。
// 這裡不把金鑰寫死在程式裡，改成去 public/ 找那個「檔名與內容相同」的檔——這樣
// 金鑰只有一個出處，換金鑰時不會出現改了檔案卻忘了改程式的情況。
//
// 推送失敗不讓部署變紅：東西已經上線了，沒推成頂多晚幾天被抓到，不值得擋住部署。
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, SITE_URL } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const ENDPOINT = 'https://api.indexnow.org/indexnow';

function findKey() {
  const dir = join(ROOT, 'public');
  for (const name of readdirSync(dir)) {
    const m = /^([a-f0-9]{8,128})\.txt$/.exec(name);
    if (!m) continue;
    const body = readFileSync(join(dir, name), 'utf8').trim();
    if (body === m[1]) return m[1];
  }
  return null;
}

const key = findKey();
if (!key) {
  console.log('IndexNow：public/ 底下沒有金鑰檔（檔名為 <金鑰>.txt 且內容相同），略過。');
  process.exit(0);
}

const host = new URL(SITE_URL).host;
const urlList = collectRoutes().map((route) => encodeURI(`${SITE_URL}${route}`));

// 單次請求上限一萬筆，目前站的規模遠低於此；超過就分批，免得日後長大了才發現。
const batches = [];
for (let i = 0; i < urlList.length; i += 10000) batches.push(urlList.slice(i, i + 10000));

let pushed = 0;
for (const batch of batches) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: batch,
      }),
    });
    // 200 與 202 都算收下了；其餘印出來但不中斷。
    if (res.ok) {
      pushed += batch.length;
    } else {
      console.log(`IndexNow：${res.status} ${res.statusText}（${batch.length} 筆這一批沒收下）`);
    }
  } catch (err) {
    console.log(`IndexNow：送出失敗 ${err.message}`);
  }
}

console.log(`IndexNow：${host} 已送出 ${pushed}/${urlList.length} 個網址，金鑰 ${SITE_URL}/${key}.txt`);
