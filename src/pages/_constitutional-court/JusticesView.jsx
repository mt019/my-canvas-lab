import { useMemo, useState } from 'react';
import data from '../../data/constitutionalCourt.json';
import { Select, justices } from './shared';

export default function JusticesView({ onOpen }) {
  const [sortKey, setSortKey] = useState('提出意見書');
  const list = useMemo(
    () => [...justices].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0)),
    [sortKey],
  );
  const max = Math.max(...justices.map((j) => j.提出意見書));

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">逐人統計</p>
          <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">大法官意見書行為（{justices.length} 位，來源：官方意見書檔名與判決欄位）</h2>
        </div>
        <Select label="排序" value={sortKey} onChange={setSortKey} options={[['提出意見書', '提出意見書數'], ['加入意見書', '加入意見書數'], ['主筆判決', '主筆判決數'], ['參與解釋', '參與解釋數'], ['參與判決', '參與裁判數']]} />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--cc-table-border)]">
        <table className="w-full min-w-[760px] border-collapse bg-white text-left text-[12.5px]">
          {/* 表頭語意換行：動詞一行、受詞一行（提出／意見書…），避免瀏覽器把窄欄硬拆成
              4字+3字+1字的醜換行；姓名與意見書類型不換行（4字名、長類型串靠整表橫捲）。 */}
          <thead className="bg-[var(--cc-hover-bg)] text-[var(--cc-table-head-ink)] align-bottom">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap">大法官</th>
              <th className="px-2 py-2 whitespace-nowrap"><span className="block leading-tight">提出</span><span className="block leading-tight">意見書</span></th>
              <th className="px-1 py-2 w-[84px]"></th>
              <th className="px-2 py-2 whitespace-nowrap"><span className="block leading-tight">加入</span><span className="block leading-tight">意見書</span></th>
              <th className="px-2 py-2 whitespace-nowrap"><span className="block leading-tight">主筆</span><span className="block leading-tight">判決</span></th>
              <th className="px-2 py-2 whitespace-nowrap"><span className="block leading-tight">參與</span><span className="block leading-tight">解釋</span></th>
              <th className="px-2 py-2 whitespace-nowrap"><span className="block leading-tight">參與</span><span className="block leading-tight">裁判</span></th>
              <th className="px-3 py-2 whitespace-nowrap">意見書類型</th>
            </tr>
          </thead>
          <tbody>
            {list.map((j) => (
              <tr key={j.姓名} className="border-t border-[var(--cc-row-border)]">
                <td className="px-3 py-2 whitespace-nowrap">
                  <button onClick={() => onOpen?.(j.姓名)} className="font-bold text-[var(--cc-ink-heavy)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{j.姓名}</button>
                </td>
                <td className="px-2 py-2 font-bold text-[var(--cc-accent)]">{j.提出意見書}</td>
                <td className="px-1 py-2">
                  <div className="h-1.5 rounded-full bg-[var(--cc-track)]">
                    <div className="h-1.5 rounded-full" style={{ width: `${(j.提出意見書 / max) * 100}%`, background: 'var(--cc-highlight)' }} />
                  </div>
                </td>
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.加入意見書}</td>
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.主筆判決 || '—'}</td>
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.參與解釋 || '—'}</td>
                <td className="px-2 py-2 text-[var(--cc-ink-mid)]">{j.參與判決 || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--cc-ink-soft)]">
                  {Object.entries(j.意見書類型 ?? {}).map(([k, v]) => `${k.replace('意見書', '')} ${v}`).join('・') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        統計基礎：行憲後 {data.統計.行憲後} 件（大法官釋字 {data.統計.機關?.大法官 ?? 813}・憲法法庭裁判 {(data.統計.判決 ?? 0) + (data.統計.實體裁定 ?? 0)}）中具名的大法官意見書；行憲前統一解釋無大法官具名意見書、不計入。參與解釋計自官方頁末尾的大法官署名列（813 件全覆蓋；
        迴避或未參與評議者不在署名列，故非任期推定）；參與裁判計自憲法法庭判決/裁定的官方合議庭名單。點姓名開個人頁。
      </p>
    </section>
  );
}
