import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import AppearanceMenu from '../components/AppearanceMenu';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParam } from '../components/lab/Tabs';
import data from '../data/notes.json';

/*
 * 手記的首頁：一份按年份分節、由新到舊的清單。
 *
 * 文章與它的 meta 都來自資料倉（notes-data），這一頁只負責印出來——新增一篇的動作全部
 * 發生在那邊，這個檔不會跟著長。年份是 h2、每篇標題是 h3，所以右欄目次自動變成「年份底下
 * 有哪幾篇」的活目錄，不必另外維護一份。
 *
 * 標籤是篩選、不是分類頁：只有兩位數的文章量還撐不起一頁一標籤（那會生出一堆只有一篇文章
 * 的路由），所以選擇留在網址的 ?tag= 上，貼得出去也回得來。
 */
export default function Notes() {
  const { site, posts = [], tags = [] } = data;
  const [scale, setScale] = useFontScale();
  const [tag, setTag] = useTabParam('tag', 'all');

  const shown = useMemo(
    () => (tag === 'all' ? posts : posts.filter((post) => (post.tags ?? []).includes(tag))),
    [posts, tag],
  );

  // 年份分節。posts 已在資料倉按日期排好，這裡只切段，不重排。
  const years = useMemo(() => {
    const out = [];
    for (const post of shown) {
      const year = post.publishedAt.slice(0, 4);
      const last = out[out.length - 1];
      if (last?.year === year) last.list.push(post);
      else out.push({ year, list: [post] });
    }
    return out;
  }, [shown]);

  return (
    <DashboardLayout
      scale={scale}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow="Notes"
      title={site.title}
      summary={site.intro}
      tocLabel="本頁區塊"
      refreshKey={tag}
    >
      <div className="mb-10 flex flex-wrap items-center gap-2 border-b border-line-soft pb-5">
        <TagButton label="全部" count={posts.length} on={tag === 'all'} onClick={() => setTag('all', { scroll: 'preserve' })} />
        {tags.map((t) => (
          <TagButton
            key={t.label}
            label={t.label}
            count={t.count}
            on={tag === t.label}
            onClick={() => setTag(tag === t.label ? 'all' : t.label, { scroll: 'preserve' })}
          />
        ))}
      </div>

      {years.map((group, i) => (
        <section key={group.year} className={i === 0 ? '' : 'mt-12 border-t border-line pt-8'}>
          <h2 id={`year-${group.year}`} className="font-display text-token-lg text-ink">
            {group.year}
          </h2>
          <div className="mt-1">
            {group.list.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ))}

      {shown.length === 0 ? (
        <p className="py-10 text-token-sm text-ink-faint">沒有標記「{tag}」的文章。</p>
      ) : null}

      <div className="mt-14 border-t border-line-soft pt-5">
        <p className="text-token-sm leading-relaxed text-ink-faint">{site.note}</p>
      </div>
    </DashboardLayout>
  );
}

/* 標籤鈕。選中的那顆用 accent 的細框與字色標出來，沒有底色——一整排實色藥丸會把清單本身
   壓下去，而這排東西是篩選器，不是內容。 */
function TagButton({ label, count, on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-baseline gap-1.5 rounded-token-sm border px-2.5 py-1 text-token-sm transition-colors duration-fast ${
        on ? 'border-accent text-accent' : 'border-line-soft text-ink-muted hover:border-accent hover:text-accent'
      }`}
    >
      {label}
      <span className="font-accent text-token-xs tabular-nums text-ink-faint">{count}</span>
    </button>
  );
}

/* 一篇的列。標題是 h3，右欄目次靠它列出這一年有哪幾篇。 */
function PostRow({ post }) {
  return (
    <Link
      to={post.route}
      className="group -mx-3 block rounded-token-md px-3 py-5 transition-colors duration-fast hover:bg-surface"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3
          id={`post-${post.slug}`}
          className="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent"
        >
          {post.title}
        </h3>
        <ArrowRight
          size={16}
          className="shrink-0 text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>
      {post.subtitle ? <p className="mt-1 text-token-sm text-ink-muted">{post.subtitle}</p> : null}
      <p className="mt-2 text-token-sm leading-relaxed text-ink-faint">{post.summary}</p>
      <p className="mt-3 font-accent text-token-xs text-ink-faint">
        {post.publishedAt}
        {post.readingMinutes ? ` · 約 ${post.readingMinutes} 分鐘` : ''}
        {(post.tags ?? []).length > 0 ? ` · ${post.tags.join('、')}` : ''}
      </p>
    </Link>
  );
}
