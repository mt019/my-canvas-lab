import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Info } from 'lucide-react';
import HoverCard from '../../components/lab/HoverCard';
import data from '../../data/constitutionalCourt.json';
import { ccJusticePath } from './seo';
import { docs, Select, justices, opinionTypeEntries } from './shared';

const participated = (j) => (j.參與解釋 ?? 0) + (j.參與判決 ?? 0);
const voiceRate = (j) => participated(j) ? j.提出意見書 / participated(j) : 0;
const directionCounts = (j) => {
  let cooperative = 0, mixed = 0, dissenting = 0;
  for (const [type, count] of Object.entries(j.意見書類型 ?? {})) {
    const hasCoop = type.includes('協同');
    const hasDissent = type.includes('不同');
    if (hasCoop && hasDissent) mixed += count;
    else if (hasDissent) dissenting += count;
    else cooperative += count;
  }
  return { cooperative, mixed, dissenting, dissentInclusive: mixed + dissenting };
};
const dissentVoiceRate = (j) => participated(j) ? directionCounts(j).dissentInclusive / participated(j) : 0;
const dissentCaseCount = (j) => {
  const cases = new Set();
  for (const d of docs) {
    if (!d.參與大法官?.includes(j.姓名)) continue;
    if (d.意見書?.some((op) => op.作者類別 === '大法官'
      && (op.提出?.includes(j.姓名) || op.加入?.includes(j.姓名))
      && op.類型?.includes('不同'))) cases.add(d.字號);
  }
  return cases.size;
};
const dissentCaseRate = (j) => participated(j) ? dissentCaseCount(j) / participated(j) : 0;
const pct = (v) => `${Math.round(v * 100)}%`;
const DIRECTION_COLORS = {
  // 意見方向是有順序的光譜，不是三個無序類別：沿本頁玫瑰墨 identity 做單色明度序列。
  cooperative: 'var(--cc-link-underline)',
  mixed: 'var(--cc-eyebrow)',
  dissenting: 'var(--cc-highlight)',
  track: 'var(--cc-hover-bg)',
};

function MetricInfo({ label }) {
  return (
    <HoverCard
      interactive={false}
      width={280}
      label={label}
      className="ml-1 inline-flex cursor-help rounded-full align-middle text-[var(--cc-ink-soft)] opacity-55 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cc-accent)]"
      card={<p className="text-[11.5px] font-normal leading-relaxed text-[var(--cc-ink-mid)]">{label}</p>}
    >
      <Info aria-hidden="true" size={11} strokeWidth={1.8} />
    </HoverCard>
  );
}

