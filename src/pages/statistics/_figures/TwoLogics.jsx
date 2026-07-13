import { useMemo, useState } from 'react';
import Tabs from '../../../components/lab/Tabs';
import { tTest } from '../_lib/stats';

/*
 * One dataset, three readings. Fisher hands back a number and stops. Neyman and
 * Pearson hand back a verdict, and the verdict flips when you move a threshold
 * they insist you fix in advance. The textbook hybrid does both at once and so
 * contradicts itself: it reports p as a measure of evidence while claiming the
 * long-run error control that only holds if p was never read that way.
 *
 * The data are fixed in the data repo, so these numbers do not wobble.
 */
const COPY = {
  zh: {
    panels: [
      { id: 'fisher', label: 'Fisher（1925/1935）' },
      { id: 'neyman', label: 'Neyman-Pearson（1933）' },
      { id: 'hybrid', label: '課本的混血' },
    ],
    tabsLabel: '三種讀法',
    intro: (na, nb, t, df, p, la, lb) =>
      `同一組資料：${la} ${na} 個觀測，${lb} ${nb} 個觀測。t = ${t}，df = ${df}，雙尾 p = ${p}。三個學派拿到的是同一批數字。`,
    fisher: (p) => `報告 p = ${p}，然後停在這裡。`,
    fisherBody:
      '沒有對立假設，沒有事前講好的門檻，沒有「接受」這個動作。p 是證據的刻度，衡量資料跟虛無假設有多不搭。虛無假設的角色是被拿來推翻的那一個，它永遠不會被證明。下一步交給研究者判斷：再做一次實驗，或先把結論收下。',
    setAlpha: '事前定下 alpha',
    reject: '拒絕 H0',
    keep: '不拒絕 H0',
    npBody: (p) =>
      `輸出只有一個字：拒絕，或不拒絕。同一組資料，alpha = 0.05 時拒絕，alpha = 0.01 時不拒絕。翻轉的是門檻，不是證據。p = ${p} 這個數字本身不該被報告，因為在這套邏輯裡它沒有那個身分：它不是證據強度，只是拿來跟門檻比大小的中間值。`,
    npBody2:
      '這套邏輯保證的是長期錯誤率。你一輩子照這條規則做決定，虛無為真時會錯 alpha 的比例。它保證規則，不保證眼前這一次。',
    hybrid: (p) => `「p = ${p} < 0.05，達到顯著，拒絕虛無假設，證據支持我們的假說。」`,
    hybridBody:
      '這句話把兩套邏輯焊在一起，接縫卻是錯開的。「拒絕」與「顯著水準」來自 Neyman-Pearson，代價是事前固定門檻、不准把 p 當證據。「p 越小證據越強」來自 Fisher，代價是放棄長期錯誤率的保證。兩邊的代價都不付，兩邊的好處都要。',
    hybridBody2: 'Gigerenzer 把它叫做 null ritual：一套沒有作者、也沒有人願意替它辯護的統計推論。',
  },
  en: {
    panels: [
      { id: 'fisher', label: 'Fisher (1925/1935)' },
      { id: 'neyman', label: 'Neyman-Pearson (1933)' },
      { id: 'hybrid', label: 'The textbook hybrid' },
    ],
    tabsLabel: 'Three readings',
    intro: (na, nb, t, df, p, la, lb) =>
      `One dataset: ${na} observations in the ${la} group, ${nb} in the ${lb} group. t = ${t}, df = ${df}, two-sided p = ${p}. All three schools are handed the same numbers.`,
    fisher: (p) => `Report p = ${p}, and stop.`,
    fisherBody:
      'No alternative hypothesis, no threshold agreed beforehand, no act of acceptance. The p value measures how badly the data sit with the null. The null is there to be knocked down; it never gets proved. What happens next is the investigator’s judgement: run it again, or take the result provisionally.',
    setAlpha: 'Fix alpha in advance',
    reject: 'reject H0',
    keep: 'do not reject H0',
    npBody: (p) =>
      `The output is one word: reject, or do not. Same data, and the verdict flips between alpha = 0.05 and alpha = 0.01. What moved is the threshold, not the evidence. The number p = ${p} should not be reported at all, because in this logic it has no standing: it is not a strength of evidence, only a quantity to compare against the line.`,
    npBody2:
      'What this logic guarantees is a long-run error rate. Follow the rule for a career and, on the occasions when the null holds, you will call it wrong alpha of the time. The guarantee attaches to the rule, not to the case in front of you.',
    hybrid: (p) => `"p = ${p} < 0.05, significant, we reject the null; the evidence supports our hypothesis."`,
    hybridBody:
      'The sentence welds two logics along a seam that does not line up. "Reject" and "significance level" are Neyman and Pearson’s, and the price is fixing the threshold beforehand and never reading p as evidence. "The smaller the p, the stronger the evidence" is Fisher’s, and the price is the long-run guarantee. The sentence pays neither price and claims both.',
    hybridBody2:
      'Gigerenzer calls it the null ritual: an inference with no author, which nobody will defend.',
  },
};

export default function TwoLogics({ groupA = [], groupB = [], labels = { a: '處理組', b: '對照組' }, lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
  const [panel, setPanel] = useState('fisher');
  const [alpha, setAlpha] = useState(0.05);
  const { t, df, p } = useMemo(() => tTest(groupA, groupB), [groupA, groupB]);
  const reject = p < alpha;

  const la = lang === 'en' ? 'treated' : labels.a;
  const lb = lang === 'en' ? 'control' : labels.b;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <p className="text-token-sm leading-relaxed text-ink-muted">
        {c.intro(groupA.length, groupB.length, t.toFixed(3), df, p.toFixed(4), la, lb)}
      </p>

      <Tabs
        items={c.panels}
        value={panel}
        onChange={setPanel}
        variant="quiet"
        className="mt-4"
        label={c.tabsLabel}
      />

      <div className="mt-4 min-h-[10rem] text-token-sm leading-relaxed text-ink">
        {panel === 'fisher' ? (
          <div>
            <p>{c.fisher(p.toFixed(4))}</p>
            <p className="mt-2 text-ink-muted">{c.fisherBody}</p>
          </div>
        ) : null}

        {panel === 'neyman' ? (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <span>{c.setAlpha}</span>
                {[0.05, 0.01].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlpha(a)}
                    className="rounded-token-sm px-2 py-0.5 text-token-xs transition-colors duration-fast"
                    style={{
                      background: alpha === a ? 'var(--c-accent-soft)' : 'transparent',
                      color: alpha === a ? 'var(--c-accent)' : 'var(--c-ink-faint)',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-token-xs"
                style={{
                  background: reject ? 'var(--status-danger-bg)' : 'var(--status-neutral-bg)',
                  color: reject ? 'var(--status-danger-tx)' : 'var(--status-neutral-tx)',
                }}
              >
                {reject ? c.reject : c.keep}
              </span>
            </div>
            <p className="mt-3 text-ink-muted">{c.npBody(p.toFixed(4))}</p>
            <p className="mt-2 text-ink-muted">{c.npBody2}</p>
          </div>
        ) : null}

        {panel === 'hybrid' ? (
          <div>
            <p>{c.hybrid(p.toFixed(4))}</p>
            <p className="mt-2 text-ink-muted">{c.hybridBody}</p>
            <p className="mt-2 text-ink-muted">{c.hybridBody2}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
