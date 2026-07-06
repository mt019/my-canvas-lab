import { readFileSync } from 'node:fs';
import * as fontkit from 'fontkit';
import { extractChars } from './font-chars.mjs';

const { chars, cjkChars } = extractChars();

// Codepoints the source fonts themselves lack; these render via the CSS fallback stack.
const exceptions = new Set(
  readFileSync('scripts/font-coverage-exceptions.txt', 'utf8')
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter((line) => line.startsWith('U+'))
    .map((line) => parseInt(line.slice(2), 16)),
);

function assertCoverage(fontPaths, requiredChars, label) {
  const fonts = fontPaths.map((path) => fontkit.openSync(path));
  const missing = requiredChars.filter((char) => {
    const code = char.codePointAt(0);
    return !exceptions.has(code) && !fonts.some((font) => font.hasGlyphForCodePoint(code));
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

// Body coverage is the union of the main face and the Chiron unicode-range fallback
// declared under the same 'Huiwen Mincho' family in src/index.css.
assertCoverage(
  ['public/fonts/HuiwenMincho-subset.woff2', 'public/fonts/ChironSungHK-fallback-subset.woff2'],
  chars,
  'Huiwen Mincho body family (incl. Chiron fallback)',
);
assertCoverage(['public/fonts/GenWanMin2-subset.woff2'], cjkChars, 'GenWanMin2 display CJK subset');
console.log(`Font coverage validated: ${chars.length} text glyphs, ${cjkChars.length} CJK glyphs.`);
