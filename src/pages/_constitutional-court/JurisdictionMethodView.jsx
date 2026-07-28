import { CheckCircle2, Layers3, Scale, ShieldCheck, TrendingDown } from 'lucide-react';
import data from '../../data/constitutionalCourt.json';
import JurisdictionShiftChart from './JurisdictionShiftChart';

const summary = data.職權分類摘要;

// 由弱到強排列，讀者一眼看得出這是一把梯子。件數不放大、不上色——六個數字六種顏色時，
// 色相沒有承載任何分類意義，只是把一張表畫成六張卡。
const statusRows = [
  { key: '尚待獨立複核', label: '規則判定', description: '已有分類，尚未經研究者逐案讀過。' },
  { key: '單人逐案查核', label: '單人查核', description: '已閱讀個案資料，尚待另一位研究者交叉確認。' },
  { key: '雙人獨立一致', label: '兩人一致', description: '兩位研究者各自判讀後，得到相同的法定職權分類。' },
  { key: '分歧仲裁完成', label: '第三人複核', description: '兩位研究者意見不同，已由第三位研究者依官方資料複核。' },
];

export default function JurisdictionMethodView() {
  const method = summary?.方法狀態;
  if (!summary || !method) {
    return <p className="py-8 text-[14px] text-[var(--cc-ink-mid)]">職權分類方法資料尚未同步。</p>;
  }
  const interpretations = data.文件.filter((item) => /^釋字第\d+號$/.test(item.字號));
  const verifiedStatuses = new Set(['雙人獨立一致', '分歧仲裁完成']);
  const verifiedInterpretations = interpretations.filter((item) =>
    verifiedStatuses.has(item.職權分類?.查核?.覆核狀態)
  ).length;
  // 摘要的 尚待獨立複核 512 件含憲判與裁定；這裡要的是釋字自己那一份，所以逐件數。
  const ruleOnlyInterpretations = interpretations.filter(
    (item) => item.職權分類?.查核?.覆核狀態 === '尚待獨立複核'
  ).length;

  return (
    <div className="max-w-4xl">
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">
          <TrendingDown size={13} /> 職權構成的轉變
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--cc-title-ink)]">統一解釋從八成餘退到個位數</h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          釋字這個系列從頭到尾扛著兩種職權：解釋憲法，以及統一解釋法律及命令。哪一種佔多數，
          在七十二年裡整個翻過來。1955 到 1974 年之間的四個五年期，每期都有八成以上是統一解釋；
          1975–79 年降到 63%，1980–84 年為 38%，1985–89 年剩 19%，1990 年以後每一期都在一成以下。
          同一個機關、同一條憲法第78條，做的事換了一種。
        </p>
        <div className="mt-4">
          <JurisdictionShiftChart />
        </div>
        <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          轉折集中在 1975 到 1989 這十五年：三個相鄰的五年期，佔比從 63% 掉到 19%。首期
          1949–54 年的 51% 低於其後四期，這批資料本身不說明原因。早期各期件數少，1970–74 年
          只有 14 件，一件的進出就動 7 個百分點；各期件數標在長條下方。
        </p>
        <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-[var(--cc-ink-soft)]">
          813 件釋字裡有 512 件的職權分類尚未完成兩位研究者的獨立判讀。在處境相同的 221 件上實測，
          規則判定與人工覆核相符 211 件（95.5%）。這個量級的誤差改不動曲線的形狀——1970–74 年到
          1985–89 年之間掉了 66 個百分點。
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">
          <Scale size={13} /> 分類方法
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--cc-title-ink)]">法定職權與案件類型分開記錄</h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          「法定職權」採憲法、憲法增修條文及各時期組織法令的正式名稱；2022年後的「案件類型」
          則依憲法訴訟法及憲法法庭官方案件案號字別記錄。案件涉及基本權、機關權限或既有解釋，
          都不會因此另創一種職權。
        </p>
        <dl className="mt-4 max-w-3xl space-y-2">
          {summary.欄位說明?.map((item) => (
            <div key={item.名稱} className="flex flex-col gap-x-3 sm:flex-row">
              <dt className="shrink-0 text-[13px] font-bold text-[var(--cc-ink-strong)] sm:w-24">{item.名稱}</dt>
              <dd className="text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">{item.說明}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">
          <ShieldCheck size={13} /> 目前證據強度
        </p>
        <h2 className="mt-1 text-base font-bold text-[var(--cc-title-ink)]">法源確認、官方資料確認與研究查核不混稱</h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          全庫 {method.全庫件數?.toLocaleString()} 件每一件都有法定職權分類，覆蓋沒有缺口。差別在證據是什麼：
          {method.法源直接確認?.toLocaleString()} 件由各時期有效的憲法、法律或組織法令直接確認，
          {method.官方案號確認}{' 件依憲法法庭原分案號與官方案件類型對照表確認，其餘 '}
          {(method.單人逐案查核 + method.尚待獨立複核 + method.雙人獨立一致 + method.分歧仲裁完成).toLocaleString()}
          {' 件由研究者判定，強度分四級。'}
        </p>
        <div className="mt-4 max-w-3xl overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-left text-[13px]">
            <thead className="text-[var(--cc-ink-soft)]">
              <tr className="border-b border-[var(--cc-line)]">
                <th className="py-1.5 pr-3 font-bold">證據</th>
                <th className="py-1.5 pr-3 text-right font-bold">件數</th>
                <th className="py-1.5 font-bold">依據</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.map((row) => (
                <tr key={row.key} className="border-b border-[var(--cc-line)] align-top">
                  <td className="py-1.5 pr-3 whitespace-nowrap font-bold text-[var(--cc-ink-strong)]">{row.label}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-[var(--cc-ink-strong)]">{(method[row.key] ?? 0).toLocaleString()}</td>
                  <td className="py-1.5 leading-relaxed text-[var(--cc-ink-mid)]">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          {`${interpretations.length} 件釋字裡，${verifiedInterpretations} 件走完兩位研究者各自判讀的程序（${method.雙人獨立一致} 件一致、${method.分歧仲裁完成} 件由第三位研究者複核），${method.單人逐案查核} 件完成單人逐案查核，其餘 ${ruleOnlyInterpretations} 件仍是規則判定。另以不同案件檢驗，120 件中有 119 件判斷一致。`}
        </p>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          {`那 ${ruleOnlyInterpretations} 件不打算逐件複核，這是研究判斷。其中 ${ruleOnlyInterpretations - 1} 件是解釋憲法，在這個區間一律填解釋憲法約 99.8% 正確，`}
          逐件複核等於確認一個常數。規則判定本身的誤差已經量過：在處境相同的 221 件上，
          規則與人工覆核相符 211 件，95.5%。拿這批分類當母體邊界用時
          （例如研究現代違憲審查要剔除統一解釋那幾個百分點），95.5% 是該一併引用的數字。
        </p>
        <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-[var(--cc-ink-soft)]">
          {method.現況聲明}
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">
          <Layers3 size={13} /> 判定順序
        </p>
        <h2 className="mt-1 text-base font-bold text-[var(--cc-title-ink)]">先看法定身分，再看裁判內容</h2>
        <ol className="mt-4 max-w-3xl space-y-2">
          {summary.判定原則?.map((rule, index) => (
            <li key={rule} className="flex gap-3 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
              <span className="shrink-0 tabular-nums font-bold text-[var(--cc-eyebrow)]">{index + 1}.</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">
          <Scale size={13} /> 各時代的制度法源
        </p>
        <h2 className="mt-1 text-base font-bold text-[var(--cc-title-ink)]">按當時有效法制定位，不用年代替案件貼內容標籤</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-left text-[12.5px]">
            <thead className="text-[var(--cc-ink-soft)]">
              <tr className="border-b border-[var(--cc-line)]">
                <th className="py-2 pr-3 font-bold">期間／系列</th>
                <th className="py-2 pr-3 font-bold">制度法源</th>
                <th className="py-2 pr-3 font-bold">法定職權</th>
                <th className="py-2 font-bold">本庫怎麼判</th>
              </tr>
            </thead>
            <tbody>
              {summary.制度法源?.map((row) => (
                <tr key={row.系列} className="border-b border-[var(--cc-line)] align-top">
                  <td className="py-2.5 pr-3">
                    <p className="tabular-nums text-[11.5px] text-[var(--cc-eyebrow)]">{row.期間}</p>
                    <p className="mt-0.5 font-bold text-[var(--cc-ink-strong)]">{row.系列}</p>
                  </td>
                  <td className="py-2.5 pr-3 leading-relaxed text-[var(--cc-ink-mid)]">{row.法源}</td>
                  <td className="py-2.5 pr-3 leading-relaxed text-[var(--cc-ink-mid)]">{row.職權}</td>
                  <td className="py-2.5 leading-relaxed text-[var(--cc-ink-mid)]">{row.分類規則}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-y border-[var(--cc-line)] py-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">
          <CheckCircle2 size={13} /> 術語限制
        </p>
        <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {summary.術語限制?.map((rule) => (
            <p key={rule} className="border-l-2 border-[var(--cc-line)] pl-3 text-[12.5px] leading-relaxed text-[var(--cc-ink-soft)]">{rule}</p>
          ))}
        </div>
        <p className="mt-5 text-[12px] text-[var(--cc-ink-soft)]">
          分類標準若有實質調整，應另以不同案件重新檢驗，不能直接沿用先前結果。
        </p>
      </section>
    </div>
  );
}
