import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Bars, RuleLine } from '../../../components/lab/chart/marks';
import { bandScale, linearScale, niceTicks } from '../../../components/lab/chart/scale';
import { mulberry32, normalSample } from '../_lib/rng';
import { tTest } from '../_lib/stats';

/*
 * Run the same study a few thousand times and keep only the p values. With no
 * effect at all they come out flat, and 5% land under 0.05 by construction. Turn
 * the effect up and they pile against the left wall, which is all that "power"
 * means — one picture, two settings of one knob.
 */
const BINS = 20;
const ALPHAS = [0.1, 0.05, 0.01];

const COPY = {
  zh: {
    effect: '兩組真實的差距 delta',
    effectHelp: 'delta 是兩組真實平均數的差距，用標準差當尺：兩班平均差 2 分、分數標準差 10 分，delta 就是 0.2。delta = 0 代表兩組真的一模一樣，任何看起來的差異都只是抽樣的隨機起伏。',
    threshold: '門檻 alpha',
    hits: (runs, pct) => `${runs} 次研究裡，有 ${pct}% 落在門檻以內`,
    nullTail: (a) => `。效果是零，這些全是偽陽性，比率就是你設的 ${a}。`,
    powerTail: '。效果不是零，這個比率就是檢定力。',
    title: '虛無為真時 p 值的分佈',
    captionNull: '沒有效果時，p 值均勻分佈在 0 到 1 之間。p 小並不稀奇，它本來就有 5% 的機會小於 0.05。把門檻拉到 0.01，偽陽性降到 1%，那是設定出來的，不是發現。',
    captionPower: '效果一旦不是零，p 值就往左邊堆。堆得多快，取決於效果大小與樣本數。',
    y: '研究數',
    x: 'p 值',
  },
  en: {
    effect: 'True difference between the groups, delta',
    effectHelp: 'Delta is the real gap between the two group means, measured in standard deviations: if two classes differ by 2 points on a test whose scores have a standard deviation of 10, delta is 0.2. Delta = 0 means the groups really are identical, and any difference you see is sampling noise.',
    threshold: 'Threshold alpha',
    hits: (runs, pct) => `${pct}% of ${runs} studies came out below the threshold`,
    nullTail: (a) => `. The effect is zero, so every one of them is a false positive — at exactly the rate you set, ${a}.`,
    powerTail: '. The effect is not zero, and that rate is the power of the test.',
    title: 'The distribution of p when the null is true',
    captionNull: 'With no effect, p is uniform on 0 to 1. A small p is not remarkable: it had a 5% chance of landing under 0.05 anyway. Move the threshold to 0.01 and false positives drop to 1%, which is a setting, not a finding.',
    captionPower: 'Once the effect is nonzero, p piles up on the left. How fast depends on the size of the effect and the size of the sample.',
    y: 'studies',
    x: 'p value',
  },
};

export default function PUnderNull({ n = 30, runs = 2000, seed = 20260713, delta: delta0 = 0, lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
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
  // The bars are binned; the threshold line sits at a real p value, not a bin edge.
  const pAxis = linearScale({ domain: [0, 1], range: [46, 540] });
  const yMax = Math.max(...bins);
  const y = linearScale({ domain: [0, yMax], range: [206, 12] });
  const isNull = delta === 0;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-token-sm text-ink-muted">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">{c.effect}</span>
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
          <span className="whitespace-nowrap">{c.threshold}</span>
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

      <p className="mt-2 text-token-xs leading-relaxed text-ink-faint">{c.effectHelp}</p>

      <p className="mt-3 text-token-sm text-ink">
        {c.hits(runs, (hitRate * 100).toFixed(1))}
        {isNull ? c.nullTail(alpha) : c.powerTail}
      </p>

      <ChartFrame
        width={560}
        height={240}
        margin={{ top: 26, right: 14, bottom: 36, left: 46 }}
        title={c.title}
        caption={isNull ? c.captionNull : c.captionPower}
      >
        <Grid scale={y} ticks={niceTicks([0, yMax], 4)} />
        <AxisY scale={y} ticks={niceTicks([0, yMax], 4)} label={c.y} />
        <AxisX
          scale={x}
          ticks={bins.map((_, i) => i).filter((i) => i % 4 === 0)}
          center
          format={(i) => (i / BINS).toFixed(2)}
          label={c.x}
        />
        <Bars
          data={bins.map((count, i) => ({ key: i, value: count }))}
          x={x}
          y={y}
          cat={8}
          highlightCat={8}
          highlight={(d) => (d.key + 1) / BINS <= alpha}
        />
        <RuleLine at={alpha} scale={pAxis} orient="vertical" label={`p = ${alpha}`} />
      </ChartFrame>
    </div>
  );
}
