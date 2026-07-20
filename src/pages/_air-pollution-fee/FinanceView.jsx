import { SectionHead, SubHead, Note, ShareBar, Bullets } from './shared';
import { FINANCE_DATA } from './data';

export default function FinanceView() {
  const { revenue, expenditure, centralLocal } = FINANCE_DATA;

  return (
    <>
      <section className="mb-10">
        <SectionHead id="finance">收支劃分的特殊性</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          空污費不適用《財政收支劃分法》。費款不歸國庫統收統支，而是依義務人類型分流進中央或地方的空污基金，
          形成兩層平行的基金結構，各有徵收主體、管理機關與用途限制。
        </p>
      </section>

      <section className="mb-10">
        <SubHead id="revenue">收入來源與徵收主體</SubHead>
        <div className="space-y-5">
          {revenue.map((item) => (
            <ShareBar
              key={item.label}
              label={item.label}
              pct={item.pct}
              tone={item.tone}
              right={`約 ${item.pct}%`}
              note={`${item.collectorNote}，存入${item.fund}。${item.note}`}
            />
          ))}
        </div>
        <p className="mt-4 text-token-xs leading-relaxed text-ink-muted">
          累計徵收（1995–2008）逾 355 億元；費款全數入各級空污基金，不納入一般財政預算。
        </p>
      </section>

      <section className="mb-10">
        <SubHead id="funds">兩層基金</SubHead>
        <div className="grid gap-8 sm:grid-cols-2">
          {centralLocal.map((fund) => (
            <div key={fund.title}>
              <h4 className="mb-3 text-token-sm font-semibold text-ink">{fund.title}</h4>
              <Bullets items={fund.items} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SubHead id="expenditure">基金支出結構</SubHead>
        <div className="space-y-4">
          {expenditure.map((item) => (
            <ShareBar key={item.label} label={item.label} pct={item.pct} />
          ))}
        </div>
        <div className="mt-5">
          <Note>
            支出最大的一塊是移動源管制（37.5%），而收入端的移動污染源費只佔約 24%。
            兩個數字不同源、也不在同一層基金上（移動源費全數入中央基金後再依公式撥付地方），
            所以不能直接相減得出「誰補貼誰」——要談這件事，得先拿到同一年度、同一層基金的決算數。
          </Note>
        </div>
      </section>
    </>
  );
}
