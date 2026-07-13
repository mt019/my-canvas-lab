import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Bars, RuleLine } from '../../../components/lab/chart/marks';
import { bandScale, linearScale, niceTicks } from '../../../components/lab/chart/scale';
import Tex from '../../../components/lab/Math';
import { mulberry32, normalSample } from '../_lib/rng';
import { tTest } from '../_lib/stats';

/*
 * Run the same study a few thousand times and keep only the p values.
 *
 * With no effect at all, they come out flat: every value of p is as likely as
 * every other, and 5% of them land under 0.05 by construction. Push the effect
 * up and the distribution piles against the left wall — which is all "power"
 * means. One figure, both halves of the idea, because they are the same picture
 * seen at two settings of the same knob.
 */
const BINS = 20;
const ALPHAS = [0.1, 0.05, 0.01];

export default function PUnderNull({ n = 30, runs = 2000, seed = 20260713, delta: delta0 = 0 }) {
  const [delta, setDelta] = useState(delta0);
  const [alpha, setAlpha] = useState(0.05);

  const { bins, hitRate } = useMemo(() => {
    const rand = mulberry32(seed);
    const counts = new Array(BINS).fill(0);
    let hits = 0;
    for (let i = 0; i < runs; i += 1) {
      const a = normalSample(rand, n, 0, 1);
      const b = normalSample(rand, n, delta, 1);
      const { p } = tTest(a, b);
      counts[Math.min(BINS - 1, Math.floor(p * BINS))] += 1;
      if (p < alpha) hits += 1;
    }
    return { bins: counts, hitRate: hits / runs };
  }, [n, runs, seed, delta, alpha]);

  const x = bandScale({ domain: bins.map((_, i) => i), range: [46, 540], padding: 0.12 });
  // The bars are binned, but the alpha line sits at a real p value, not a bin edge.
  const pAxis = linearScale({ domain: [0, 1], range: [46, 540] });
  const yMax = Math.max(...bins);
  const y = linearScale({ domain: [0, yMax], range: [206, 12] });
  const isNull = delta === 0;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-token-sm text-ink-muted">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">
            真實效果 <Tex tex="\delta" />
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="w-40 accent-[var(--c-accent)]"
          />
          <span className="w-10 tabular-nums text-ink">{delta.toFixed(2)}</span>
        </label>

        <span className="flex items-center gap-1">
          <span className="whitespace-nowrap">
            門檻 <Tex tex="\alpha" />
          </span>
          {ALPHAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlpha(a)}
              className="rounded-token-sm px-2 py-0.5 text-token-xs transition-colors duration-fast"
              style={{
                background: alpha === a ? 'var(--c-accent-soft)' : 'transparent',
                color: alpha === a ? 'var(--c-accent)' : 'var(--c-ink-faint)',
              }}
            >
              {a}
            </button>
          ))}
        </span>
      </div>

      <p className="mt-3 text-token-sm text-ink">
        {runs} 次研究裡，有 <span className="tabular-nums">{(hitRate * 100).toFixed(1)}%</span> 落在門檻以內
        {isNull
          ? `——效果是零，這些全是偽陽性，比率就是你設的 ${alpha}。`
          : '——效果不是零，這個比率就是檢定力。'}
      </p>

      <ChartFrame
        width={560}
        height={240}
        margin={{ top: 12, right: 14, bottom: 32, left: 46 }}
        title="虛無為真時 p 值的分佈"
        caption={
          isNull
            ? '沒有任何效果時，p 值均勻分佈在 0 到 1 之間：p 小並不稀奇，它本來就有 5% 的機會小於 0.05。把門檻拉到 0.01，偽陽性就降到 1% —— 那是設定出來的，不是發現。'
            : '效果一旦不是零，p 值就往左邊堆。堆得多快，取決於效果大小與樣本數。'
        }
      >
        <Grid scale={y} ticks={niceTicks([0, yMax], 4)} />
        <AxisY scale={y} ticks={niceTicks([0, yMax], 4)} label="研究數" />
        <AxisX
          scale={x}
          ticks={bins.map((_, i) => i).filter((i) => i % 4 === 0)}
          center
          format={(i) => (i / BINS).toFixed(2)}
          label="p 值"
        />
        <Bars
          data={bins.map((c, i) => ({ key: i, value: c }))}
          x={x}
          y={y}
          cat={2}
          highlight={(d) => (d.key + 1) / BINS <= alpha}
        />
        <RuleLine at={alpha} scale={pAxis} orient="vertical" label={`p = ${alpha}`} />
      </ChartFrame>
    </div>
  );
}
