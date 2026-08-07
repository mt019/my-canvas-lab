import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const env = {
  ...process.env,
  VITE_DEPLOY_TARGET: 'canvas',
  VITE_SITE_URL: 'https://canvas.phenomcanvas.com',
};
const localConfig = join(ROOT, '.env.cloudflare.local');
if (existsSync(localConfig)) {
  for (const line of readFileSync(localConfig, 'utf8').split(/\r?\n/)) {
    const split = line.indexOf('=');
    if (split > 0 && !env[line.slice(0, split)]) env[line.slice(0, split)] = line.slice(split + 1);
  }
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.VITE_SUPABASE_URL || '')) {
  throw new Error('VITE_SUPABASE_URL is absent or invalid; refusing a Cloudflare artifact with silently disabled auth');
}
if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.VITE_SUPABASE_PUBLISHABLE_KEY || '')) {
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is absent or invalid; refusing a Cloudflare artifact with silently disabled auth');
}
if (Object.values(env).some((value) => value === '[REDACTED]')) throw new Error('refusing to build with a [REDACTED] environment value');
const run = (command, args) => execFileSync(command, args, { cwd: ROOT, env, stdio: 'inherit' });

run('npm', ['run', 'verify:policy']);
run('node', ['scripts/build.mjs']);
run('node', ['scripts/stage-cloudflare.mjs']);
run('node', ['scripts/validate-cloudflare-artifact.mjs']);
