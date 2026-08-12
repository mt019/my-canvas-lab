import { useMemo, useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { AxisX, AxisY, Grid } from '../../../components/lab/chart/Axis';
import { Line, Dots, RuleLine } from '../../../components/lab/chart/marks';
import { linearScale } from '../../../components/lab/chart/scale';

/*
 * The mechanism figure: a real Gilbert-Shannon-Reeds run, seeded, with each card
 * tinted by the rising sequence it belongs to. This one does compute in the
 * browser, because watching the runs double — 1, 2, 4, 8, 15, 22, 25 — is the
 * whole argument for why four shuffles cannot look random.
 *
 * The PRNG and the shuffle are copied verbatim from the data repository's
 * verify-simulation-reference.mjs so the counts here match
 * data/reference/card-shuffling.json exactly at seed 20260812.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gsrShuffle(deck, rng) {
  let cut = 0;
  for (let i = 0; i < deck.length; i += 1) if (rng() < 0.5) cut += 1;
  const left = deck.slice(0, cut);
  const right = deck.slice(cut);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    const a = left.length - i;
    const b = right.length - j;
    if (a === 0) out.push(right[j++]);
    else if (b === 0) out.push(left[i++]);
    else if (rng() < a / (a + b)) out.push(left[i++]);
    else out.push(right[j++]);
  }
  return out;
}

/* Which rising sequence each card belongs to: walk the values in order and start
   a new run wherever the next value sits earlier in the deck than the current
   one. Returns the run index per position, so the deck can be tinted. */
function labelRuns(deck) {
  const position = new Array(deck.length);
  deck.forEach((value, index) => { position[value] = index; });
  const runOf = new Array(deck.length);
  let run = 0;
  for (let v = 0; v < deck.length; v += 1) {
    if (v > 0 && position[v] < position[v - 1]) run += 1;
    runOf[position[v]] = run;
  }
  return { runOf, count: run + 1 };
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const faceOf = (v) => `${RANKS[v % 13]}${SUITS[Math.floor(v / 13)]}`;

const COPY = {
  zh: {
    shuffles: '洗牌次數',
    runs: (r) => `目前 ${r} 段遞增序列`,
    ceiling: (k, c) => `洗 ${k} 次的上限是 ${c} 段`,
    uniformMean: (m, sd) => `均勻隨機的牌堆平均 ${m} 段（標準差 ${sd}）`,
    axisY: '遞增序列的段數',
    axisX: '洗牌次數',
    uniformRule: '均勻隨機的平均',
    deckCaption:
      '一副由 A 到 K、黑紅方梅依序排好的牌，由上而下讀。同一段遞增序列的牌用同一種底色；洗一次多一組顏色，洗到第七次之後段數就停在二十幾，再洗下去看不出差別。',
    chartCaption: (m) =>
      `段數隨洗牌次數變化。細虛線是均勻隨機牌堆的平均 ${m} 段：段數爬到這個高度附近就停住，這正是「數段數」這個檢驗失效的時候。`,
  },
  en: {
    shuffles: 'shuffles',
    runs: (r) => `${r} rising sequences`,
    ceiling: (k, c) => `the ceiling after ${k} shuffles is ${c}`,
    uniformMean: (m, sd) => `a uniformly random deck averages ${m} (sd ${sd})`,
    axisY: 'rising sequences',
    axisX: 'shuffles',
    uniformRule: 'uniform average',
    deckCaption:
      'A deck sorted A to K in spades, hearts, diamonds, clubs, read from the top. Cards in the same rising sequence share a tint. Each shuffle brings another set of tints; past the seventh the count settles in the mid-twenties and further shuffles look alike.',
    chartCaption: (m) =>
      `Rising sequences against shuffles. The dashed rule is the uniform average of ${m}: once the count reaches it, counting runs stops telling the two decks apart.`,
  },
};

export default function RisingSequences({
  n = 52,
  kMax = 10,
  defaultK = 3,
  seed = 20260812,
  uniformMeanRising = 26.5,
  uniformSdRising = 2.1,
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [k, setK] = useState(defaultK);

  // The whole run is generated once: shuffle j is shuffle j-1 shuffled again, so
  // moving the slider must not restart the stream from a different point.
  const history = useMemo(() => {
    const rng = mulberry32(seed);
    let deck = Array.from({ length: n }, (_, i) => i);
    const frames = [{ deck, ...labelRuns(deck) }];
    for (let step = 1; step <= kMax; step += 1) {
      deck = gsrShuffle(deck, rng);
      frames.push({ deck, ...labelRuns(deck) });
    }
    return frames;
  }, [n, kMax, seed]);

  const frame = history[k];
  const counts = useMemo(() => history.map((f, i) => [i, f.count]), [history]);

  const FW = 560;
  const FH = 230;
  const margin = { top: 16, right: 20, bottom: 42, left: 44 };
  const x = linearScale({ domain: [0, kMax], range: [margin.left, FW - margin.right] });
  const y = linearScale({ domain: [0, 32], range: [FH - margin.bottom, margin.top] });
  const yTicks = [0, 8, 16, 24, 32];

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-col items-start gap-x-6 gap-y-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex items-center gap-2 text-token-sm text-ink-muted">
          <span className="whitespace-nowrap">{c.shuffles}</span>
          <input
            type="range"
            min="0"
            max={kMax}
            step="1"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="canvas-range w-36 sm:w-44"
          />
          <span className="w-6 shrink-0 whitespace-nowrap tabular-nums text-ink">{k}</span>
        </label>
        <p className="text-token-sm tabular-nums text-ink">{c.runs(frame.count)}</p>
        <p className="text-token-sm tabular-nums text-ink-muted">{c.ceiling(k, Math.min(2 ** k, n))}</p>
      </div>

      <figure className="mt-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.3rem,1fr))] gap-1">
          {frame.deck.map((value, index) => {
            const tone = `var(--cat-${(frame.runOf[index] % 8) + 1}-tx)`;
            return (
              <span
                key={index}
                className="rounded-token-sm px-1 py-1 text-center text-token-xs tabular-nums"
                style={{
                  color: tone,
                  backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)`,
                }}
              >
                {faceOf(value)}
              </span>
            );
          })}
        </div>
        <figcaption className="mt-2 text-token-xs leading-relaxed text-ink-faint">{c.deckCaption}</figcaption>
      </figure>

      <ChartFrame width={FW} height={FH} margin={margin} caption={c.chartCaption(uniformMeanRising)}>
        <Grid scale={y} ticks={yTicks} />
        <RuleLine at={uniformMeanRising} scale={y} orient="horizontal" label={c.uniformRule} />
        <Line points={counts} x={x} y={y} cat={2} />
        <Dots points={counts} x={x} y={y} cat={2} r={2.6} />
        <AxisY scale={y} ticks={yTicks} format={String} label={c.axisY} />
        <AxisX scale={x} ticks={Array.from({ length: kMax + 1 }, (_, i) => i)} format={String} label={c.axisX} />
      </ChartFrame>

      <p className="mt-1 text-token-xs text-ink-faint">{c.uniformMean(uniformMeanRising, Number(uniformSdRising).toFixed(2))}</p>
    </div>
  );
}
