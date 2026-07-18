import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX } from '../../../components/lab/chart/Axis';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';

/*
 * Morey et al. 2016's submarine. A 10 m sub lies on the bottom; the rescue hatch
 * is dead centre (coordinate 0, unknown to the rescuer). Bubbles surface uniformly
 * within 5 m either side of the hatch. The frequentist 50% interval from the first
 * two bubbles is CP1 = xbar ± |x1 - x2| / 2 (the span between the bubbles). The
 * flat-prior 50% credible interval is xbar ± (5 - |x1 - x2| / 2), which shrinks as
 * the bubbles spread and refuses impossible positions.
 *
 * Drag the two bubbles. Close together, CP1 is narrow yet uninformative; more than
 * 5 m apart, CP1 is GUARANTEED to contain the hatch — width is not precision. The
 * same legal 50% procedure can be certainly right or almost certainly wrong,
 * depending only on the gap. Analytic and deterministic; no seed. Numbers verbatim
 * from figures.json / sources.json (morey2016).
 */
const DOMAIN = [-6, 6];

const COPY = {
  zh: {
    b1: '氣泡 1',
    b2: '氣泡 2',
    gap: (g) => `兩泡間距 |x1 - x2| = ${g} 公尺`,
    cp1: 'CP1：頻率派 50% 信賴區間',
    cred: '平坦先驗 50% 可信區間',
    hatch: '救援艙門（真值，未知）',
    guaranteed: '間距 > 5 公尺：CP1 保證 100% 含艙門——寬，不等於精確。',
    containsYes: 'CP1 這一段含住了艙門。',
    containsNo: 'CP1 這一段沒有含住艙門。',
    x: '距艙門的位置（公尺）',
    caption:
      '拖動兩個氣泡。深色橫條是頻率派用頭兩個氣泡造的 50% 信賴區間 CP1，淡色橫條是平坦先驗下的 50% 可信區間。兩泡靠近時 CP1 很窄卻幾乎沒資訊；把兩泡拉到相距超過 5 公尺，CP1 必然夾住艙門。同一個合法的 50% 程序，這一段可以確定對、也可以幾乎確定錯。',
  },
  en: {
    b1: 'bubble 1',
    b2: 'bubble 2',
    gap: (g) => `gap |x1 - x2| = ${g} m`,
    cp1: 'CP1: frequentist 50% confidence interval',
    cred: 'flat-prior 50% credible interval',
    hatch: 'rescue hatch (true value, unknown)',
    guaranteed: 'gap > 5 m: CP1 is guaranteed to contain the hatch — width is not precision.',
    containsYes: 'This CP1 segment contains the hatch.',
    containsNo: 'This CP1 segment misses the hatch.',
    x: 'position relative to the hatch (m)',
    caption:
      'Drag the two bubbles. The dark bar is CP1, the frequentist 50% interval from the first two bubbles; the pale bar is the flat-prior 50% credible interval. Close bubbles make CP1 narrow yet nearly uninformative; pull them more than 5 m apart and CP1 must straddle the hatch. The same legal 50% procedure can be certainly right or almost certainly wrong.',
  },
};

