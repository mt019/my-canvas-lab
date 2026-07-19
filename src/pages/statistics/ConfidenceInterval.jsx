import { useEffect, useMemo } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import TermLink from '../../components/lab/TermLink';
import Derivation from '../../components/lab/Derivation';
import Quiz from '../../components/lab/Quiz';
import StatementsPanel from './_figures/StatementsPanel';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import ArticleMeta from '../../components/lab/ArticleMeta';
import ArticleZh from '../../content/statistics/confidence-interval.zh.mdx';
import ArticleEn from '../../content/statistics/confidence-interval.en.mdx';
import data from '../../data/statistics-confidence-interval.json';
import hub from '../../data/statistics.json';
import PollErrorBand from './_figures/PollErrorBand';
import Coverage from './_figures/Coverage';
import Submarine from './_figures/Submarine';
import Fieller from './_figures/Fieller';
import FreqVsBayes from './_figures/FreqVsBayes';

/*
 * The article shell, same contract as the other statistics pieces: the .mdx owns
 * the prose, this file owns which figures exist, the parameters they run with,
 * and where citations and glossary terms resolve from. Five figures — the coverage
 * one is a seeded simulation that must match the data repo's reference; the rest
 * are deterministic. <Derivation> and <Quiz> are injected the same way a figure is.
 * See NullHypothesis.jsx / EquivalenceTesting.jsx for the pattern.
 */
export default function ConfidenceInterval() {
  const { meta, figures, sources, terms, quiz, statements } = data;
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const params = useMemo(
    () => Object.fromEntries(Object.entries(figures ?? {}).map(([id, f]) => [id, f.params ?? {}])),
    [figures],
  );

  const components = useMemo(() => ({
    PollErrorBand: () => <PollErrorBand {...params['poll-error-band']} lang={lang} />,
    Coverage: () => <Coverage {...params.coverage} lang={lang} />,
    Submarine: () => <Submarine {...params.submarine} lang={lang} />,
    Fieller: () => <Fieller {...params.fieller} lang={lang} />,
    FreqVsBayes: () => <FreqVsBayes {...params['freq-vs-bayes']} lang={lang} />,
    // The one collapsible aside on the site that starts closed — optional algebra,
    // not skipped content. Title is authored per language in the prose.
    Derivation,
    // <Quiz /> renders the six-statement self-test in place; the data comes from
    // the data repo, the correct index is shared across languages.
    Quiz: () => <Quiz items={quiz ?? []} lang={lang} />,
    // <Statements /> renders the right / wrong panel: curated precise phrasings
    // beside the classic misreadings, each misreading paired with its fix.
    Statements: () => <StatementsPanel statements={statements ?? {}} lang={lang} />,
    // <Cite id="…"> resolves against sources.json in the data repo, so a citation
    // with no source cannot reach the page.
    Cite: ({ id, children }) => <HoverCite source={sources?.[id]} lang={lang}>{children}</HoverCite>,
    // <Term id="…"> resolves against the glossary: the card carries the definition,
    // its link carries the reader to the term's own page.
    Term: ({ id, children }) => <TermLink term={terms?.[id]} lang={lang}>{children}</TermLink>,
  }), [params, sources, terms, quiz, statements, lang]);

  const title = en ? meta.en?.title ?? meta.title : meta.title;
  const summary = en ? meta.en?.summary ?? meta.summary : meta.summary;
  const Article = en ? ArticleEn : ArticleZh;

  useEffect(() => { document.title = `${title}｜Canvas Lab`; }, [title]);

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
      <SiteHeader
        back={{ href: '/statisticslab', label: en ? 'Statistics Lab' : '統計學實驗室' }}
        lang={lang}
        onLangChange={setLang}
        scale={scale}
        onScaleChange={setScale}
      />

      <ArticleLayout
        title={title}
        eyebrow={en ? 'Statistics Lab' : '統計學實驗室'}
        summary={summary}
        meta={
          <ArticleMeta
            publishedAt={meta.publishedAt}
            updatedAt={meta.updatedAt}
            readingMinutes={en ? meta.en?.readingMinutes : meta.readingMinutes}
            tags={(en ? meta.en?.tags : meta.tags) ?? []}
            tagSlugs={meta.tagSlugs ?? []}
            lang={lang}
          />
        }
        tocLabel={en ? 'On this page' : '本頁目次'}
        tocKey={lang}
        nav={
          <ArticleNav
            topics={hub.topics}
            articles={hub.articles}
            currentSlug={meta.slug}
            homeHref="/statisticslab"
            homeLabel={en ? 'Statistics Lab' : '統計學實驗室'}
            lang={lang}
          />
        }
      >
        <Prose components={components}>
          <Article />
        </Prose>
      </ArticleLayout>
    </main>
  );
}
