#!/usr/bin/env node
/*
 * Math notation gate.
 *
 * On the math-bearing surfaces of the site, a mathematical symbol may only
 * enter as LaTeX — $…$ / $$…$$ in .mdx, or <Math tex="…" /> in JSX. Typing the
 * Unicode character instead (alpha, H-nought, sigma) renders it in the Ming
 * body face while the formula next to it renders in KaTeX_Math, so the same
 * symbol ends up with two different shapes on one page. It also drags Greek and
 * math blocks into the font subset for no reason.
 *
 * Scope is deliberately narrow: the statistics site, synced statistics data,
 * and the shared lab components. Older pages use ">=", "~=" and similar as
 * ordinary prose punctuation, already covered by the font subsets — this gate
 * is not a site-wide typography sweep, and widening it would only create noise.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  'src/pages/statistics',
  'src/pages/StatisticsLab.jsx',
  'src/content',
  'src/components/lab',
];
const DATA_GLOB_DIR = 'src/data';
const DATA_PREFIX = 'statistics';

// Greek, super/subscripts, mathematical operators.
const BANNED = /[Ͱ-Ͽ⁰-₟∀-⋿]/u;

// 成對的 ⋯⋯（U+22EF ×2）是中文刪節號，是標點不是數學。它落在「數學運算子」區段純屬
// Unicode 分區的結果——…（U+2026）在明體裡貼著基線，置中的那一個就是 ⋯，中文排版本來
// 就用它。豁免按字元用途切、不按目錄切：統計站的散文一樣寫得到刪節號，而把整個
// src/content/notes 移出掃描範圍，會讓那幾篇真的在談機率論的手記漏掉 σ 這類字元。
// 單獨一個 ⋯ 仍然攔——那才可能是 a₁, ⋯, aₙ 那種數學寫法。
const CJK_ELLIPSIS = /⋯{2,}/gu;

function walk(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true })
    .flatMap((entry) => walk(join(path, entry.name)));
}

const files = [
  ...ROOTS.flatMap(walk),
  ...(existsSync(DATA_GLOB_DIR)
    ? readdirSync(DATA_GLOB_DIR).filter((f) => f.startsWith(DATA_PREFIX)).map((f) => join(DATA_GLOB_DIR, f))
    : []),
];

const problems = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const scan = line.replace(CJK_ELLIPSIS, '');
    const hits = [...new Set([...scan].filter((c) => BANNED.test(c)))];
    if (hits.length > 0) problems.push({ file, line: i + 1, hits: hits.join(' ') });
  });
}

/*
 * Second rule: a data field carrying $…$ must reach the page through a
 * component that compiles it. .mdx prose gets remark-math at build time, but a
 * JSON string printed straight into JSX shows the source ($2^k$) — that is how
 * the card-shuffling quiz options shipped. Every field below is rendered by
 * <MathText>; a new field with LaTeX in it fails here until it is wired up
 * (src/components/lab/MathText.jsx).
 */
const MATH_RENDERED_FIELDS = new Set([
  'prompt', 'options', 'explain',   // Quiz.jsx
  'statement', 'claim', 'why', 'instead', // StatementsPanel.jsx
  'caption',                        // ChartFrame.jsx
  'locator',                        // HoverCite.jsx, AnnotatedHtml.jsx
  // Written for the data repo's own docs and for figure components that pass
  // their own JSX captions; never printed as a bare string.
  'description', 'notes', 'source', 'title', 'label',
]);

function fieldsWithLatex(value, key, out) {
  if (typeof value === 'string') {
    if (/\$[^$\n]+\$/.test(value) && !MATH_RENDERED_FIELDS.has(key)) out.add(key);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) fieldsWithLatex(item, key, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) fieldsWithLatex(v, k, out);
  }
}

/*
 * Third rule: a display formula must be fenced on its own lines.
 *
 *   $$
 *   \|Q_m - U\| = \max_A |Q_m(A) - U(A)|
 *   $$
 *
 * remark-math reads a one-line `$$…$$` as text math, so it renders inline
 * inside the paragraph element: left-aligned, body line-height, no
 * `.katex-display` wrapper and none of the spacing katex.css sets for it. The
 * page looks like the author wanted a display formula and got a long inline
 * one, which is exactly what shipped in the shuffling and confidence-interval
 * articles.
 */
const ONE_LINE_DISPLAY = /^\s*\$\$.*\S.*\$\$\s*$/;
const inlineDisplay = [];
for (const file of files.filter((f) => f.endsWith('.mdx'))) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (ONE_LINE_DISPLAY.test(line)) inlineDisplay.push({ file, line: i + 1 });
  });
}

if (inlineDisplay.length > 0) {
  console.error('獨立成行的公式要把 $$ 各自放在自己的一行，中間才是式子；寫成一行的 $$…$$ 會被當成行內數學，靠左貼著段落排。');
  console.error('以下位置要拆成三行：\n');
  for (const d of inlineDisplay) console.error(`  ${d.file}:${d.line}`);
  process.exit(1);
}

const unrendered = [];
for (const file of files.filter((f) => f.endsWith('.json'))) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    continue;
  }
  const out = new Set();
  fieldsWithLatex(parsed, '', out);
  for (const key of out) unrendered.push({ file, key });
}

if (unrendered.length > 0) {
  console.error('資料層有欄位含 $…$，但前端沒有用 <MathText> 渲染它，讀者會看到 LaTeX 原文。');
  console.error('把該欄位接上 src/components/lab/MathText.jsx，再把欄名加進本檔的 MATH_RENDERED_FIELDS：\n');
  for (const u of unrendered) console.error(`  ${u.file}  欄位 ${u.key || '(頂層)'}`);
  process.exit(1);
}

if (problems.length > 0) {
  console.error('數學記號必須寫成 LaTeX：.mdx 用 $…$，JSX 用 <Math tex="…" />。');
  console.error('以下位置直接打了 Unicode 數學字元：\n');
  for (const p of problems) console.error(`  ${p.file}:${p.line}  ${p.hits}`);
  console.error(`\n共 ${problems.length} 處。理由見 docs/DESIGN.md 的 KaTeX 例外。`);
  process.exit(1);
}

console.log(`math notation ok — ${files.length} 個檔案，零 Unicode 數學字元`);
