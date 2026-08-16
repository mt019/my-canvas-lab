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
// Requires: pyftsubset (fonttools) and the source fonts in Font_Library.
// Run it with `npm run fonts:rebuild` only when validate:fonts reports a glyph
// the committed subsets cannot draw (rare — an exotic character outside common
// CJK). It prints the Chiron unicode-range to paste into src/index.css.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import { comprehensiveChars, latinChars } from './font-chars.mjs';

// 字型母庫在版控之外（授權未明的字型不進 repo，見 docs/DESIGN.md 的字體禁令）。
// 路徑用 homedir() 組，不寫死絕對路徑——那會把本機使用者名稱寫進公開 repo。
const FONT_LIBRARY_ROOT = process.env.FONT_LIBRARY_ROOT || join(homedir(), 'Documents/Font_Library');
const HUIWEN_SRC = join(FONT_LIBRARY_ROOT, 'fonts/HuiwenMincho-Improved.ttf');
const CHIRON_SRC = join(FONT_LIBRARY_ROOT, 'fonts/ChironSungHK-Text-R.ttf');
const ERIKAS_SRC = join(FONT_LIBRARY_ROOT, 'categories/typewriter-latin/erikas-farbband.ttf');
const ERIKAS_BOLD_SRC = join(FONT_LIBRARY_ROOT, 'categories/typewriter-latin/erikas-farbband-bold.ttf');

if (!existsSync(HUIWEN_SRC)) {
  console.error(`source font missing: ${HUIWEN_SRC}`);
  console.error('Set FONT_LIBRARY_ROOT to the managed font library, then rerun this script locally.');
  process.exit(1);
}

// Body: fixed comprehensive coverage — does not depend on the site's current text.
const bodyChars = comprehensiveChars(HUIWEN_SRC);

// Chiron fallback (2026-07-27, 一勞永逸): comprehensive, NOT text-driven — every
// codepoint in COVERAGE_RANGES that Chiron can draw but Huiwen cannot. Fixed and
// data-independent: once built, any dataset's rare glyphs are already covered so
// long as either source font has them, so this subset (and index.css's Chiron
// unicode-range) never needs rebuilding when site content changes again. Only
// characters NEITHER font can draw, or outside COVERAGE_RANGES (Plane-2 ext-B),
// still fall to scripts/font-coverage-exceptions.txt.
const huiwenSource = fontkit.openSync(HUIWEN_SRC);
const fallbackChars = comprehensiveChars(CHIRON_SRC).filter(
  (ch) => !huiwenSource.hasGlyphForCodePoint(ch.codePointAt(0)),
);

// 拉丁點綴（font-accent）的兩個字重：同樣是固定覆蓋、與網站文字無關（見 font-chars.mjs
// 的 LATIN_COVERAGE_RANGES）。這個字型只有 440 個碼位，整套收進來也只多幾十 KB，換到的是
// 「羅馬字不會半個詞掉出打字機體」。
const SOURCES = {
  'public/fonts/HuiwenMincho-subset.woff2': { source: HUIWEN_SRC, text: bodyChars },
  'public/fonts/ChironSungHK-fallback-subset.woff2': { source: CHIRON_SRC, text: fallbackChars },
  'public/fonts/ErikasFarbband-subset.woff2': { source: ERIKAS_SRC, text: latinChars(ERIKAS_SRC) },
  'public/fonts/ErikasFarbband-Bold-subset.woff2': { source: ERIKAS_BOLD_SRC, text: latinChars(ERIKAS_BOLD_SRC) },
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
