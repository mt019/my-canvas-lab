import { chmodSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const origin = process.argv[2] || 'https://phenomcanvas.com';
const html = await (await fetch(origin)).text();
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)]
  .map((match) => new URL(match[1], origin).href);
if (scripts.length === 0) throw new Error(`${origin}: no JavaScript assets found`);

let source = '';
for (const url of scripts) {
  const response = await fetch(url);
  if (response.ok) source += `\n${await response.text()}`;
}
const urls = [...new Set(source.match(/https:\/\/[a-z0-9-]+\.supabase\.co/g) || [])];
const keys = [...new Set(source.match(/sb_publishable_[A-Za-z0-9_-]+/g) || [])];
if (urls.length !== 1 || keys.length !== 1) {
  throw new Error(`expected exactly one public Supabase URL and publishable key; found ${urls.length}/${keys.length}`);
}

const target = join(ROOT, '.env.cloudflare.local');
writeFileSync(target, `VITE_SUPABASE_URL=${urls[0]}\nVITE_SUPABASE_PUBLISHABLE_KEY=${keys[0]}\n`, { mode: 0o600 });
chmodSync(target, 0o600);
console.log('Imported the public Supabase browser configuration from the current production bundle (values not printed).');
