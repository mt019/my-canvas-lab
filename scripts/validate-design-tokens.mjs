import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/*
 * Design-token ratchet. Migrated files must not contain bare hex colors:
 * colors belong in src/styles/tokens.css or in a page-local palette object
 * whose opening line carries a `token-exempt` comment (the exemption runs
 * until the next line ending in `};`).
 *
 * Unmigrated files are listed in scripts/design-token-exceptions.txt.
 * That list may only shrink — remove entries as pages are migrated,
 * never add ones back.
 */

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const exceptions = readFileSync('scripts/design-token-exceptions.txt', 'utf8')
  .split('\n')
  .map((line) => line.split('#')[0].trim())
  .filter(Boolean);

const stale = exceptions.filter((path) => !existsSync(path));
if (stale.length > 0) {
  throw new Error(
    `design-token-exceptions.txt lists files that no longer exist: ${stale.join(', ')} — remove the stale entries.`,
  );
}

const files = walk('src').filter(
  (path) =>
    /\.(jsx|tsx|js|css)$/.test(path) &&
    path !== join('src', 'styles', 'tokens.css') &&
    !exceptions.includes(path),
);

const violations = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let exemptDepthActive = false;
  lines.forEach((line, i) => {
    if (line.includes('token-exempt')) exemptDepthActive = true;
    const wasExempt = exemptDepthActive;
    if (exemptDepthActive && /};?\s*$/.test(line.trim()) && !line.includes('token-exempt')) {
      exemptDepthActive = false;
    }
    if (wasExempt) return;
    const hits = line.match(HEX);
    if (hits) violations.push(`${file}:${i + 1} ${hits.join(' ')}`);
  });
}

if (violations.length > 0) {
  throw new Error(
    `Bare hex colors in token-migrated files (use tokens.css vars or a token-exempt palette object):\n` +
      violations.map((v) => `  ${v}`).join('\n'),
  );
}

console.log(
  `design tokens ok: ${files.length} migrated files clean, ${exceptions.length} pending in exceptions list.`,
);
