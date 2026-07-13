import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageShell from '../components/PageShell';
import Tabs, { useTabParam } from '../components/lab/Tabs';
import data from '../data/statistics.json';

/*
 * The hub. It lists whatever the data repo says exists — a new article means a
 * new entry in statistics.json and a new page file, and nothing here changes.
 */
export default function StatisticsLab() {
  const { topics = [], articles = [] } = data;
  const [topic, setTopic] = useTabParam('topic', 'all');

  const tabs = [
    { id: 'all', label: '全部', count: articles.length },
    ...topics.map((t) => ({
      id: t.id,
      label: t.label,
      count: articles.filter((a) => a.topic === t.id).length,
    })),
  ];

  const shown = topic === 'all' ? articles : articles.filter((a) => a.topic === topic);
  const blurb = topics.find((t) => t.id === topic)?.blurb;

  return (
    <PageShell
      title="統計學實驗室"
      eyebrow="Statistics Lab"
      width="prose"
    >
      <p className="mb-8 text-token-base leading-relaxed text-ink-muted">
        每一篇處理一個統計學裡看起來理所當然、其實來歷可疑的東西：它為什麼長這樣、當初是誰為了什麼問題發明它、
        以及它被誤用時會壞在哪裡。文中的模擬可以親手轉動，因為有些事情只有自己按下去重跑一萬次才會相信。
      </p>

      <Tabs items={tabs} value={topic} onChange={setTopic} label="主題" />
      {blurb ? <p className="mt-3 text-token-sm text-ink-faint">{blurb}</p> : null}

      <div className="mt-6">
        {shown.map((a) => (
          <Link
            key={a.slug}
            to={a.route}
            className="group block border-b border-line-soft py-5 transition-colors duration-fast hover:bg-surface"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-token-lg text-ink">{a.title}</h2>
              <ArrowRight
                size={16}
                className="shrink-0 text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </div>
            {a.subtitle ? <p className="mt-1 text-token-sm text-ink-muted">{a.subtitle}</p> : null}
            <p className="mt-2 text-token-sm leading-relaxed text-ink-faint">{a.summary}</p>
            <p className="mt-2 text-token-xs text-ink-faint">
              {a.publishedAt}
              {a.readingMinutes ? ` · 約 ${a.readingMinutes} 分鐘` : ''}
            </p>
          </Link>
        ))}
        {shown.length === 0 ? (
          <p className="py-8 text-token-sm text-ink-faint">這個主題還沒有文章。</p>
        ) : null}
      </div>
    </PageShell>
  );
}
