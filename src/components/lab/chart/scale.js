/*
 * The three functions every hand-drawn SVG on this site was re-deriving.
 * No d3: the site draws its own marks, and all it ever needed from a scale
 * library was a linear map, a band map, and readable tick values.
 */

export function linearScale({ domain, range }) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const scale = (v) => (span === 0 ? r0 : r0 + ((v - d0) / span) * (r1 - r0));
  scale.domain = domain;
  scale.range = range;
  scale.invert = (p) => (r1 === r0 ? d0 : d0 + ((p - r0) / (r1 - r0)) * span);
  return scale;
}

export function bandScale({ domain, range, padding = 0.2 }) {
  const [r0, r1] = range;
  const n = domain.length;
  const step = n === 0 ? 0 : (r1 - r0) / n;
  const bandwidth = step * (1 - padding);
  const scale = (v) => {
    const i = domain.indexOf(v);
    return i < 0 ? r0 : r0 + i * step + (step - bandwidth) / 2;
  };
  scale.bandwidth = () => bandwidth;
  scale.step = () => step;
  scale.center = (v) => scale(v) + bandwidth / 2;
  scale.domain = domain;
  scale.range = range;
  return scale;
}

/* Round tick values a reader would actually write down (1, 2, 2.5, 5, 10 × 10^k). */
export function niceTicks([d0, d1], count = 5) {
  if (d0 === d1) return [d0];
  const raw = (d1 - d0) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const start = Math.ceil(d0 / step) * step;
  const out = [];
  for (let v = start; v <= d1 + step * 1e-6; v += step) {
    out.push(Number(v.toFixed(10))); // kill float dust like 0.30000000000000004
  }
  return out;
}
