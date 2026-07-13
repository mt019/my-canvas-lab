import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Bars } from '../../../components/lab/chart/marks';
import { bandScale, linearScale, niceTicks } from '../../../components/lab/chart/scale';
import Tex from '../../../components/lab/Math';
import { teaNullDistribution } from '../_lib/stats';

/*
 * Fisher's tea tasting, as an experiment the reader runs on themselves: pick the
 * four cups you claim had the milk poured first, and read your result against the
 * exact null distribution — all 70 ways of choosing 4 cups from 8, counted, not
 * simulated. This is where the p value comes from, before any of the theory.
 */
export default function LadyTastingTea({ cups = 8, truth = [1, 3, 5, 8] }) {
  const [picked, setPicked] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const half = cups / 2;
  const dist = useMemo(() => teaNullDistribution(cups), [cups]);

  const toggle = (i) => {
    setSubmitted(false);
    setPicked((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= half) return prev;
      return [...prev, i];
    });
  };

  const correct = picked.filter((i) => truth.includes(i)).length;
  const p = dist.pAtLeast(correct);

  const x = bandScale({ domain: dist.counts.map((_, k) => k), range: [44, 460], padding: 0.35 });
  const yMax = Math.max(...dist.counts);
  const y = linearScale({ domain: [0, yMax], range: [200, 12] });

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: cups }, (_, i) => i + 1).map((i) => {
          const on = picked.includes(i);
          const reveal = submitted && truth.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={on}
              className="h-12 w-12 rounded-full border text-token-sm transition-colors duration-fast"
              style={{
                borderColor: on ? 'var(--cat-1-tx)' : 'var(--c-line)',
                background: on ? 'var(--cat-1-bg)' : reveal ? 'var(--cat-3-bg)' : 'var(--c-paper)',
                color: on ? 'var(--cat-1-tx)' : reveal ? 'var(--cat-3-tx)' : 'var(--c-ink-faint)',
              }}
            >
              {i}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-token-sm text-ink-muted">
        <span>
          挑出你認為先倒牛奶的 {half} 杯（已挑 {picked.length}）
        </span>
        <button
          type="button"
          disabled={picked.length !== half}
          onClick={() => setSubmitted(true)}
          className="rounded-token-sm border border-line px-3 py-1 text-token-sm text-ink transition-colors duration-fast hover:border-accent hover:text-accent disabled:opacity-40"
        >
          揭曉
        </button>
        {submitted ? (
          <span className="text-ink">
            猜對 {correct} 杯，單尾 <Tex tex="p" /> = {p.toFixed(4)}
            {correct === half ? '（1/70）' : null}
          </span>
        ) : null}
      </div>

      <ChartFrame
        width={480}
        height={230}
        margin={{ top: 12, right: 20, bottom: 30, left: 44 }}
        minWidth={420}
        title="猜對杯數在虛無假設下的精確分佈"
        caption={`女士純憑猜測時，${dist.total} 種挑法各有相同機會。猜對 ${half} 杯的挑法只有 1 種，所以全部猜對的機率是 1/${dist.total}。這個數字是數出來的，不是抽樣估的。`}
      >
        <Grid scale={y} ticks={niceTicks([0, yMax], 4)} />
        <AxisY scale={y} ticks={niceTicks([0, yMax], 4)} label="挑法數" />
        <AxisX
          scale={x}
          ticks={dist.counts.map((_, k) => k)}
          center
          format={(k) => `猜對 ${k}`}
        />
        <Bars
          data={dist.counts.map((c, k) => ({ key: k, value: c }))}
          x={x}
          y={y}
          cat={2}
          highlight={(d) => submitted && d.key === correct}
        />
      </ChartFrame>
    </div>
  );
}
