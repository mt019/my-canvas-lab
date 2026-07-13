import { useFrame } from './ChartFrame';

/*
 * Data marks. The one rule they enforce: a large filled area is always a
 * near-white wash with a thin ink keyline of the same hue — deep ink is for
 * strokes, text and small marks, never for a big block of pixels. So <Bars>
 * and <AreaWash> take a categorical slot (1–8), not a color; there is no fill
 * prop to abuse.
 */

const slot = (n) => {
  const i = Math.min(8, Math.max(1, n));
  return { tx: `var(--cat-${i}-tx)`, bg: `var(--cat-${i}-bg)` };
};

export function Bars({ data, x, y, y0, cat = 1, highlight = () => false, onHover }) {
  const { inner } = useFrame();
  const base = y0 ?? inner.y0;
  const w = x.bandwidth ? x.bandwidth() : 8;
  const tone = slot(cat);
  const hot = slot(6);

  return (
    <g>
      {data.map((d, i) => {
        const top = y(d.value);
        const on = highlight(d, i);
        const c = on ? hot : tone;
        return (
          <rect
            key={d.key ?? i}
            x={x(d.key ?? i)}
            y={Math.min(top, base)}
            width={w}
            height={Math.abs(base - top)}
            fill={c.bg}
            stroke={c.tx}
            strokeWidth="1"
            onMouseEnter={onHover ? () => onHover(d, i) : undefined}
            onMouseLeave={onHover ? () => onHover(null, -1) : undefined}
          />
        );
      })}
    </g>
  );
}

export function Line({ points, x, y, cat = 2, width = 1.8, dashed = false }) {
  const d = points
    .map(([px, py], i) => `${i ? 'L' : 'M'}${x(px).toFixed(1)} ${y(py).toFixed(1)}`)
    .join(' ');
  return (
    <path
      d={d}
      fill="none"
      stroke={slot(cat).tx}
      strokeWidth={width}
      strokeDasharray={dashed ? '4 3' : undefined}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

export function AreaWash({ points, x, y, cat = 2, y0 }) {
  const { inner } = useFrame();
  const base = y0 ?? inner.y0;
  if (points.length === 0) return null;
  const top = points.map(([px, py], i) => `${i ? 'L' : 'M'}${x(px).toFixed(1)} ${y(py).toFixed(1)}`).join(' ');
  const d = `${top} L${x(points[points.length - 1][0]).toFixed(1)} ${base} L${x(points[0][0]).toFixed(1)} ${base} Z`;
  return <path d={d} fill={slot(cat).bg} stroke="none" />;
}

export function Dots({ points, x, y, cat = 2, r = 3 }) {
  const tone = slot(cat);
  return (
    <g>
      {points.map(([px, py], i) => (
        <circle
          key={i}
          cx={x(px)}
          cy={y(py)}
          r={r}
          fill="var(--c-paper)"
          stroke={tone.tx}
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
}

/* A reference line the reader is meant to compare against — an alpha
   threshold, a null value, an expected level. Dashed and labelled, so it
   never reads as data. */
export function RuleLine({ at, scale, orient = 'vertical', label, tone = 'var(--c-pop)' }) {
  const { inner } = useFrame();
  const p = scale(at);
  const vertical = orient === 'vertical';
  return (
    <g>
      <line
        x1={vertical ? p : inner.x0}
        x2={vertical ? p : inner.x1}
        y1={vertical ? inner.y1 : p}
        y2={vertical ? inner.y0 : p}
        stroke={tone}
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      {label ? (
        <text
          x={vertical ? p + 4 : inner.x1}
          y={vertical ? inner.y1 + 10 : p - 4}
          textAnchor={vertical ? 'start' : 'end'}
          fontSize="10"
          fill={tone}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
