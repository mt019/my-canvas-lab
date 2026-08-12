import { useMemo } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Line, Dots, RuleLine } from '../../../components/lab/chart/marks';
import { linearScale } from '../../../components/lab/chart/scale';

/*
 * Table 5 of Bayer-Diaconis (1992), drawn. Nothing is computed here beyond the
 * layout: the two rows are Monte Carlo results from the paper and the baseline
 * is the exact harmonic number, all carried in from the data repository.
 *
 * The y-axis is logarithmic because the first shuffle sits at 31 cards and the
 * tail at 4.6; on a linear axis the interesting half of the story would be four
 * pixels tall. The baseline rule is what the reader compares everything to.
 */
const COPY = {
  zh: {
    axisY: '平均猜中張數',
    axisX: '洗牌次數',
    baseline: (v) => `洗好的牌：${v} 張`,
    caption: (v) =>
      `逐張猜牌，猜完翻開再猜下一張。縱軸取對數。虛線是均勻隨機牌堆的期望值 ${v} 張；洗五次還多猜中兩張，洗六次剩一張，之後每次大約減半。`,
  },
  en: {
    axisY: 'cards guessed correctly',
    axisX: 'number of shuffles',
    baseline: (v) => `well-shuffled deck: ${v}`,
    caption: (v) =>
      `Guess the cards one at a time, turning each over after the guess. The vertical axis is logarithmic. The dashed rule is the ${v} expected against a uniformly random deck; five shuffles still leave two extra cards, six leave one, and each further shuffle roughly halves the excess.`,
  },
};

export default function GuessingGame({
  k = [],
  noCut = [],
  cut = [],
  baseline = 4.538,
  series = {},
  en = {},
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const labels = lang === 'en' ? { ...series, ...(en.series ?? {}) } : series;

  const FW = 560;
  const FH = 280;
  const margin = { top: 18, right: 20, bottom: 42, left: 46 };
  const x = linearScale({ domain: [k[0] ?? 1, k[k.length - 1] ?? 10], range: [margin.left, FW - margin.right] });
  const y = linearScale({ domain: [Math.log10(4), Math.log10(40)], range: [FH - margin.bottom, margin.top] });
  const yAt = (v) => y(Math.log10(v));
  const yTicks = [4, 6, 10, 20, 40];

  const rows = useMemo(() => ([
    { id: 'noCut', label: labels.noCut, values: noCut, cat: 2 },
    { id: 'cut', label: labels.cut, values: cut, cat: 4 },
  ]), [labels, noCut, cut]);

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-token-sm text-ink-muted">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-0 w-5 border-t-2"
              style={{ borderColor: `var(--cat-${row.cat}-tx)` }}
            />
            <span>{row.label}</span>
          </li>
        ))}
      </ul>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption(baseline.toFixed(2))}>
        <Grid scale={y} ticks={yTicks.map((v) => Math.log10(v))} />
        <RuleLine at={Math.log10(baseline)} scale={y} orient="horizontal" label={c.baseline(baseline.toFixed(2))} />
        {rows.map((row) => {
          const points = row.values.map((v, i) => [k[i], v]);
          return (
            <g key={row.id}>
              <Line points={points} x={x} y={yAt} cat={row.cat} />
              <Dots points={points} x={x} y={yAt} cat={row.cat} r={2.6} />
            </g>
          );
        })}
        <AxisY scale={y} ticks={yTicks.map((v) => Math.log10(v))} format={(v) => String(Math.round(10 ** v))} label={c.axisY} />
        <AxisX scale={x} ticks={k} format={String} label={c.axisX} />
      </ChartFrame>
    </div>
  );
}
