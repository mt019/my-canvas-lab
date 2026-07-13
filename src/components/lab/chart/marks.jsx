import { useFrame } from './ChartFrame';

/*
 * Data marks. Large filled areas stay light — deep ink is for strokes, text and
 * small marks, never for a big block of pixels — and they carry a categorical
 * slot (1–8), never a color, so there is no fill prop to abuse.
 */

const slot = (n) => {
  const i = Math.min(8, Math.max(1, n));
  return { tx: `var(--cat-${i}-tx)`, bg: `var(--cat-${i}-bg)` };
};

/*
 * Restraint is the default: bars carry one quiet tone, and a second tone appears
 * only on the bars the reader is meant to look at. A chart where every bar has
 * its own color is a chart with nothing to say.
 *
 * A bar is a tint of its own ink, not a near-white box with a hairline around it.
 * The wireframe version — pale fill plus 1px outline — is fine at chip size and
 * reads as an empty placeholder once it is 200px tall, which is why the fill here
 * is the ink color at low opacity: the hue survives, the area still stays light.
 * Corners get a small radius, the way Notion and GitHub draw theirs; hard 90°
 * corners on a thin outline are what make a chart look like a spreadsheet.
 */
export function Bars({ data, x, y, y0, cat = 8, highlightCat = 6, highlight = () => false, radius = 3, onHover }) {
  const { inner } = useFrame();
  const base = y0 ?? inner.y0;
  const w = x.bandwidth ? x.bandwidth() : 8;
  const tone = slot(cat);
  const hot = slot(highlightCat);

  return (
    <g>
      {data.map((d, i) => {
        const top = y(d.value);
        const on = highlight(d, i);
        const c = on ? hot : tone;
        const h = Math.abs(base - top);
        return (
          <rect
            key={d.key ?? i}
            x={x(d.key ?? i)}
            y={Math.min(top, base)}
            width={w}
            height={h}
            rx={Math.min(radius, w / 2, h)}
            fill={c.tx}
            fillOpacity={on ? 0.85 : 0.22}
            stroke={c.tx}
            strokeOpacity={on ? 0 : 0.35}
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
