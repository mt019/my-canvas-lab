import { useFrame } from './ChartFrame';

/*
 * Axes and gridlines. Colors are fixed to the line/ink tokens on purpose:
 * chart furniture must never compete with the data, so callers get to choose
 * ticks and labels, not the ink.
 */

export function Grid({ scale, ticks, orient = 'horizontal' }) {
  const { inner } = useFrame();
  return (
    <g aria-hidden="true">
      {ticks.map((t) => {
        const p = scale(t);
        return orient === 'horizontal' ? (
          <line key={t} x1={inner.x0} x2={inner.x1} y1={p} y2={p} stroke="var(--c-line-soft)" strokeWidth="1" />
        ) : (
          <line key={t} y1={inner.y0} y2={inner.y1} x1={p} x2={p} stroke="var(--c-line-soft)" strokeWidth="1" />
        );
      })}
    </g>
  );
}

export function AxisY({ scale, ticks, format = String, label }) {
  const { inner } = useFrame();
  return (
    <g>
      {ticks.map((t) => (
        <text
          key={t}
          x={inner.x0 - 6}
          y={scale(t) + 3.5}
          textAnchor="end"
          fontSize="10"
          fill="var(--c-ink-faint)"
        >
          {format(t)}
        </text>
      ))}
      {label ? (
        <text
          transform={`translate(11 ${(inner.y0 + inner.y1) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="10"
          fill="var(--c-ink-faint)"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function AxisX({ scale, ticks, format = String, label, center = false }) {
  const { inner, height } = useFrame();
  const pos = center && scale.center ? scale.center : scale;
  return (
    <g>
      <line x1={inner.x0} x2={inner.x1} y1={inner.y0} y2={inner.y0} stroke="var(--c-line)" strokeWidth="1" />
      {ticks.map((t) => (
        <text
          key={t}
          x={pos(t)}
          y={inner.y0 + 15}
          textAnchor="middle"
          fontSize="10"
          fill="var(--c-ink-faint)"
        >
          {format(t)}
        </text>
      ))}
      {label ? (
        <text
          x={(inner.x0 + inner.x1) / 2}
          y={height - 2}
          textAnchor="middle"
          fontSize="10"
          fill="var(--c-ink-faint)"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
