import { useState } from 'react';
import Tex from '../../../components/lab/Math';
import { positivePredictiveValue } from '../_lib/stats';

/*
 * "p < 0.05, so there is a 95% chance the effect is real" is the misreading that
 * costs the most, and the arithmetic that kills it is small enough to fit in a
 * 2x2 table. What decides the answer is how often a real effect was there to be
 * found in the first place — the one quantity the p value knows nothing about.
 *
 * No chart: this is exact arithmetic, not a distribution. A bar chart of four
 * numbers would only dress it up.
 */
const FIELDS = [
  { key: 'priorOdds', label: '事前勝算（真效果 : 沒效果）', min: 0.02, max: 1, step: 0.02, format: (v) => `1 : ${(1 / v).toFixed(0)}` },
  { key: 'power', label: '檢定力', min: 0.1, max: 0.99, step: 0.01, format: (v) => v.toFixed(2) },
  { key: 'alpha', label: '門檻 alpha', min: 0.001, max: 0.1, step: 0.001, format: (v) => v.toFixed(3) },
];

export default function PositivePredictiveValue({ priorOdds = 0.1, power = 0.5, alpha = 0.05 }) {
  const [v, setV] = useState({ priorOdds, power, alpha });
  const ppv = positivePredictiveValue(v);

  // Per 1000 hypotheses tested, with the given prior odds of being true.
  const real = (1000 * v.priorOdds) / (1 + v.priorOdds);
  const fake = 1000 - real;
  const truePos = real * v.power;
  const falsePos = fake * v.alpha;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
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
            <th className="border-b border-line px-2 py-1.5 text-left text-token-xs text-ink-faint">每 1000 個被檢定的假說</th>
            <th className="border-b border-line px-2 py-1.5 text-right text-token-xs text-ink-faint">顯著</th>
            <th className="border-b border-line px-2 py-1.5 text-right text-token-xs text-ink-faint">不顯著</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr>
            <td className="border-b border-line-soft px-2 py-1.5 text-ink">真有效果（{real.toFixed(0)}）</td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right text-ink">{truePos.toFixed(0)}</td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right text-ink-faint">{(real - truePos).toFixed(0)}</td>
          </tr>
          <tr>
            <td className="border-b border-line-soft px-2 py-1.5 text-ink">沒有效果（{fake.toFixed(0)}）</td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right" style={{ color: 'var(--status-danger-tx)' }}>
              {falsePos.toFixed(0)}
            </td>
            <td className="border-b border-line-soft px-2 py-1.5 text-right text-ink-faint">{(fake - falsePos).toFixed(0)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full border border-line-soft">
        <span style={{ width: `${ppv * 100}%`, background: 'var(--cat-3-bg)' }} />
        <span style={{ width: `${(1 - ppv) * 100}%`, background: 'var(--cat-6-bg)' }} />
      </div>
      <p className="mt-2 text-token-sm text-ink">
        在所有「顯著」的結果裡，真的有效果的佔 <span className="tabular-nums">{(ppv * 100).toFixed(0)}%</span>。
        <Tex tex="p < 0.05" /> 從來就不代表「有 95% 的機會是真的」——那個 95% 是在虛無為真的前提下算出來的，
        而這裡問的是反過來的問題。
      </p>
    </div>
  );
}
