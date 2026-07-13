import { useState } from 'react';
import { positivePredictiveValue } from '../_lib/stats';

/*
 * "p < 0.05, so there is a 95% chance the effect is real" is the misreading that
 * costs the most, and the arithmetic that kills it fits in a 2x2 table. What
 * decides the answer is how often a real effect was there to be found — the one
 * quantity the p value knows nothing about.
 *
 * No chart: this is exact arithmetic, not a distribution. Four numbers in a bar
 * chart would only be decoration.
 */
const COPY = {
  zh: {
    fields: [
      { key: 'priorOdds', label: '事前勝算（真效果 : 沒效果）', min: 0.02, max: 1, step: 0.02, format: (v) => `1 : ${(1 / v).toFixed(0)}` },
      { key: 'power', label: '檢定力', min: 0.1, max: 0.99, step: 0.01, format: (v) => v.toFixed(2) },
      { key: 'alpha', label: '門檻 alpha', min: 0.001, max: 0.1, step: 0.001, format: (v) => v.toFixed(3) },
    ],
    head: '每 1000 個被檢定的假說',
    sig: '顯著',
    nonsig: '不顯著',
    real: (n) => `真有效果（${n}）`,
    fake: (n) => `沒有效果（${n}）`,
    verdict: (pct) => `在所有「顯著」的結果裡，真的有效果的佔 ${pct}%。`,
    note: 'p < 0.05 從來不代表「有 95% 的機會是真的」。那個 95% 是在虛無為真的前提下算出來的，這裡問的卻是反過來的問題。',
  },
  en: {
    fields: [
      { key: 'priorOdds', label: 'Prior odds (real : null)', min: 0.02, max: 1, step: 0.02, format: (v) => `1 : ${(1 / v).toFixed(0)}` },
      { key: 'power', label: 'Power', min: 0.1, max: 0.99, step: 0.01, format: (v) => v.toFixed(2) },
      { key: 'alpha', label: 'Threshold alpha', min: 0.001, max: 0.1, step: 0.001, format: (v) => v.toFixed(3) },
    ],
    head: 'Per 1000 hypotheses tested',
    sig: 'significant',
    nonsig: 'not significant',
    real: (n) => `real effect (${n})`,
    fake: (n) => `no effect (${n})`,
    verdict: (pct) => `Of everything that comes back "significant", ${pct}% is real.`,
    note: 'p < 0.05 never meant "95% likely to be true". That 95% is computed assuming the null holds, and the question here runs the other way.',
  },
};

export default function PositivePredictiveValue({ priorOdds = 0.1, power = 0.8, alpha = 0.05, lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
  const [v, setV] = useState({ priorOdds, power, alpha });
  const ppv = positivePredictiveValue(v);

  // Per 1000 hypotheses tested, at the given prior odds of being true.
  const real = (1000 * v.priorOdds) / (1 + v.priorOdds);
  const fake = 1000 - real;
  const truePos = real * v.power;
  const falsePos = fake * v.alpha;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {c.fields.map((f) => (
          <label key={f.key} className="block text-token-xs text-ink-muted">
            <span className="block">{f.label}</span>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={v[f.key]}
              onChange={(e) => setV((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
              className="mt-1 w-full accent-[var(--c-accent)]"
            />
            <span className="tabular-nums text-ink">{f.format(v[f.key])}</span>
          </label>
        ))}
      </div>

      <table className="mt-5 w-full border-collapse text-token-sm">
        <thead>
          <tr>
            <th className="border-b border-line px-2 py-1.5 text-left text-token-xs text-ink-faint">{c.head}</th>
            <th className="border-b border-line px-2 py-1.5 text-right text-token-xs text-ink-faint">{c.sig}</th>
            <th className="border-b border-line px-2 py-1.5 text-right text-token-xs text-ink-faint">{c.nonsig}</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr>
            <td className="border-b border-line-soft px-2 py-1.5 text-ink">{c.real(real.toFixed(0))}</td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right text-ink">{truePos.toFixed(0)}</td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right text-ink-faint">{(real - truePos).toFixed(0)}</td>
          </tr>
          <tr>
            <td className="border-b border-line-soft px-2 py-1.5 text-ink">{c.fake(fake.toFixed(0))}</td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right" style={{ color: 'var(--status-danger-tx)' }}>
              {falsePos.toFixed(0)}
            </td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right text-ink-faint">{(fake - falsePos).toFixed(0)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full border border-line-soft">
        <span style={{ width: `${ppv * 100}%`, background: 'var(--status-success-bg)' }} />
        <span style={{ width: `${(1 - ppv) * 100}%`, background: 'var(--status-danger-bg)' }} />
      </div>
      <p className="mt-2 text-token-sm text-ink">
        {c.verdict((ppv * 100).toFixed(0))}
        <span className="text-ink-muted"> {c.note}</span>
      </p>
    </div>
  );
}
