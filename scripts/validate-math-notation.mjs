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
    const hits = [...new Set([...line].filter((c) => BANNED.test(c)))];
    if (hits.length > 0) problems.push({ file, line: i + 1, hits: hits.join(' ') });
  });
}

if (problems.length > 0) {
  console.error('數學記號必須寫成 LaTeX：.mdx 用 $…$，JSX 用 <Math tex="…" />。');
  console.error('以下位置直接打了 Unicode 數學字元：\n');
  for (const p of problems) console.error(`  ${p.file}:${p.line}  ${p.hits}`);
  console.error(`\n共 ${problems.length} 處。理由見 docs/DESIGN.md 的 KaTeX 例外。`);
  process.exit(1);
}

console.log(`math notation ok — ${files.length} 個檔案，零 Unicode 數學字元`);
