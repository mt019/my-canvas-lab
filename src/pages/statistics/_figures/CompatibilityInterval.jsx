import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { RuleLine } from '../../../components/lab/chart/marks';
import { AxisX } from '../../../components/lab/chart/Axis';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';
import { tTwoSidedP, tCritical } from '../_lib/stats';

/*
 * One fixed batch of data, drawn as a point estimate with its 95% confidence
 * interval on a number line. Nothing is random here — the numbers are computed
 * from the same t-test formulas the data repo precomputed, so the interval on
 * screen matches figures.json to three decimals.
 *
 * The slider is a hypothesised true difference. Drag it and watch it stay inside
 * the interval: this batch is as compatible with "+2 mmHg" as it is with "0".
 * A non-significant result only says 0 sits in the interval, not that 0 is more
 * credible than the other values sitting there with it.
 */
const DOMAIN = [-6, 6];

const COPY = {
  zh: {
    delta: '假設的真實差異',
    reading: (d, unit, inside) =>
      `假設兩者真的差 ${d} ${unit}——這批資料${inside ? '和它相容' : '排除得掉它'}。`,
    insideZero: '（區間包含 0，所以檢定不顯著。）',
    est: (d, lo, hi, unit) => `點估計 ${d} ${unit}，95% 信賴區間 [${lo}, ${hi}]。`,
    p: (p) => `雙尾 p = ${p}`,
    zero: '0（兩者相同）',
    marker: '你選的值',
    ciLabel: '95% 信賴區間',
    x: (unit) => `兩組差異（${unit}）`,
    caption: (unit) =>
      `固定資料：兩組平均差 0.6 ${unit}、每組 120 人、合併標準差 8 ${unit}。橫線是 95% 信賴區間，實心點是點估計，空心點是你用滑桿假設的真實差異。只要它落在橫線裡，這批資料就和它相容。`,
  },
  en: {
    delta: 'Hypothesised true difference',
    reading: (d, unit, inside) =>
      `Suppose the two really differ by ${d} ${unit} — this batch ${inside ? 'is compatible with that' : 'can rule it out'}.`,
    insideZero: '(The interval contains 0, so the test is not significant.)',
    est: (d, lo, hi, unit) => `Point estimate ${d} ${unit}, 95% confidence interval [${lo}, ${hi}].`,
    p: (p) => `two-sided p = ${p}`,
    zero: '0 (identical)',
    marker: 'your value',
    ciLabel: '95% CI',
    x: (unit) => `difference between groups (${unit})`,
    caption: (unit) =>
      `Fixed data: the two group means differ by 0.6 ${unit}, 120 per group, pooled SD 8 ${unit}. The bar is the 95% confidence interval, the filled dot the point estimate, the hollow dot the true difference you assume with the slider. As long as it lands on the bar, the data are compatible with it.`,
  },
};

export default function CompatibilityInterval({
  meanDiff = 0.6,
  pooledSD = 8,
  nPerGroup = 120,
  unit = 'mmHg',
  deltaDefault = 2,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [delta, setDelta] = useState(deltaDefault);

  const stat = useMemo(() => {
    const se = pooledSD * Math.sqrt(2 / nPerGroup);
    const df = 2 * (nPerGroup - 1);
    const t = meanDiff / se;
    const p = tTwoSidedP(t, df);
    const tCrit = tCritical(0.95, df);
    const half = tCrit * se;
    return { se, df, p, ci: [meanDiff - half, meanDiff + half] };
  }, [meanDiff, pooledSD, nPerGroup]);

  const [lo, hi] = stat.ci;
  const inside = delta >= lo && delta <= hi;

  // Geometry: a number line, the interval on it, one movable marker.
  const FW = 560;
  const FH = 188;
  const margin = { top: 40, right: 28, bottom: 38, left: 28 };
  const rowY = 104;
  const x = linearScale({ domain: DOMAIN, range: [margin.left + 20, FW - margin.right - 20] });
  const ticks = niceTicks(DOMAIN, 6);

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <label className="flex flex-wrap items-center gap-3 text-token-sm text-ink-muted">
        <span className="whitespace-nowrap">{c.delta}</span>
        <input
          type="range"
          min="-4"
          max="4"
          step="0.1"
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value))}
          className="w-52 accent-[var(--c-accent)]"
        />
        <span className="w-16 tabular-nums text-ink">{delta.toFixed(1)} {unit}</span>
      </label>

      <p className="mt-3 text-token-sm text-ink">
        {c.reading(delta.toFixed(1), unit, inside)}
        {Math.abs(delta) < 1e-9 ? ` ${c.insideZero}` : ''}
      </p>
      <p className="mt-1 text-token-sm text-ink-muted">
        {c.est(meanDiff, lo.toFixed(2), hi.toFixed(2), unit)}　{c.p(stat.p.toFixed(2))}
      </p>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption(unit)}>
        <RuleLine at={0} scale={x} orient="vertical" label={c.zero} />

        {/* the 95% interval whisker */}
        <line x1={x(lo)} x2={x(hi)} y1={rowY} y2={rowY} stroke="var(--cat-8-tx)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={x(lo)} x2={x(lo)} y1={rowY - 7} y2={rowY + 7} stroke="var(--cat-8-tx)" strokeWidth="2" />
        <line x1={x(hi)} x2={x(hi)} y1={rowY - 7} y2={rowY + 7} stroke="var(--cat-8-tx)" strokeWidth="2" />
        <circle cx={x(meanDiff)} cy={rowY} r={4.5} fill="var(--cat-8-tx)" />
        <text x={x(hi) + 8} y={rowY + 3.5} fontSize="10" fill="var(--c-ink-faint)">{c.ciLabel}</text>

        {/* the movable marker */}
        <line x1={x(delta)} x2={x(delta)} y1={margin.top} y2={FH - margin.bottom} stroke="var(--c-accent)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={x(delta)} cy={rowY} r={5} fill="var(--c-paper)" stroke="var(--c-accent)" strokeWidth="1.8" />
        <text x={x(delta)} y={margin.top - 6} textAnchor="middle" fontSize="10" fill="var(--c-accent)">{c.marker}</text>

        <AxisX scale={x} ticks={ticks} format={String} label={c.x(unit)} />
      </ChartFrame>
    </div>
  );
}
