// Rebuild the two CJK webfont subsets from the local source fonts, using the
// same character extraction as validate-font-coverage.mjs. Run whenever new
// text (synced research data, new pages) introduces glyphs the current
// subsets lack and `npm run validate:fonts` fails.
//
// Requires: pyftsubset (fonttools) and the source fonts in ~/Library/Fonts.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractChars } from './font-chars.mjs';

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

const { chars, cjkChars } = extractChars();

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
