import Badge from '../../components/lab/Badge';
import { SectionHead, SubHead, KeyPoint, CountBar, CaseVignette } from './shared';

export default function CrossStraitView({ crossStrait }) {
  const maxTax = Math.max(...crossStrait.taxBreakdown.map((t) => t.n));
  return (
    <>
      <div className="mb-8 flex items-center gap-2">
        <Badge tone="info">探索中</Badge>
        <span className="text-token-xs text-ink-muted">{crossStrait.statusNote}</span>
      </div>

      <section className="mb-10">
        <SectionHead id="scale">候選規模</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          以兩岸／港澳相關關鍵字（法條本名、通用簡稱）掃過整個稅務訴訟母體，命中
          <span className="font-semibold text-ink"> {crossStrait.candidatePool.toLocaleString('zh-Hant')} 件</span>候選；
          其中真正落在稅務訴訟母體內的有 <span className="font-semibold text-ink">{crossStrait.populationOverlap.n} 件</span>，
          這裡面又有 <span className="font-semibold text-ink">{crossStrait.leakage.n} 件</span>不在既有的涉外語料庫裡——
          既有的涉外關鍵字清單幾乎沒收兩岸相關詞彙，這批案件先前被漏掉了。
        </p>
      </section>

      <section className="mb-10">
        <SubHead id="taxtype">稅目分布（前五大）</SubHead>
        <div className="space-y-3">
          {crossStrait.taxBreakdown.map((t) => (
            <CountBar key={t.label} label={t.label} n={t.n} max={maxTax} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SubHead id="treaty">一份沒有生效的協議</SubHead>
        <p className="max-w-3xl text-token-base leading-relaxed text-ink-muted">{crossStrait.treatyStatus.summary}</p>
        <div className="mt-4"><KeyPoint>{crossStrait.treatyStatus.label}</KeyPoint></div>
      </section>

      <section>
        <SubHead id="vignette">當事人援引未生效協議的樣本</SubHead>
        <CaseVignette citation={crossStrait.vignette.citation} summary={crossStrait.vignette.summary} />
      </section>
    </>
  );
}
