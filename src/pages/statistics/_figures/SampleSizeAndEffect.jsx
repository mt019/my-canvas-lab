import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Dots, Line, RuleLine } from '../../../components/lab/chart/marks';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';
import { mulberry32, normalSample } from '../_lib/rng';
import { tTest } from '../_lib/stats';

/*
 * The effect is held fixed and tiny. Only the sample size moves, and the p value
 * collapses anyway.
 *
 * Every point on the curve — including the one under the slider — is the median p
 * of REPS studies at that sample size, with the seed derived from the sample size
 * itself. So the marked point always lands on the curve. An earlier version drew
 * it from a different seed and it floated off the line, looking like a bug.
 */
const GRID = [20, 30, 50, 80, 120, 200, 320, 500, 800, 1200, 2000];
const REPS = 400;

const COPY = {
  zh: {
    n: '每組樣本數',
    fixed: (d) => `兩組真實的差距固定在 d = ${d}`,
    fixedHelp: (d) => `d = ${d} 的意思是：兩組的真實平均只差 ${d} 個標準差。換算成分數，大約是兩班平均差 1.5 分、而分數標準差有 10 分——小到沒有人會在意。整張圖裡這個差距完全沒有變過，變的只有人數。`,
    reading: (n, p) => `每組收 ${n} 個人，重做 ${REPS} 次研究，其中典型的一次會得到 p = ${p}`,
    sig: '。已經算顯著了，而效果從頭到尾沒變過。',
    notSig: '。還不顯著。多收一點人就會。',
    marker: '你選的樣本數',
    cross: (n) => `每組人數超過大約 ${n} 之後，典型的研究就會跌破 0.05，開始「顯著」。`,
    title: '效果不變，只加人',
    caption: `曲線上每一點，是在該樣本數下重做 ${REPS} 次研究、取 p 值的中位數（也就是「典型的一次」會得到的 p）。放大的那個空心點，就是你用滑桿選的樣本數，它一定落在曲線上。橫軸是對數刻度。整張圖裡效果都是 d = 0.15，只有人數在變。`,
    y: '典型的 p 值',
    x: '每組樣本數（對數刻度）',
  },
  en: {
    n: 'Sample size per group',
    fixed: (d) => `The true gap between the groups is frozen at d = ${d}`,
    fixedHelp: (d) => `d = ${d} means the two group means really differ by ${d} of a standard deviation — about 1.5 points on a test whose scores have a standard deviation of 10. Nobody would care about a gap that size. It never changes across this chart; only the number of people does.`,
    reading: (n, p) => `With ${n} people per group, run ${REPS} times, the typical study comes back with p = ${p}`,
    sig: '. That already counts as significant, and the effect never changed.',
    notSig: '. Not significant yet. Collect a few more people and it will be.',
    marker: 'the size you picked',
    cross: (n) => `Past roughly ${n} people per group, the typical study drops below 0.05 and starts coming out "significant".`,
    title: 'Same effect, more people',
    caption: `Each point on the curve is the median p value of ${REPS} studies run at that sample size — what a typical study there would report. The enlarged hollow point is the size you chose with the slider, and it always lands on the curve. The horizontal axis is logarithmic. Across the whole chart the effect is d = 0.15; only the number of people changes.`,
    y: 'typical p value',
    x: 'sample size per group (log scale)',
  },
};

/* Median p over REPS studies at this sample size. The seed comes from n, so the
   same sample size always gives the same answer and the curve does not shimmer. */
function medianP(n, d, seed) {
  const rand = mulberry32(seed + n * 7919);
  const ps = Array.from({ length: REPS }, () => {
    const a = normalSample(rand, n, 0, 1);
    const b = normalSample(rand, n, d, 1);
    return tTest(a, b).p;
  }).sort((x, y) => x - y);
  return ps[Math.floor(REPS / 2)];
}

export default function SampleSizeAndEffect({ d = 0.15, seed = 991, nDefault = 80, lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
  const [n, setN] = useState(nDefault);

  const curve = useMemo(() => GRID.map((g) => [g, medianP(g, d, seed)]), [d, seed]);
  const current = useMemo(() => medianP(n, d, seed), [n, d, seed]);

  // Where the typical study starts clearing the 0.05 bar.
  const crossing = useMemo(() => (curve.find(([, p]) => p < 0.05) ?? [null])[0], [curve]);

  const x = linearScale({ domain: [Math.log10(20), Math.log10(2000)], range: [58, 540] });
  const xLog = (v) => x(Math.log10(v));
  const y = linearScale({ domain: [0, 0.6], range: [206, 24] });
  const yTicks = niceTicks([0, 0.6], 4);

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <label className="flex flex-wrap items-center gap-3 text-token-sm text-ink-muted">
        <span className="whitespace-nowrap">{c.n}</span>
        <input
          type="range"
          min="20"
          max="2000"
          step="10"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-52 accent-[var(--c-accent)]"
        />
        <span className="w-14 tabular-nums text-ink">{n}</span>
        <span>{c.fixed(d)}</span>
      </label>

      <p className="mt-2 text-token-xs leading-relaxed text-ink-faint">{c.fixedHelp(d)}</p>

      <p className="mt-3 text-token-sm text-ink">
        {c.reading(n, current.toFixed(3))}
        {current < 0.05 ? c.sig : c.notSig}
      </p>
      {crossing ? <p className="mt-1 text-token-sm text-ink-muted">{c.cross(crossing)}</p> : null}

      <ChartFrame
        width={560}
        height={252}
        margin={{ top: 36, right: 16, bottom: 42, left: 58 }}
        title={c.title}
        caption={c.caption}
      >
        <Grid scale={y} ticks={yTicks} />
        <AxisY scale={y} ticks={yTicks} format={(v) => v.toFixed(1)} label={c.y} />
        <AxisX scale={xLog} ticks={[20, 50, 120, 320, 800, 2000]} format={String} label={c.x} />
        <RuleLine at={0.05} scale={y} orient="horizontal" label="p = 0.05" />
        <Line points={curve} x={xLog} y={y} cat={8} />
        <Dots points={curve} x={xLog} y={y} cat={8} r={2.5} />
        <Dots points={[[n, current]]} x={xLog} y={y} cat={8} r={6} />
        <text
          x={xLog(n)}
          y={Math.max(18, y(current) - 12)}
          textAnchor="middle"
          fontSize="10"
          fill="var(--c-accent)"
        >
          {c.marker}
        </text>
      </ChartFrame>
    </div>
  );
}
