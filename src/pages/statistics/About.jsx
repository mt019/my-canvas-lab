import { useEffect, useMemo } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import TermLink from '../../components/lab/TermLink';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import AboutZh from '../../content/statistics/about.zh.mdx';
import AboutEn from '../../content/statistics/about.en.mdx';
import data from '../../data/statistics-about.json';
import hub from '../../data/statistics.json';

/*
 * What the site is, how its examples are checked, why its simulations repeat.
 *
 * It is written in the data repo like everything else a reader reads, and it
 * describes the gates that repo actually enforces — which is the only way a page
 * like this stays true. A promise of rigour that lives in prose, with nothing
 * checking it, is decoration.
 */
export default function About() {
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
  const Body = en ? AboutEn : AboutZh;

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
          <p className="mt-4 border-t border-line-soft pt-3 font-accent text-token-xs text-ink-faint">
            {en ? 'Updated ' : '最後更新 '}{meta.updatedAt}
          </p>
        }
        tocLabel={en ? 'On this page' : '本頁目次'}
        tocKey={lang}
        nav={
          <ArticleNav
            topics={hub.topics}
            articles={hub.articles}
            currentSlug="about"
            homeHref="/statisticslab"
            homeLabel={en ? 'Statistics Lab' : '統計學實驗室'}
            lang={lang}
          />
        }
      >
        <Prose components={components}>
          <Body />
        </Prose>
      </ArticleLayout>
    </main>
  );
}
