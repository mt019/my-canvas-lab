import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFontScale } from '../../components/FontSizeControl';
import SiteHeader from '../../components/SiteHeader';
import ArticleLayout from '../../components/lab/ArticleLayout';
import { useTabParams } from '../../components/lab/Tabs';
import {
  blindSpots,
  itemDateText,
  itemFacts,
  itemRevisedText,
  itemSections,
  itemSources,
  items,
  itemsOfSource,
  sectionId,
  todayInTaipei,
} from './data';

/*
 * 讀的東西：24 個來源、247 篇，連摘要。門口（/brief）回答「這一類今天有什麼新的」，只出
 * 每個來源的前幾篇；這裡回答「這一批到底有什麼、我要找的那篇在不在」。
 *
 * **這頁存在本身就是在修一個比例問題。** 上一版活動有一整個內頁（條列／月曆／交叉表），
 * 讀的東西一篇內頁都沒有——而資料端是 24 個來源給讀的東西、3 個給活動。版面照著「我手上
 * 剛好先做了哪一個」長，不是照著這個站是什麼長。
 *
 * 沒有月曆也沒有交叉表：那兩種看法是為了回答「時間怎麼排」「誰什麼時候有東西」，而論文
 * 沒有行程可排。**一份資料多種看法**的前提是那幾種看法各自回答得了一個真問題，不是每頁
 * 都湊三個分頁。這裡的第二種看法是篩選（來源與關鍵字），不是換軸。
 *
 * 這頁一個字都不自己編，也不自己算——連「剩幾天」都沒有，因為讀的東西沒有「來不及」。
 */

const DEFAULT_SOURCES = 'all';

/*
 * 摘要可以是 null，而且那是事實，不是漏抓。
 *
 * ECB 與 OECD 的登錄裡就是沒有 abstract；Reddit 上轉貼連結的貼文，內文本來就只有一句
 * 「submitted by /u/某人」，拆掉罐頭之後是空的——r/economics 那 25 則全部是連結。
 * 247 篇裡 36 篇沒有摘要。
 *
 * **不為了版面整齊去別的欄位硬湊。** 拿標題當摘要、拿第一個作者的名字填一行，會讓「這個
 * 來源沒有給我們摘要」這件事從畫面上消失，而讀者會以為他看到的就是全部。空著就空著；
 * 那一行少一句話，正好就是那則東西的實況。
 */
