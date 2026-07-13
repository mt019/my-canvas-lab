import { useEffect, useMemo } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import TermLink from '../../components/lab/TermLink';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import ArticleMeta from '../../components/lab/ArticleMeta';
import ArticleZh from '../../content/statistics/justice-partial-pooling.zh.mdx';
import ArticleEn from '../../content/statistics/justice-partial-pooling.en.mdx';
import data from '../../data/statistics-justice-partial-pooling.json';
import hub from '../../data/statistics.json';

export default function JusticePartialPooling() {
  const { meta, sources, terms } = data;
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const components = useMemo(() => ({
    Cite: ({ id, children }) => <HoverCite source={sources?.[id]} lang={lang}>{children}</HoverCite>,
    Term: ({ id, children }) => <TermLink term={terms?.[id]} lang={lang}>{children}</TermLink>,
  }), [sources, terms, lang]);

  const title = en ? meta.en?.title ?? meta.title : meta.title;
  const summary = en ? meta.en?.summary ?? meta.summary : meta.summary;
  const Article = en ? ArticleEn : ArticleZh;

  useEffect(() => { document.title = `${title}｜${en ? 'Statistics Lab' : '統計學實驗室'}`; }, [title, en]);

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ zoom: scale }}>
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
