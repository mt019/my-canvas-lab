import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX } from '../../../components/lab/chart/Axis';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';

/*
 * A real poll, drawn once. A point estimate on a 0–100% line with its margin of
 * error as a band around it: 45% support, ±4 points, so the band runs 41% to 49%.
 * Nothing here moves — the figure exists only to let the reader see that the
 * newspaper's "±4 points" is literally a segment, the segment the rest of the
 * article is about. Numbers come from figures.json (Gallup 2024, verbatim).
 */
const DOMAIN = [0, 100];

const COPY = {
  zh: {
    estLabel: (e) => `點估計 ${e}%`,
    bandLabel: (lo, hi) => `${lo}% – ${hi}%`,
    moe: (m) => `誤差 ±${m} 個百分點`,
    x: '支持度（%）',
    caption: (e, m, lo, hi, n) =>
      `蓋洛普 2024 年 10 月電訪、隨機抽樣 ${n} 位美國成年人：施政滿意度點估計 ${e}%，抽樣誤差 ±${m} 個百分點（95% 信心水準）。實心點是點估計，橫帶是 ${lo}% 到 ${hi}% 的 95% 信賴區間——報紙緊接著那句「真實支持度有 95% 機率落在裡面」，正是本文要拆的誤讀。`,
  },
  en: {
    estLabel: (e) => `estimate ${e}%`,
    bandLabel: (lo, hi) => `${lo}% – ${hi}%`,
    moe: (m) => `margin of error ±${m} points`,
    x: 'approval (%)',
    caption: (e, m, lo, hi, n) =>
      `Gallup, October 2024, a random sample of ${n} US adults: approval estimated at ${e}%, margin of error ±${m} points (95% level). The filled dot is the estimate, the bar the 95% confidence interval from ${lo}% to ${hi}% — and the newspaper's next line, "a 95% chance the true support lies inside," is the misreading this article takes apart.`,
  },
};

export default function PollErrorBand({
  estimate = 45,
  marginOfError = 4,
  low = 41,
  high = 49,
  n = 1023,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;

  const FW = 560;
  const FH = 168;
  const margin = { top: 44, right: 28, bottom: 38, left: 28 };
  const rowY = 96;
  const x = linearScale({ domain: DOMAIN, range: [margin.left + 12, FW - margin.right - 12] });
  const ticks = niceTicks(DOMAIN, 5);

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption(estimate, marginOfError, low, high, n)}>
        {/* the 95% interval band */}
        <rect
          x={x(low)}
          y={rowY - 10}
          width={x(high) - x(low)}
          height={20}
          rx={4}
          fill="var(--cat-8-tx)"
          fillOpacity="0.16"
        />
        <line x1={x(low)} x2={x(high)} y1={rowY} y2={rowY} stroke="var(--cat-8-tx)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={x(low)} x2={x(low)} y1={rowY - 8} y2={rowY + 8} stroke="var(--cat-8-tx)" strokeWidth="2" />
        <line x1={x(high)} x2={x(high)} y1={rowY - 8} y2={rowY + 8} stroke="var(--cat-8-tx)" strokeWidth="2" />

        {/* endpoint readouts */}
        <text x={x(low)} y={rowY + 26} textAnchor="middle" fontSize="10" fill="var(--c-ink-faint)">{low}%</text>
        <text x={x(high)} y={rowY + 26} textAnchor="middle" fontSize="10" fill="var(--c-ink-faint)">{high}%</text>

        {/* the point estimate */}
        <circle cx={x(estimate)} cy={rowY} r={5} fill="var(--cat-8-tx)" />
        <text x={x(estimate)} y={margin.top - 16} textAnchor="middle" fontSize="11" fill="var(--c-ink)">{c.estLabel(estimate)}</text>
        <text x={x(estimate)} y={margin.top - 3} textAnchor="middle" fontSize="10" fill="var(--c-ink-faint)">{c.moe(marginOfError)}</text>
        <line x1={x(estimate)} x2={x(estimate)} y1={margin.top} y2={rowY - 11} stroke="var(--c-line)" strokeWidth="1" strokeDasharray="3 3" />

        <AxisX scale={x} ticks={ticks} format={(t) => `${t}`} label={c.x} />
      </ChartFrame>
    </div>
  );
}
