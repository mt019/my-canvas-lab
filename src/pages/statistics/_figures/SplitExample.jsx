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
    labels: ['起點', '切牌', '交錯', '再切牌', '再交錯'],
    steps: (cut, n) => [
      `${n} 張牌照 1 到 ${n} 排好，柱高是牌值：整副是一段遞增序列，一道爬滿的階梯。`,
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
    labels: ['Start', 'Cut', 'Riffle', 'Cut again', 'Riffle again'],
    steps: (cut, n) => [
      `${n} cards in order, 1 to ${n}, bar height showing the card's value: the whole deck is one rising sequence, a single staircase.`,
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

  // The whole deck stays on one row at every step — wrapping it would draw two
  // rows and look like two runs before anything happened (2026-08-13 站主退回).
  // A cut slides the front packet up and the back packet down, keeping each
  // card's horizontal position at its place in the deck, so the cut point reads
  // directly off the gap.
  const perRow = n;
  const deckRows = 1;

  // Per step, where every card sits, keyed by card value so a tile's identity
  // survives every rearrangement and CSS can animate it.
  const layouts = useMemo(() => {
    const sorted = Array.from({ length: n }, (_, i) => i + 1);
    const slotDeck = (deck) => Object.fromEntries(deck.map((v, i) => [v, { row: 1, col: i }]));
    const slotPiles = (deck, cut) => ({
      ...Object.fromEntries(deck.slice(0, cut).map((v, i) => [v, { row: 0, col: i }])),
      ...Object.fromEntries(deck.slice(cut).map((v, i) => [v, { row: 2, col: cut + i }])),
    });
    return [
      slotDeck(sorted),
      slotPiles(sorted, cut1),
      slotDeck(order1),
      slotPiles(order1, cut2),
      slotDeck(order2),
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
  // 一張牌一根細柱，柱高就是牌值：「由小到大」直接是看得見的上升階梯，不用在
  // 12px 的格子裡塞兩位數（52 張單列的數字誰都讀不了，站主退回）。柱用百分比寬，
  // 任何螢幕都放得下一列，不捲。牌值留在 title，滑鼠停上去看得到。
  const unit = 0.055; // rem per 牌值
  const bandH = n * unit + 0.5; // 每一水平帶的高度：最高的柱＋一點空
  const totalRows = deckRows + 2;

  // 步驟列照 wizard 樣式的常規做：每一步是帶名字與序號的可點目標，五格本身就是
  // 全部的導航，不另擺上一步／下一步（兩顆箭頭鈕跟五格擠不進一行，而且是冗餘的
  // 操作面）。三種狀態不靠顏色單獨區分：當前步實心反白、走過的正常、沒到的退淡。
  // 觸標 py-2 拉到手指按得中的大小。
  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div role="group" aria-label={c.stepOf(step + 1, last + 1)} className="flex flex-wrap items-center gap-1.5">
        {c.labels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            aria-current={i === step ? 'step' : undefined}
            className={`rounded-full px-3.5 py-2 text-token-sm leading-none transition-colors duration-fast ${
              i === step
                ? 'bg-ink font-medium text-paper'
                : i < step
                ? 'text-ink-muted hover:bg-surface-raised hover:text-ink'
                : 'text-ink-faint hover:bg-surface-raised hover:text-ink'
            }`}
          >
            {/* 序號與名字之間是真的空格，不是 margin——無障礙名稱與 locator 都讀
                文字，不讀樣式（useHeadings 那條教訓的同款）。 */}
            <span className="tabular-nums">{i + 1}</span>{' '}{label}
          </button>
        ))}
      </div>

      <figure className="mt-4">
        <div className="relative" style={{ height: `${totalRows * bandH}rem` }}>
          {values.map((v) => {
            const slot = layout[v];
            const { tone, mix } = toneOf(v, step);
            const h = v * unit;
            return (
              <span
                key={v}
                title={String(v)}
                className="absolute rounded-t-[1px] transition-transform motion-reduce:transition-none"
                style={{
                  width: `calc(${100 / perRow}% - 1px)`,
                  height: `${h}rem`,
                  left: 0,
                  top: 0,
                  // 柱在自己那條水平帶裡落底：帶底減柱高。柱高不隨步驟變，動畫只有移動。
                  transform: `translate(calc(${slot.col} * (100% + ${perRow / (perRow - 1)}px)), ${(slot.row + 1) * bandH - h}rem)`,
                  // 波次：按目的欄位由左到右各延遲 7ms（52 張共 357ms，落在 stagger 總預算
                  // 500ms 之內），切牌與落牌讀成一道從左掃到右的波，不是整片同時跳。
                  // easing 用 MD3 的標準曲線；prefers-reduced-motion 時整個 transition 關掉，
                  // 直接跳到下一步的排面。
                  transitionDuration: '480ms',
                  transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                  transitionDelay: `${slot.col * 7}ms`,
                  backgroundColor: `color-mix(in oklab, ${tone} ${window.Math.min(mix * 3.2, 88)}%, transparent)`,
                }}
              />
            );
          })}
        </div>
        <figcaption className="mt-2 text-token-xs leading-relaxed text-ink-faint">{steps[step]}</figcaption>
      </figure>
    </div>
  );
}
