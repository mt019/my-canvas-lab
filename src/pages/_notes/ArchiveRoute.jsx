import { Suspense, lazy } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import SeoHead from '../../components/SeoHead';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import meta from '../../data/notes-archive.json';
import { archiveSeo, postsNav } from './seo';

/*
 * 舊帖：58 則沒有成篇的短記，一頁。
 *
 * 為什麼是一頁而不是 58 頁：這些東西最短的只有六個字，一則一頁就是五十幾條點進去只有
 * 一行字的網址，而且全部進 sitemap。收成一頁之後只有這一條網址被索引。
 *
 * 正文（`src/content/notes-archive.mdx`）與它的計數（`src/data/notes-archive.json`）都是
 * 資料倉 notes-data 算好送過來的，這一頁不重算篇數、不重排順序——連「哪些算舊帖」都在
 * 那邊決定（沒定稿成單篇的草稿就是舊帖），所以某一則將來升級成正式文章時，這裡不必改。
 *
 * 正文動態載入：它是整頁 58 則的合集，跟單篇一樣不該進主 bundle。
 */
const Body = lazy(() => import('../../content/notes-archive.mdx'));

export default function ArchiveRoute() {
  const [scale, setScale] = useFontScale();

  return (
    <>
      <SeoHead page={archiveSeo(meta)} />
      <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
        <SiteHeader scale={scale} onScaleChange={setScale} />

        <ArticleLayout
          title="舊帖"
          eyebrow="手記"
          summary={
            `${meta.dateRange.from.slice(0, 4)} 到 ${meta.dateRange.to.slice(0, 4)} 年寫在 Matters 與一個已經關掉的個人站上的短記，`
            + '多半只有一兩行，最短的一則六個字。它們短到撐不起自己的一頁，所以收在這裡，'
            + '按年份排，從最早的一則讀下來。正文與當年一字不改。'
          }
          meta={
            /* 計數寫成一行字，不做統計磚——這裡的數字是這頁的範圍說明，不是這頁的內容。 */
            <p className="mt-5 border-y border-line-soft py-3 text-token-xs leading-relaxed text-ink-faint">
              <span className="font-accent tabular-nums">{meta.count}</span> 則，
              <span className="font-accent tabular-nums">{meta.dateRange.from}</span> 至{' '}
              <span className="font-accent tabular-nums">{meta.dateRange.to}</span>
              {meta.years.map((y) => (
                <span key={y.year}>
                  ；{y.year} 年 <span className="font-accent tabular-nums">{y.count}</span> 則
                </span>
              ))}
              。
            </p>
          }
          tocLabel="年份"
          tocKey="notes-archive"
          // 右欄只列年份。草稿自己的小標降級後是 `###`，其中六條都叫「補記（Matters 留言區）」，
          // 列進去等於把同一個詞印六遍。
          tocLevels={[2]}
          nav={
            <ArticleNav {...postsNav()} homeHref="/notes" homeLabel="手記" />
          }
        >
          <Prose>
            <Suspense fallback={<p className="py-10 text-token-sm text-ink-faint">正文載入中。</p>}>
              <Body />
            </Suspense>
          </Prose>
        </ArticleLayout>
      </main>
    </>
  );
}
