import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as fontkit from 'fontkit';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const textFiles = [
  'index.html',
  'README.md',
  'TODO.md',
  'HANDOFF.md',
  ...walk('src'),
].filter(Boolean);

const text = textFiles
  .filter((file) => existsSync(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

const chars = [...new Set([...text])].filter((char) => {
  const code = char.codePointAt(0);
  if (code < 0x20) return false;
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Letter}\p{Number}]/u.test(char);
});

const cjkChars = chars.filter((char) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(char));

// Codepoints the source fonts themselves lack; these render via the CSS fallback stack.
const exceptions = new Set(
  readFileSync('scripts/font-coverage-exceptions.txt', 'utf8')
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter((line) => line.startsWith('U+'))
    .map((line) => parseInt(line.slice(2), 16)),
);

function assertCoverage(fontPath, requiredChars, label) {
  const font = fontkit.openSync(fontPath);
  const missing = requiredChars.filter((char) => {
    const code = char.codePointAt(0);
    return !exceptions.has(code) && !font.hasGlyphForCodePoint(code);
  });
  if (missing.length > 0) {
    const sample = missing.slice(0, 20).join('');
    const codes = missing.slice(0, 20).map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
    throw new Error(
      `${label} is missing ${missing.length} required glyphs (e.g. ${sample} — ${codes}); ` +
      'rebuild the subset, or add codepoints absent from the source font to scripts/font-coverage-exceptions.txt.',
    );
  }
}

assertCoverage('public/fonts/HuiwenMincho-subset.woff2', chars, 'HuiwenMincho body subset');
assertCoverage('public/fonts/GenWanMin2-subset.woff2', cjkChars, 'GenWanMin2 display CJK subset');
console.log(`Font coverage validated: ${chars.length} text glyphs, ${cjkChars.length} CJK glyphs.`);
