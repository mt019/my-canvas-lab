// Rebuild the CJK webfont subsets from the local source fonts.
//
// Strategy (2026-07-18): the body face carries everything, so it is subset ONCE
// to a fixed, comprehensive character set (common BMP CJK + kana + punctuation +
// symbols — see comprehensiveChars in font-chars.mjs), NOT to the exact text the
// site currently uses. That is the whole point: an ordinary new article never
// introduces a glyph outside common CJK, so the body subset never needs
// rebuilding again, and a Vercel build (which has no source fonts) never has to.
//
// Two faces, stacked under one family name "Huiwen Mincho":
//   - Huiwen Mincho carries the text (fixed comprehensive subset).
//   - Chiron Sung HK fills the few codepoints the site uses that Huiwen itself
//     cannot draw, via a unicode-range @font-face in index.css. This one stays
//     small and text-driven — it only needs the handful of gaps Huiwen has.
//
// GenWanMin2 was removed: it was loaded but unreferenced by any font stack (all
// CJK renders in Huiwen), so it was ~1.8MB of dead weight.
//
// Requires: pyftsubset (fonttools) and the source fonts in ~/Library/Fonts.
// Run it with `npm run fonts:rebuild` only when validate:fonts reports a glyph
// the committed subsets cannot draw (rare — an exotic character outside common
// CJK). It prints the Chiron unicode-range to paste into src/index.css.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import { extractChars, comprehensiveChars } from './font-chars.mjs';

const HUIWEN_SRC = join(homedir(), 'Library/Fonts/SCUQuoteCards-HuiwenMincho-Improved.ttf');
const CHIRON_SRC = join(homedir(), 'Library/Fonts/SCUQuoteCards-ChironSungHK-Text-R.ttf');

if (!existsSync(HUIWEN_SRC)) {
  console.error(`source font missing: ${HUIWEN_SRC}`);
  console.error('The source fonts live only on a machine that has them (not CI). Run this there.');
  process.exit(1);
}

// Body: fixed comprehensive coverage — does not depend on the site's current text.
const bodyChars = comprehensiveChars(HUIWEN_SRC);

// Chiron fallback: exactly the codepoints the site actually renders that the
// Huiwen source cannot draw. Small and text-driven.
const { chars: siteChars } = extractChars();
const huiwenSource = fontkit.openSync(HUIWEN_SRC);
const fallbackChars = siteChars.filter((c) => !huiwenSource.hasGlyphForCodePoint(c.codePointAt(0)));

const SOURCES = {
  'public/fonts/HuiwenMincho-subset.woff2': { source: HUIWEN_SRC, text: bodyChars },
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
