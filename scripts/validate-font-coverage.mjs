import { readFileSync } from 'node:fs';
import * as fontkit from 'fontkit';
import { extractChars } from './font-chars.mjs';

/*
 * Does every character the site renders exist in the committed font subsets?
 *
 * This only VALIDATES. It never rebuilds (2026-07-18): the rebuild needs the
 * licensed source fonts, which live on one machine and are deliberately not in
 * the repo, so a build server (Vercel) cannot run it — the old auto-rebuild
 * crashed there on a missing source font. The body face is now a fixed,
 * comprehensive subset (see rebuild-font-subsets.mjs), so an ordinary new
 * paragraph is already covered and this passes without anyone doing anything.
 *
 * When something genuinely falls outside coverage (an exotic character beyond
 * common CJK), this fails with instructions instead of trying to fix it here:
 * either avoid the character, accept the system fallback for it via
 * font-coverage-exceptions.txt, or — on a machine that has the source fonts —
 * run `npm run fonts:rebuild` and commit the updated subsets.
 */
function loadExceptions() {
  return new Set(
    readFileSync('scripts/font-coverage-exceptions.txt', 'utf8')
      .split('\n')
      .map((line) => line.split('#')[0].trim())
      .filter((line) => line.startsWith('U+'))
      .map((line) => parseInt(line.slice(2), 16)),
  );
}

function missingFrom(fontPaths, requiredChars, exceptions) {
  const fonts = fontPaths.map((path) => fontkit.openSync(path));
  return requiredChars.filter((char) => {
    const code = char.codePointAt(0);
    return !exceptions.has(code) && !fonts.some((font) => font.hasGlyphForCodePoint(code));
  });
}

function describe(missing) {
  const sample = missing.slice(0, 20).join('');
  const codes = missing
    .slice(0, 20)
    .map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))
    .join(' ');
  return `${missing.length} glyph(s), e.g. ${sample} — ${codes}`;
}

// The body family is two faces stacked under one name: Huiwen carries the text,
// Chiron fills the codepoints Huiwen has no glyph for (unicode-range in
// index.css). Every CJK stack in index.css (body, display, accent) resolves to
// this family, so this single union is the whole site's coverage.
const BODY = {
  label: 'Huiwen Mincho body family (incl. Chiron fallback)',
  paths: ['public/fonts/HuiwenMincho-subset.woff2', 'public/fonts/ChironSungHK-fallback-subset.woff2'],
};

const { chars } = extractChars();
const exceptions = loadExceptions();
const missing = missingFrom(BODY.paths, chars, exceptions);

if (missing.length > 0) {
  throw new Error(
    `${BODY.label}: the committed subsets are missing ${describe(missing)}\n` +
    'These characters are rendered on the site but no committed font subset can draw them.\n' +
    '→ Either use a different character, accept the system fallback by adding the codepoint(s) ' +
    'to scripts/font-coverage-exceptions.txt, or — on a machine with the source fonts — run ' +
    '`npm run fonts:rebuild`, paste the printed unicode-range into src/index.css, and commit ' +
    'the updated public/fonts/*.woff2.\n' +
    '(This build never rebuilds fonts itself — the source fonts are not in the repo.)',
  );
}

console.log(`Font coverage validated: ${chars.length} glyphs against the committed subsets.`);
