import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX } from '../../../components/lab/chart/Axis';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';

/*
 * A 95% confidence set for the ratio of two normal means (Fieller). The set is
 * the r solving A r^2 + B r + C <= 0, with A = b^2 - z^2 Vb, B = -2 a b (Cov = 0),
 * C = a^2 - z^2 Va. As the denominator's signal-to-noise ratio falls, A crosses
 * zero and the parabola flips: a finite interval becomes the complement of an
 * interval (middle excised, two infinite rays), then the whole real line. A legal
 * 95% procedure that must, with positive probability, return "any value at all" —
 * a zero-information answer, and not an error (Casella-Berger 9.5.3).
 *
 * Analytic and deterministic; no seed. Constants from figures.json.
 */
const DOMAIN = [-10, 10];

const COPY = {
  zh: {
    snr: '分母的訊噪比',
    shapeInterval: '95% 信賴集：一段有限區間',
    shapeComplement: '95% 信賴集：一段區間的補集（中間挖空、兩端無限）',
    shapeWhole: '95% 信賴集：整條實數線——任何比值都相容，資訊量為零',
    shapeEmpty: '95% 信賴集：空集',
    ratio: (r) => `點估計 比值 = ${r}`,
    x: '兩平均數的比值',
    caption:
      '拉滑桿把分母的訊噪比（分母平均相對於它的標準誤）壓低。信賴集先是一段有限區間，接著中間被挖空、剩兩端無限（箭頭表示延伸到無限），最後脹成整條實數線。這不是算錯，是這個合法程序為了守住 95% 覆蓋率、在分母可能為零時必須付的代價。',
  },
  en: {
    snr: "denominator's signal-to-noise ratio",
    shapeInterval: '95% set: a single finite interval',
    shapeComplement: '95% set: the complement of an interval (middle excised, two infinite rays)',
    shapeWhole: '95% set: the whole real line — every ratio is compatible, zero information',
    shapeEmpty: '95% set: the empty set',
    ratio: (r) => `point estimate ratio = ${r}`,
    x: 'ratio of the two means',
    caption:
      "Drag the slider to lower the denominator's signal-to-noise ratio (its mean relative to its standard error). The set is first a finite interval, then has its middle excised leaving two infinite rays (arrows run off to infinity), then swells to the whole real line. Not a computation error — the price this legal procedure pays to hold 95% coverage when the denominator might be zero.",
  },
};

