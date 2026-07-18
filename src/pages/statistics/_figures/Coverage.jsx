import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX } from '../../../components/lab/chart/Axis';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';
import { tCritical } from '../_lib/stats';

/*
 * The heart of the article, drawn honestly. A fixed population mean is a vertical
 * line; each draw of n observations gives one confidence interval, stacked as a
 * horizontal segment. About 95% of the segments cross the line, about 5% miss —
 * the 95% is a property of the whole pile (the procedure), never of one segment.
 *
 * The sampling MUST reproduce data/reference/confidence-interval.json exactly, so
 * mulberry32 and the Box-Muller pair transform are copied here verbatim from the
 * data repo's verify-simulation-reference.mjs — both branches (cos AND sin) kept,
 * which is why this does not import _lib/rng.js (that one keeps only cos). At the
 * default seed=1937, mu=50, sigma=10, n=20, level=0.95 this lands on 1901/2000
 * covered, and the width-sorted halves on 921 / 980 — the relevant-subsets gap.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalPair(rng) {
  let u1 = rng();
  const u2 = rng();
  if (u1 < 1e-12) u1 = 1e-12;
  const r = Math.sqrt(-2 * Math.log(u1));
  return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

function normalSample(rng, n) {
  const out = [];
  while (out.length < n) {
    const [z0, z1] = normalPair(rng);
    out.push(z0);
    if (out.length < n) out.push(z1);
  }
  return out;
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const stddev = (a) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1));
};

function runCoverage({ seed, mu, sigma, n, tCrit, repeats }) {
  const rng = mulberry32(seed);
  const intervals = [];
  for (let i = 0; i < repeats; i += 1) {
    const x = normalSample(rng, n).map((v) => mu + sigma * v);
    const xbar = mean(x);
    const half = (tCrit * stddev(x)) / Math.sqrt(n);
    intervals.push({ xbar, lo: xbar - half, hi: xbar + half, width: 2 * half, covered: mu >= xbar - half && mu <= xbar + half });
  }
  const coverageCount = intervals.filter((iv) => iv.covered).length;
  const sorted = [...intervals].sort((a, b) => a.width - b.width);
  const halfN = Math.floor(repeats / 2);
  return {
    intervals,
    coverageCount,
    coverageNarrowHalf: sorted.slice(0, halfN).filter((iv) => iv.covered).length,
    coverageWideHalf: sorted.slice(halfN).filter((iv) => iv.covered).length,
    halfN,
  };
}

const LEVELS = [0.9, 0.95, 0.99];

const COPY = {
  zh: {
    level: '信心水準',
    n: '每段的樣本數 n',
    sortByWidth: '依區間長度排序',
    coverage: (c, r, pct) => `覆蓋率：${r} 段裡有 ${c} 段罩住真值＝${pct}%`,
    subsets: (nn, nh, wn, wh, np, wp) =>
      `依長度排序後，最窄的 ${nh} 段只罩住 ${nn}（${np}%），最寬的 ${wh} 段罩住 ${wn}（${wp}%）——窄區間常沒蓋，這就是相關子集。`,
    trueValue: '真值',
    covered: '罩住',
    missed: '沒罩到',
    caption: (d) =>
      `直線是固定不動的母體平均；每一橫條是一次抽樣算出的信賴區間（畫面顯示前 ${d} 段）。罩住真值的畫成細淡線，沒罩到的畫成深色。撥信心水準與 n，看罩住的比例怎麼變；勾「依長度排序」，短區間會集中在上方、而且更常沒罩到。覆蓋率統計跑滿 2000 段。`,
  },
  en: {
    level: 'confidence level',
    n: 'sample size n per interval',
    sortByWidth: 'sort by interval width',
    coverage: (c, r, pct) => `Coverage: ${c} of ${r} intervals cover the true value = ${pct}%`,
    subsets: (nn, nh, wn, wh, np, wp) =>
      `Sorted by width, the narrowest ${nh} cover only ${nn} (${np}%), the widest ${wh} cover ${wn} (${wp}%) — short intervals cover less. That is the relevant-subsets gap.`,
    trueValue: 'true value',
    covered: 'covers',
    missed: 'misses',
    caption: (d) =>
      `The line is the fixed population mean; each bar is one confidence interval from one draw (the first ${d} are shown). Covering intervals are drawn as thin pale lines, missing ones dark. Move the level and n to watch the covering fraction; tick "sort by width" and the short intervals cluster at the top and miss more often. Coverage counts run over the full 2000.`,
  },
};

export default function Coverage({
  populationMean = 50,
  populationSD = 10,
  n: nDefault = 20,
  level: levelDefault = 0.95,
  repeats = 2000,
  displayCount = 60,
  seed = 1937,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [level, setLevel] = useState(levelDefault);
  const [n, setN] = useState(nDefault);
  const [sortByWidth, setSortByWidth] = useState(false);

  const result = useMemo(() => {
    const tCrit = tCritical(level, n - 1);
    return runCoverage({ seed, mu: populationMean, sigma: populationSD, n, tCrit, repeats });
  }, [level, n, seed, populationMean, populationSD, repeats]);

  const pct = (a, b) => ((a / b) * 100).toFixed(1);

  // The displayed intervals are the first `displayCount` of the same stream;
  // sorting only reorders the display, never the coverage counts.
  const shown = useMemo(() => {
    const first = result.intervals.slice(0, displayCount);
    return sortByWidth ? [...first].sort((a, b) => a.width - b.width) : first;
  }, [result, displayCount, sortByWidth]);

  const FW = 560;
  const rowH = 3.1;
  const margin = { top: 16, right: 24, bottom: 40, left: 24 };
  const FH = margin.top + margin.bottom + displayCount * rowH;

  // Frame the intervals: widen the domain to hold the shown segments, padded.
  const domain = useMemo(() => {
    let lo = populationMean;
    let hi = populationMean;
    for (const iv of shown) { lo = Math.min(lo, iv.lo); hi = Math.max(hi, iv.hi); }
    const pad = (hi - lo) * 0.04 || 1;
    return [lo - pad, hi + pad];
  }, [shown, populationMean]);

  const x = linearScale({ domain, range: [margin.left, FW - margin.right] });
  const ticks = niceTicks(domain, 6);
  const muX = x(populationMean);

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-token-sm text-ink-muted">
          <span className="whitespace-nowrap">{c.level}</span>
          <div className="flex overflow-hidden rounded-token-sm border border-line">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                aria-pressed={level === lv}
                className={`px-2.5 py-1 text-token-xs tabular-nums transition-colors duration-fast ${
                  level === lv ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:text-accent'
                }`}
              >
                {Math.round(lv * 100)}%
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-token-sm text-ink-muted">
          <span className="whitespace-nowrap">{c.n}</span>
          <input
            type="range"
            min="4"
            max="80"
            step="1"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-40 accent-[var(--c-accent)]"
          />
          <span className="w-8 shrink-0 whitespace-nowrap tabular-nums text-ink">{n}</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-token-sm text-ink-muted">
          <input
            type="checkbox"
            checked={sortByWidth}
            onChange={(e) => setSortByWidth(e.target.checked)}
            className="accent-[var(--c-accent)]"
          />
          <span className="whitespace-nowrap">{c.sortByWidth}</span>
        </label>
      </div>

      <p className="mt-4 text-token-sm text-ink">
        {c.coverage(result.coverageCount, repeats, pct(result.coverageCount, repeats))}
      </p>
      <p className="mt-1 text-token-sm leading-[1.7] text-ink-muted">
        {c.subsets(
          result.coverageNarrowHalf, result.halfN,
          result.coverageWideHalf, result.halfN,
          pct(result.coverageNarrowHalf, result.halfN),
          pct(result.coverageWideHalf, result.halfN),
        )}
      </p>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption(displayCount)}>
        {/* the fixed population mean */}
        <line x1={muX} x2={muX} y1={margin.top - 4} y2={FH - margin.bottom + 4} stroke="var(--c-ink-muted)" strokeWidth="1.25" />
        <text x={muX + 4} y={margin.top + 6} fontSize="10" fill="var(--c-ink-muted)">{c.trueValue}</text>

        {/* the stacked intervals */}
        {shown.map((iv, i) => {
          const y = margin.top + i * rowH + rowH / 2;
          const stroke = iv.covered ? 'var(--cat-8-tx)' : 'var(--cat-6-tx)';
          return (
            <line
              key={i}
              x1={x(iv.lo)}
              x2={x(iv.hi)}
              y1={y}
              y2={y}
              stroke={stroke}
              strokeWidth={iv.covered ? 1 : 1.6}
              strokeOpacity={iv.covered ? 0.42 : 1}
              strokeLinecap="round"
            />
          );
        })}

        <AxisX scale={x} ticks={ticks} format={String} />
      </ChartFrame>
    </div>
  );
}
