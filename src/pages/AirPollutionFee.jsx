import { useEffect } from 'react';
import AppearanceMenu from '../components/AppearanceMenu';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParam } from '../components/lab/Tabs';
import ElementsView from './_air-pollution-fee/ElementsView';
import RatesView from './_air-pollution-fee/RatesView';
import ProcedureView from './_air-pollution-fee/ProcedureView';
import EffectsView from './_air-pollution-fee/EffectsView';
import EvasionView from './_air-pollution-fee/EvasionView';
import FinanceView from './_air-pollution-fee/FinanceView';
import HistoryView from './_air-pollution-fee/HistoryView';

/*
 * 空污費：一個特別公課的完整解剖。
 *
 * 分頁對應的是這個公課的各個面向（要件、費率、程序、效果、逃漏、財政、沿革），
 * 不是內容種類的分類箱——與 TaxLitigation／ConstitutionalCourt 同一個慣例。
 *
 * 費率查詢原本埋在「構成要件」底下一顆要點開的按鈕裡，現在自己是一個分頁：
 * 有吸頂分頁列之後就沒有理由再藏，它本來就是讀者最常來查的東西。
 */
export default function AirPollutionFee() {
  const [scale, setScale] = useFontScale();
  const [tab, setTab] = useTabParam('tab', 'elements');

  useEffect(() => {
    document.title = '空氣污染防制費｜Canvas Lab';
  }, []);

  return (
    <DashboardLayout
      scale={scale}
      back={{ href: '/', label: 'Canvas Lab' }}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow="空污法 §16 · 特別公課"
      title="空氣污染防制費"
      summary="依排放種類與排放量徵收、費款專入空污基金而不進國庫的一種特別公課（司法院釋字第 426 號）。這頁把它拆成七面：誰要繳、費率怎麼算、怎麼稽徵、不繳會怎樣、怎麼逃漏、錢流去哪、以及五十年來它怎麼變成現在這樣。"
      tabs={{
        label: '看哪一面',
        value: tab,
        onChange: setTab,
        items: [
          { id: 'elements', label: '構成要件' },
          { id: 'rates', label: '費率' },
          { id: 'procedure', label: '稽徵程序' },
          { id: 'effects', label: '法律效果' },
          { id: 'evasion', label: '逃漏' },
          { id: 'finance', label: '財政收支' },
          { id: 'history', label: '制度沿革' },
        ],
      }}
      refreshKey={tab}
    >
      {tab === 'elements' ? <ElementsView /> : null}
      {tab === 'rates' ? <RatesView /> : null}
      {tab === 'procedure' ? <ProcedureView /> : null}
      {tab === 'effects' ? <EffectsView /> : null}
      {tab === 'evasion' ? <EvasionView /> : null}
      {tab === 'finance' ? <FinanceView /> : null}
      {tab === 'history' ? <HistoryView /> : null}

      <p className="mt-12 border-t border-line-soft pt-5 text-token-xs leading-relaxed text-ink-muted">
        依據空污法第 16 條及相關費率附表（固定污染源）。僅供學術研究參考，實務請以環境部官方公告為準。
      </p>
    </DashboardLayout>
  );
}
