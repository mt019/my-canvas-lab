import useHeadings from './useHeadings';

/*
 * "On this page": the headings of the article that is actually on screen, read
 * out of the DOM rather than declared by hand, so a heading added to the .mdx
 * shows up here without anyone maintaining a list. The entry for the section the
 * reader is currently in stays marked as they scroll.
 *
 * 量測本身在 useHeadings。版型殼（ArticleLayout、DashboardLayout）自己呼叫那支 hook，
 * 因為它要先知道有沒有標題，才決定右欄那條軌道留不留；量完把結果用 items／active 傳進來，
 * 於是同一頁的手機版（details）與桌機版（側欄）兩份目次共用一次量測。單獨用這個元件的
 * 頁面不傳 items，它就自己量。
 */
export default function TableOfContents({
  containerRef, label = '本頁目次', refreshKey, levels = [2, 3], items, active,
}) {
  // hook 不能寫在條件裡：外面已經量好時就不給它容器，它會回一份空的。
  const own = useHeadings(items ? null : containerRef, { levels, refreshKey });
  const list = items ?? own.items;
  const current = items ? active : own.active;

  if (list.length === 0) return null;

  return (
    <nav aria-label={label} className="text-token-xs leading-relaxed">
      <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <ul className="space-y-1.5 border-l border-line-soft">
        {list.map((it) => {
          const on = it.id === current;
          return (
            <li key={it.id} style={{ paddingLeft: it.level === 3 ? 22 : 12 }}>
              {/*
                * 側欄只有 13rem 寬，長標題在這裡最多折兩行，第三行起截斷（滑過去看完整標題）。
                * line-break: strict 讓中日文的斷行避開「（」「）」「、」這些位置——沒有它，
                * 「倚音（上方與下方）」會斷成「…（上方與下」＋「方）」，讀起來像壞掉。
                * text-wrap: pretty 讓最後一行不會只剩一兩個字。
                */}
              <a
                href={`#${it.id}`}
                title={it.full}
                className="-ml-px block border-l-2 py-0.5 pl-2 transition-colors duration-fast [line-break:strict] [text-wrap:pretty] line-clamp-2"
                style={{
                  borderColor: on ? 'var(--c-accent)' : 'transparent',
                  color: on ? 'var(--c-ink)' : 'var(--c-ink-faint)',
                }}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
