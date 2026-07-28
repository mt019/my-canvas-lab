import { useRef } from 'react';
import { SHELL_PAD_X_RAIL } from '../shellPadding';
import { Link } from 'react-router-dom';
import TableOfContents from './TableOfContents';
import PageIdentity from '../PageIdentity';

/*
 * The shell a long article sits in: a quiet rail of everything else there is to
 * read on the left, the reading column in the middle at its own measure, and the
 * headings of the current piece on the right. GitBook and bookdown put the same
 * three things in the same places, and readers of technical prose already know
 * where to look.
 *
 * Both rails are sticky and both disappear below a wide screen, where the reading
 * column takes the whole width and the headings collapse into a summary at the top
 * — a sidebar squeezed onto a phone is worse than no sidebar.
 *
 * Neither the reading column nor the rail is a colored panel. A tinted block of
 * any hue sits against the paper's own warmth and fights it; the only colors that
 * survive next to body text are the ones already in the ink. So the rail is text
 * on paper with a hairline beside it, and the single accent in the whole shell is
 * the mark on wherever the reader currently is.
 */
export default function ArticleLayout({
  title, eyebrow, summary, meta, nav, tocLabel, tocKey,
  // 右欄目次要列到第幾層。預設 h2＋h3。存檔頁那種「一頁收很多則、每則自己帶小標」的
  // 版面傳 [2]：小標在那裡重複（六則各有一條「補記（Matters 留言區）」），列進去是把
  // 同一個詞印六遍，不是導覽。
  tocLevels = [2, 3],
  // 本頁本來就沒有區塊標題可列（單篇原文只有段落），或右欄會跟左欄列出同一份東西時關掉。
  // 與 DashboardLayout 的同名 prop 同一個理由：同一件事講兩次不是導覽，是雜訊。
  hideToc = false,
  // 收起右欄時，中欄預設吃掉騰出來的寬度（清單與表格用得到）。散文頁傳 true：一篇短文
  // 沒有小標可列，但它的行長不該因此變長——44rem 那條閱讀欄寬本來就是照行長訂的，
  // 空出來的地方留白即可。
  keepReadingWidth = false,
  compactReading = false,
  mobileNavLabel,
  scaleContent = true,
  children,
}) {
  const bodyRef = useRef(null);

  return (
    <div className={`mx-auto grid max-w-[86rem] gap-10 ${SHELL_PAD_X_RAIL} lg:gap-12 ${
      // 收起右欄時中欄吃掉騰出來的寬度（44＋14＋gap），不留一條空白軌道。散文本來就
      // 由內容自己的 max-w 收住行長，會用到這段多出來的寬度的是清單與表格。
      compactReading
        ? 'lg:grid-cols-[15rem_minmax(0,44rem)]'
        : hideToc && !keepReadingWidth
        ? 'lg:grid-cols-[15rem_minmax(0,61rem)]'
        : 'lg:grid-cols-[15rem_minmax(0,44rem)_14rem]'
    }`}>
      <aside className="hidden lg:block">
        {/* Clears the sticky site bar above it (see SiteHeader) — a rail that
            slides under the toolbar loses its first item. */}
        <div className="sticky top-16 max-h-[calc(100vh-6rem)] overflow-y-auto border-r border-line-soft pr-5">
          {nav}
        </div>
      </aside>

      {/* Nothing behind the words: no fill, and no texture of its own either. The
          paper grain belongs to the whole page (see the page component) — painted
          onto this column alone it draws a visible rectangle, which is a panel by
          another name. */}
      {/* reader-scale: 字級放大只縮放這欄閱讀內容，兩側導覽 rail 與工具列固定。欄寬由
          grid track（minmax(0,44rem)）決定、在 zoom 之外，所以邊界不隨字級移動。 */}
      <article className={scaleContent ? 'reader-scale' : ''}>
        <header className="mb-8">
          <PageIdentity eyebrow={eyebrow} title={title} summary={summary} />
          {meta}
        </header>

        {mobileNavLabel ? (
          <details className="mb-8 rounded-token-md border border-line-soft px-4 py-3 lg:hidden">
            <summary className="cursor-pointer text-token-sm text-ink-muted">{mobileNavLabel}</summary>
            <div className="mt-3">{nav}</div>
          </details>
        ) : null}

        {hideToc ? null : (
          <details className="mb-8 rounded-token-md border border-line-soft px-4 py-3 lg:hidden">
            <summary className="cursor-pointer text-token-sm text-ink-muted">{tocLabel ?? '本頁目次'}</summary>
            <div className="mt-3">
              <TableOfContents containerRef={bodyRef} label={tocLabel} refreshKey={tocKey} levels={tocLevels} />
            </div>
          </details>
        )}

        <div ref={bodyRef}>{children}</div>
      </article>

      {hideToc ? null : (
        <aside className="hidden lg:block">
          {/* Clears the sticky site bar above it (see SiteHeader) — a rail that
              slides under the toolbar loses its first item. */}
          <div className="sticky top-16 max-h-[calc(100vh-6rem)] overflow-y-auto pb-10">
            <TableOfContents containerRef={bodyRef} label={tocLabel} refreshKey={tocKey} levels={tocLevels} />
          </div>
        </aside>
      )}
    </div>
  );
}

/* The left rail: the other articles, grouped by topic. A reader who liked one
   piece is one click from the rest, without going back to the hub. */
export function ArticleNav({ topics = [], articles = [], currentSlug, homeHref, homeLabel, lang = 'zh' }) {
  const label = (t) => (lang === 'en' ? t.en?.label ?? t.label : t.label);
  const title = (a) => (lang === 'en' ? a.en?.title ?? a.title : a.title);

  return (
    <nav aria-label={homeLabel} className="text-token-xs">
      <Link
        to={homeHref}
        className="mb-4 block font-accent uppercase tracking-[0.12em] text-ink-faint transition-colors duration-fast hover:text-accent"
      >
        {homeLabel}
      </Link>
      {topics.map((t) => {
        const list = articles.filter((a) => a.topic === t.id);
        if (list.length === 0) return null;
        return (
          <div key={t.id} className="mb-5">
            <p className="mb-1.5 text-ink-muted">{label(t)}</p>
            <ul className="space-y-1 border-l border-line-soft">
              {list.map((a) => {
                const on = a.slug === currentSlug;
                return (
                  <li key={a.slug}>
                    <Link
                      to={a.route}
                      className="-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors duration-fast"
                      style={{
                        borderColor: on ? 'var(--c-accent)' : 'transparent',
                        color: on ? 'var(--c-ink)' : 'var(--c-ink-faint)',
                      }}
                    >
                      {title(a)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
