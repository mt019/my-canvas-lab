// Rebuild the CJK webfont subsets from the local source fonts, using the same
// character extraction as validate-font-coverage.mjs. Run whenever new text
// (synced research data, new pages) introduces glyphs the current subsets lack
// and `npm run validate:fonts` fails.
//
// Three subsets, because the body family is two faces stacked under one name:
// Huiwen Mincho carries the text, and Chiron Sung HK fills the codepoints
// Huiwen itself has no glyph for, via a unicode-range @font-face in index.css.
// validate-font-coverage.mjs checks the union of the two, so the Chiron subset
// has to be rebuilt from the same corpus — otherwise "Huiwen lacks it, Chiron
// covers it" is a hand-maintained claim that quietly rots.
//
// Requires: pyftsubset (fonttools) and the source fonts in ~/Library/Fonts.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import { extractChars } from './font-chars.mjs';

const HUIWEN_SRC = join(homedir(), 'Library/Fonts/SCUQuoteCards-HuiwenMincho-Improved.ttf');
const CHIRON_SRC = join(homedir(), 'Library/Fonts/SCUQuoteCards-ChironSungHK-Text-R.ttf');

const { chars, cjkChars } = extractChars();

if (!existsSync(HUIWEN_SRC)) {
  console.error(`source font missing: ${HUIWEN_SRC}`);
  process.exit(1);
}

// What the corpus needs but the Huiwen source itself cannot draw — exactly the
// job of the Chiron fallback face.
const huiwenSource = fontkit.openSync(HUIWEN_SRC);
const fallbackChars = chars.filter((c) => !huiwenSource.hasGlyphForCodePoint(c.codePointAt(0)));

const SOURCES = {
  'public/fonts/HuiwenMincho-subset.woff2': { source: HUIWEN_SRC, text: chars },
  'public/fonts/GenWanMin2-subset.woff2': {
    source: join(homedir(), 'Library/Fonts/SCUQuoteCards-GenWanMin2-R.ttc'),
    text: cjkChars,
    fontNumber: '0',
  },
  'public/fonts/ChironSungHK-fallback-subset.woff2': { source: CHIRON_SRC, text: fallbackChars },
};

const tmp = mkdtempSync(join(tmpdir(), 'canvas-font-build-'));
try {
  for (const [target, cfg] of Object.entries(SOURCES)) {
    if (!existsSync(cfg.source)) {
      console.error(`source font missing: ${cfg.source}`);
      process.exit(1);
    }
    if (cfg.text.length === 0) {
      console.log(`skipped ${target} (nothing to cover)`);
      continue;
    }
    const textFile = join(tmp, `${target.replace(/\W/g, '_')}.txt`);
    writeFileSync(textFile, cfg.text.join(''));
    const args = [
      cfg.source,
      `--text-file=${textFile}`,
      '--flavor=woff2',
      '--layout-features=*',
      '--ignore-missing-glyphs',
      `--output-file=${target}`,
    ];
    if (cfg.fontNumber !== undefined) args.splice(1, 0, `--font-number=${cfg.fontNumber}`);
    execFileSync('pyftsubset', args, { encoding: 'utf8' });
    console.log(`rebuilt ${target} (${cfg.text.length} glyph targets)`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// The fallback @font-face only wins for the codepoints named in its
// unicode-range, so index.css has to be updated in step with the subset above.
const chiron = fontkit.openSync(CHIRON_SRC);
const covered = fallbackChars.filter((c) => chiron.hasGlyphForCodePoint(c.codePointAt(0)));
const uncovered = fallbackChars.filter((c) => !chiron.hasGlyphForCodePoint(c.codePointAt(0)));
const range = covered
  .map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))
  .sort()
  .join(', ');

console.log('\nsrc/index.css — the Chiron @font-face unicode-range must read:\n');
console.log(`  unicode-range: ${range};\n`);
if (uncovered.length > 0) {
  console.log(
    `neither source font can draw ${uncovered.length} codepoint(s): ${uncovered.join(' ')}\n` +
    '→ these belong in scripts/font-coverage-exceptions.txt (they fall back to the system stack).\n',
  );
}
console.log('done — run `npm run validate:fonts` to confirm coverage.');
