import { useEffect, useMemo } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import SourcesList from '../../components/lab/SourcesList';
import TermLink from '../../components/lab/TermLink';
import Quiz from '../../components/lab/Quiz';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import ArticleMeta from '../../components/lab/ArticleMeta';
import ArticleZh from '../../content/statistics/card-shuffling.zh.mdx';
import ArticleEn from '../../content/statistics/card-shuffling.en.mdx';
import data from '../../data/statistics-card-shuffling.json';
import hub from '../../data/statistics.json';
import RisingSequences from './_figures/RisingSequences';
import SplitExample from './_figures/SplitExample';
import MixingCurve from './_figures/MixingCurve';
import GuessingGame from './_figures/GuessingGame';
import QuestionPanel from './_figures/QuestionPanel';
import StatementsPanel from './_figures/StatementsPanel';

/*
 * The article shell, same contract as the other statistics pieces: the .mdx owns
 * the prose, this file owns which figures exist, the parameters they run with,
 * and where citations and glossary terms resolve from.
 *
 * One of the four figures is a seeded simulation (RisingSequences, GSR at seed
 * 20260812) whose run must match data/reference/card-shuffling.json in the data
 * repo. The other three lay out numbers computed or transcribed there — the exact
 * Bayer-Diaconis distances, Table 5, and the separation-distance table — because
 * the exact arithmetic behind the first of those is too heavy for a browser tab.
 */
export default function CardShuffling() {
  const { meta, figures, sources, terms, quiz, statements } = data;
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const params = useMemo(
    () => Object.fromEntries(Object.entries(figures ?? {}).map(([id, f]) => [id, f.params ?? {}])),
    [figures],
  );

  const components = useMemo(() => ({
    RisingSequences: () => <RisingSequences {...params['rising-sequences']} lang={lang} />,
    SplitExample: () => <SplitExample {...params['split-example']} lang={lang} />,
    MixingCurve: () => <MixingCurve {...params['mixing-curve']} lang={lang} />,
    GuessingGame: () => <GuessingGame {...params['guessing-game']} lang={lang} />,
    QuestionPanel: () => <QuestionPanel {...params['question-panel']} lang={lang} />,
    Quiz: () => <Quiz items={quiz ?? []} lang={lang} />,
    Statements: () => <StatementsPanel statements={statements ?? {}} lang={lang} />,
    // <Cite id="…"> resolves against sources.json in the data repo, so a citation
    // with no source cannot reach the page.
    Cite: ({ id, children }) => <HoverCite source={sources?.[id]} sourceId={id} lang={lang}>{children}</HoverCite>,
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
          <SourcesList sources={sources} lang={lang} />
        </Prose>
      </ArticleLayout>
    </main>
  );
}
