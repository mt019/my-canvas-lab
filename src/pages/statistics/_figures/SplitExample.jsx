import { useMemo, useState } from 'react';
import Math from '../../../components/lab/Math';

/*
 * The worked example for the rising-sequence bound, stepped by hand: cut, riffle,
 * cut again, riffle again. Twelve cards is enough to watch the mechanism — the
 * cards keep their order inside each packet, so one shuffle leaves at most two
 * rising sequences and the next shuffle splits each of those in at most two.
 *
 * The two arrangements come from the data repository (figures.json, id
 * split-example), where a note verifies they are legal riffles and that the run
 * counts walk the ceiling exactly: 1, 2, 4. Nothing here is sampled; the point
 * of this figure is the bound, not the distribution, and a fixed example is the
 * honest way to show a bound.
 *
 * Cards move between steps by CSS transform on absolutely-positioned tiles, so
 * the reader can see each packet slide apart and interleave without any card
 * passing another card from its own packet.
 */
const COPY = {
  zh: {
    prev: '上一步',
    next: '下一步',
    stepOf: (i, n) => `步驟 ${i}/${n}`,
    steps: [
      '十二張牌照 1 到 12 排好，整副是一段遞增序列。',
      '切牌：分成 1–6 與 7–12 兩堆，每堆內部照舊由小到大。',
      '交錯落下：兩堆的牌混進同一列，但同色的牌前後次序不變，1 到 6 的位置仍然遞增，7 到 12 也是。整副拆成兩段遞增序列。',
      '洗第二次，先切牌：把剛才的排列分成兩堆，每一堆都橫跨原來的兩種顏色。',
      <>再交錯落下：原來的每一段各被拆成兩段（深淺各一），共四段。洗 <Math tex="k" /> 次最多 <Math tex="2^k" /> 段。</>,
    ],
  },
  en: {
    prev: 'Back',
    next: 'Next',
    stepOf: (i, n) => `Step ${i}/${n}`,
    steps: [
      'Twelve cards in order, 1 to 12: the whole deck is one rising sequence.',
      'Cut: two packets, 1–6 and 7–12, each still ascending inside.',
      'Riffle: the packets interleave into one row, but cards of the same colour keep their order. The positions of 1 to 6 still ascend, and so do 7 to 12: two rising sequences.',
      'Second shuffle, cut first: the arrangement splits into two packets, and each packet spans both colours.',
      <>Riffle again: each of the two runs splits in two, one dark and one light shade — four rising sequences. After <Math tex="k" /> shuffles, at most <Math tex="2^k" />.</>,
    ],
  },
};

export default function SplitExample({
  n = 12,
  cut1 = 6,
  order1 = [],
  cut2 = 6,
  order2 = [],
  lang = 'zh',
}) {
  const c = COPY[lang] ?? COPY.zh;
  const [step, setStep] = useState(0);
  const last = c.steps.length - 1;

  // Per step, where every card sits: row 0 and 2 are the two packets after a
  // cut, row 1 is the assembled deck. Positions are keyed by card value so a
  // tile's identity survives every rearrangement and CSS can animate it.
  const layouts = useMemo(() => {
    const sorted = Array.from({ length: n }, (_, i) => i + 1);
    const slotRow = (deck, row) => Object.fromEntries(deck.map((v, i) => [v, { row, col: i }]));
    const slotPiles = (deck, cut) => ({
      ...Object.fromEntries(deck.slice(0, cut).map((v, i) => [v, { row: 0, col: i }])),
      ...Object.fromEntries(deck.slice(cut).map((v, i) => [v, { row: 2, col: cut + i }])),
    });
    return [
      slotRow(sorted, 1),
      slotPiles(sorted, cut1),
      slotRow(order1, 1),
      slotPiles(order1, cut2),
      slotRow(order2, 1),
    ];
  }, [n, cut1, order1, cut2, order2]);

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
        <div className="relative" style={{ height: '7.4rem' }}>
          {values.map((v) => {
            const slot = layout[v];
            const { tone, mix } = toneOf(v, step);
            return (
              <span
                key={v}
                className="absolute rounded-token-sm py-1.5 text-center text-token-xs tabular-nums transition-transform duration-500"
                style={{
                  width: `calc(${100 / n}% - 3px)`,
                  left: 0,
                  top: 0,
                  transform: `translate(calc(${slot.col} * (100% + ${3 * n / (n - 1)}px)), ${slot.row * 2.6}rem)`,
                  color: tone,
                  backgroundColor: `color-mix(in oklab, ${tone} ${mix}%, transparent)`,
                }}
              >
                {v}
              </span>
            );
          })}
        </div>
        <figcaption className="mt-2 text-token-xs leading-relaxed text-ink-faint">{c.steps[step]}</figcaption>
      </figure>
    </div>
  );
}
