import { useState } from 'react';
import Tabs from '../../components/lab/Tabs';
import { SectionHead, SubHead, Note, ShareBar } from './shared';
import { POLLUTANTS } from './data';

/*
 * 費率查詢。原本埋在「構成要件」底下一顆要點開的按鈕裡——分頁殼上線後它自己就是
 * 一條線，拉出來當一個分頁，不必再藏。
 *
 * 三個維度（污染物、防制區等級、季別）都是分頁元件的既有 variant：主維度用 pill，
 * 兩個切換用 quiet。不再手刻 ToggleGroup。
 */
export default function RatesView() {
  const [key, setKey] = useState('SOx');
  const [zone, setZone] = useState('zone2');
  const [season, setSeason] = useState('q23');

  const p = POLLUTANTS[key];
  const rates = p.rates[zone][season];
  const maxRate = Math.max(...rates.filter((r) => typeof r === 'number'));

  return (
    <>
      <section className="mb-10">
        <SectionHead id="rates">費率查詢</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          固定污染源的費率同時吃三個維度：所在防制區的空品等級、季別、以及該季排放量落在哪一級距。
          三者相乘之後才是單價，再乘上優惠係數 D 與減量係數 E。
        </p>
      </section>

      <section className="mb-10">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="mb-1.5 text-token-xs text-ink-faint">污染物</p>
            <Tabs
              variant="pill"
              label="選污染物"
              value={key}
              onChange={setKey}
              items={Object.entries(POLLUTANTS).map(([id, v]) => ({ id, label: v.abbr }))}
            />
          </div>
          <div>
            <p className="mb-1.5 text-token-xs text-ink-faint">防制區</p>
            <Tabs
              variant="quiet"
              label="選防制區等級"
              value={zone}
              onChange={setZone}
              items={[{ id: 'zone2', label: '二級' }, { id: 'zone13', label: '一三級' }]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-token-xs text-ink-faint">季別</p>
            <Tabs
              variant="quiet"
              label="選季別"
              value={season}
              onChange={setSeason}
              items={[{ id: 'q23', label: 'Q2/Q3' }, { id: 'q14', label: 'Q1/Q4' }]}
            />
          </div>
        </div>

        <p className="mt-5 text-token-sm leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">{p.name}（{p.abbr}）</span>　{p.desc}
        </p>

        <div className="mt-5 space-y-4">
          {p.tiers.map((tier, i) => {
            const rate = rates[i];
            const flat = typeof rate === 'string';
            return (
              <ShareBar
                key={tier.label}
                label={`${tier.label}　${tier.range}`}
                pct={flat ? 0 : (rate / maxRate) * 100}
                tone={flat ? undefined : p.tone}
                right={flat ? rate : `${rate} 元/kg`}
              />
            );
          })}
        </div>

        {season === 'q14' ? (
          <div className="mt-6">
            <Note>
              第一、四季是冬季費率，本來就高於第二、三季；同一季另乘減量係數 E，
              當季排放量較前三年同季平均減少 30% 以上者最低可打七折。
            </Note>
          </div>
        ) : null}
      </section>

      <section className="mb-10">
        <SubHead id="rates-note">怎麼讀這張表</SubHead>
        <p className="text-token-sm leading-relaxed text-ink-muted">
          長條的長度是同一組條件下各級距費率的相對高低，不是費額——實際費額還要乘上該級距的排放量。
          第四級多半是每季 450 元的定額（VOCs 除外），所以它沒有長條：定額與單價不同單位，畫在同一支尺上會誤導。
        </p>
      </section>
    </>
  );
}
