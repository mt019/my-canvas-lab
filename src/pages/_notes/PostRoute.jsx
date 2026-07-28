import { Suspense, lazy, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFontScale } from '../../components/FontSizeControl';
import SeoHead from '../../components/SeoHead';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import ArticleMeta from '../../components/lab/ArticleMeta';
import data from '../../data/notes.json';
import { postSeo } from './seo';

/*
 * 一篇手記，一頁。
 *
 * 正文是資料倉同步過來的 .mdx，**按 slug 動態載入**：glob 不加 eager，每篇編成自己的
 * chunk，所以文章累積下去不會把這條路由的包越拖越大，更不會進主 bundle（這條路由本身在
 * App.jsx 也是 lazy 的）。新增一篇文章不必碰這個檔。
 */
const bodies = import.meta.glob('../../content/notes/*.mdx');

export default function PostRoute() {
  const { slug } = useParams();
  const [scale, setScale] = useFontScale();

  const post = data.posts.find((p) => p.slug === slug);
  const Body = useMemo(() => {
    const loader = bodies[`../../content/notes/${slug}.mdx`];
    return loader ? lazy(loader) : null;
  }, [slug]);

  if (!post || !Body) {
    return (
      <main className="min-h-screen bg-paper py-20 text-ink">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-token-lg">查無此文。</p>
          <Link to="/notes" className="mt-4 inline-block text-token-sm text-accent hover:underline">
            回手記
          </Link>
        </div>
      </main>
    );
  }

  // 左欄列出全部文章，讀完一篇不必回首頁才能讀下一篇。ArticleNav 吃的是 topic 分組的
  // 形狀，手記按年份分節，所以年份就是它的 topic。
  const topics = [...new Set(data.posts.map((p) => p.publishedAt.slice(0, 4)))].map((year) => ({
    id: year,
    label: `${year} 年`,
  }));
  const articles = data.posts.map((p) => ({ ...p, topic: p.publishedAt.slice(0, 4) }));

  return (
    <>
      <SeoHead page={postSeo(post)} />
      <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
        {/* 返回鍵直接在這裡指定，不走 backNav.js 的 SITE_HOMES。那張表現在有兩個消費者：
            返回鍵，以及報頭（`PageIdentity` 把眉標＋大標整塊做成回站首頁的連結）。手記
            登記進去的話，文章標題會跟著變成一顆連結——2026-07-28 使用者：「這個 title
            區域變成返回 note 主頁的按鈕了，太奇怪」。 */}
        <SiteHeader back={{ href: '/notes', label: '手記' }} scale={scale} onScaleChange={setScale} />

        <ArticleLayout
          title={post.title}
          eyebrow="手記"
          summary={post.subtitle}
          meta={
            <ArticleMeta
              publishedAt={post.publishedAt}
              updatedAt={post.updatedAt}
              readingMinutes={post.readingMinutes}
              tags={post.tags ?? []}
            />
          }
          tocLabel="本頁目次"
          tocKey={slug}
          // 沒有 `##` 小標的短文（多數手記都是）不畫右欄目次，但閱讀欄維持原本的寬度。
          hideToc={!post.hasSections}
          keepReadingWidth
          nav={
            <ArticleNav
              topics={topics}
              articles={articles}
              currentSlug={slug}
              homeHref="/notes"
              homeLabel="手記"
            />
          }
        >
          <Prose>
            <Suspense fallback={<p className="py-10 text-token-sm text-ink-faint">正文載入中。</p>}>
              <Body />
            </Suspense>
          </Prose>

          {(post.related ?? []).length > 0 ? (
            <section className="mt-12 border-t border-line-soft pt-6">
              <h2 className="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">延伸</h2>
              <ul className="space-y-2">
                {post.related.map((item) => (
                  <li key={item.href} className="text-token-sm leading-relaxed">
                    <Link to={item.href} className="text-ink transition-colors duration-fast hover:text-accent">
                      {item.label}
                    </Link>
                    {item.note ? <span className="text-ink-faint">——{item.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </ArticleLayout>
      </main>
    </>
  );
}
