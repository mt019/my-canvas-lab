import Badge from '../../components/lab/Badge';
import { SectionHead, SubHead, KeyPoint, RangeBar, Quote } from './shared';

export default function VerdictScopeView({ verdictScope }) {
  const { population, raw, afterPresumption, legalBasis, byCourt } = verdictScope;
  return (
    <>
      <div className="mb-8 flex items-center gap-2">
        <Badge tone="warning">資料仍在擴充</Badge>
        <span className="text-token-xs text-ink-muted">{verdictScope.statusNote}</span>
      </div>

      <section className="mb-10">
        <SectionHead id="question">撤銷之後，稅單真的沒了嗎</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          行政法院判「原處分撤銷」，讀起來像是這張稅單整個作廢。但臺灣的稅務訴訟實務把「原處分」
          預設讀成復查決定，不是最初的核定處分——撤銷復查決定，原核定的稅額原則上仍然有效，
          稽徵機關重新做一次復查決定即可，程序回到起點。這批數字要測的是：撤銷判決究竟連原核定
          一起撤，還是只撤到復查決定。
        </p>
        <div className="mt-6"><Quote citation={legalBasis.citation} quote={legalBasis.quote} /></div>
        <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{legalBasis.plain}</p>
        <p className="mt-2 text-token-xs text-ink-muted">依據：{legalBasis.source}</p>
      </section>

      <section className="mb-10">
        <SubHead id="range">舊口徑的參考區間</SubHead>
        <p className="mb-4 max-w-3xl text-token-sm leading-relaxed text-ink-muted">
          {population.n} 件撤銷處分（{population.note}）裡，主文措辭本身已經清楚寫明的只是一部分；
          其餘曾以措辭規律推定，還有一批仍未定。這組區間保留為研究背景；正式報告會改用分軌人工抽樣後的
          點估計與信賴區間。
        </p>
        <div className="space-y-4">
          <RangeBar label="措辭字面清楚可判" floorPct={raw.floorPct} ceilingPct={raw.ceilingPct} />
          <RangeBar label="套用已驗證推定規則後" floorPct={afterPresumption.floorPct} ceilingPct={afterPresumption.ceilingPct} />
        </div>
        <p className="mt-3 text-token-xs leading-relaxed text-ink-muted">{afterPresumption.note}</p>
      </section>

      <section className="mb-10">
        <SubHead id="bycourt">三個高等行政法院的措辭差異</SubHead>
        <div className="space-y-4">
          {byCourt.map((c) => (
            <RangeBar key={c.court} label={c.court} floorPct={c.floorPct} ceilingPct={c.ceilingPct} n={c.n} />
          ))}
        </div>
        <div className="mt-4"><KeyPoint>
          三院區間互不重疊，先表示措辭慣例有強烈院別差異；它是否等於實質裁判行為差異，仍待用獨立指標驗證。
        </KeyPoint></div>
      </section>
    </>
  );
}
