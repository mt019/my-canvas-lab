import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX } from '../../../components/lab/chart/Axis';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';

/*
 * The same mean, two intervals side by side. The 95% confidence interval is
 * sampleMean ± z·SE; under a flat prior the 95% credible interval lands on the
 * same limits. The numbers coincide; the readings do not — the left is a long-run
 * property of the procedure, the right an actual 95% posterior probability for the
 * parameter this time. The reader wanted the right one all along.
 *
 * Static and deterministic; no seed. SE is an illustrative scale, not a real
 * study (figures.json marks it illustrativeOnly). The prior-dragging interaction
 * belongs to the sequel on credible intervals.
 */
const COPY = {
  zh: {
    ci: '95% 信賴區間',
    ciRead: '製造它的程序，長期會蓋到真值 95% 的時候。',
    cred: '95% 可信區間（平坦先驗）',
    credRead: '在這個模型與先驗下，參數有 95% 的事後機率就落在這一段。',
    same: '同一筆資料，數字幾乎重合，讀法卻是兩回事。',
    x: '平均數',
    caption:
      '左邊是頻率派的 95% 信賴區間，右邊是平坦先驗下的 95% 可信區間。示範用的例子裡兩段數值重合，但左邊那句話講的是程序長期的覆蓋率，右邊才真的是「參數這一次落在這段的機率」。你原本想問的是右邊那句。（先驗怎麼進來、可信區間怎麼隨它移動，留給續篇。）',
  },
  en: {
    ci: '95% confidence interval',
    ciRead: '95% of the time, the procedure that builds it covers the true value.',
    cred: '95% credible interval (flat prior)',
    credRead: 'Under this model and prior, the parameter has a 95% posterior probability of lying in this segment.',
    same: 'Same data, the numbers nearly coincide, but the readings are two different things.',
    x: 'the mean',
    caption:
      "Left: the frequentist 95% confidence interval. Right: the 95% credible interval under a flat prior. In this illustrative example the two coincide numerically, but the left sentence is about the procedure's long-run coverage and only the right is 'the probability the parameter lies here this time'. The right one is what you meant to ask. (How a prior enters and moves the credible interval is left to the sequel.)",
  },
};

export default function FreqVsBayes({
  sampleMean = 45,
  sampleSE = 2.04,
  zCritical = 1.959963985,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const half = zCritical * sampleSE;
  const lo = sampleMean - half;
  const hi = sampleMean + half;

  const DOMAIN = [sampleMean - 4 * sampleSE, sampleMean + 4 * sampleSE];
  const FW = 560;
  const FH = 200;
  const margin = { top: 24, right: 28, bottom: 38, left: 28 };
  const ciY = 74;
  const credY = 128;
  const x = linearScale({ domain: DOMAIN, range: [margin.left + 16, FW - margin.right - 16] });
  const ticks = niceTicks(DOMAIN, 6);

  const Whisker = ({ y, tone, opacity = 1 }) => (
    <g>
      <line x1={x(lo)} x2={x(hi)} y1={y} y2={y} stroke={tone} strokeWidth="2.5" strokeLinecap="round" strokeOpacity={opacity} />
      <line x1={x(lo)} x2={x(lo)} y1={y - 7} y2={y + 7} stroke={tone} strokeWidth="2" strokeOpacity={opacity} />
      <line x1={x(hi)} x2={x(hi)} y1={y - 7} y2={y + 7} stroke={tone} strokeWidth="2" strokeOpacity={opacity} />
      <circle cx={x(sampleMean)} cy={y} r={4} fill={tone} fillOpacity={opacity} />
      <text x={x(lo)} y={y - 12} textAnchor="middle" fontSize="10" fill="var(--c-ink-faint)">{lo.toFixed(1)}</text>
      <text x={x(hi)} y={y - 12} textAnchor="middle" fontSize="10" fill="var(--c-ink-faint)">{hi.toFixed(1)}</text>
    </g>
  );

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-token-sm border border-line-soft p-3">
          <p className="font-accent text-token-xs uppercase tracking-wide text-ink-faint">{c.ci}</p>
          <p className="mt-1 tabular-nums text-token-base text-ink">[{lo.toFixed(1)}, {hi.toFixed(1)}]</p>
          <p className="mt-1 text-token-sm leading-[1.7] text-ink-muted">{c.ciRead}</p>
        </div>
        <div className="rounded-token-sm border border-line-soft p-3">
          <p className="font-accent text-token-xs uppercase tracking-wide text-ink-faint">{c.cred}</p>
          <p className="mt-1 tabular-nums text-token-base text-ink">[{lo.toFixed(1)}, {hi.toFixed(1)}]</p>
          <p className="mt-1 text-token-sm leading-[1.7] text-ink-muted">{c.credRead}</p>
        </div>
      </div>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption}>
        <text x={margin.left} y={ciY - 22} fontSize="10" fill="var(--c-ink-muted)">{c.ci}</text>
        <Whisker y={ciY} tone="var(--cat-8-tx)" />
        <text x={margin.left} y={credY - 22} fontSize="10" fill="var(--c-ink-muted)">{c.cred}</text>
        <Whisker y={credY} tone="var(--cat-4-tx)" opacity={0.9} />
        <AxisX scale={x} ticks={ticks} format={String} label={c.x} />
      </ChartFrame>
    </div>
  );
}
