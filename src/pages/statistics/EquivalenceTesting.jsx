import { useEffect, useMemo } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import TermLink from '../../components/lab/TermLink';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import ArticleMeta from '../../components/lab/ArticleMeta';
import ArticleZh from '../../content/statistics/equivalence-testing.zh.mdx';
import ArticleEn from '../../content/statistics/equivalence-testing.en.mdx';
import data from '../../data/statistics-equivalence-testing.json';
import hub from '../../data/statistics.json';
import CompatibilityInterval from './_figures/CompatibilityInterval';
import EquivalenceBounds from './_figures/EquivalenceBounds';

/*
 * The article shell, same contract as the other statistics pieces: the .mdx owns
 * the prose, this file owns which figures exist, the parameters they run with,
 * and where citations and glossary terms resolve from. Two figures here, both
 * deterministic — no seed, no simulation. See NullHypothesis.jsx for the pattern.
 */
export default function EquivalenceTesting() {
  const { meta, figures, sources, terms } = data;
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const params = useMemo(
    () => Object.fromEntries(Object.entries(figures ?? {}).map(([id, f]) => [id, f.params ?? {}])),
    [figures],
  );

  const components = useMemo(() => ({
    CompatibilityInterval: () => <CompatibilityInterval {...params['compatibility-interval']} lang={lang} />,
    EquivalenceBounds: () => <EquivalenceBounds {...params['equivalence-bounds']} lang={lang} />,
    // <Cite id="schuirmann1987TOST">…</Cite> — the id is checked against
    // sources.json in the data repo, so a citation with no source cannot reach
    // the page.
    Cite: ({ id, children }) => <HoverCite source={sources?.[id]} lang={lang}>{children}</HoverCite>,
    // <Term id="statistical-power">檢定力</Term> — same contract, against the
    // glossary: the card carries the definition, its link carries the reader to
    // the term's own page.
    Term: ({ id, children }) => <TermLink term={terms?.[id]} lang={lang}>{children}</TermLink>,
  }), [params, sources, terms, lang]);

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
