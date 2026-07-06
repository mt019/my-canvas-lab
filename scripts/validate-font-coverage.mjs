import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

const tmp = mkdtempSync(join(tmpdir(), 'canvas-font-check-'));
const allCharsFile = join(tmp, 'all.txt');
const cjkCharsFile = join(tmp, 'cjk.txt');
writeFileSync(allCharsFile, chars.join(''));
writeFileSync(cjkCharsFile, cjkChars.join(''));

function assertCoverage(fontPath, textFile, label) {
  const output = execFileSync('pyftsubset', [
    fontPath,
    `--text-file=${textFile}`,
    '--ignore-missing-glyphs',
    '--layout-features=*',
    '--output-file=/dev/null',
  ], { encoding: 'utf8', stderr: 'pipe' });
  const missingLine = output.split('\n').find((line) => line.includes('Missing glyphs'));
  if (missingLine) {
    throw new Error(`${label} is missing required glyphs: ${missingLine}`);
  }
}

try {
  assertCoverage('public/fonts/HuiwenMincho-subset.woff2', allCharsFile, 'HuiwenMincho body subset');
  assertCoverage('public/fonts/GenWanMin2-subset.woff2', cjkCharsFile, 'GenWanMin2 display CJK subset');
  console.log(`Font coverage validated: ${chars.length} text glyphs, ${cjkChars.length} CJK glyphs.`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
