import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageShell from '../components/PageShell';
import LangSwitch, { useLang } from '../components/LangSwitch';
import Tabs, { useTabParam } from '../components/lab/Tabs';
import data from '../data/statistics.json';

/*
 * The hub. It lists whatever the data repo says exists — a new article means a
 * new entry in statistics.json and a new page file, and nothing here changes.
 */
const COPY = {
  zh: {
    title: '統計學實驗室',
    intro: '每一篇處理一個統計學裡看起來理所當然、來歷卻可疑的東西：它為什麼長這樣，當初是誰為了什麼問題發明它，以及它被誤用時會壞在哪裡。文中的模擬可以親手轉動，因為有些事情，得自己按下去重跑一萬次才會相信。',
    all: '全部',
    topicsLabel: '主題',
    empty: '這個主題還沒有文章。',
    minutes: (m) => ` · 約 ${m} 分鐘`,
  },
  en: {
    title: 'Statistics Lab',
    intro: 'Each piece takes one thing in statistics that looks self-evident and has a questionable history: why it has the shape it has, who invented it and for what problem, and where it breaks when it is misused. The simulations are yours to turn, because some things you only believe after re-running them ten thousand times yourself.',
    all: 'All',
    topicsLabel: 'Topics',
    empty: 'Nothing here yet.',
    minutes: (m) => ` · ${m} min read`,
  },
};

export default function StatisticsLab() {
  const { topics = [], articles = [] } = data;
  const [topic, setTopic] = useTabParam('topic', 'all');
  const { lang, setLang } = useLang();
  const en = lang === 'en';
  const c = COPY[en ? 'en' : 'zh'];

  const label = (t) => (en ? t.en?.label ?? t.label : t.label);
  const blurb = (t) => (en ? t.en?.blurb ?? t.blurb : t.blurb);

  const tabs = [
    { id: 'all', label: c.all, count: articles.length },
    ...topics.map((t) => ({
      id: t.id,
      label: label(t),
      count: articles.filter((a) => a.topic === t.id).length,
    })),
  ];

  const shown = topic === 'all' ? articles : articles.filter((a) => a.topic === topic);
  const active = topics.find((t) => t.id === topic);

  return (
    <PageShell
      title={c.title}
      eyebrow="Statistics Lab"
      width="prose"
      controls={<LangSwitch lang={lang} onChange={setLang} />}
    >
      <p className="mb-8 text-token-base leading-relaxed text-ink-muted">{c.intro}</p>

      <Tabs items={tabs} value={topic} onChange={setTopic} label={c.topicsLabel} />
      {active ? <p className="mt-3 text-token-sm text-ink-faint">{blurb(active)}</p> : null}

      <div className="mt-6">
        {shown.map((a) => (
          <Link
            key={a.slug}
            to={a.route}
            className="group block border-b border-line-soft py-5 transition-colors duration-fast hover:bg-surface"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-token-lg text-ink">{en ? a.en?.title ?? a.title : a.title}</h2>
              <ArrowRight
                size={16}
                className="shrink-0 text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </div>
            {(en ? a.en?.subtitle : a.subtitle) ? (
              <p className="mt-1 text-token-sm text-ink-muted">{en ? a.en.subtitle : a.subtitle}</p>
            ) : null}
            <p className="mt-2 text-token-sm leading-relaxed text-ink-faint">
              {en ? a.en?.summary ?? a.summary : a.summary}
            </p>
            <p className="mt-2 text-token-xs text-ink-faint">
              {a.publishedAt}
              {a.readingMinutes ? c.minutes(a.readingMinutes) : ''}
            </p>
          </Link>
        ))}
        {shown.length === 0 ? <p className="py-8 text-token-sm text-ink-faint">{c.empty}</p> : null}
      </div>
    </PageShell>
  );
}
