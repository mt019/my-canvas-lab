import { SectionHead, SubHead } from './shared';

export default function MethodsView({ population, methods }) {
  return (
    <>
      <section className="mb-10">
        <SectionHead id="data">資料來源</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          母體是司法院法學資料檢索系統（FJUD）公開的稅務訴訟判決全文，{population.note}
          共 {population.totalTaxCases.toLocaleString('zh-Hant')} 件。每條研究線各自從這個母體裡，
          依爭點性質篩出自己的子集——篩法與排除規則寫在各條線自己的頁面裡。
        </p>
        <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{methods.sourceReliability}</p>
      </section>

      <section className="mb-10">
        <SubHead id="scope">單一法域</SubHead>
        <p className="max-w-3xl text-token-sm leading-relaxed text-ink-muted">{methods.jurisdictionScope}</p>
      </section>

      <section>
        <SubHead id="review">人工核定</SubHead>
        <p className="max-w-3xl text-token-sm leading-relaxed text-ink-muted">{methods.reviewProtocol}</p>
      </section>
    </>
  );
}
