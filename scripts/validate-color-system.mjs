/*
 * Enforce the semantic color system's harmony envelope at build time.
 *
 * The Layer-0 tone primitives in src/styles/tokens.css encode Notion's harmony
 * rule (same-hue pairs, uniform text lightness, near-white backgrounds). This
 * script computes each token's OKLCH and fails the build if any tone drifts out
 * of the bands — so a categorical/status color can never be hand-added off the
 * envelope. Turns "pick a nice color" from taste into a machine check.
 *
 * Bands (chosen with margin around the current, user-approved Badge tones):
 *   -tx (text/mark):  chromatic tones  L 0.46–0.58,  C 0.045–0.13
 *                     neutral (slate)  L 0.46–0.58,  C ≤ 0.04
 *                     uniform-lightness spread (max−min L) ≤ 0.10
 *   -bg (pale):       all              L 0.90–0.97,  C ≤ 0.035
 *                     spread ≤ 0.06
 * Pure node, no deps (this machine has no real ripgrep; matches the other
 * validate-*.mjs scripts).
 */
import { readFileSync } from 'node:fs';

const TX_L = [0.46, 0.58];
const TX_C_CHROMA = [0.045, 0.13];
const NEUTRAL_C_MAX = 0.04;
const TX_SPREAD_MAX = 0.10;
const BG_L = [0.90, 0.97];
const BG_C_MAX = 0.035;
const BG_SPREAD_MAX = 0.06;
const NEUTRAL_TONES = new Set(['slate']);

function oklch(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const s2 = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [rl, gl, bl] = [r, g, b].map(s2);
  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L: +L.toFixed(3), C: +Math.hypot(a, bb).toFixed(3) };
}

const css = readFileSync('src/styles/tokens.css', 'utf8');
// Layer 0 only: --tone-<name>-<tx|bg>: #hex;  (semantic layers are var() aliases, not raw hex)
const tones = [...css.matchAll(/--tone-([a-z]+)-(tx|bg):\s*(#[0-9a-fA-F]{6})/g)]
  .map((m) => ({ name: m[1], kind: m[2], hex: m[3], ...oklch(m[3]) }));

const errs = [];
if (!tones.length) errs.push('no --tone-*-tx/bg primitives found in tokens.css');

const tx = tones.filter((t) => t.kind === 'tx');
const bg = tones.filter((t) => t.kind === 'bg');

for (const t of tx) {
  if (t.L < TX_L[0] || t.L > TX_L[1]) errs.push(`--tone-${t.name}-tx ${t.hex}: L ${t.L} outside text band ${TX_L[0]}–${TX_L[1]}`);
  if (NEUTRAL_TONES.has(t.name)) {
    if (t.C > NEUTRAL_C_MAX) errs.push(`--tone-${t.name}-tx ${t.hex}: C ${t.C} > neutral max ${NEUTRAL_C_MAX} (neutral should read gray)`);
  } else if (t.C < TX_C_CHROMA[0] || t.C > TX_C_CHROMA[1]) {
    errs.push(`--tone-${t.name}-tx ${t.hex}: C ${t.C} outside chroma band ${TX_C_CHROMA[0]}–${TX_C_CHROMA[1]} (too gray / too vivid)`);
  }
}
for (const t of bg) {
  if (t.L < BG_L[0] || t.L > BG_L[1]) errs.push(`--tone-${t.name}-bg ${t.hex}: L ${t.L} outside pale band ${BG_L[0]}–${BG_L[1]}`);
  if (t.C > BG_C_MAX) errs.push(`--tone-${t.name}-bg ${t.hex}: C ${t.C} > pale max ${BG_C_MAX} (bg not near-white enough)`);
}
const spread = (arr) => (arr.length ? Math.max(...arr) - Math.min(...arr) : 0);
const txSpread = +spread(tx.map((t) => t.L)).toFixed(3);
const bgSpread = +spread(bg.map((t) => t.L)).toFixed(3);
if (txSpread > TX_SPREAD_MAX) errs.push(`text lightness spread ${txSpread} > ${TX_SPREAD_MAX} — tones not uniform-lightness enough`);
if (bgSpread > BG_SPREAD_MAX) errs.push(`bg lightness spread ${bgSpread} > ${BG_SPREAD_MAX}`);

// Every tone must be a complete tx+bg pair.
const names = [...new Set(tones.map((t) => t.name))];
for (const n of names) {
  if (!tx.find((t) => t.name === n)) errs.push(`--tone-${n} has no -tx`);
  if (!bg.find((t) => t.name === n)) errs.push(`--tone-${n} has no -bg`);
}

if (errs.length) {
  console.error(`color-system invalid (${errs.length}):\n  ${errs.join('\n  ')}`);
  process.exit(1);
}
console.log(`color system ok: ${names.length} tone pairs, text L-spread ${txSpread} (≤${TX_SPREAD_MAX}), bg L-spread ${bgSpread} (≤${BG_SPREAD_MAX}).`);
