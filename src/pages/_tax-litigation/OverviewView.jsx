import Badge from '../../components/lab/Badge';
import { SectionHead, SubHead, KeyPoint, MetricBar, CaseVignette } from './shared';

const TONE = { P1: 'neutral', P2: 'info', P3: 'success', P0: 'neutral' };

export default function OverviewView({ decisive }) {
  const candidateFlow = decisive.candidateFlow ?? [];
  return (
    <>
      <section className="mb-10">
        <SectionHead id="thesis">法院怎麼用租稅協定判案</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          臺灣的所得稅協定第一句話幾乎都是「與國內法牴觸時，依協定規定」——但協定本身經常留了一個口子：
          「另有規定者，依其規定」，把具體計算方式交回國內法。這批 {decisive.denominator} 件案件，是全臺
          稅務訴訟裡法院在主文或理由中具名援引特定協定條款、爭點又落在課稅管轄權競合（來源國 vs 居住國、
          協定分配條款、雙重居民、對臺稅之外國稅額扣抵）的完整子集。逐件核對後，
          <span className="font-semibold text-ink"> {decisive.headlineCount} 件（{decisive.headlinePct}%）法院最終仍是依財政部函釋、
          查核準則或所得稅法本文認定</span>，只有 1 件法院真正依協定文義或 OECD 範本註釋自己做出解釋。
        </p>
        <div className="mt-6"><KeyPoint>
          協定自主解釋在這批稅約訴訟裡近乎缺席；但這是裁判依據的分布，不是法官態度的直接測量。
        </KeyPoint></div>
        {decisive.expressionNote ? (
          <p className="mt-3 max-w-3xl text-token-xs leading-relaxed text-ink-muted">{decisive.expressionNote}</p>
        ) : null}
      </section>

      <section className="mb-10">
        <SubHead id="distribution">67 件怎麼分佈</SubHead>
        <div className="space-y-4">
          {decisive.distribution.map((d) => (
            <div key={d.code}>
              <div className="mb-1 flex items-center gap-2">
                <Badge tone={TONE[d.code]}>{d.code}</Badge>
                <span className="text-token-sm text-ink-muted">{d.label}</span>
              </div>
              <MetricBar label="" pct={d.pct} count={d.count} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-token-xs leading-relaxed text-ink-muted">
          {decisive.excludedNote}母體建構流程：{candidateFlow.map((s) => `${s.step}（${s.n}）`).join(' → ')}。
        </p>
        {decisive.clusterSummary ? (
          <p className="mt-2 text-token-xs leading-relaxed text-ink-muted">
            去重後：{decisive.clusterSummary.domesticClusters}/{decisive.clusterSummary.eligibleClusters} 個合格爭議叢集
            （{decisive.clusterSummary.pct}%）仍以國內法令作為裁判依據。{decisive.clusterSummary.note}
          </p>
        ) : null}
      </section>

      <section className="mb-10">
        <SubHead id="autonomous">唯一的自主解釋案</SubHead>
        <div className="flex gap-3">
          <Badge tone={TONE.P3}>P3</Badge>
          <CaseVignette
            citation={decisive.autonomousCase.citation}
            summary={decisive.autonomousCase.summary}
            note={decisive.autonomousCase.note}
          />
        </div>
      </section>

      <section className="mb-10">
        <SubHead id="domestic">典型的國內化模式</SubHead>
        <div className="space-y-5">
          <div className="flex gap-3">
            <Badge tone={TONE.P1}>P1</Badge>
            <CaseVignette
              citation={decisive.domesticExample.citation}
              summary={decisive.domesticExample.summary}
            />
          </div>
          {decisive.moreExamples.map((ex) => (
            <div key={ex.citation} className="flex gap-3">
              <Badge tone={TONE[ex.code]}>{ex.code}</Badge>
              <CaseVignette citation={ex.citation} summary={ex.summary} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SubHead id="dedup">{decisive.disputeDedup.label}</SubHead>
        <p className="max-w-3xl text-token-sm leading-relaxed text-ink-muted">{decisive.disputeDedup.summary}</p>
        <ul className="mt-4 space-y-3">
          {decisive.disputeDedup.chains.map((c) => (
            <li key={c.shares} className="border-t border-line-soft pt-3">
              <p className="text-token-xs font-semibold tabular-nums text-ink">{c.shares}</p>
              <p className="mt-1 font-accent text-token-xs leading-relaxed text-ink-muted">{c.path}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-token-xs leading-relaxed text-ink-muted">{decisive.disputeDedup.caveat}</p>
      </section>

      <section>
        <SubHead id="caveats">怎麼讀這個數字</SubHead>
        <ul className="space-y-2.5">
          {decisive.caveats.map((c) => (
            <li key={c} className="grid grid-cols-[14px_1fr] gap-2 text-token-sm leading-relaxed text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
