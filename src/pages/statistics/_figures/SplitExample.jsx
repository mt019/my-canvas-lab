import { useMemo, useState } from 'react';
import Math from '../../../components/lab/Math';

/*
 * The worked example for the rising-sequence bound, stepped by hand: cut, riffle,
 * cut again, riffle again. The full 52 cards, so the figure matches the deck the
 * article talks about — the cards keep their order inside each packet, so one
 * shuffle leaves at most two rising sequences and the next splits each in two.
 *
 * The two arrangements come from the data repository (figures.json, id
 * split-example), where a note records the constrained draw that produced them
 * and verifies they are legal riffles whose run counts walk the ceiling exactly:
 * 1, 2, 4, with every split landing on a quarter so the runs can be read off
 * the numbers. Nothing here is sampled at runtime; the point of this figure is
 * the bound, not the distribution, and a fixed example is the honest way to
 * show a bound.
 *
 * Cards move between steps by CSS transform on absolutely-positioned tiles, so
 * the reader can see each packet slide apart and interleave without any card
 * passing another card from its own packet. A deck too wide for one row wraps
 * onto two (26 per row for 52); the packets after a cut are one row each, above
 * and below.
 */
const COPY = {
  zh: {
    prev: '上一步',
    next: '下一步',
    stepOf: (i, n) => `步驟 ${i}/${n}`,
    steps: (cut, n) => [
      `${n} 張牌照 1 到 ${n} 排好，整副是一段遞增序列。`,
      `切牌：分成 1–${cut}（上）與 ${cut + 1}–${n}（下）兩堆，每堆內部照舊由小到大。`,
      `交錯落下：兩堆的牌混進同一副，但同色的牌前後次序不變，1 到 ${cut} 的位置仍然遞增，${cut + 1} 到 ${n} 也是。整副拆成兩段遞增序列。`,
      '洗第二次，先切牌：把剛才的排列分成兩堆，每一堆都橫跨原來的兩種顏色。',
      <>再交錯落下：原來的每一段各被對半拆成兩段（深淺各一），共四段。洗 <Math tex="k" /> 次最多 <Math tex="2^k" /> 段。</>,
    ],
  },
  en: {
    prev: 'Back',
    next: 'Next',
    stepOf: (i, n) => `Step ${i}/${n}`,
    steps: (cut, n) => [
      `${n} cards in order, 1 to ${n}: the whole deck is one rising sequence.`,
      `Cut: two packets, 1–${cut} above and ${cut + 1}–${n} below, each still ascending inside.`,
      `Riffle: the packets interleave into one deck, but cards of the same colour keep their order. The positions of 1 to ${cut} still ascend, and so do ${cut + 1} to ${n}: two rising sequences.`,
      'Second shuffle, cut first: the arrangement splits into two packets, and each packet spans both colours.',
      <>Riffle again: each of the two runs splits in half, one dark and one light shade — four rising sequences. After <Math tex="k" /> shuffles, at most <Math tex="2^k" />.</>,
    ],
  },
};

export default function SplitExample({
  n = 52,
  cut1 = 26,
  order1 = [],
  cut2 = 26,
  order2 = [],
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [step, setStep] = useState(0);
  const steps = useMemo(() => c.steps(cut1, n), [c, cut1, n]);
  const last = steps.length - 1;

  // A short deck sits in one row; 52 wraps at 26. The assembled deck occupies
  // the middle rows, the packets after a cut one row each above and below.
  const perRow = n <= 16 ? n : window.Math.ceil(n / 2);
  const deckRows = window.Math.ceil(n / perRow);
  // When the row is wide enough, the lower packet keeps its horizontal position
  // (cards slide apart vertically at the cut); otherwise both packets align left.
  const pileShift = perRow - cut1 >= cut1 ? cut1 : 0;

  // Per step, where every card sits, keyed by card value so a tile's identity
  // survives every rearrangement and CSS can animate it.
  const layouts = useMemo(() => {
    const sorted = Array.from({ length: n }, (_, i) => i + 1);
    const slotDeck = (deck) => Object.fromEntries(deck.map((v, i) => [
      v, { row: 1 + window.Math.floor(i / perRow), col: i % perRow },
    ]));
    const slotPiles = (deck, cut) => ({
      ...Object.fromEntries(deck.slice(0, cut).map((v, i) => [v, { row: 0, col: i }])),
      ...Object.fromEntries(deck.slice(cut).map((v, i) => [v, { row: deckRows + 1, col: pileShift + i }])),
    });
    return [
      slotDeck(sorted),
      slotPiles(sorted, cut1),
      slotDeck(order1),
      slotPiles(order1, cut2),
      slotDeck(order2),
    ];
  }, [n, cut1, order1, cut2, order2, perRow, deckRows, pileShift]);

  // Colour by the first cut for the whole first shuffle; on the last step each
  // half fades into its two halves — the split the bound is about.
  const toneOf = (value, s) => {
    if (s === 0) return { tone: 'var(--c-ink-muted)', mix: 10 };
    // Plum against blue (cat-1 / cat-2): the two packets have to stay tellable
    // apart at a pale wash, and the neighbouring reds in the palette are not.
    const cat = value <= cut1 ? 'var(--cat-1-tx)' : 'var(--cat-2-tx)';
    if (s < 4) return { tone: cat, mix: 16 };
    const firstHalfOfRun = value <= cut1 ? value <= cut1 / 2 : value <= cut1 + (n - cut1) / 2;
    return { tone: cat, mix: firstHalfOfRun ? 34 : 12 };
  };

  const layout = layouts[step];
  const values = Array.from({ length: n }, (_, i) => i + 1);
  const rowH = 1.7;
  const totalRows = deckRows + 2;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => window.Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-token-sm border border-line-soft px-3 py-1 text-token-sm text-ink-muted transition-colors duration-fast hover:border-line hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:border-line-soft disabled:hover:text-ink-muted"
        >
          {c.prev}
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => window.Math.min(last, s + 1))}
          disabled={step === last}
          className="rounded-token-sm border border-line-soft px-3 py-1 text-token-sm text-ink-muted transition-colors duration-fast hover:border-line hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:border-line-soft disabled:hover:text-ink-muted"
        >
          {c.next}
        </button>
        <span className="whitespace-nowrap text-token-sm tabular-nums text-ink-faint">{c.stepOf(step + 1, last + 1)}</span>
      </div>

      <figure className="mt-4">
        {/* 26 張一列在手機塞不下，牌面區自己橫向捲，頁面不捲（DESIGN.md 的寬內容規則）。 */}
        <div className="overflow-x-auto">
        <div className="relative" style={{ height: `${(totalRows - 1) * rowH + 1.4}rem`, minWidth: `${perRow}rem` }}>
          {values.map((v) => {
            const slot = layout[v];
            const { tone, mix } = toneOf(v, step);
            return (
              <span
                key={v}
                className="absolute rounded-[3px] py-0.5 text-center text-[0.65rem] leading-tight tabular-nums transition-transform duration-500"
                style={{
                  width: `calc(${100 / perRow}% - 2px)`,
                  left: 0,
                  top: 0,
                  transform: `translate(calc(${slot.col} * (100% + ${2 * perRow / (perRow - 1)}px)), ${slot.row * rowH}rem)`,
                  color: tone,
                  backgroundColor: `color-mix(in oklab, ${tone} ${mix}%, transparent)`,
                }}
              >
                {v}
              </span>
            );
          })}
        </div>
        </div>
        <figcaption className="mt-2 text-token-xs leading-relaxed text-ink-faint">{steps[step]}</figcaption>
      </figure>
    </div>
  );
}
