import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import FontSizeControl, { useFontScale } from '../../components/FontSizeControl';
import LangSwitch, { useLang } from '../../components/LangSwitch';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import TermLink from '../../components/lab/TermLink';
import ArticleLayout from '../../components/lab/ArticleLayout';
import glossary from '../../data/statistics-glossary.json';

/*
 * One term, one page. The hover card in an article gives the reader the
 * definition in place; this is where they land when that is not enough.
 *
 * The bodies are .mdx files synced from the data repo, loaded eagerly and keyed
 * by slug — a term's page is a data-repo folder, not a React file, so adding a
 * term never means touching this component.
 */
const bodies = import.meta.glob('../../content/statistics/glossary/*.mdx', { eager: true });

function bodyFor(slug, lang) {
  const key = `../../content/statistics/glossary/${slug}.${lang}.mdx`;
  return bodies[key]?.default ?? null;
}

export default function GlossaryTerm() {
  const { slug } = useParams();
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const en = lang === 'en';

  const term = glossary.terms?.[slug];

  const components = useMemo(() => ({
    Cite: ({ id, children }) => <HoverCite source={term?.sources?.[id]} lang={lang}>{children}</HoverCite>,
    Term: ({ id, children }) => <TermLink term={term?.mentions?.[id]} lang={lang}>{children}</TermLink>,
  }), [term, lang]);

  const name = term ? (en ? term.en?.term ?? term.term : term.term) : slug;

  useEffect(() => {
    document.title = term
      ? `${name}｜${en ? 'Statistics Lab' : '統計學實驗室'}`
      : `${en ? 'Term not found' : '查無此術語'}｜Canvas Lab`;
  }, [name, term, en]);

  if (!term) {
    return (
      <main className="min-h-screen bg-paper py-20 text-ink">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-token-lg">{en ? 'No such term.' : '查無此術語。'}</p>
          <Link to="/statistics/glossary" className="mt-4 inline-block text-token-sm text-accent hover:underline">
            {en ? 'Back to the glossary' : '回到術語表'}
          </Link>
        </div>
      </main>
    );
  }

  const Body = bodyFor(slug, lang) ?? bodyFor(slug, 'zh');
  const oneLine = en ? term.en?.oneLine ?? term.oneLine : term.oneLine;
  const aliases = (en ? term.en?.aliases : term.aliases) ?? [];
  const related = term.related ?? [];
  const usedIn = term.usedIn ?? [];

  return (
    <main className="reading-grain min-h-screen bg-paper py-10 text-ink" style={{ zoom: scale }}>
      <div className="mx-auto mb-6 flex max-w-[86rem] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/statistics/glossary" className="text-token-sm text-ink-faint transition-colors duration-fast hover:text-accent">
          ← {en ? 'Glossary' : '術語表'}
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitch lang={lang} onChange={setLang} />
          <FontSizeControl scale={scale} onChange={setScale} />
        </div>
      </div>

      <ArticleLayout
        title={name}
        eyebrow={en ? 'Term' : '術語'}
        summary={oneLine}
        meta={
          aliases.length > 0 ? (
            <p className="mt-3 font-accent text-token-xs text-ink-faint">
              {en ? 'Also: ' : '又稱：'}{aliases.join(en ? ', ' : '、')}
            </p>
          ) : null
        }
        tocLabel={en ? 'On this page' : '本頁目次'}
        tocKey={`${slug}-${lang}`}
        nav={<GlossaryNav terms={glossary.terms} currentSlug={slug} lang={lang} />}
      >
        <Prose components={components}>
          {Body ? <Body /> : null}
        </Prose>

        {related.length > 0 ? (
          <section className="mt-12 border-t border-line-soft pt-6">
            <h2 className="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">
              {en ? 'Neighbouring terms' : '相鄰術語'}
            </h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug} className="text-token-sm leading-relaxed">
                  <Link to={r.route} className="text-ink transition-colors duration-fast hover:text-accent">
                    {en ? r.en?.term ?? r.term : r.term}
                  </Link>
                  <span className="text-ink-faint">
                    {en ? ' — ' : '——'}{en ? r.en?.oneLine ?? r.oneLine : r.oneLine}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Generated in the data repo from the prose itself: an article appears
            here because it marks this term, so the list cannot go stale. */}
        {usedIn.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">
              {en ? 'Where it comes up' : '出現在'}
            </h2>
            <ul className="space-y-1.5">
              {usedIn.map((a) => (
                <li key={a.slug} className="text-token-sm">
                  <Link to={a.route} className="text-ink transition-colors duration-fast hover:text-accent">
                    {en ? a.en?.title ?? a.title : a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </ArticleLayout>
    </main>
  );
}

/* The left rail on a term page: every other term, so a reader following one
   definition into another never has to go back through the index. */
function GlossaryNav({ terms, currentSlug, lang }) {
  const en = lang === 'en';
  const list = Object.values(terms).sort((a, b) =>
    (en ? a.en.term : a.term).localeCompare(en ? b.en.term : b.term, en ? 'en' : 'zh-Hant'),
  );

  return (
    <nav aria-label={en ? 'Glossary' : '術語表'} className="text-token-xs">
      <Link
        to="/statisticslab"
        className="mb-4 block font-accent uppercase tracking-[0.12em] text-ink-faint transition-colors duration-fast hover:text-accent"
      >
        {en ? 'Statistics Lab' : '統計學實驗室'}
      </Link>
      <p className="mb-1.5 text-ink-muted">{en ? 'Glossary' : '術語表'}</p>
      <ul className="space-y-1 border-l border-line-soft">
        {list.map((t) => {
          const on = t.slug === currentSlug;
          return (
            <li key={t.slug}>
              <Link
                to={t.route}
                className="-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors duration-fast"
                style={{
                  borderColor: on ? 'var(--c-accent)' : 'transparent',
                  color: on ? 'var(--c-ink)' : 'var(--c-ink-faint)',
                }}
              >
                {en ? t.en.term : t.term}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
