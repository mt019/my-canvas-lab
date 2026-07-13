import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Bars } from '../../../components/lab/chart/marks';
import { bandScale, linearScale, niceTicks } from '../../../components/lab/chart/scale';
import { teaNullDistribution } from '../_lib/stats';

/*
 * Fisher's tea tasting, run on the reader: pick the four cups you say had milk
 * first, then read your score against the exact null distribution — all 70 ways
 * of choosing 4 from 8, counted rather than simulated. The p value starts here,
 * before any of the theory.
 */
const COPY = {
  zh: {
    prompt: (half, picked) => `挑出你認為先倒牛奶的 ${half} 杯（已挑 ${picked}）`,
    reveal: '揭曉',
    result: (correct, p) => `猜對 ${correct} 杯，單尾 p = ${p.toFixed(4)}`,
    perfect: '（七十分之一）',
    title: '猜對杯數在虛無假設下的精確分佈',
    caption: (total) => `純憑猜測時，${total} 種挑法機會均等。全中的挑法只有一種，所以全中的機率是 1/${total}。這個數字是數出來的，不是抽樣估的。`,
    y: '挑法數',
    x: (k) => `${k}`,
    xLabel: '猜對杯數',
  },
  en: {
    prompt: (half, picked) => `Pick the ${half} cups you say had milk first (${picked} chosen)`,
    reveal: 'Reveal',
    result: (correct, p) => `${correct} correct, one-sided p = ${p.toFixed(4)}`,
    perfect: ' (one in seventy)',
    title: 'Exact null distribution of the number of correct cups',
    caption: (total) => `A guesser is equally likely to pick any of the ${total} selections, and exactly one of them is fully correct. So guessing all four right happens with probability 1/${total}. That number was counted, not estimated.`,
    y: 'ways to choose',
    x: (k) => `${k}`,
    xLabel: 'cups correct',
  },
};

export default function LadyTastingTea({ cups = 8, truth = [1, 3, 5, 8], lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
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

  const x = bandScale({ domain: dist.counts.map((_, k) => k), range: [44, 460], padding: 0.22 });
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
                borderColor: on ? 'var(--cat-2-tx)' : reveal ? 'var(--status-success-tx)' : 'var(--c-line)',
                background: on ? 'var(--cat-2-bg)' : reveal ? 'var(--status-success-bg)' : 'var(--c-paper)',
                color: on ? 'var(--cat-2-tx)' : reveal ? 'var(--status-success-tx)' : 'var(--c-ink-faint)',
              }}
            >
              {i}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-token-sm text-ink-muted">
        <span>{c.prompt(half, picked.length)}</span>
        <button
          type="button"
          disabled={picked.length !== half}
          onClick={() => setSubmitted(true)}
          className="rounded-token-sm border border-line px-3 py-1 text-token-sm text-ink transition-colors duration-fast hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {c.reveal}
        </button>
        {submitted ? (
          <span className="text-ink">
            {c.result(correct, p)}
            {correct === half ? c.perfect : null}
          </span>
        ) : null}
      </div>

      <ChartFrame
        width={480}
        height={230}
        margin={{ top: 26, right: 20, bottom: 34, left: 44 }}
        minWidth={420}
        title={c.title}
        caption={c.caption(dist.total)}
      >
        <Grid scale={y} ticks={niceTicks([0, yMax], 4)} />
        <AxisY scale={y} ticks={niceTicks([0, yMax], 4)} label={c.y} />
        <AxisX scale={x} ticks={dist.counts.map((_, k) => k)} center format={c.x} label={c.xLabel} />
        <Bars
          data={dist.counts.map((count, k) => ({ key: k, value: count }))}
          x={x}
          y={y}
          cat={2}
          highlightCat={2}
          highlight={(d) => submitted && d.key === correct}
        />
      </ChartFrame>
    </div>
  );
}
