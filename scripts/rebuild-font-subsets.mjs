// Rebuild the two CJK webfont subsets from the local source fonts, using the
// same character extraction as validate-font-coverage.mjs. Run whenever new
// text (synced research data, new pages) introduces glyphs the current
// subsets lack and `npm run validate:fonts` fails.
//
// Requires: pyftsubset (fonttools) and the source fonts in ~/Library/Fonts.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const SOURCES = {
  'public/fonts/HuiwenMincho-subset.woff2': {
    source: join(homedir(), 'Library/Fonts/SCUQuoteCards-HuiwenMincho-Improved.ttf'),
    charset: 'all',
  },
  'public/fonts/GenWanMin2-subset.woff2': {
    source: join(homedir(), 'Library/Fonts/SCUQuoteCards-GenWanMin2-R.ttc'),
    charset: 'cjk',
    fontNumber: '0',
  },
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const textFiles = ['index.html', 'README.md', 'TODO.md', 'HANDOFF.md', ...walk('src')].filter(Boolean);
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

const tmp = mkdtempSync(join(tmpdir(), 'canvas-font-build-'));
try {
  writeFileSync(join(tmp, 'all.txt'), chars.join(''));
  writeFileSync(join(tmp, 'cjk.txt'), cjkChars.join(''));

  for (const [target, cfg] of Object.entries(SOURCES)) {
    if (!existsSync(cfg.source)) {
      console.error(`source font missing: ${cfg.source}`);
      process.exit(1);
    }
    const args = [
      cfg.source,
      `--text-file=${join(tmp, `${cfg.charset === 'all' ? 'all' : 'cjk'}.txt`)}`,
      '--flavor=woff2',
      '--layout-features=*',
      '--ignore-missing-glyphs',
      `--output-file=${target}`,
    ];
    if (cfg.fontNumber !== undefined) args.splice(1, 0, `--font-number=${cfg.fontNumber}`);
    execFileSync('pyftsubset', args, { encoding: 'utf8' });
    console.log(`rebuilt ${target} (${cfg.charset === 'all' ? chars.length : cjkChars.length} glyph targets)`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log('done — run `npm run validate:fonts` to confirm coverage.');
