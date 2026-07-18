import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { RuleLine } from '../../../components/lab/chart/marks';
import { AxisX } from '../../../components/lab/chart/Axis';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';
import { tUpperP, tLowerP, tCritical } from '../_lib/stats';

/*
 * The same fixed batch, now with an equivalence margin the reader sets. The band
 * is the interval [-Delta, +Delta] of differences small enough not to matter;
 * the whisker is the 90% confidence interval — the TOST-dual level, because two
 * one-sided tests at 5% each correspond to the 90% two-sided interval.
 *
 * Equivalence is declared exactly when the whole 90% interval sits inside the
 * band (Berger-Hsu). Everything else on screen — the two one-sided p values and
 * their max — is computed deterministically from the t distribution, no seed.
 * Drag the margin below the interval's half-width and equivalence can no longer
 * be declared.
 */
const DOMAIN = [-6, 6];

const COPY = {
  zh: {
    margin: '等價邊界',
    equivalent: (m, unit) => `邊界 = ${m} ${unit}：90% 區間整個落在邊界內——宣告等價。`,
    notEquivalent: (m, unit) => `邊界 = ${m} ${unit}：90% 區間有一頭伸出邊界——宣告不了等價。`,
    tost: (p1, p2, tostP) => `兩個單尾檢定 p1 = ${p1}、p2 = ${p2}，TOST 的 p = max = ${tostP}`,
    verdictYes: '< 0.05 → 等價',
    verdictNo: '>= 0.05 → 不等價',
    star: (d, unit) => `能宣告等價的最小邊界是 ${d} ${unit}（區間的半寬）。`,
    band: '容許邊界 ±',
    ciLabel: '90% 信賴區間',
    zero: '0',
    x: (unit) => `兩組差異（${unit}）`,
    caption: () =>
      `淡帶是你設定的等價邊界，橫線是 90% 信賴區間（不是 95%：兩個各 5% 的單尾檢定合起來是 90%）。整條橫線縮在帶子裡就宣告等價。把邊界拖到比區間半寬還小，橫線就伸出帶外。固定資料同前一張圖。`,
  },
  en: {
    margin: 'Equivalence margin',
    equivalent: (m, unit) => `margin = ${m} ${unit}: the whole 90% interval sits inside the band — equivalence declared.`,
    notEquivalent: (m, unit) => `margin = ${m} ${unit}: one end of the 90% interval pokes out — equivalence cannot be declared.`,
    tost: (p1, p2, tostP) => `Two one-sided tests p1 = ${p1}, p2 = ${p2}, TOST p = max = ${tostP}`,
    verdictYes: '< 0.05 → equivalent',
    verdictNo: '>= 0.05 → not equivalent',
    star: (d, unit) => `The smallest margin that can declare equivalence is ${d} ${unit} (the interval's half-width).`,
    band: 'margin ±',
    ciLabel: '90% CI',
    zero: '0',
    x: (unit) => `difference between groups (${unit})`,
    caption: () =>
      `The pale band is the equivalence margin you set; the bar is the 90% confidence interval (not 95%: two one-sided tests of 5% each make 90%). Equivalence is declared when the whole bar is inside the band. Drag the margin below the interval's half-width and the bar pokes out. Same fixed data as the previous figure.`,
  },
};

