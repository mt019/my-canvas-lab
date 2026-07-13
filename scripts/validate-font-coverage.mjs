import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as fontkit from 'fontkit';
import { extractChars } from './font-chars.mjs';

/*
 * Does every character the site actually renders exist in the subsetted fonts?
 *
 * When it does not, this used to stop the build and tell a person to go and run
 * the rebuild script. That is a chore, and it fires on something as ordinary as
 * writing a paragraph with a character no page had used before — the build knows
 * exactly which characters are missing and the rebuild script needs no decisions
 * from anyone, so asking a human to relay the message between them was pointless.
 *
 * So: a miss rebuilds the subsets and checks again. The build only stops when the
 * *source* font itself cannot draw the character, which is the one case that does
 * need a person (pick a different character, or accept the fallback stack and say
 * so in font-coverage-exceptions.txt).
 *
 * The rebuild is ~20s and is not run unless something is missing, so an ordinary
 * build pays nothing. It is deterministic — same characters in, byte-identical
 * .woff2 out — so it does not churn the repo on every run.
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

const BODY = {
  label: 'Huiwen Mincho body family (incl. Chiron fallback)',
  paths: ['public/fonts/HuiwenMincho-subset.woff2', 'public/fonts/ChironSungHK-fallback-subset.woff2'],
};
const DISPLAY = {
  label: 'GenWanMin2 display CJK subset',
  paths: ['public/fonts/GenWanMin2-subset.woff2'],
};

function check() {
  const { chars, cjkChars } = extractChars();
  const exceptions = loadExceptions();
  return [
    { ...BODY, missing: missingFrom(BODY.paths, chars, exceptions) },
    { ...DISPLAY, missing: missingFrom(DISPLAY.paths, cjkChars, exceptions) },
  ].filter((f) => f.missing.length > 0);
}

let gaps = check();

if (gaps.length > 0) {
  for (const gap of gaps) console.log(`${gap.label}: missing ${describe(gap.missing)}`);
  console.log('Rebuilding the font subsets from the text the site currently contains…');
  execFileSync('node', ['scripts/rebuild-font-subsets.mjs'], { stdio: 'inherit' });
  gaps = check();
}

if (gaps.length > 0) {
  const detail = gaps.map((g) => `  ${g.label}: ${describe(g.missing)}`).join('\n');
  throw new Error(
    'These characters are used on the site but the source fonts cannot draw them, so a rebuild ' +
    'will not fix it:\n' + detail +
    '\nEither use a different character, or accept the system fallback for it by adding the ' +
    'codepoint to scripts/font-coverage-exceptions.txt.',
  );
}

const { chars, cjkChars } = extractChars();
console.log(`Font coverage validated: ${chars.length} text glyphs, ${cjkChars.length} CJK glyphs.`);
