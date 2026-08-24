// public/_redirects 的讀取器。Canvas 只由 Cloudflare Pages 服務，Pages 讀的這一份
// 是正式轉址的單一設定來源。
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
