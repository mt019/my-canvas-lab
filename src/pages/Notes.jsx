import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import AppearanceMenu from '../components/AppearanceMenu';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParam } from '../components/lab/Tabs';
import Dropdown from '../components/lab/Dropdown';
import FilterBar from '../components/lab/FilterBar';
import SectionLink from '../components/lab/SectionLink';
import data from '../data/notes.json';
import archive from '../data/notes-archive.json';
import stream from '../data/notes-stream.json';

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
      {/* 短記入口放在最上面。它是這個站唯一每天會變的東西，排在 57 篇之後等於藏起來
          （2026-07-29 使用者：「短記在首頁看不見？」）。最新那一則的內容與截斷都在資料倉
          算好（notes-stream.json 的 latest），這裡只印。 */}
      <SectionLink to="/notes/stream" title="短記" count={stream.count} className="mb-8">
        <span className="mr-2 whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
          {stream.latest.date} {stream.latest.time}
        </span>
        {stream.latest.text}
      </SectionLink>

      {/* 標籤：48 個裡有 30 個只用一次，攤平成一整面牆會佔掉五行、而且讀起來像目錄不像
          篩選器（2026-07-29 使用者：「tag 太多太佔版面且不直覺」）。收進一顆可搜尋的
          下拉，選中的那個另外標出來，按一下就清掉。 */}
      <FilterBar
        label="標籤"
        note={tag === 'all' ? null : `列出 ${shown.length} 篇，全部共 ${posts.length} 篇`}
        className="mb-10"
      >
        <Dropdown
          value={tag}
          onChange={(v) => setTag(v, { scroll: 'preserve' })}
          options={[
            { value: 'all', label: `全部（${posts.length}）` },
            ...tags.map((t) => ({ value: t.label, label: `${t.label}（${t.count}）` })),
          ]}
          panelWidth="w-64"
        />
        {tag === 'all' ? null : (
          <button
            type="button"
            onClick={() => setTag('all', { scroll: 'preserve' })}
            className="text-token-sm text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
          >
            清除
          </button>
        )}
      </FilterBar>

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

      {/* 舊帖：短到撐不起一頁的那些收在一頁，不混進上面的清單（它們沒有摘要也沒有標籤，
          排進去只會是一整排空欄位）。篇數從資料倉的 notes-archive.json 來，不寫死。 */}
      <div className="mt-14 border-t border-line pt-2">
        <SectionLink to="/notes/archive" title="舊帖" count={archive.count}>
          {archive.dateRange.from.slice(0, 4)}–{archive.dateRange.to.slice(0, 4)} 年的短記，多半只有一兩行，
          最短的一則六個字。收在同一頁上，按年份排。
        </SectionLink>
      </div>

      <div className="mt-10 border-t border-line-soft pt-5">
        <p className="text-token-sm leading-relaxed text-ink-faint">{site.note}</p>
      </div>
    </DashboardLayout>
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
