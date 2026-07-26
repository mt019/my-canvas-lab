import Badge from '../../components/lab/Badge';
import { SectionHead, SubHead, KeyPoint } from './shared';

export default function ForeignCourtsView({ foreignCourts }) {
  return (
    <>
      <div className="mb-8 flex items-center gap-2">
        <Badge tone="info">探索中</Badge>
        <span className="text-token-xs text-ink-muted">{foreignCourts.statusNote}</span>
      </div>

      <section className="mb-10">
        <SectionHead id="question">代表處協定在別的法域長什麼樣子</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          臺灣沒有正式邦交的國家，簽的租稅協定形式上不是國與國條約——通常是雙方代表機構之間的協定，
          再由對方國內法把它接進本國法律體系。八個法域已查證的接法列在下面，不需要外國判決即可成立。
        </p>
      </section>

      <section className="mb-10">
        <SubHead id="forms">八法域的法律形式</SubHead>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-token-xs text-ink-muted">
                <th className="py-2 pr-4 font-medium">法域</th>
                <th className="py-2 font-semibold text-ink">怎麼接進國內法</th>
              </tr>
            </thead>
            <tbody>
              {foreignCourts.legalForms.map((r) => (
                <tr key={r.jurisdiction} className="border-b border-line-soft align-top">
                  <td className="py-3 pr-4 text-token-sm font-semibold text-ink">{r.jurisdiction}</td>
                  <td className="py-3 text-token-sm leading-relaxed text-ink-muted">{r.form}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SubHead id="swiss">{foreignCourts.swissDetail.label}</SubHead>
        <p className="max-w-3xl text-token-base leading-relaxed text-ink-muted">{foreignCourts.swissDetail.summary}</p>
        <div className="mt-4"><KeyPoint>
          八法域裡形式最極端的樣本：協定本身是私法契約，靠一部不提臺灣名字的專法承認。
        </KeyPoint></div>
      </section>
    </>
  );
}
