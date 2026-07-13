import { useMemo, useState } from 'react';
import { mulberry32, normalSample } from '../_lib/rng';
import { tTest } from '../_lib/stats';

/*
 * Twenty outcome measures, no effect in any of them, and the reader gets to do
 * what a researcher does: run the study, look at all twenty, report the best one.
 * At a 0.05 threshold, "at least one hit" happens about 64% of the time. Nothing
 * here is fraud; every individual test is done correctly.
 */
const COPY = {
  zh: {
    run: '做一次研究',
    reset: '重來',
    setup: (k) => `量 ${k} 個結果變數，每一個的真實效果都是零。`,
    hit: (n) => `這一次有 ${n} 個變數「顯著」。`,
    hitTail: '把它寫成論文的主要發現，其餘十幾個不提。每一步都合乎規範，結論卻是憑空的。',
    missTail: '這一次什麼也沒撈到。再按一次。',
    tally: (studies, any, pct, k, expected) =>
      `做了 ${studies} 次研究，其中 ${any} 次至少撈到一個顯著結果（${pct}%）。理論值 1 - 0.95^${k} 約等於 ${expected}。`,
  },
  en: {
    run: 'Run a study',
    reset: 'Reset',
    setup: (k) => `${k} outcome measures, and the true effect in every one of them is zero.`,
    hit: (n) => `${n} of them came out "significant" this time.`,
    hitTail: 'Write that one up as the finding and never mention the other nineteen. Every step is by the book, and the conclusion is made of nothing.',
    missTail: 'Nothing this time. Press it again.',
    tally: (studies, any, pct, k, expected) =>
      `${studies} studies run, ${any} of which caught at least one significant result (${pct}%). The theoretical value of 1 - 0.95^${k} is about ${expected}.`,
  },
};

export default function PHacking({ outcomes = 20, n = 20, seed = 424242, lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
  const [studies, setStudies] = useState([]);
  const rand = useMemo(() => mulberry32(seed), [seed]);

  const runStudy = () => {
    const ps = Array.from({ length: outcomes }, () => {
      const a = normalSample(rand, n, 0, 1);
      const b = normalSample(rand, n, 0, 1);
      return tTest(a, b).p;
    });
    setStudies((prev) => [...prev, ps]);
  };

  const latest = studies[studies.length - 1];
  const anyHit = studies.filter((ps) => ps.some((p) => p < 0.05)).length;
  const expected = 1 - 0.95 ** outcomes;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex flex-wrap items-center gap-3 text-token-sm text-ink-muted">
        <button
          type="button"
          onClick={runStudy}
          className="rounded-token-sm border border-line px-3 py-1 text-ink transition-colors duration-fast hover:border-accent hover:text-accent"
        >
          {c.run}
        </button>
        <span>{c.setup(outcomes)}</span>
        {studies.length > 0 ? (
          <button
            type="button"
            onClick={() => setStudies([])}
            className="text-token-xs text-ink-faint underline underline-offset-2 hover:text-ink"
          >
            {c.reset}
          </button>
        ) : null}
      </div>

      {latest ? (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {latest.map((p, i) => {
              const hit = p < 0.05;
              return (
                <span
                  key={i}
                  className="inline-flex h-7 min-w-[3.6rem] items-center justify-center rounded-token-sm border px-1 text-token-xs tabular-nums"
                  style={{
                    borderColor: hit ? 'var(--c-accent)' : 'var(--c-line-soft)',
                    background: hit ? 'var(--c-accent-soft)' : 'var(--c-paper)',
                    color: hit ? 'var(--c-accent)' : 'var(--c-ink-faint)',
                  }}
                >
                  {p.toFixed(3)}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-token-sm text-ink">
            {c.hit(latest.filter((p) => p < 0.05).length)}{' '}
            {latest.some((p) => p < 0.05) ? c.hitTail : c.missTail}
          </p>
          <p className="mt-1 text-token-sm text-ink-muted">
            {c.tally(
              studies.length,
              anyHit,
              ((anyHit / studies.length) * 100).toFixed(0),
              outcomes,
              expected.toFixed(2),
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
