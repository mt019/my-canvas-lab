import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import FontSizeControl, { useFontScale } from '../../components/FontSizeControl';
import LangSwitch, { useLang } from '../../components/LangSwitch';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import ArticleLayout, { ArticleNav } from '../../components/lab/ArticleLayout';
import ArticleZh from '../../content/statistics/null-hypothesis.zh.mdx';
import ArticleEn from '../../content/statistics/null-hypothesis.en.mdx';
import data from '../../data/statistics-null-hypothesis.json';
import hub from '../../data/statistics.json';
import LadyTastingTea from './_figures/LadyTastingTea';
import PUnderNull from './_figures/PUnderNull';
import TwoLogics from './_figures/TwoLogics';
import PHacking from './_figures/PHacking';
import SampleSizeAndEffect from './_figures/SampleSizeAndEffect';
import PositivePredictiveValue from './_figures/PositivePredictiveValue';
import Misreadings from './_figures/Misreadings';
import Timeline from './_figures/Timeline';

/*
 * The article shell. It owns three things the .mdx does not: which figures exist,
 * what parameters they run with, and where the citations come from. Prose stays
 * plain markdown — <LadyTastingTea /> with no import and no props — so writing
 * the next article means writing prose.
 *
 * Two languages, two .mdx files. A dictionary keyed by sentence is the right
 * shape for UI labels and the wrong shape for an essay: an essay translated
 * sentence by sentence reads like a translation.
 */
export default function NullHypothesis() {
  const { meta, figures, sources, misreadings, timeline } = data;
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const params = useMemo(
    () => Object.fromEntries(Object.entries(figures ?? {}).map(([id, f]) => [id, f.params ?? {}])),
    [figures],
  );

  const components = useMemo(() => ({
    LadyTastingTea: () => <LadyTastingTea {...params['lady-tasting-tea']} lang={lang} />,
    PUnderNull: () => <PUnderNull {...params['p-under-null']} lang={lang} />,
    TwoLogics: () => <TwoLogics {...params['two-logics']} lang={lang} />,
    PHacking: () => <PHacking {...params['p-hacking']} lang={lang} />,
    SampleSizeAndEffect: () => <SampleSizeAndEffect {...params['n-and-effect']} lang={lang} />,
    PPV: () => <PositivePredictiveValue {...params['ppv-2x2']} lang={lang} />,
    Misreadings: () => <Misreadings items={misreadings ?? []} lang={lang} />,
    Timeline: () => <Timeline items={timeline ?? []} lang={lang} />,
    // <Cite id="fisher1935…">…</Cite> — the id is checked against sources.json in
    // the data repo, so a citation with no source cannot reach the page.
    Cite: ({ id, children }) => <HoverCite source={sources?.[id]} lang={lang}>{children}</HoverCite>,
  }), [params, sources, misreadings, timeline, lang]);

  const title = en ? meta.en?.title ?? meta.title : meta.title;
  const summary = en ? meta.en?.summary ?? meta.summary : meta.summary;
  const Article = en ? ArticleEn : ArticleZh;

  useEffect(() => { document.title = `${title}｜Canvas Lab`; }, [title]);

  return (
    <main className="min-h-screen bg-paper paper-texture py-10 text-ink" style={{ zoom: scale }}>
      <div className="mx-auto mb-6 flex max-w-[86rem] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="text-token-sm text-ink-faint transition-colors duration-fast hover:text-accent">
          ← Canvas Lab
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitch lang={lang} onChange={setLang} />
          <FontSizeControl scale={scale} onChange={setScale} />
        </div>
      </div>

      <ArticleLayout
        title={title}
        eyebrow={en ? 'Statistics Lab' : '統計學實驗室'}
        summary={summary}
        tocLabel={en ? 'On this page' : '本頁目次'}
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
