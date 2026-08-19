// public/_redirects 的讀取器。canvas 2026-08-16 起由 Cloudflare Pages 服務，Pages 讀的是
// 這一份；vercel.json 的 routes 在這個平台不生效——2026-08-20 實測 /constitutionalcourt
// 與 /familywealth 都回 404，而它們的 308 在 vercel.json 裡寫得好好的，三支閘也綠。
// 所以驗轉址一律驗這一份，vercel.json 只當 Vercel 觀察期未過期間的備援。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

export function readRedirects() {
  const text = readFileSync(join(ROOT, 'public', '_redirects'), 'utf8');
  const rules = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to, status] = line.split(/\s+/);
    rules.push({ from, to, status: status ?? '302' });
  }
  return rules;
}

// 一個舊路徑要有兩條：它自己，以及它底下的所有路徑。找不到就回 undefined，
// 由呼叫端決定訊息。
export function redirectFor(rules, path) {
  return rules.find((r) => r.from === path);
}
export function deepRedirectFor(rules, path) {
  return rules.find((r) => r.from === `${path}/*`);
}
