import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
    minutes: (m) => `${m} min read`,
    seeGlossary: 'Open the full glossary',
    terms: (n) => `${n} terms`,
    about: 'About this site: method, sources, and the discipline behind the simulations',
    empty: 'Nothing here yet.',
    tocLabel: 'On this page',
  },
};

export default function StatisticsLab() {
  const { site, topics = [], articles = [], glossary = [], glossaryGroups = [] } = data;
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
        ],
      }}
      refreshKey={`${tab}-${lang}`}
    >
      {tab === 'glossary' ? (
        <>
          {glossaryGroups.map((g, i) => {
            const list = glossary.filter((t) => t.group === g.id);
            if (list.length === 0) return null;
            return (
              <section key={g.id} className={i === 0 ? '' : 'mt-10 border-t border-line pt-6'}>
                <h2 id={`group-${g.id}`} className="font-display text-token-lg text-ink">
                  {en ? g.en?.label ?? g.label : g.label}
                  <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{c.terms(list.length)}</span>
                </h2>
                <p className="mb-3 mt-1 text-token-sm leading-relaxed text-ink-muted">
                  {en ? g.en?.blurb ?? g.blurb : g.blurb}
                </p>
                {/* Names only, set close together: a map of the ground, with the
                    definition one click away on the term's own page. */}
                <p className="text-token-sm leading-relaxed">
                  {list.map((t, j) => (
                    <span key={t.slug}>
                      {j > 0 ? <span className="text-ink-faint">{en ? ' · ' : '、'}</span> : null}
                      <Link to={t.route} className="text-ink transition-colors duration-fast hover:text-accent">
                        {en ? t.en?.term ?? t.term : t.term}
                      </Link>
                    </span>
                  ))}
                </p>
              </section>
            );
          })}

          <Link
            to="/statistics/glossary"
            className="group mt-8 inline-flex items-center gap-1.5 text-token-sm text-ink-muted transition-colors duration-fast hover:text-accent"
          >
            {c.seeGlossary}
            <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" />
          </Link>
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
