import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Dots, Line, RuleLine } from '../../../components/lab/chart/marks';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';
import Tex from '../../../components/lab/Math';
import { mulberry32, normalSample } from '../_lib/rng';
import { tTest } from '../_lib/stats';

/*
 * The effect is held fixed and tiny. Only the sample size moves. The p value
 * collapses anyway — which is the whole point: a small p says the data are
 * unlikely under the null, and with enough data even a trivial difference is
 * unlikely under the null. It says nothing about how big the difference is.
 */
const GRID = [20, 30, 50, 80, 120, 200, 320, 500, 800, 1200, 2000];
const REPS = 120;

function medianP(rand, n, d) {
  const ps = Array.from({ length: REPS }, () => {
    const a = normalSample(rand, n, 0, 1);
    const b = normalSample(rand, n, d, 1);
    return tTest(a, b).p;
  }).sort((x, y) => x - y);
  return ps[Math.floor(REPS / 2)];
}

export default function SampleSizeAndEffect({ d = 0.15, seed = 991, nDefault = 80 }) {
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
        <span className="whitespace-nowrap">每組樣本數</span>
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
        <span>
          效果固定在 <Tex tex={`d = ${d}`} />（小到不值得談的差距）
        </span>
      </label>

      <p className="mt-3 text-token-sm text-ink">
        這個樣本數下，典型的 <Tex tex="p" /> 值約 <span className="tabular-nums">{current.toFixed(4)}</span>
        {current < 0.05 ? '——顯著。而效果從頭到尾沒有變過。' : '——還不顯著。多收一點資料就會。'}
      </p>

      <ChartFrame
        width={560}
        height={240}
        margin={{ top: 12, right: 14, bottom: 34, left: 50 }}
        title="樣本數與 p 值"
        caption="每組樣本數的中位數 p 值（同一個微小效果，重跑 120 次取中位）。橫軸是對數刻度。p 值回答的是「資料有多不像虛無」，樣本一大，再小的差距也會變得很不像——所以 p 小不代表效果大。"
      >
        <Grid scale={y} ticks={yTicks} />
        <AxisY scale={y} ticks={yTicks} format={(v) => v.toFixed(1)} label="中位數 p" />
        <AxisX
          scale={xLog}
          ticks={[20, 50, 120, 320, 800, 2000]}
          format={String}
          label="每組樣本數"
        />
        <RuleLine at={0.05} scale={y} orient="horizontal" label="0.05" />
        <Line points={curve} x={xLog} y={y} cat={2} />
        <Dots points={curve} x={xLog} y={y} cat={2} r={2.5} />
        <Dots points={[[n, current]]} x={xLog} y={y} cat={6} r={4.5} />
      </ChartFrame>
    </div>
  );
}