export default function EquivalenceBounds({
  meanDiff = 0.6,
  pooledSD = 8,
  nPerGroup = 120,
  unit = 'mmHg',
  marginDefault = 3,
  alpha = 0.05,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [margin_, setMargin] = useState(marginDefault);

  const stat = useMemo(() => {
    const se = pooledSD * Math.sqrt(2 / nPerGroup);
    const df = 2 * (nPerGroup - 1);
    const tCrit = tCritical(0.9, df);
    const half = tCrit * se;
    const ci = [meanDiff - half, meanDiff + half];
    const deltaStar = Math.max(Math.abs(ci[0]), Math.abs(ci[1]));
    return { se, df, ci, deltaStar };
  }, [meanDiff, pooledSD, nPerGroup]);

  const tost = useMemo(() => {
    const t1 = (meanDiff - -margin_) / stat.se; // H0: diff <= -margin, right tail
    const t2 = (meanDiff - margin_) / stat.se; // H0: diff >= +margin, left tail
    const p1 = tUpperP(t1, stat.df);
    const p2 = tLowerP(t2, stat.df);
    return { p1, p2, tostP: Math.max(p1, p2) };
  }, [meanDiff, margin_, stat.se, stat.df]);

  const [lo, hi] = stat.ci;
  const equivalent = tost.tostP < alpha;

  const FW = 560;
  const FH = 196;
  const chartMargin = { top: 40, right: 28, bottom: 38, left: 28 };
  const rowY = 108;
  const bandTop = 54;
  const bandBottom = FH - chartMargin.bottom;
  const x = linearScale({ domain: DOMAIN, range: [chartMargin.left + 20, FW - chartMargin.right - 20] });
  const ticks = niceTicks(DOMAIN, 6);
  const fmtP = (p) => (p < 0.001 ? p.toExponential(1) : p.toFixed(3));

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <label className="flex flex-wrap items-center gap-3 text-token-sm text-ink-muted">
        <span className="whitespace-nowrap">{c.margin}</span>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={margin_}
          onChange={(e) => setMargin(Number(e.target.value))}
          className="w-52 accent-[var(--c-accent)]"
        />
        <span className="w-16 tabular-nums text-ink">{margin_.toFixed(1)} {unit}</span>
      </label>

      <p className="mt-3 text-token-sm text-ink">
        {equivalent ? c.equivalent(margin_.toFixed(1), unit) : c.notEquivalent(margin_.toFixed(1), unit)}
      </p>
      <p className="mt-1 text-token-sm text-ink-muted">
        {c.tost(fmtP(tost.p1), fmtP(tost.p2), fmtP(tost.tostP))}
        <span className={equivalent ? 'text-accent' : ''}>　{equivalent ? c.verdictYes : c.verdictNo}</span>
      </p>
      <p className="mt-1 text-token-xs text-ink-faint">{c.star(stat.deltaStar.toFixed(2), unit)}</p>

      <ChartFrame width={FW} height={FH} margin={chartMargin} caption={c.caption()}>
        {/* the equivalence band [-margin, +margin] */}
        <rect
          x={x(-margin_)}
          y={bandTop}
          width={x(margin_) - x(-margin_)}
          height={bandBottom - bandTop}
          fill="var(--cat-4-bg)"
        />
        <line x1={x(-margin_)} x2={x(-margin_)} y1={bandTop} y2={bandBottom} stroke="var(--cat-4-tx)" strokeWidth="1" strokeOpacity="0.5" />
        <line x1={x(margin_)} x2={x(margin_)} y1={bandTop} y2={bandBottom} stroke="var(--cat-4-tx)" strokeWidth="1" strokeOpacity="0.5" />
        <text x={x(margin_)} y={bandTop - 5} textAnchor="middle" fontSize="10" fill="var(--cat-4-tx)">{c.band}{margin_.toFixed(1)}</text>

        <RuleLine at={0} scale={x} orient="vertical" label={c.zero} />

        {/* the 90% interval whisker */}
        <line x1={x(lo)} x2={x(hi)} y1={rowY} y2={rowY} stroke="var(--cat-8-tx)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={x(lo)} x2={x(lo)} y1={rowY - 7} y2={rowY + 7} stroke="var(--cat-8-tx)" strokeWidth="2" />
        <line x1={x(hi)} x2={x(hi)} y1={rowY - 7} y2={rowY + 7} stroke="var(--cat-8-tx)" strokeWidth="2" />
        <circle cx={x(meanDiff)} cy={rowY} r={4.5} fill="var(--cat-8-tx)" />
        <text x={x(hi) + 8} y={rowY + 3.5} fontSize="10" fill="var(--c-ink-faint)">{c.ciLabel}</text>

        <AxisX scale={x} ticks={ticks} format={String} label={c.x(unit)} />
      </ChartFrame>
    </div>
  );
}