export default function Fieller({
  numeratorEstimate = 2.0,
  numeratorSE = 1.0,
  denominatorSE = 1.0,
  denominatorSNRDefault = 2.0,
  zCritical = 1.959963985,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [snr, setSnr] = useState(denominatorSNRDefault);

  const set = useMemo(() => {
    const a = numeratorEstimate;
    const Va = numeratorSE * numeratorSE;
    const Vb = denominatorSE * denominatorSE;
    const b = snr * denominatorSE; // signal-to-noise ratio drives the denominator mean
    const z2 = zCritical * zCritical;
    const A = b * b - z2 * Vb;
    const B = -2 * (a * b); // Cov = 0
    const C = a * a - z2 * Va;
    const disc = B * B - 4 * A * C;
    const ratio = a / b;

    // Segments (in ratio units) to shade, and a shape label. Infinite ends are
    // marked so the drawing can show arrows instead of a hard stop.
    if (Math.abs(A) < 1e-9) {
      // linear boundary; treat as a ray. Rare — the slider does not land here.
      const r = -C / B;
      return B < 0
        ? { shape: c.shapeComplement, segments: [{ lo: r, hi: Infinity }] }
        : { shape: c.shapeComplement, segments: [{ lo: -Infinity, hi: r }] };
    }
    if (disc < 0) {
      return A < 0
        ? { shape: c.shapeWhole, segments: [{ lo: -Infinity, hi: Infinity }], ratio }
        : { shape: c.shapeEmpty, segments: [], ratio };
    }
    const root1 = (-B - Math.sqrt(disc)) / (2 * A);
    const root2 = (-B + Math.sqrt(disc)) / (2 * A);
    const lo = Math.min(root1, root2);
    const hi = Math.max(root1, root2);
    if (A > 0) return { shape: c.shapeInterval, segments: [{ lo, hi }], ratio, roots: [lo, hi] };
    return { shape: c.shapeComplement, segments: [{ lo: -Infinity, hi: lo }, { lo: hi, hi: Infinity }], ratio, roots: [lo, hi] };
  }, [snr, numeratorEstimate, numeratorSE, denominatorSE, zCritical, c]);

  const FW = 560;
  const FH = 172;
  const margin = { top: 40, right: 28, bottom: 38, left: 28 };
  const rowY = 92;
  const x = linearScale({ domain: DOMAIN, range: [margin.left + 16, FW - margin.right - 16] });
  const ticks = niceTicks(DOMAIN, 6);

  const clampX = (v) => Math.max(DOMAIN[0], Math.min(DOMAIN[1], v));

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <label className="flex flex-wrap items-center gap-3 text-token-sm text-ink-muted">
        <span className="whitespace-nowrap">{c.snr}</span>
        <input
          type="range"
          min="0.2"
          max="4"
          step="0.05"
          value={snr}
          onChange={(e) => setSnr(Number(e.target.value))}
          className="w-52 accent-[var(--c-accent)]"
        />
        <span className="w-12 shrink-0 whitespace-nowrap tabular-nums text-ink">{snr.toFixed(2)}</span>
      </label>

      <p className="mt-3 text-token-sm text-ink">{set.shape}</p>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption}>
        <line x1={x(DOMAIN[0])} x2={x(DOMAIN[1])} y1={rowY} y2={rowY} stroke="var(--c-line)" strokeWidth="1" />

        {set.segments.map((seg, i) => {
          const leftInf = seg.lo === -Infinity;
          const rightInf = seg.hi === Infinity;
          const xa = x(clampX(leftInf ? DOMAIN[0] : seg.lo));
          const xb = x(clampX(rightInf ? DOMAIN[1] : seg.hi));
          return (
            <g key={i}>
              <rect x={xa} y={rowY - 9} width={Math.max(0, xb - xa)} height={18} rx={3} fill="var(--cat-8-tx)" fillOpacity="0.18" />
              <line x1={xa} x2={xb} y1={rowY} y2={rowY} stroke="var(--cat-8-tx)" strokeWidth="2.5" strokeLinecap="round" />
              {!leftInf ? <line x1={xa} x2={xa} y1={rowY - 8} y2={rowY + 8} stroke="var(--cat-8-tx)" strokeWidth="2" /> : (
                <path d={`M ${xa + 8} ${rowY - 5} L ${xa} ${rowY} L ${xa + 8} ${rowY + 5}`} fill="none" stroke="var(--cat-8-tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {!rightInf ? <line x1={xb} x2={xb} y1={rowY - 8} y2={rowY + 8} stroke="var(--cat-8-tx)" strokeWidth="2" /> : (
                <path d={`M ${xb - 8} ${rowY - 5} L ${xb} ${rowY} L ${xb - 8} ${rowY + 5}`} fill="none" stroke="var(--cat-8-tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
          );
        })}

        {/* the point estimate ratio, when it is on-screen */}
        {set.ratio != null && Number.isFinite(set.ratio) && set.ratio >= DOMAIN[0] && set.ratio <= DOMAIN[1] ? (
          <>
            <line x1={x(set.ratio)} x2={x(set.ratio)} y1={margin.top} y2={rowY - 10} stroke="var(--c-accent)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(set.ratio)} cy={rowY} r={4} fill="var(--c-accent)" />
            <text x={x(set.ratio)} y={margin.top - 6} textAnchor="middle" fontSize="10" fill="var(--c-accent)">{c.ratio(set.ratio.toFixed(2))}</text>
          </>
        ) : null}

        <AxisX scale={x} ticks={ticks} format={String} label={c.x} />
      </ChartFrame>
    </div>
  );
}