function SortButton({ children, metric, sortKey, sortDirection, onSort }) {
  const active = sortKey === metric;
  return (
    <button
      type="button"
      onClick={() => onSort(metric)}
      className={`group inline-flex items-center gap-0.5 text-left transition-colors hover:text-[var(--cc-accent)] ${active ? 'text-[var(--cc-accent)]' : ''}`}
      aria-label={`${children}排序；目前${active ? (sortDirection === 'desc' ? '由高至低' : '由低至高') : '未選取'}`}
    >
      <span>{children}</span>
      <ArrowDown
        aria-hidden="true"
        size={11}
        strokeWidth={1.8}
        className={`transition-all ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-45'} ${active && sortDirection === 'asc' ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

function BehaviorRatios({ j }) {
  const dir = directionCounts(j);
  const dissentCases = dissentCaseCount(j);
  return (
    <>
      <td className="px-2 py-2">
        <div className="flex min-w-[108px] items-center gap-2" title={`發聲 ${j.提出意見書}／${participated(j)}（${pct(voiceRate(j))}）；異議發聲 ${dir.dissentInclusive}／${participated(j)}（${pct(dissentVoiceRate(j))}）；協同 ${dir.cooperative}・混合 ${dir.mixed}・不同 ${dir.dissenting}`}>
          <span className="w-8 text-right font-bold tabular-nums text-[var(--cc-accent)]">{pct(voiceRate(j))}</span>
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: DIRECTION_COLORS.track }}>
            <span className="h-full" style={{ width: pct(dir.cooperative / (participated(j) || 1)), background: DIRECTION_COLORS.cooperative }} />
            <span className="h-full" style={{ width: pct(dir.mixed / (participated(j) || 1)), background: DIRECTION_COLORS.mixed }} />
            <span className="h-full" style={{ width: pct(dir.dissenting / (participated(j) || 1)), background: DIRECTION_COLORS.dissenting }} />
          </div>
        </div>
      </td>
      <td className="w-[160px] px-3 py-2">
        {j.提出意見書 ? (
          <div title={`具名提出或加入異議的案件 ${dissentCases} ÷ 參與案件 ${participated(j)}；同案只計一次`}>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold tabular-nums text-[var(--cc-accent)]">{pct(dissentCaseRate(j))}</span>
              <span className="text-[10px] tabular-nums text-[var(--cc-ink-soft)]">{dissentCases}／{participated(j)} 案</span>
            </div>
          </div>
        ) : <span className="text-[var(--cc-ink-soft)]">—</span>}
      </td>
    </>
  );
}

export default function JusticesView() {
  const [sortKey, setSortKey] = useState('rate:dissent-case');
  const [sortDirection, setSortDirection] = useState('desc');
  // sortKey 前綴 type: ＝按某一意見書類型的件數排（值取自 意見書類型 物件，與該列顯示的數字同源），
  // 否則按頂層統計欄。
  const valueOf = (j, key) => key === 'rate:voice' ? voiceRate(j)
    : key === 'rate:dissent-case' ? dissentCaseRate(j)
      : key === 'rate:dissent-voice' ? dissentVoiceRate(j)
      : key.startsWith('type:') ? (j.意見書類型?.[key.slice(5)] ?? 0) : (j[key] ?? 0);
  const list = useMemo(
    () => [...justices].sort((a, b) => {
      const delta = valueOf(b, sortKey) - valueOf(a, sortKey);
      return sortDirection === 'desc' ? delta : -delta;
    }),
    [sortDirection, sortKey],
  );
  const activateSort = (key) => {
    if (key === sortKey) setSortDirection((d) => d === 'desc' ? 'asc' : 'desc');
    else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };
  const max = Math.max(...justices.map((j) => j.提出意見書));

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">逐人統計</p>
          <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">大法官意見書行為（{justices.length} 位，來源：官方意見書檔名與判決欄位）</h2>
        </div>
        <Select
          label="其他排序"
          value={sortKey.startsWith('type:') || sortKey === 'rate:dissent-voice' ? sortKey : ''}
          onChange={(key) => { if (key) { setSortKey(key); setSortDirection('desc'); } }}
          options={[["", "選擇指標"], ["rate:dissent-voice", "異議發聲率"], ["type:不同意見書", "不同意見書數"], ["type:協同意見書", "協同意見書數"]]}
        />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--cc-table-border)]">
        <table className="w-full min-w-[980px] border-collapse bg-white text-left text-[12.5px]">
          {/* 表頭語意換行：動詞一行、受詞一行（提出／意見書…），避免瀏覽器把窄欄硬拆成
              4字+3字+1字的醜換行；姓名與意見書類型不換行（4字名、長類型串靠整表橫捲）。 */}
          <thead className="bg-[var(--cc-hover-bg)] text-[var(--cc-table-head-ink)] align-bottom">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap">大法官</th>
              <th className="px-2 py-2 whitespace-nowrap"><SortButton metric="提出意見書" sortKey={sortKey} sortDirection={sortDirection} onSort={activateSort}><span className="block leading-tight">提出</span><span className="block leading-tight">意見書</span></SortButton></th>
              <th className="px-1 py-2 w-[84px]"></th>
              <th className="px-2 py-2 whitespace-nowrap"><SortButton metric="rate:voice" sortKey={sortKey} sortDirection={sortDirection} onSort={activateSort}>發聲率</SortButton><MetricInfo label="色帶總長＝提出意見書數 ÷ 參與案件數；色段依序為協同、混合、不同。外部「更多排序」可改按異議發聲率＝本人提出的不同或混合意見書數 ÷ 參與案件數排序。" /></th>
              <th className="w-[160px] px-3 py-2 whitespace-nowrap">
                <span className="block"><SortButton metric="rate:dissent-case" sortKey={sortKey} sortDirection={sortDirection} onSort={activateSort}>案件異議率</SortButton><MetricInfo label="具名提出或加入不同／混合意見的案件數 ÷ 實際參與案件數；同案只計一次。主筆與加入仍在各自欄位分開計數。" /></span>
              </th>
              <th className="px-2 py-2 whitespace-nowrap"><SortButton metric="加入意見書" sortKey={sortKey} sortDirection={sortDirection} onSort={activateSort}><span className="block leading-tight">加入</span><span className="block leading-tight">意見書</span></SortButton></th>
              <th className="px-2 py-2 whitespace-nowrap"><SortButton metric="主筆判決" sortKey={sortKey} sortDirection={sortDirection} onSort={activateSort}><span className="block leading-tight">主筆</span><span className="block leading-tight">判決</span></SortButton></th>
              <th className="px-2 py-2 whitespace-nowrap"><SortButton metric="參與解釋" sortKey={sortKey} sortDirection={sortDirection} onSort={activateSort}><span className="block leading-tight">參與</span><span className="block leading-tight">解釋</span></SortButton></th>
              <th className="px-2 py-2 whitespace-nowrap"><SortButton metric="參與判決" sortKey={sortKey} sortDirection={sortDirection} onSort={activateSort}><span className="block leading-tight">參與</span><span className="block leading-tight">裁判</span></SortButton></th>
              <th className="px-3 py-2 whitespace-nowrap">意見書類型</th>
            </tr>
          </thead>
          <tbody>
            {list.map((j) => (
              <tr key={j.姓名} className="border-t border-[var(--cc-row-border)]">
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link to={ccJusticePath(j.姓名)} className="font-bold text-[var(--cc-ink-heavy)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{j.姓名}</Link>
                </td>
                <td className="px-2 py-2 font-bold text-[var(--cc-accent)]">{j.提出意見書}</td>
                <td className="px-1 py-2">
                  <div className="h-1.5 rounded-full bg-[var(--cc-track)]">
                    <div className="h-1.5 rounded-full" style={{ width: `${(j.提出意見書 / max) * 100}%`, background: 'var(--cc-highlight)' }} />
                  </div>
                </td>
                <BehaviorRatios j={j} />
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.加入意見書}</td>
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.主筆判決 || '—'}</td>
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.參與解釋 || '—'}</td>
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.參與判決 || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--cc-ink-soft)]">
                  {opinionTypeEntries(j.意見書類型).map(([k, v]) => `${k.replace('意見書', '')} ${v}`).join('・') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        統計基礎：行憲後 {data.統計.行憲後} 件（大法官釋字 {data.統計.機關?.大法官 ?? 813}・憲法法庭裁判 {(data.統計.判決 ?? 0) + (data.統計.實體裁定 ?? 0)}）中具名的大法官意見書；行憲前統一解釋無大法官具名意見書、不計入。參與解釋計自官方頁末尾的大法官署名列（813 件全覆蓋；
        迴避或未參與評議者不在署名列，故非任期推定）；參與裁判計自憲法法庭判決/裁定的官方合議庭名單。案件異議率以實際參與案件為分母，具名提出或加入均納入，同案只計一次；公式可由欄名旁的 i 查看。點姓名開個人頁。
      </p>
    </section>
  );
}
