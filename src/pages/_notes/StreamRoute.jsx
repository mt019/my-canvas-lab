import { useFontScale } from '../../components/FontSizeControl';
import SeoHead from '../../components/SeoHead';
import SiteHeader from '../../components/SiteHeader';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import stream from '../../data/notes-stream.json';
import { postsNav, streamSeo } from './seo';

/*
 * 短記：一句話一則，帶著它被說出來的那一刻。
 *
 * 版面照對話框做——日期橫在中間當分隔線，每則左邊一個時刻，右邊是那句話。沒有標題、沒有
 * 摘要、沒有標籤，因為那些東西寫的時候就沒有。一頁到底，不分頁也不各自成網址：理由與舊帖
 * 那頁同一條，兩三行的東西各自成篇會生出一堆點進去只有一行字的網址並全部進 sitemap。
 *
 * 月分節、日分段、時刻與段落都是資料倉 notes-data 算好送過來的（build-stream.mjs），
 * 這一頁不重算也不重排——時刻字串尤其不能進 Date，那會被換算成讀者所在的時區。
 */
export default function StreamRoute() {
  const [scale, setScale] = useFontScale();

  return (
    <>
      <SeoHead page={streamSeo(stream)} />
      <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
        <SiteHeader scale={scale} onScaleChange={setScale} />

        <ArticleLayout
          title="短記"
          eyebrow="手記"
          summary={
            '一句話一則，說的當下就記下來。每則標的時刻是按下送出的那一刻，'
            + '所以連跟伺服器收到的那幾秒差距都留著。不成篇，也不修飾。'
          }
          meta={
            <p className="mt-5 border-y border-line-soft py-3 text-token-xs leading-relaxed text-ink-faint">
              <span className="font-accent tabular-nums">{stream.count}</span> 則，最早一則在{' '}
              <span className="font-accent tabular-nums">{stream.dateRange.from.slice(0, 10)}</span>，
              最近一則在 <span className="font-accent tabular-nums">{stream.dateRange.to.slice(0, 10)}</span>。
            </p>
          }
          tocLabel="月份"
          tocKey="notes-stream"
          // 右欄只列到月。日期分隔線是版面上的節奏，列進目次會變成一長排日期。
          tocLevels={[2]}
          nav={<ArticleNav {...postsNav()} homeHref="/notes" homeLabel="手記" />}
        >
          {stream.months.map((m) => (
            <section key={m.id} className="mt-12 border-t border-line pt-8 first:mt-0 first:border-0 first:pt-0">
              <h2 id={m.id} className="font-display text-token-lg text-ink">{m.label}</h2>
              {m.days.map((d) => (
                <div key={d.day}>
                  {/* 日期分隔線橫在中間，兩邊各一條細線。只有一行短字，置中沒問題
                      （會折行的文字一律靠左，見 DESIGN.md）。年月寫在上面的分節標題上。 */}
                  <div className="my-6 flex items-center gap-4">
                    <span className="h-px flex-1 bg-line-soft" />
                    <span className="whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
                      {d.label}
                    </span>
                    <span className="h-px flex-1 bg-line-soft" />
                  </div>
                  {d.items.map((item) => <Entry key={item.id} item={item} />)}
                </div>
              ))}
            </section>
          ))}
        </ArticleLayout>
      </main>
    </>
  );
}

/* 一則。左邊是時刻，寬度寫死五個字元＋不換行＋等寬數字——時刻每則都不一樣，不鎖寬度
   整排會左右跳（DESIGN.md「會動的值要預留寬度」）。時刻本身是這一則的永久連結。 */
function Entry({ item }) {
  return (
    <div id={item.id} className="flex scroll-mt-28 gap-4 py-2.5">
      <a
        href={`#${item.id}`}
        aria-label={`${item.time} 這一則的連結`}
        className="w-[5ch] shrink-0 whitespace-nowrap pt-[0.2em] font-accent text-token-xs tabular-nums text-ink-faint transition-colors duration-fast hover:text-accent"
      >
        {item.time}
      </a>
      <div className="min-w-0 flex-1">
        {item.paras.map((para) => (
          <p key={para} className="mt-2 whitespace-pre-line text-token-base leading-relaxed text-ink first:mt-0">
            {linkify(para)}
          </p>
        ))}
        {(item.images ?? []).map((img) => (
          <img key={img.src} src={img.src} alt={img.alt} loading="lazy" className="mt-3 max-w-full rounded-token-sm" />
        ))}
      </div>
    </div>
  );
}

/* 貼進來的網址要能點。短記裡會出現的格式只有網址與換行兩種，都在這裡處理掉，
   不必為了這件事把一整個 markdown 渲染器扛進來。 */
const URL_RE = /(https?:\/\/[^\s，。、）)]+)/g;
function linkify(text) {
  return text.split(URL_RE).map((part, i) => (i % 2 === 1 ? (
    <a key={part} href={part} target="_blank" rel="noreferrer" className="text-accent underline decoration-line underline-offset-2">
      {part}
    </a>
  // eslint-disable-next-line react/no-array-index-key
  ) : <span key={i}>{part}</span>));
}
