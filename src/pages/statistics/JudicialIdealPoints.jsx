import { useEffect, useMemo } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import TermLink from '../../components/lab/TermLink';
import Quiz from '../../components/lab/Quiz';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import ArticleMeta from '../../components/lab/ArticleMeta';
import ArticleZh from '../../content/statistics/judicial-ideal-points.zh.mdx';
import ArticleEn from '../../content/statistics/judicial-ideal-points.en.mdx';
import data from '../../data/statistics-judicial-ideal-points.json';
import hub from '../../data/statistics.json';
import BayesIdealPoints from './_figures/BayesIdealPoints';
import SameNomineeForest from './_figures/SameNomineeForest';

/*
 * 出版級長文的殼頁，同其他統計文章的契約：.mdx 擁有正文，本檔決定有哪些圖、參數為何、
 * 引用與術語從哪解析。兩張圖都是靜態互動圖（hover），資料由 figures.json 帶入（抽自司法院
 * 計量母本，非模擬、不需 seed）。<Cite> 對 sources.json、<Term> 對 glossary 解析。
 */
export default function JudicialIdealPoints() {
  const { meta, figures, sources, terms, quiz } = data;
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const params = useMemo(
    () => Object.fromEntries(Object.entries(figures ?? {}).map(([id, f]) => [id, f.params ?? {}])),
    [figures],
  );

  const components = useMemo(() => ({
    BayesIdealPoints: () => <BayesIdealPoints {...params['bayes-ideal-points']} lang={lang} />,
    SameNomineeForest: () => <SameNomineeForest {...params['same-nominee-forest']} lang={lang} />,
    Quiz: () => <Quiz items={quiz ?? []} lang={lang} />,
    Cite: ({ id, children }) => <HoverCite source={sources?.[id]} lang={lang}>{children}</HoverCite>,
    Term: ({ id, children }) => <TermLink term={terms?.[id]} lang={lang}>{children}</TermLink>,
  }), [params, sources, terms, quiz, lang]);

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
