import { useMemo, useState } from 'react';
import Tabs from '../../../components/lab/Tabs';
import Tex from '../../../components/lab/Math';
import { tTest } from '../_lib/stats';

/*
 * One dataset, three readings.
 *
 * Fisher hands back a number and stops. Neyman and Pearson hand back a verdict,
 * and the verdict flips when you move a threshold they insist you fix in advance.
 * The textbook hybrid does both at once and thereby contradicts itself — it
 * reports p as if it measured evidence, while claiming the long-run error control
 * that only holds if p was never looked at that way.
 *
 * The data are fixed in the data repo, so the numbers below do not wobble.
 */
const PANELS = [
  { id: 'fisher', label: 'Fisher（1925/1935）' },
  { id: 'neyman', label: 'Neyman-Pearson（1933）' },
  { id: 'hybrid', label: '教科書的混血' },
];

export default function TwoLogics({ groupA = [], groupB = [], labels = { a: '處理組', b: '對照組' } }) {
  const [panel, setPanel] = useState('fisher');
  const [alpha, setAlpha] = useState(0.05);
  const { t, df, p } = useMemo(() => tTest(groupA, groupB), [groupA, groupB]);

  const reject = p < alpha;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <p className="text-token-sm text-ink-muted">
        同一組資料：{labels.a} <span className="tabular-nums">{groupA.length}</span> 個觀測、{labels.b}{' '}
        <span className="tabular-nums">{groupB.length}</span> 個觀測。
        <Tex tex="t" /> = <span className="tabular-nums">{t.toFixed(3)}</span>、
        <Tex tex="\mathrm{df}" /> = {df}、雙尾 <Tex tex="p" /> ={' '}
        <span className="tabular-nums">{p.toFixed(4)}</span>。三個學派拿到的是同一批數字。
      </p>

      <Tabs
        items={PANELS}
        value={panel}
        onChange={setPanel}
        variant="quiet"
        className="mt-4"
        label="三種讀法"
      />

      <div className="mt-4 min-h-[9.5rem] text-token-sm leading-relaxed text-ink">
        {panel === 'fisher' ? (
          <div>
            <p>
              報告 <Tex tex={`p = ${p.toFixed(4)}`} />，然後停在這裡。
            </p>
            <p className="mt-2 text-ink-muted">
              沒有對立假設，沒有事先講好的門檻，沒有「接受」這個動作。
              <Tex tex="p" /> 是一個證據的刻度：資料與虛無假設有多不搭。
              虛無假設的角色是被拿來推翻的那一個，它從來不會被證明。
              下一步是研究者的判斷——再做一次實驗，或者暫時把它當成一個可用的結論。
            </p>
          </div>
        ) : null}

        {panel === 'neyman' ? (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-ink-muted">
                <span>
                  事前定下 <Tex tex="\alpha" />
                </span>
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
              </label>
              <span
                className="rounded-full px-2.5 py-0.5 text-token-xs"
                style={{
                  background: reject ? 'var(--status-danger-bg)' : 'var(--status-neutral-bg)',
                  color: reject ? 'var(--status-danger-tx)' : 'var(--status-neutral-tx)',
                }}
              >
                {reject ? '拒絕 H0' : '不拒絕 H0'}
              </span>
            </div>
            <p className="mt-3 text-ink-muted">
              輸出只有這一個字：拒絕，或不拒絕。同一組資料，
              <Tex tex="\alpha = 0.05" /> 時拒絕、<Tex tex="\alpha = 0.01" /> 時不拒絕——
              翻轉的是門檻，不是證據。
              <Tex tex={`p = ${p.toFixed(4)}`} /> 這個數字本身不該被報告，因為在這套邏輯裡它沒有意義：
              它不是證據強度，它只是用來跟門檻比大小的中間值。
            </p>
            <p className="mt-2 text-ink-muted">
              這套邏輯保證的是長期錯誤率——你一輩子照這個規則做決定，虛無為真時你會錯
              <Tex tex="\alpha" /> 的比例。它保證的是這條規則，不是眼前這一次。
            </p>
          </div>
        ) : null}

        {panel === 'hybrid' ? (
          <div>
            <p>
              「<Tex tex={`p = ${p.toFixed(4)} < 0.05`} />，達到顯著，拒絕虛無假設，證據支持我們的假說。」
            </p>
            <p className="mt-2 text-ink-muted">
              這一句把兩套邏輯縫在一起，而它們的接縫是錯開的。
              「拒絕」與「顯著水準」來自 Neyman-Pearson，代價是事前固定門檻、放棄把
              <Tex tex="p" /> 當證據；「
              <Tex tex="p" /> 越小證據越強」來自 Fisher，代價是放棄長期錯誤率的保證。
              兩邊的代價都不付，兩邊的好處都要——於是這句話同時宣稱了它自己排除掉的東西。
            </p>
            <p className="mt-2 text-ink-muted">
              Gigerenzer 把這個縫合物叫做 null ritual：一套沒有作者、也沒有人為它辯護的統計推論。
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
