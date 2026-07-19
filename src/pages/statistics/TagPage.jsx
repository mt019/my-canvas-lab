import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import hub from '../../data/statistics.json';

/*
 * One tag, one page: every article about the same thing. This is the site's
 * second axis — a term page answers "what is this", a tag page answers "what else
 * is about this". The tag index is derived in the data repo from the articles'
 * own metadata (hub.tags), so this page never goes stale against them.
 *
 * When a tag happens to name a glossary term, the page offers the definition too:
 * the two axes cross at that word without being the same thing.
 */
export default function TagPage() {
  const { slug } = useParams();
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const tag = (hub.tags ?? []).find((t) => t.slug === slug);
  const label = tag ? (en ? tag.en : tag.zh) : slug;

  useEffect(() => {
    document.title = tag
      ? `${en ? 'Tag' : '標籤'}：${label}｜${en ? 'Statistics Lab' : '統計學實驗室'}`
      : `${en ? 'Tag not found' : '查無此標籤'}｜Canvas Lab`;
  }, [tag, label, en]);

  if (!tag) {
    return (
      <main className="min-h-screen bg-paper py-20 text-ink">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-token-lg">{en ? 'No such tag.' : '查無此標籤。'}</p>
          <Link to="/statisticslab?tab=tags" className="mt-4 inline-block text-token-sm text-accent hover:underline">
            {en ? 'Back to all tags' : '回到所有標籤'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
      <SiteHeader
        back={{ href: '/statisticslab?tab=tags', label: en ? 'All tags' : '所有標籤' }}
        width="prose"
        lang={lang}
        onLangChange={setLang}
        scale={scale}
        onScaleChange={setScale}
      />

      <div className="mx-auto max-w-[52rem] px-4 sm:px-6">
       <div className="reader-scale">
        <header className="mb-8">
          <p className="mb-2 font-accent text-token-xs uppercase tracking-[0.18em] text-ink-faint">
            {en ? 'Tag' : '標籤'}
          </p>
          <h1 className="font-display text-token-2xl leading-tight sm:text-token-3xl">{label}</h1>
          <p className="mt-3 text-token-sm text-ink-muted">
            {en ? `${tag.count} article${tag.count > 1 ? 's' : ''} tagged this` : `${tag.count} 篇文章帶這個標籤`}
          </p>

          {/* Cross to the other axis: this tag also has a definition. */}
          {tag.termRoute ? (
            <Link
              to={tag.termRoute}
              className="group mt-4 inline-flex items-center gap-1.5 border-l-2 border-accent pl-3 text-token-sm text-ink-muted transition-colors duration-fast hover:text-accent"
            >
              {en ? 'This word also has a definition' : '這個詞也有定義'}
              <ArrowRight size={13} className="transition-transform duration-fast group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </header>

        {/* Each article hangs off the same keyline the glossary uses, so the two
            axes read as one system. */}
        <ul className="space-y-5">
          {tag.articles.map((a) => (
            <li key={a.slug}>
              <Link
                to={a.route}
                className="group block border-l-2 border-line pl-4 transition-colors duration-fast hover:border-accent"
              >
                <span className="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent">
                  {en ? a.en?.title ?? a.title : a.title}
                </span>
                {a.publishedAt ? (
                  <span className="mt-1 block font-accent text-token-xs text-ink-faint">{a.publishedAt}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
       </div>
      </div>
    </main>
  );
}