export default function Submarine({
  halfWidth = 5,
  bubble1Default = -1.2,
  bubble2Default = 1.2,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [x1, setX1] = useState(bubble1Default);
  const [x2, setX2] = useState(bubble2Default);

  const FW = 560;
  const FH = 220;
  const margin = { top: 30, right: 24, bottom: 38, left: 24 };
  const x = linearScale({ domain: DOMAIN, range: [margin.left + 10, FW - margin.right - 10] });
  const ticks = niceTicks(DOMAIN, 6);

  const hullY = 74;
  const cp1Y = 132;
  const credY = 162;
  const bubbleY = hullY - 24;

  const stat = useMemo(() => {
    const xbar = (x1 + x2) / 2;
    const gap = Math.abs(x1 - x2);
    const cp1 = [xbar - gap / 2, xbar + gap / 2];
    const credHalf = Math.max(0, halfWidth - gap / 2);
    const cred = [xbar - credHalf, xbar + credHalf];
    const contains = cp1[0] <= 0 && 0 <= cp1[1];
    return { xbar, gap, cp1, cred, contains, guaranteed: gap > halfWidth };
  }, [x1, x2, halfWidth]);

  // Drag a bubble: capture the pointer on the grabbed handle, map clientX to a
  // data coordinate through the owning SVG's rendered box, clamp to the bubble's
  // uniform range. Pointer capture means the drag keeps working past the handle.
  const startDrag = (setter) => (evt) => {
    const svg = evt.currentTarget.ownerSVGElement;
    evt.currentTarget.setPointerCapture?.(evt.pointerId);
    const move = (e) => {
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * FW;
      setter(Math.max(-halfWidth, Math.min(halfWidth, x.invert(px))));
    };
    move(evt);
    evt.currentTarget.onpointermove = move;
    const end = () => {
      evt.currentTarget.onpointermove = null;
      evt.currentTarget.onpointerup = null;
    };
    evt.currentTarget.onpointerup = end;
  };

  const Bubble = ({ id, value, setter }) => (
    <g className="cursor-ew-resize touch-none" onPointerDown={startDrag(setter)}>
      <line x1={x(value)} x2={x(value)} y1={bubbleY} y2={hullY - 6} stroke="var(--c-line)" strokeWidth="1" strokeDasharray="2 2" />
      {/* a generous transparent hit target around the visible handle */}
      <circle cx={x(value)} cy={bubbleY} r={14} fill="transparent" />
      <circle cx={x(value)} cy={bubbleY} r={7} fill="var(--c-paper)" stroke="var(--c-accent)" strokeWidth="2" />
      <text x={x(value)} y={bubbleY - 12} textAnchor="middle" fontSize="9" fill="var(--c-accent)">{id === 1 ? c.b1 : c.b2}</text>
    </g>
  );

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <p className="text-token-sm text-ink">
        {c.gap(stat.gap.toFixed(2))}
        <span className="text-ink-muted">　{stat.contains ? c.containsYes : c.containsNo}</span>
      </p>
      <p className="mt-1 min-h-[1.25rem] text-token-sm text-accent">{stat.guaranteed ? c.guaranteed : ''}</p>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption}>
        {/* the hull, 10 m long, hatch dead centre at 0 */}
        <rect x={x(-halfWidth)} y={hullY - 6} width={x(halfWidth) - x(-halfWidth)} height={12} rx={6} fill="var(--cat-8-tx)" fillOpacity="0.14" stroke="var(--cat-8-tx)" strokeOpacity="0.4" strokeWidth="1" />
        <line x1={x(0)} x2={x(0)} y1={hullY - 12} y2={credY + 10} stroke="var(--c-ink-muted)" strokeWidth="1.25" strokeDasharray="4 3" />
        <text x={x(0)} y={hullY + 26} textAnchor="middle" fontSize="9" fill="var(--c-ink-muted)">{c.hatch}</text>

        {/* CP1: frequentist 50% interval */}
        <line x1={x(stat.cp1[0])} x2={x(stat.cp1[1])} y1={cp1Y} y2={cp1Y} stroke="var(--cat-8-tx)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={x(stat.cp1[0])} x2={x(stat.cp1[0])} y1={cp1Y - 6} y2={cp1Y + 6} stroke="var(--cat-8-tx)" strokeWidth="2" />
        <line x1={x(stat.cp1[1])} x2={x(stat.cp1[1])} y1={cp1Y - 6} y2={cp1Y + 6} stroke="var(--cat-8-tx)" strokeWidth="2" />
        <text x={x(Math.max(stat.cp1[1], 0)) + 8} y={cp1Y + 3.5} fontSize="9" fill="var(--c-ink-faint)">{c.cp1}</text>

        {/* flat-prior 50% credible interval */}
        <line x1={x(stat.cred[0])} x2={x(stat.cred[1])} y1={credY} y2={credY} stroke="var(--cat-4-tx)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.85" />
        <line x1={x(stat.cred[0])} x2={x(stat.cred[0])} y1={credY - 6} y2={credY + 6} stroke="var(--cat-4-tx)" strokeWidth="2" strokeOpacity="0.85" />
        <line x1={x(stat.cred[1])} x2={x(stat.cred[1])} y1={credY - 6} y2={credY + 6} stroke="var(--cat-4-tx)" strokeWidth="2" strokeOpacity="0.85" />
        <text x={x(Math.max(stat.cred[1], stat.cp1[1], 0)) + 8} y={credY + 3.5} fontSize="9" fill="var(--c-ink-faint)">{c.cred}</text>

        <Bubble id={1} value={x1} setter={setX1} />
        <Bubble id={2} value={x2} setter={setX2} />

        <AxisX scale={x} ticks={ticks} format={String} label={c.x} />
      </ChartFrame>
    </div>
  );
}