function ItemRow({ item, today }) {
  const revised = itemRevisedText(item, today);
  const facts = itemFacts(item);
  return (
    <div className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2.5 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
      <div className="text-token-xs leading-relaxed tabular-nums text-ink-faint">
        {/* datePrecision 決定印到哪一位。NBER 與 IMF 只講得出月份，印出「7/1」就是我們自己
            編了一個沒有人講過的日子——那個 1 號是資料倉為了排序補的。 */}
        {itemDateText(item, today)}
        {revised ? <div>{revised}</div> : null}
      </div>
      <div className="min-w-0">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-token-sm leading-snug text-ink transition-colors duration-fast hover:text-accent"
        >
          {item.title}
        </a>
        {item.pdfUrl ? (
          <a
            href={item.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-token-xs text-accent underline underline-offset-2"
          >
            PDF
          </a>
        ) : null}
        {facts.length > 0 ? (
          <div className="text-token-xs leading-relaxed text-ink-faint">{facts.join(' · ')}</div>
        ) : null}
        {item.summary ? (
          <p className="mt-1 text-token-xs leading-relaxed text-ink-muted">{item.summary}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function Reading() {
  const [scale, setScale] = useFontScale();
  const [{ sources: sourceParam }, setTabs] = useTabParams({ sources: DEFAULT_SOURCES });
  const [query, setQuery] = useState('');
  const today = todayInTaipei();

  const selected = useMemo(() => {
    if (sourceParam === 'all') return itemSources.map((s) => s.id);
    const ids = sourceParam.split(',').filter((id) => itemSources.some((s) => s.id === id));
    return ids.length ? ids : itemSources.map((s) => s.id);
  }, [sourceParam]);

  const write = (ids) => {
    const ordered = itemSources.filter((s) => ids.includes(s.id)).map((s) => s.id);
    setTabs({ sources: ordered.length === itemSources.length ? 'all' : ordered.join(',') });
  };

  const toggleSource = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    if (next.length === 0) return; // 一個來源都不選＝空白頁，那不是篩選是壞掉
    write(next);
  };

  /* 整類一起切。24 個來源要一個一個關掉才能只看某一類，那不是篩選是勞動。 */
  const toggleKind = (sec) => {
    const ids = sec.sources.map((s) => s.id);
    const allOn = ids.every((id) => selected.includes(id));
    const next = allOn ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])];
    if (next.length === 0) return;
    write(next);
  };

  /* 篩選只決定先看到什麼，不決定存了什麼。關鍵字掃標題、作者與摘要——摘要是 null 的那些
     照樣掃得到標題，不會因為沒摘要就從搜尋結果裡消失。 */
  const shown = useMemo(() => {
    const q = query.trim();
    return items.filter((i) => {
      if (!selected.includes(i.source)) return false;
      if (!q) return true;
      return [i.title, i.summary, i.journalRef, ...(i.authors ?? []), ...(i.topics ?? [])]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q.toLowerCase()));
    });
  }, [selected, query]);

  const blocks = useMemo(() => {
    const keep = new Set(shown.map((i) => i.id));
    return itemSections
      .map((sec) => ({
        sec,
        groups: sec.sources
          .filter((s) => selected.includes(s.id))
          .map((s) => ({ source: s, rows: itemsOfSource(s.id).filter((i) => keep.has(i.id)) }))
          .filter((g) => g.rows.length > 0),
      }))
      .filter((b) => b.groups.length > 0);
  }, [shown, selected]);

  const noSummary = shown.filter((i) => !i.summary).length;

  const rail = (
    <nav className="text-token-xs">
      <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">找標題、作者或摘要</p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="例：tariff"
        className="mb-5 w-full rounded border border-line-soft bg-paper px-2 py-1 text-token-xs text-ink outline-none focus:border-accent"
      />

      <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">來源</p>
      {itemSections.map((sec) => {
        const ids = sec.sources.map((s) => s.id);
        const allOn = ids.every((id) => selected.includes(id));
        return (
          <div key={sec.kind} className="mb-3">
            <button
              type="button"
              onClick={() => toggleKind(sec)}
              aria-pressed={allOn}
              className={`mb-0.5 text-left transition-colors duration-fast hover:text-accent ${allOn ? 'text-ink-muted' : 'text-ink-faint'}`}
            >
              {sec.kind}
            </button>
            <div className="flex flex-col items-start gap-0.5">
              {sec.sources.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSource(s.id)}
                    aria-pressed={on}
                    className={`w-full text-left transition-colors duration-fast hover:text-accent ${on ? 'text-ink' : 'text-ink-faint'}`}
                  >
                    <span className="mr-1.5 tabular-nums">{on ? '■' : '□'}</span>
                    {s.label}
                    <span className="ml-1.5 tabular-nums text-ink-faint">{itemsOfSource(s.id).length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="leading-relaxed text-ink-faint">
        篩選是視圖，不是入庫條件。沒列出來的一樣在庫裡——每個來源的配額與涵蓋範圍在
        <Link to="/brief?view=sources" className="text-accent underline underline-offset-2">
          資料來自哪裡
        </Link>
        。
      </p>
    </nav>
  );

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ zoom: scale }}>
      <SiteHeader back={{ href: '/brief', label: '簡報' }} width="article" scale={scale} onScaleChange={setScale} />
      <ArticleLayout
        title="讀的東西"
        eyebrow="Brief"
        summary="論文、講辭、機構報告、學者部落格與社群討論，連摘要。只排新舊，不倒數——這些東西沒有「來不及」。來源逐個可切，篩選在網址裡。"
        nav={rail}
        tocLabel="本頁目次"
        tocKey={`${sourceParam}-${query}-${blocks.length}`}
      >
        <section>
          <h2 id="all-items" className="font-display text-token-lg text-ink">
            這一批
            <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{shown.length} 篇</span>
          </h2>
          <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">
            {blocks.length > 0
              ? `${blocks.length} 類、${blocks.reduce((n, b) => n + b.groups.length, 0)} 個來源。`
              : ''}
            {/* 名字與數字從同一個集合算。這一行的每個數字都是 shown 自己數出來的，不是從
                coverage 搬來的——coverage 是整份資料的，跟畫面上這一批不是同一個集合。 */}
            {noSummary > 0
              ? `其中 ${noSummary} 篇沒有摘要——那是來源本來就沒給（ECB 與 OECD 的登錄裡沒有 abstract，Reddit 轉貼連結的貼文沒有內文），不是漏抓，也不拿別的欄位去湊。`
              : ''}
          </p>
        </section>

        {shown.length === 0 ? (
          <p className="py-6 text-token-sm text-ink-muted">
            {query ? `「${query}」在這個篩選底下沒有東西。` : '這個篩選底下沒有東西。'}
            　東西還在庫裡——把來源切回全部再找一次。
          </p>
        ) : (
          blocks.map(({ sec, groups }) => (
            <section key={sec.kind} className="mt-12 border-t border-line pt-6">
              <h2 id={sectionId(sec.kind)} className="font-display text-token-lg text-ink">
                {sec.kind}
                <span className="ml-2 text-token-sm tabular-nums text-ink-faint">
                  {groups.reduce((n, g) => n + g.rows.length, 0)} 篇
                </span>
              </h2>
              <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">
                {groups.map((g) => `${g.source.label} ${g.rows.length} 篇`).join('、')}
              </p>
              {groups.map(({ source, rows }) => (
                <div key={source.id} className="mt-6">
                  {/* 一個類別只有一個來源時，來源標題是廢話：「預印本 12 篇」底下再掛一個
                      「arXiv 12 篇」，同一個數字講兩遍。但 id 要留著——目次與門口的連結靠它。 */}
                  {groups.length === 1 ? (
                    <span id={`s-${source.id}`} />
                  ) : (
                    <h3 id={`s-${source.id}`} className="font-display text-token-base text-ink-muted">
                      {source.label}
                      <span className="ml-2 text-token-xs tabular-nums text-ink-faint">{rows.length} 篇</span>
                    </h3>
                  )}
                  <p className="mb-2 text-token-xs leading-relaxed text-ink-faint">{source.note}</p>
                  {rows.map((i) => (
                    <ItemRow key={i.id} item={i} today={today} />
                  ))}
                </div>
              ))}
            </section>
          ))
        )}

        <section className="mt-12 border-t border-line pt-6">
          <h2 id="blind-spots" className="font-display text-token-lg text-ink">
            這裡看不到什麼
          </h2>
          <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">
            有缺口就講出來。一份看起來完整的清單，比一份說得出自己漏了什麼的清單危險。
            每個來源的涵蓋範圍與配額在
            <Link to="/brief?view=sources" className="text-accent underline underline-offset-2">
              門口的「資料來自哪裡」
            </Link>
            。
          </p>
          <dl className="mt-4">
            {blindSpots.map((s) => (
              <div key={s.id} className="border-b border-line-soft py-2.5">
                <dt className="text-token-sm text-ink">{s.title}</dt>
                <dd className="mt-0.5 text-token-xs leading-relaxed text-ink-faint">{s.detail}</dd>
              </div>
            ))}
          </dl>
        </section>
      </ArticleLayout>
    </main>
  );
}
