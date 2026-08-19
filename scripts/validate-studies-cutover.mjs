// 朱家驊、陳寅恪、德川三個專題 2026-08-16 拆成獨立倉，掛在 studies.phenomcanvas.com；
// canvas 這一份到 2026-08-20 都還留著，於是資料倉的 sync 腳本照舊寫進 canvas，
// 2026-08-19 到 08-20 的 198 篇讀稿全部落在拆掉的那一份上，線上的站一個字都沒動。
//
// 這支查兩件事：三個專題的檔案不在本倉、舊網址有 308 轉址。
// 轉址查的是 public/_redirects——canvas 由 Cloudflare Pages 服務，vercel.json 的 routes
// 在這個平台不生效（同日實測 /constitutionalcourt 與 /familywealth 都回 404，而它們的
// 308 在 vercel.json 裡寫著）。
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { collectRoutes } from './routes.mjs';

const routes = collectRoutes();
const redirects = readFileSync(join(ROOT, 'public', '_redirects'), 'utf8');

const 專題 = [
  {
    prefix: '/zhujiahua',
    dest: 'https://studies.phenomcanvas.com/zhujiahua/',
    檔案: ['src/pages/ZhuJiahua.jsx', 'src/pages/_zhu-jiahua', 'src/data/zhuJiahua.json', 'src/data/zhuJiahua'],
  },
  {
    prefix: '/chenyinke',
    dest: 'https://studies.phenomcanvas.com/chenyinke/',
    檔案: ['src/pages/ChenYinke.jsx', 'src/pages/_chen-yinke', 'src/lib/chenYinkeSeo.js', 'src/data/chenYinke.json', 'src/data/chenYinke', 'public/chen-yinke'],
  },
  {
    prefix: '/tokugawa',
    dest: 'https://studies.phenomcanvas.com/tokugawa/',
    檔案: ['src/pages/Tokugawa.jsx', 'src/pages/_tokugawa', 'src/data/tokugawaBackground.json'],
  },
];

for (const 站 of 專題) {
  for (const rel of 站.檔案) {
    assert.equal(
      existsSync(join(ROOT, rel)),
      false,
      `${rel} 又回到 canvas 了——現役副本在 studies.phenomcanvas.com${站.prefix}/，改那邊的倉`,
    );
  }
  const 本地路由 = routes.filter((route) => route === 站.prefix || route.startsWith(`${站.prefix}/`));
  assert.equal(本地路由.length, 0, `canvas 不該再有 ${站.prefix} 的路由，實際有 ${本地路由.join('、')}`);

  // 精確網址與其下所有路徑各一條。舊連結多半帶查詢字串（?item=、?tab=），
  // 目的地不得自己再帶一個 ?，否則兩個查詢字串疊在一起。
  for (const [pattern, expected] of [[站.prefix, 站.dest], [`${站.prefix}/*`, 站.dest]]) {
    const 行 = redirects
      .split('\n')
      .filter((line) => line.trim().split(/\s+/)[0] === pattern);
    assert.equal(行.length, 1, `public/_redirects 裡 ${pattern} 應該剛好一行，實際 ${行.length} 行`);
    const [, dest, status] = 行[0].trim().split(/\s+/);
    assert.equal(dest, expected, `${pattern} 的目的地應該是 ${expected}`);
    assert.equal(status, '308', `${pattern} 應該是 308`);
    assert.equal(dest.includes('?'), false, `${pattern} 的目的地不得自帶查詢字串`);
  }
}

console.log(`studies cutover ok: 三個專題共 ${專題.reduce((n, s) => n + s.檔案.length, 0)} 個舊路徑確認不存在，${routes.length} 條路由裡沒有它們，六組 308 都在 _redirects`);
