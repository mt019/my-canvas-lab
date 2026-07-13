import { useMemo, useState } from 'react';
import Tex from '../../../components/lab/Math';
import { mulberry32, normalSample } from '../_lib/rng';
import { tTest } from '../_lib/stats';

/*
 * Twenty outcome measures, no effect in any of them, and the reader gets to do
 * what a researcher does: run the study, look at all twenty, and report the best
 * one. Under the 0.05 threshold, "at least one hit" happens about 64% of the
 * time — 1 - 0.95^20. Nothing here is fraud; every single test is done correctly.
 */
export default function PHacking({ outcomes = 20, n = 30, seed = 424242 }) {
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
          做一次研究
        </button>
        <span>
          量 {outcomes} 個結果變數，每一個的真實效果都是零。
        </span>
        {studies.length > 0 ? (
          <button
            type="button"
            onClick={() => setStudies([])}
            className="text-token-xs text-ink-faint underline underline-offset-2 hover:text-ink"
          >
            重來
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
                    borderColor: hit ? 'var(--cat-6-tx)' : 'var(--c-line-soft)',
                    background: hit ? 'var(--cat-6-bg)' : 'var(--c-paper)',
                    color: hit ? 'var(--cat-6-tx)' : 'var(--c-ink-faint)',
                  }}
                >
                  {p.toFixed(3)}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-token-sm text-ink">
            這一次有 {latest.filter((p) => p < 0.05).length} 個變數「顯著」。
            {latest.some((p) => p < 0.05)
              ? '把它寫成論文的主要發現，其餘十幾個不提——每一步都合乎規範，結論卻是憑空的。'
              : '這一次什麼也沒撈到。再按一次。'}
          </p>
          <p className="mt-1 text-token-sm text-ink-muted">
            做了 {studies.length} 次研究，其中 {anyHit} 次至少撈到一個顯著結果（
            {((anyHit / studies.length) * 100).toFixed(0)}%）。理論值{' '}
            <Tex tex={`1 - 0.95^{${outcomes}} \\approx ${expected.toFixed(2)}`} />。
          </p>
        </div>
      ) : null}
    </div>
  );
}
