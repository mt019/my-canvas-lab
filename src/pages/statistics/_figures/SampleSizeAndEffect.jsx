import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Dots, Line, RuleLine } from '../../../components/lab/chart/marks';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';
import { mulberry32, normalSample } from '../_lib/rng';
import { tTest } from '../_lib/stats';

/*
 * The effect is held fixed and tiny. Only the sample size moves, and the p value
 * collapses anyway. A small p says the data are unlikely under the null, and with
 * enough data even a trivial difference is unlikely under the null. It says
 * nothing about how big the difference is.
 */
const GRID = [20, 30, 50, 80, 120, 200, 320, 500, 800, 1200, 2000];
const REPS = 120;

const COPY = {
  zh: {
    n: '每組樣本數',
    fixed: (d) => `效果固定在 d = ${d}（小到不值得談的差距）`,
    typical: (p) => `這個樣本數下，典型的 p 值約 ${p}`,
    sig: '，已經顯著。效果從頭到尾沒有變過。',
    notSig: '，還不顯著。多收一點資料就會。',
    title: '樣本數與 p 值',
    caption: '每個樣本數重跑 120 次，取 p 值中位數。橫軸是對數刻度。p 值回答的是「資料有多不像虛無」，樣本一大，再小的差距也會變得很不像，所以 p 小不代表效果大。',
    y: '中位數 p',
    x: '每組樣本數',
  },
  en: {
    n: 'Sample size per group',
    fixed: (d) => `The effect is frozen at d = ${d}, a difference too small to care about`,
    typical: (p) => `At this sample size, a typical p value is about ${p}`,
    sig: ' — significant. The effect never changed.',
    notSig: ' — not significant yet. Collect a bit more and it will be.',
    title: 'Sample size and the p value',
    caption: 'Median p over 120 runs at each sample size; the horizontal axis is logarithmic. A p value asks how unlike the null the data are, and with a large enough sample even a trivial difference looks very unlike the null. Small p, therefore, does not mean large effect.',
    y: 'median p',
    x: 'sample size per group',
  },
};

function medianP(rand, n, d) {
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

  const curve = useMemo(() => {
    const rand = mulberry32(seed);
    return GRID.map((g) => [g, medianP(rand, g, d)]);
  }, [seed, d]);

  const current = useMemo(() => {
    const rand = mulberry32(seed + 1);
    return medianP(rand, n, d);
  }, [seed, n, d]);

  const x = linearScale({ domain: [Math.log10(20), Math.log10(2000)], range: [50, 540] });
  const xLog = (v) => x(Math.log10(v));
  const y = linearScale({ domain: [0, 0.6], range: [206, 12] });
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

      <p className="mt-3 text-token-sm text-ink">
        {c.typical(current.toFixed(4))}
        {current < 0.05 ? c.sig : c.notSig}
      </p>

      <ChartFrame
        width={560}
        height={240}
        margin={{ top: 26, right: 14, bottom: 38, left: 50 }}
        title={c.title}
        caption={c.caption}
      >
        <Grid scale={y} ticks={yTicks} />
        <AxisY scale={y} ticks={yTicks} format={(v) => v.toFixed(1)} label={c.y} />
        <AxisX scale={xLog} ticks={[20, 50, 120, 320, 800, 2000]} format={String} label={c.x} />
        <RuleLine at={0.05} scale={y} orient="horizontal" label="0.05" />
        <Line points={curve} x={xLog} y={y} cat={2} />
        <Dots points={curve} x={xLog} y={y} cat={2} r={2.5} />
        <Dots points={[[n, current]]} x={xLog} y={y} cat={2} r={5} />
      </ChartFrame>
    </div>
  );
}
