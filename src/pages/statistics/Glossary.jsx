import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useFontScale } from '../../components/FontSizeControl';
import { useLang } from '../../components/LangSwitch';
import SiteHeader from '../../components/SiteHeader';
import glossary from '../../data/statistics-glossary.json';
import hub from '../../data/statistics.json';

/*
 * The index of the glossary: every term, its one-line definition, and a way in.
 * The definitions are the same strings the hover cards use, so a reader who
 * scans this page and a reader who hovers a word in an article are told exactly
 * the same thing.
 *
 * The terms are laid out in groups, and the groups are what a term is *for* —
 * the parts a test is built from, the ways it fails, what people do with it —
 * not which article happened to introduce it. Grouping by topic was the obvious
 * thing and it was useless: every term the site has is "inference", so the
 * headings all said the same word. The groups and their order live in the data
 * repo (data/glossary-groups.json); this page prints whatever is there.
 *
 * The filter matches the name, the aliases and the definition, because a reader
 * who half-remembers a term usually half-remembers the wrong half of it.
 */
function matchedExample(term, query, en) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const example = (en ? term.en?.example : term.example) ?? '';
  const name = [term.term, term.en?.term, ...(term.aliases ?? []), ...(term.en?.aliases ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return example.toLowerCase().includes(q) && !name.includes(q);
}

export default function Glossary() {
  const [scale, setScale] = useFontScale();
  const { lang, setLang } = useLang();
  const [query, setQuery] = useState('');
  const en = lang === 'en';

  useEffect(() => {
    document.title = `${en ? 'Glossary' : '術語表'}｜${en ? 'Statistics Lab' : '統計學實驗室'}`;
  }, [en]);

  const terms = useMemo(() => Object.values(glossary.terms ?? {}), []);

  // Index order comes from the data repo (see the group comment below), so the
  // list is filtered and never sorted: sorting it alphabetically would replace an
  // argument with a filing system.
  const order = useMemo(() => {
    const seq = new Map();
    (hub.glossaryGroups ?? []).forEach((g) => g.terms.forEach((slug) => seq.set(slug, seq.size)));
    return seq;
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = terms.filter((t) => {
      if (!q) return true;
      const haystack = [
        t.term,
        t.oneLine,
        t.example,
        t.en?.term,
        t.en?.oneLine,
        t.en?.example,
        ...(t.aliases ?? []),
        ...(t.en?.aliases ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    return list.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  }, [terms, query, order]);

  // The groups, and the sequence inside them, are declared in the data repo
  // (data/glossary-groups.json): the groups run from the parts of a test, through
  // the ways it fails, to what people do with it, and within a group the terms run
  // in the order you would have to learn them. This page prints that order.
  const groups = useMemo(
    () =>
      (hub.glossaryGroups ?? [])
        .map((g) => ({ ...g, list: g.terms.map((slug) => shown.find((t) => t.slug === slug)).filter(Boolean) }))
        .filter((g) => g.list.length > 0),
    [shown],
  );

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
      <SiteHeader
        back={{ href: '/statisticslab', label: en ? 'Statistics Lab' : '統計學實驗室' }}
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
            {en ? 'Statistics Lab' : '統計學實驗室'}
          </p>
          <h1 className="font-display text-token-2xl leading-tight sm:text-token-3xl">
            {en ? 'Glossary' : '術語表'}
          </h1>
          <p className="mt-4 max-w-[44rem] text-token-sm leading-relaxed text-ink-muted">
            {en
              ? 'Every term the articles lean on, defined in one line and then explained on its own page, with an example that actually happened and a source for it. The same definitions appear on hover, wherever the term is used.'
              : '文章裡用到的每個術語，先給一句話的定義，再給一個獨立頁面：來歷、一個真實發生過的例子、常見的誤讀。同樣的定義會在術語出現的地方以浮窗顯示。'}
          </p>
        </header>

        <label className="mb-8 flex items-center gap-2 border-b border-line pb-2">
          <Search size={14} className="shrink-0 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={en ? 'Filter terms' : '搜尋術語'}
            className="w-full bg-transparent text-token-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <span className="shrink-0 font-accent text-token-xs text-ink-faint">
            {shown.length}/{terms.length}
          </span>
        </label>

        {groups.map((g) => (
          <section key={g.id} className="mb-12">
            <div className="mb-4 border-b border-line-soft pb-2">
              <h2 className="font-display text-token-lg text-ink">
                {en ? g.en?.label ?? g.label : g.label}
              </h2>
              <p className="mt-1 text-token-sm leading-relaxed text-ink-faint">
                {en ? g.en?.blurb ?? g.blurb : g.blurb}
              </p>
            </div>
            <ul className="space-y-5">
              {g.list.map((t) => (
                <li key={t.slug}>
                  <Link to={t.route} className="group block">
                    <span className="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent">
                      {en ? t.en.term : t.term}
                    </span>
                    <span className="mt-1 block text-token-sm leading-relaxed text-ink-muted">
                      {en ? t.en.oneLine : t.oneLine}
                    </span>
                    {/* A term can match on its example — someone remembers the dead
                        salmon and not the words "multiple comparisons". Show the line
                        that matched, or the hit looks arbitrary. */}
                    {matchedExample(t, query, en) ? (
                      <span className="mt-1 block border-l-2 border-line pl-2 text-token-sm leading-relaxed text-ink-faint">
                        {en ? t.en.example : t.example}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {shown.length === 0 ? (
          <p className="py-10 text-center text-token-sm text-ink-faint">
            {en ? 'Nothing matches that.' : '沒有符合的術語。'}
          </p>
        ) : null}
       </div>
      </div>
    </main>
  );
}
