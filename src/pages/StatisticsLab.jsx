import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import LangSwitch, { useLang } from '../components/LangSwitch';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import AppearanceMenu from '../components/AppearanceMenu';
import { useTabParam } from '../components/lab/Tabs';
import DashboardLayout from '../components/lab/DashboardLayout';
import data from '../data/statistics.json';

/*
 * The hub, as a dashboard. It used to be a flat index inside PageShell; now it
 * sits in the same shell /brief does (DashboardLayout): a sticky tab bar picks
 * 文章 or 術語, the left rail lists the sections of whichever tab is open, and
 * the right rail (SubOutline) follows the reader down whichever section they are
 * in. The pattern is the reusable canvas layout — see docs/DESIGN.md.
 *
 * Everything still comes from the data repo: a new article means a new entry in
 * statistics.json and nothing here changes. The tab structure is deliberately
 * about kind (articles vs terms), not topic — topics are the h2 sections inside
 * the 文章 tab, so they grow into the left rail on their own as the site grows.
 *
 * The right rail wants h3s to list. Under 文章 each article title is an h3, so
 * the rail is a live table of the current topic's articles. Under 術語 a group
 * has no sub-headings, so the rail simply names the current group — which is the
 * SubOutline's intended behaviour for a section with no children.
 */
const COPY = {
  zh: {
    title: '統計學實驗室',
    tabsLabel: '看哪一區',
    articles: '文章',
    glossary: '術語表',
    tags: '標籤',
    tagsAreTerms: '也是術語的標籤',
    tagsAreTermsBlurb: '這些標籤剛好也是術語。點進去看同標籤的文章，那個詞另有定義。',
    tagsTopics: '主題標籤',
    tagsTopicsBlurb: '人、領域、方法、史觀——術語表裡沒有，但把談同一件事的文章連在一起。',
    tagsUnit: (n) => `${n} 個`,
    minutes: (m) => `約 ${m} 分鐘`,
    seeGlossary: '進完整術語表',
    terms: (n) => `${n} 條`,
    about: '本站說明：方法、出處、模擬的紀律',
    empty: '這個主題還沒有文章。',
    tocLabel: '本頁區塊',
  },
  en: {
    title: 'Statistics Lab',
    tabsLabel: 'Sections',
    articles: 'Articles',
    glossary: 'Glossary',
    tags: 'Tags',
    tagsAreTerms: 'Tags that are also terms',
    tagsAreTermsBlurb: 'These tags happen to name a glossary term. Follow one for the articles about it — and its definition is one more click away.',
    tagsTopics: 'Topic tags',
    tagsTopicsBlurb: 'People, fields, methods, history of ideas — not in the glossary, but they tie together the articles about the same thing.',
    tagsUnit: (n) => `${n} tags`,
    minutes: (m) => `${m} min read`,
    seeGlossary: 'Open the full glossary',
    terms: (n) => `${n} terms`,
    about: 'About this site: method, sources, and the discipline behind the simulations',
    empty: 'Nothing here yet.',
    tocLabel: 'On this page',
  },
};

