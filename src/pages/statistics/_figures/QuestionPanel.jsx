import { useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Line, Dots } from '../../../components/lab/chart/marks';
import { linearScale } from '../../../components/lab/chart/scale';

/*
 * Table 1 of Assaf-Diaconis-Soundararajan (2011): five questions about the same
 * deck, one separation-distance curve each. The point of the figure is the
 * horizontal gap between the curves — the full order needs about twice as many
 * shuffles as the colours — so all five are drawn together and the legend
 * doubles as a filter for reading one at a time.
 *
 * Row labels and values come from the data repository; nothing here knows what
 * blackjack is.
 */
const COPY = {
  zh: {
    axisY: '分離距離',
    axisX: '洗牌次數',
    exact: '精確計算',
    approx: '近似公式',
    caption:
      '同一副 52 張牌、同一套洗牌，五種問法各一條線。點按圖例只看其中幾條。分離距離與前一張圖的全變異距離定義不同，兩張圖的縱軸不能互相比較；這張圖內的五條線可以。',
  },
  en: {
    axisY: 'separation distance',
    axisX: 'number of shuffles',
    exact: 'exact',
    approx: 'rule of thumb',
    caption:
      'One 52-card deck, one shuffling model, five questions. Click a legend entry to isolate a curve. Separation distance is defined differently from the total variation of the previous figure, so the two vertical axes do not compare; the five curves here do.',
  },
};

export default function QuestionPanel({ k = [], rows = [], lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
  const [only, setOnly] = useState(null);

  const FW = 560;
  const FH = 300;
  const margin = { top: 18, right: 20, bottom: 42, left: 46 };
  const x = linearScale({ domain: [k[0] ?? 1, k[k.length - 1] ?? 12], range: [margin.left, FW - margin.right] });
  const y = linearScale({ domain: [0, 1], range: [FH - margin.bottom, margin.top] });
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const labelOf = (row) => (lang === 'en' ? row.en?.label ?? row.label : row.label);

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-token-sm">
        {rows.map((row, i) => {
          const active = only === null || only === row.id;
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setOnly(only === row.id ? null : row.id)}
                aria-pressed={only === row.id}
                className={`flex items-center gap-2 transition-colors duration-fast ${
                  active ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-0 w-5 border-t-2"
                  style={{ borderColor: `var(--cat-${(i % 8) + 1}-tx)`, opacity: active ? 1 : 0.35 }}
                />
                <span className="whitespace-nowrap">{labelOf(row)}</span>
                <span className="text-token-xs text-ink-faint">{row.exact ? c.exact : c.approx}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption}>
        <Grid scale={y} ticks={yTicks} />
        {rows.map((row, i) => {
          const dim = only !== null && only !== row.id;
          const points = row.values.map((v, j) => [k[j], v]);
          return (
            <g key={row.id} opacity={dim ? 0.16 : 1}>
              <Line points={points} x={x} y={y} cat={(i % 8) + 1} dashed={!row.exact} />
              {dim ? null : <Dots points={points} x={x} y={y} cat={(i % 8) + 1} r={2.4} />}
            </g>
          );
        })}
        <AxisY scale={y} ticks={yTicks} format={(v) => v.toFixed(2)} label={c.axisY} />
        <AxisX scale={x} ticks={k} format={String} label={c.axisX} />
      </ChartFrame>
    </div>
  );
}
