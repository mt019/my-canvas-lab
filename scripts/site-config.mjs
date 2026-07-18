// Single source of truth for the public origin, shared by the node build scripts
// (prerender, sitemap, og image). The client reads VITE_SITE_URL directly through
// import.meta.env; these scripts run under plain node where import.meta.env is
// empty, so they read the same value out of .env.production here. process.env wins
// when set (Vercel build env / one-off overrides).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function fromEnvFile() {
  try {
    const text = readFileSync(join(root, '.env.production'), 'utf8');
    const line = text.split('\n').find((l) => l.trim().startsWith('VITE_SITE_URL='));
    return line ? line.slice(line.indexOf('=') + 1).trim() : '';
  } catch {
    return '';
  }
}

const raw = (process.env.VITE_SITE_URL || fromEnvFile() || '').trim();
if (!raw) {
  throw new Error('VITE_SITE_URL is not set (checked process.env and .env.production). Refusing to emit relative or third-party canonical URLs.');
}

export const SITE_URL = raw.replace(/\/$/, '');
export const ROOT = root;
