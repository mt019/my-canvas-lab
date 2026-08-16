import { readFileSync } from 'node:fs';
import * as fontkit from 'fontkit';
import { extractChars, requiredLatinAccentChars } from './font-chars.mjs';

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

/*
 * 拉丁點綴面（font-accent＝Erikas Farbband）另外驗一次，判準與上面不同。
 *
 * 上面驗的是「畫得出來」，用的是整個字型堆疊的聯集，所以缺字會落到 Huiwen 而照樣通過。
 * 2026-08-13 德川頁術語表就是這樣壞的：平文式羅馬字的 ō（daimyō、taishōgun、bushidō）
 * 不在 Erikas 子集裡，落到 Huiwen 明體，一個詞裡兩種字面。這一段驗的是「同一個面畫得完」
 * ——常用拉丁字元必須全部在 Erikas 自己的子集裡，不看堆疊下游。
 */
const ACCENT = {
  label: 'Erikas Farbband 拉丁點綴面（font-accent）',
  paths: ['public/fonts/ErikasFarbband-subset.woff2', 'public/fonts/ErikasFarbband-Bold-subset.woff2'],
};

// 來源字型 erikas-farbband.ttf 本身就沒有的碼位（重建也生不出來），與 CJK 那份
// font-coverage-exceptions.txt 分開列，免得在內文字型那邊也一併放行。
// U+0113 ē 長音 e：日文平文式羅馬字用不到（長音 e 寫 ei），拉脫維亞語等才需要。
// U+014A/U+014B Ŋŋ：非洲語言與 IPA。三者在 font-accent 裡會落到明體。
const ACCENT_SOURCE_GAPS = new Set([0x0113, 0x014a, 0x014b]);

for (const path of ACCENT.paths) {
  const face = fontkit.openSync(path);
  const gaps = requiredLatinAccentChars().filter(
    (char) => !ACCENT_SOURCE_GAPS.has(char.codePointAt(0))
      && !exceptions.has(char.codePointAt(0))
      && !face.hasGlyphForCodePoint(char.codePointAt(0)),
  );
  if (gaps.length > 0) {
    throw new Error(
      `${ACCENT.label}：${path} 畫不出 ${describe(gaps)}\n` +
      '這些字元本身有別的字型畫得出來，所以上面的缺字驗證不會報——壞的是字面一致性：\n' +
      '一個羅馬字詞裡，缺的那個字母會掉到堆疊下一個字型（明體），半個詞不是打字機體。\n' +
      '→ 在有來源字型的機器上跑 `npm run fonts:rebuild` 重建子集並提交；\n' +
      '來源字型本身就沒有的碼位，加進 scripts/font-coverage-exceptions.txt。',
    );
  }
}

console.log(
  `Font coverage validated: ${chars.length} glyphs against the committed subsets; ` +
  `${ACCENT.paths.length} 個拉丁點綴面涵蓋常用拉丁字元。`,
);
