import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import FontSizeControl, { useFontScale } from '../../components/FontSizeControl';
import LangSwitch, { useLang } from '../../components/LangSwitch';
import glossary from '../../data/statistics-glossary.json';
import hub from '../../data/statistics.json';

/*
 * The index of the glossary: every term, its one-line definition, and a way in.
 * The definitions are the same strings the hover cards use, so a reader who
 * scans this page and a reader who hovers a word in an article are told exactly
 * the same thing.
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
    return list.sort((a, b) =>
      (en ? a.en.term : a.term).localeCompare(en ? b.en.term : b.term, en ? 'en' : 'zh-Hant'),
    );
  }, [terms, query, en]);

  const byTopic = useMemo(() => {
    const groups = new Map();
    for (const t of shown) {
      if (!groups.has(t.topic)) groups.set(t.topic, []);
      groups.get(t.topic).push(t);
    }
    return groups;
  }, [shown]);

  const topicLabel = (id) => {
    const topic = hub.topics?.find((t) => t.id === id);
    if (!topic) return id;
    return en ? topic.en?.label ?? topic.label : topic.label;
  };

  return (
    <main className="reading-grain min-h-screen bg-paper py-10 text-ink" style={{ zoom: scale }}>
      <div className="mx-auto mb-6 flex max-w-[52rem] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/statisticslab" className="text-token-sm text-ink-faint transition-colors duration-fast hover:text-accent">
          ← {en ? 'Statistics Lab' : '統計學實驗室'}
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitch lang={lang} onChange={setLang} />
          <FontSizeControl scale={scale} onChange={setScale} />
        </div>
      </div>

      <div className="mx-auto max-w-[52rem] px-4 sm:px-6">
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

        {[...byTopic.entries()].map(([topic, list]) => (
          <section key={topic} className="mb-10">
            <h2 className="mb-4 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">
              {topicLabel(topic)}
            </h2>
            <ul className="space-y-5">
              {list.map((t) => (
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
    </main>
  );
}
