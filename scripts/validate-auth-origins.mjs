// 驗登入落點：站台部署到哪些來源，Supabase 的 Redirect URLs 就要有對應的項目。
//
// Supabase 的清單按來源比對，`/**` 只管路徑不管主機，`canvas.phenomcanvas.com` 與
// `phenomcanvas.com` 因此是兩條各自獨立的項目。落點不在清單裡時 Supabase 改用 Site URL，
// `?code=` 就落在別的站上，沒有人拿去換 session。2026-08-17 的故障長這樣：登入按鈕按下去
// 之後沒有任何動靜，而建置與線上頁面都正常。
//
// `supabase/auth-url-configuration.json` 是 dashboard 那兩欄的抄本，值由人維護。這支檢查
// 管的是抄本與部署來源對不對得上：來源換了而清單沒跟著換，建置在這裡失敗並印出 dashboard
// 網址。抄本與 dashboard 之間仍要靠改的時候一起改，`checkedAt` 記最後一次核對的日期。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const config = JSON.parse(readFileSync(join(ROOT, 'supabase', 'auth-url-configuration.json'), 'utf8'));
const authProvider = readFileSync(join(ROOT, 'src', 'personal-state', 'AuthProvider.jsx'), 'utf8');
const cloudflareBuild = readFileSync(join(ROOT, 'scripts', 'build-cloudflare.mjs'), 'utf8');
const envProduction = readFileSync(join(ROOT, '.env.production'), 'utf8');

const originOf = (value) => new URL(value).origin;
const fail = (message) => {
  throw new Error(`${message}\n改的地方：${config.dashboard}\n改完把新值抄進 supabase/auth-url-configuration.json 並更新 checkedAt。`);
};

// 每個來源都要單獨列一條的前提：登入送出的落點是當下那一頁的完整網址。
assert.match(authProvider, /redirectTo:\s*window\.location\.href/);

assert.match(config.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
const allowedOrigins = new Set(config.redirectUrls.map((entry) => {
  if (!entry.endsWith('/**')) fail(`Redirect URL 少了 /** 結尾：${entry}——只有首頁會是合法落點`);
  return originOf(entry.slice(0, -3));
}));

if (!allowedOrigins.has(originOf(config.siteUrl))) fail(`Site URL ${config.siteUrl} 不在 Redirect URLs 裡`);

// 部署來源取自實際建置的兩個入口，不另外維護一份清單。
const cloudflareOrigin = cloudflareBuild.match(/VITE_SITE_URL:\s*'([^']+)'/)?.[1];
const vercelOrigin = envProduction.split('\n').find((line) => line.startsWith('VITE_SITE_URL='))?.slice('VITE_SITE_URL='.length).trim();
assert.ok(cloudflareOrigin, 'scripts/build-cloudflare.mjs 讀不到 VITE_SITE_URL');
assert.ok(vercelOrigin, '.env.production 讀不到 VITE_SITE_URL');

const deployOrigins = [...new Set([cloudflareOrigin, vercelOrigin].map(originOf))];
for (const origin of deployOrigins) {
  if (!allowedOrigins.has(origin)) fail(`站台部署在 ${origin}，而 Supabase 的 Redirect URLs 沒有 ${origin}/**——從這個來源登入會被送去 Site URL ${config.siteUrl}`);
}

// 登入的落點就是使用者所在的那一頁，Site URL 只在落點不合法時才用得上；它指向沒有部署
// 站台的來源時，那個退路本身也是壞的。
if (!deployOrigins.includes(originOf(config.siteUrl))) fail(`Site URL ${config.siteUrl} 不是任何一個部署來源（目前部署在 ${deployOrigins.join('、')}）`);

console.log(`auth origins ok: 部署來源 ${deployOrigins.join('、')} 都在 Redirect URLs 裡；Site URL ${config.siteUrl}；抄本核對於 ${config.checkedAt}`);
