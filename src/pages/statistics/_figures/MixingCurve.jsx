import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Line, Dots, RuleLine } from '../../../components/lab/chart/marks';
import { linearScale, niceTicks } from '../../../components/lab/chart/scale';

/*
 * The exact total variation distances, drawn as one curve per deck size. The
 * numbers are not recomputed here: Bayer-Diaconis needs exact rational
 * arithmetic over 2^(nk), which for 312 cards and 14 shuffles is a few million
 * BigInt multiplications — fine in a build script, not in a reader's tab. They
 * come from the data repository's figures.json and are re-derived on every
 * `npm run verify:sim` there, where they are also checked against Table 3 of
 * the 1992 paper.
 *
 * The dashed rule marks (3/2) log2 n. What the reader is meant to see is that
 * the curve is flat at 1 until it arrives, then halves each step after it.
 */
const COPY = {
  zh: {
    deck: '牌堆張數',
    cutoff: (v) => `1.5 log2 n = ${v}`,
    at: (k, v, pct) => `洗 ${k} 次：距離 ${v}，分辨得出來的機率 ${pct}%`,
    axisY: '全變異距離',
    axisX: '洗牌次數',
    caption: (n, cut) =>
      `${n} 張牌，每一點是洗該次數之後與均勻分佈的全變異距離（精確計算）。虛線在 ${cut} 次，是漸近理論給的位置。距離先貼著 1，越過虛線附近之後每次大約減半，永遠不會等於 0。把它換成賭局：從一副真隨機的牌裡認出洗過的那一副，成功率等於 50% 加上距離的一半。`,
  },
  en: {
    deck: 'deck size',
    cutoff: (v) => `1.5 log2 n = ${v}`,
    at: (k, v, pct) => `after ${k}: distance ${v}, told apart ${pct}% of the time`,
    axisY: 'total variation distance',
    axisX: 'number of shuffles',
    caption: (n, cut) =>
      `${n} cards. Each point is the exact total variation distance to uniform after that many riffle shuffles. The dashed rule sits at ${cut}, the position the asymptotic theory gives. The distance holds at 1, halves roughly once per shuffle past the rule, and never reaches 0. As a game: picking the shuffled deck out from a random one succeeds 50% of the time plus half the distance.`,
  },
};

export default function MixingCurve({
  decks = [52],
  defaultDeck = 52,
  kMax = 14,
  highlightK = 7,
  totalVariation = {},
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [deck, setDeck] = useState(defaultDeck);

  const series = useMemo(() => {
    const values = totalVariation[String(deck)] ?? [];
    return values.slice(0, kMax).map((value, i) => ({ k: i + 1, value }));
  }, [totalVariation, deck, kMax]);

  const points = useMemo(() => series.map((p) => [p.k, p.value]), [series]);
  const cutoff = useMemo(() => (1.5 * Math.log2(deck)).toFixed(2), [deck]);
  const marked = series.find((p) => p.k === highlightK);

  const FW = 560;
  const FH = 300;
  const margin = { top: 18, right: 20, bottom: 42, left: 46 };
  const x = linearScale({ domain: [1, kMax], range: [margin.left, FW - margin.right] });
  const y = linearScale({ domain: [0, 1], range: [FH - margin.bottom, margin.top] });
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-col items-start gap-x-6 gap-y-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2 text-token-sm text-ink-muted">
          <span className="whitespace-nowrap">{c.deck}</span>
          <div className="flex overflow-hidden rounded-token-sm border border-line">
            {decks.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDeck(n)}
                aria-pressed={deck === n}
                className={`px-2.5 py-1 text-token-xs tabular-nums transition-colors duration-fast ${
                  deck === n ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:text-accent'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        {marked ? (
          <p className="text-token-sm tabular-nums text-ink">{c.at(highlightK, marked.value.toFixed(4), (50 + marked.value * 50).toFixed(1))}</p>
        ) : null}
      </div>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.caption(deck, cutoff)}>
        <Grid scale={y} ticks={yTicks} />
        <RuleLine at={Number(cutoff)} scale={x} orient="vertical" label={c.cutoff(cutoff)} />
        <Line points={points} x={x} y={y} cat={2} />
        <Dots points={points} x={x} y={y} cat={2} r={2.6} />
        <AxisY scale={y} ticks={yTicks} format={(v) => v.toFixed(2)} label={c.axisY} />
        <AxisX scale={x} ticks={niceTicks([1, kMax], 7)} format={String} label={c.axisX} />
      </ChartFrame>
    </div>
  );
}
