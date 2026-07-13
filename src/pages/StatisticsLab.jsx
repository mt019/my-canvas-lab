import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageShell from '../components/PageShell';
import LangSwitch, { useLang } from '../components/LangSwitch';
import AppearanceMenu from '../components/AppearanceMenu';
import Tabs, { useTabParam } from '../components/lab/Tabs';
import data from '../data/statistics.json';

/*
 * The hub. It lists whatever the data repo says exists — a new article means a
 * new entry in statistics.json and a new page file, and nothing here changes.
 *
 * The words on this page (the opening, what each section is for, the closing
 * note) come from the payload too, not from a string in this file: they are what
 * the site says about itself, and they get rewritten as it grows.
 *
 * Two sections, not one list with a footnote. Until there are many articles the
 * glossary is the thicker half of the site, and hiding fourteen terms behind a
 * single line reading "Glossary →" tells a first-time reader nothing about what
 * is actually here. So the terms are laid out in full, grouped the way they are
 * grouped on their own index — someone can see the whole site from the door.
 *
 * The topic tabs only appear once there is something to filter (see MIN_TABS).
 * One tab labelled "All" and one labelled "Inference" over a list of one article
 * is furniture, not navigation.
 */
const MIN_TABS = 3;

const COPY = {
  zh: {
    title: '統計學實驗室',
    all: '全部',
    topicsLabel: '主題',
    empty: '這個主題還沒有文章。',
    minutes: (m) => `約 ${m} 分鐘`,
    seeGlossary: '進術語表',
    terms: (n) => `${n} 條`,
    about: '本站說明：方法、出處、模擬的紀律',
  },
  en: {
    title: 'Statistics Lab',
    all: 'All',
    topicsLabel: 'Topics',
    empty: 'Nothing here yet.',
    minutes: (m) => `${m} min read`,
    seeGlossary: 'Open the glossary',
    terms: (n) => `${n} terms`,
    about: 'About this site: method, sources, and the discipline behind the simulations',
  },
};

export default function StatisticsLab() {
  const { site, topics = [], articles = [], glossary = [], glossaryGroups = [] } = data;
  const [topic, setTopic] = useTabParam('topic', 'all');
  const { lang, setLang } = useLang();
  const en = lang === 'en';
  const c = COPY[en ? 'en' : 'zh'];
  const copy = en ? { ...site, ...site.en } : site;

  const label = (t) => (en ? t.en?.label ?? t.label : t.label);
  const blurb = (t) => (en ? t.en?.blurb ?? t.blurb : t.blurb);

  const showTabs = articles.length >= MIN_TABS;
  const tabs = [
    { id: 'all', label: c.all, count: articles.length },
    ...topics.map((t) => ({
      id: t.id,
      label: label(t),
      count: articles.filter((a) => a.topic === t.id).length,
    })),
  ];

  const shown = showTabs && topic !== 'all' ? articles.filter((a) => a.topic === topic) : articles;
  const active = showTabs ? topics.find((t) => t.id === topic) : null;

  return (
    <PageShell
      title={c.title}
      eyebrow="Statistics Lab"
      width="prose"
      controls={
        <>
          <LangSwitch lang={lang} onChange={setLang} />
          <AppearanceMenu lang={lang} />
        </>
      }
    >
      <p className="mb-12 text-token-base leading-loose text-ink-muted">{copy.intro}</p>

      <Section title={copy.sections.articles.label} blurb={copy.sections.articles.blurb}>
        {showTabs ? (
          <>
            <Tabs items={tabs} value={topic} onChange={setTopic} label={c.topicsLabel} />
            {active ? <p className="mt-3 text-token-sm text-ink-faint">{blurb(active)}</p> : null}
          </>
        ) : null}

        <div className={showTabs ? 'mt-6' : undefined}>
          {shown.map((a) => (
            <ArticleRow key={a.slug} article={a} lang={lang} minutes={c.minutes} />
          ))}
          {shown.length === 0 ? <p className="py-8 text-token-sm text-ink-faint">{c.empty}</p> : null}
        </div>
      </Section>

      {glossary.length > 0 ? (
        <Section
          title={copy.sections.glossary.label}
          blurb={copy.sections.glossary.blurb}
          aside={c.terms(glossary.length)}
        >
          <div className="mt-6 space-y-6">
            {glossaryGroups.map((g) => {
              const list = glossary.filter((t) => t.group === g.id);
              if (list.length === 0) return null;
              return (
                <div key={g.id}>
                  <h3 className="font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">
                    {en ? g.en?.label ?? g.label : g.label}
                  </h3>
                  {/* Names only, set close together: this is a map of the ground, and
                      the definitions are one click away on the term's own page. */}
                  <p className="mt-2 text-token-sm leading-relaxed">
                    {list.map((t, i) => (
                      <span key={t.slug}>
                        {i > 0 ? <span className="text-ink-faint">{en ? ' · ' : '、'}</span> : null}
                        <Link
                          to={t.route}
                          className="text-ink transition-colors duration-fast hover:text-accent"
                        >
                          {en ? t.en?.term ?? t.term : t.term}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>
              );
            })}
          </div>

          <Link
            to="/statistics/glossary"
            className="group mt-6 inline-flex items-center gap-1.5 text-token-sm text-ink-muted transition-colors duration-fast hover:text-accent"
          >
            {c.seeGlossary}
            <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" />
          </Link>
        </Section>
      ) : null}

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
    </PageShell>
  );
}

/* A section of the home page: a name, a sentence saying what it is for, and the
   thing itself. The rule is one heading per kind of content — a reader should be
   able to tell what this site holds by reading only the headings. */
function Section({ title, blurb, aside, children }) {
  return (
    <section className="mb-14">
      <div className="mb-1 flex items-baseline justify-between gap-4 border-b border-line-soft pb-2">
        <h2 className="font-display text-token-xl text-ink">{title}</h2>
        {aside ? <span className="shrink-0 font-accent text-token-xs text-ink-faint">{aside}</span> : null}
      </div>
      <p className="mb-2 mt-3 text-token-sm leading-relaxed text-ink-muted">{blurb}</p>
      {children}
    </section>
  );
}

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
        <h3 className="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent">
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