export default function StatisticsLab() {
  const { site, topics = [], articles = [], glossary = [], glossaryGroups = [], tags: tagIndex = [] } = data;
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const [tab, setTab] = useTabParam('tab', 'articles');
  const en = lang === 'en';
  const c = COPY[en ? 'en' : 'zh'];
  const copy = en ? { ...site, ...site.en } : site;

  const label = (t) => (en ? t.en?.label ?? t.label : t.label);
  const blurb = (t) => (en ? t.en?.blurb ?? t.blurb : t.blurb);

  useEffect(() => { document.title = `${c.title}｜Canvas Lab`; }, [c.title]);

  const topicsWithArticles = topics.filter((t) => articles.some((a) => a.topic === t.id));

  // The glossary tab is the full, searchable glossary now (the standalone page
  // was folded in). The filter matches a term's name and its one-line definition,
  // in whichever language is showing; a group with nothing left drops out, and the
  // left rail follows because query is part of refreshKey.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const glossaryShown = useMemo(() => {
    if (!q) return glossary;
    return glossary.filter((t) =>
      [t.term, t.oneLine, t.en?.term, t.en?.oneLine]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [glossary, q]);
  const visibleGroups = useMemo(
    () =>
      glossaryGroups
        .map((g) => ({ g, list: glossaryShown.filter((t) => t.group === g.id) }))
        .filter((x) => x.list.length > 0),
    [glossaryGroups, glossaryShown],
  );

  return (
    <DashboardLayout
      scale={scale}
      back={{ href: '/', label: 'Canvas Lab' }}
      headerRight={
        <>
          <LangSwitch lang={lang} onChange={setLang} />
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu lang={lang} />
        </>
      }
      eyebrow="Statistics Lab"
      title={c.title}
      summary={copy.intro}
      tocLabel={c.tocLabel}
      tabs={{
        label: c.tabsLabel,
        value: tab,
        onChange: setTab,
        items: [
          { id: 'articles', label: c.articles, count: articles.length },
          { id: 'glossary', label: c.glossary, count: glossary.length },
          { id: 'tags', label: c.tags, count: tagIndex.length },
        ],
      }}
      refreshKey={`${tab}-${lang}-${q}`}
    >
      {tab === 'glossary' ? (
        <>
          <label className="mb-8 flex items-center gap-2 border-b border-line pb-2">
            <Search size={14} className="shrink-0 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={en ? 'Filter terms' : '搜尋術語'}
              className="w-full bg-transparent text-token-sm text-ink outline-none placeholder:text-ink-faint"
            />
            <span className="shrink-0 font-accent text-token-xs tabular-nums text-ink-faint">
              {glossaryShown.length}/{glossary.length}
            </span>
          </label>

          {visibleGroups.map(({ g, list }, i) => (
            <section key={g.id} className={i === 0 ? '' : 'mt-10 border-t border-line pt-6'}>
              <h2 id={`group-${g.id}`} className="font-display text-token-lg text-ink">
                {en ? g.en?.label ?? g.label : g.label}
                <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{c.terms(list.length)}</span>
              </h2>
              <p className="mb-3 mt-1 text-token-sm leading-relaxed text-ink-muted">
                {en ? g.en?.blurb ?? g.blurb : g.blurb}
              </p>
              {/* Each term hangs off a thin keyline — the marker that says "this
                  is an entry", not a run of prose — with its one-line definition
                  under it and the full page one click away. */}
              <ul className="space-y-4">
                {list.map((t) => (
                  <li key={t.slug}>
                    <Link
                      to={t.route}
                      className="group block border-l-2 border-line pl-4 transition-colors duration-fast hover:border-accent"
                    >
                      <span className="font-display text-token-base text-ink transition-colors duration-fast group-hover:text-accent">
                        {en ? t.en?.term ?? t.term : t.term}
                      </span>
                      <span className="mt-1 block text-token-sm leading-relaxed text-ink-muted">
                        {en ? t.en?.oneLine ?? t.oneLine : t.oneLine}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {visibleGroups.length === 0 ? (
            <p className="py-10 text-center text-token-sm text-ink-faint">
              {en ? 'Nothing matches that.' : '沒有符合的術語。'}
            </p>
          ) : null}
        </>
      ) : tab === 'tags' ? (
        <>
          {/* The second axis. Split by whether a tag also names a glossary term:
              the split gives the dashboard rails their sections, and it says out
              loud which words carry a definition and which are only labels. */}
          {[
            { id: 'terms', label: c.tagsAreTerms, blurb: c.tagsAreTermsBlurb, list: tagIndex.filter((t) => t.termRoute) },
            { id: 'topics', label: c.tagsTopics, blurb: c.tagsTopicsBlurb, list: tagIndex.filter((t) => !t.termRoute) },
          ]
            .filter((s) => s.list.length > 0)
            .map((s, i) => (
              <section key={s.id} className={i === 0 ? '' : 'mt-10 border-t border-line pt-6'}>
                <h2 id={`taggroup-${s.id}`} className="font-display text-token-lg text-ink">
                  {s.label}
                  <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{c.tagsUnit(s.list.length)}</span>
                </h2>
                <p className="mb-3 mt-1 text-token-sm leading-relaxed text-ink-muted">{s.blurb}</p>
                <ul className="flex flex-wrap gap-2.5">
                  {s.list.map((t) => (
                    <li key={t.slug}>
                      <Link
                        to={`/statistics/tags/${t.slug}`}
                        className="group inline-flex items-baseline gap-1.5 rounded-token-sm border border-line-soft px-2.5 py-1 text-token-sm text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent"
                      >
                        {en ? t.en : t.zh}
                        <span className="font-accent text-token-xs tabular-nums text-ink-faint">{t.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </>
      ) : (
        <>
          {topicsWithArticles.map((t, i) => (
            <section key={t.id} className={i === 0 ? '' : 'mt-12 border-t border-line pt-8'}>
              <h2 id={`topic-${t.id}`} className="font-display text-token-lg text-ink">{label(t)}</h2>
              <p className="mb-2 mt-1 text-token-sm leading-relaxed text-ink-muted">{blurb(t)}</p>
              <div className="mt-2">
                {articles
                  .filter((a) => a.topic === t.id)
                  .map((a) => (
                    <ArticleRow key={a.slug} article={a} lang={lang} minutes={c.minutes} />
                  ))}
              </div>
            </section>
          ))}
          {topicsWithArticles.length === 0 ? (
            <p className="py-8 text-token-sm text-ink-faint">{c.empty}</p>
          ) : null}
        </>
      )}

      <div className="mt-14 border-t border-line-soft pt-5">
        <p className="text-token-sm leading-relaxed text-ink-faint">{copy.note}</p>
        <Link
          to="/statistics/about"
          className="group mt-3 inline-flex items-center gap-1.5 text-token-sm text-ink-muted transition-colors duration-fast hover:text-accent"
        >
          {c.about}
          <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" />
        </Link>
      </div>
    </DashboardLayout>
  );
}

/* One article: the title is an h3 so the right rail can list it, with the
   subtitle, summary, and a line of metadata below. */
function ArticleRow({ article: a, lang, minutes }) {
  const en = lang === 'en';
  const tags = (en ? a.en?.tags : a.tags) ?? [];
  const readingMinutes = (en ? a.en?.readingMinutes : a.readingMinutes) ?? a.readingMinutes;

  return (
    <Link
      to={a.route}
      className="group -mx-3 block rounded-token-md px-3 py-5 transition-colors duration-fast hover:bg-surface"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3
          id={`article-${a.slug}`}
          className="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent"
        >
          {en ? a.en?.title ?? a.title : a.title}
        </h3>
        <ArrowRight
          size={16}
          className="shrink-0 text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>
      {(en ? a.en?.subtitle : a.subtitle) ? (
        <p className="mt-1 text-token-sm text-ink-muted">{en ? a.en.subtitle : a.subtitle}</p>
      ) : null}
      <p className="mt-2 text-token-sm leading-relaxed text-ink-faint">
        {en ? a.en?.summary ?? a.summary : a.summary}
      </p>
      <p className="mt-3 font-accent text-token-xs text-ink-faint">
        {a.publishedAt}
        {readingMinutes ? ` · ${minutes(readingMinutes)}` : ''}
        {tags.length > 0 ? ` · ${tags.join(en ? ', ' : '、')}` : ''}
      </p>
    </Link>
  );
}
