import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Background, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Database,
  FileSearch,
  Filter,
  GitBranch,
  Globe2,
  Languages,
  Layers3,
  Radar,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import sources from '../data/intlTaxOps/sources.json';
import topics from '../data/intlTaxOps/topics.json';
import schema from '../data/intlTaxOps/data_classification_schema.json';
import watchlist from '../data/intlTaxOps/frontier_watchlist.json';
import styles from './InternationalTaxOps.module.css';

const ui = {
  zh: {
    app: '國際稅法研究桌',
    subtitle: '規範、實然、趨勢、未來發展、研究熱點與學者生態的雙語監測面板',
    lang: 'English',
    snapshot: '研究快照',
    sources: '來源',
    topics: '議題',
    watch: '監測',
    queued: '待處理',
    verified: '可核實來源',
    lens: '分類視角',
    matrix: '議題矩陣',
    sourceRegistry: '來源登錄',
    frontier: '前沿監測',
    nextActions: '待補研究',
    risk: '風險',
    open: '打開來源',
    cadence: '更新頻率',
    checked: '核實日',
    authority: '權威層',
    temporal: '時間狀態',
    workflow: '工作流',
    type: '材料類型',
    layer: '認識層',
    all: '全部',
    allViews: '全部視角',
    filterLens: '篩選研究視角',
    desc: '把法律權威、實務觀察、趨勢訊號與研究熱點分開標記，避免把不同證據強度的材料混在一起。',
  },
  en: {
    app: 'International Tax Research Desk',
    subtitle: 'A bilingual research desk for rules, implementation, trends, future development, hotspots, and scholar ecosystems',
    lang: '中文',
    snapshot: 'Research Snapshot',
    sources: 'Sources',
    topics: 'Topics',
    watch: 'Watch',
    queued: 'Queued',
    verified: 'Verifiable sources',
    lens: 'Classification Lens',
    matrix: 'Topic Matrix',
    sourceRegistry: 'Source Registry',
    frontier: 'Frontier Watch',
    nextActions: 'Research follow-up',
    risk: 'Risk',
    open: 'Open source',
    cadence: 'Cadence',
    checked: 'Checked',
    authority: 'Authority',
    temporal: 'Temporal',
    workflow: 'Workflow',
    type: 'Material type',
    layer: 'Epistemic layer',
    all: 'All',
    allViews: 'All views',
    filterLens: 'Filter by research view',
    desc: 'Separates legal authority, implementation facts, trend signals, and research hotspots so claims are not mixed across evidence strength.',
  },
};

const axisLabels = {
  authorityTier: { zh: '權威層級', en: 'Authority' },
  temporalStatus: { zh: '時間狀態', en: 'Temporal status' },
  workflowState: { zh: '工作流', en: 'Workflow' },
};

function labelFor(axis, id, lang) {
  const list = schema.axes[axis];
  if (!Array.isArray(list)) return id;
  const hit = list.find((item) => item.id === id || item === id);
  if (!hit) return id;
  if (typeof hit === 'string') return hit;
  return hit[lang] ?? hit.en ?? id;
}

function cadenceLabel(value, lang) {
  const labels = {
    hourly: { zh: '每小時', en: 'Hourly' },
    daily: { zh: '每日', en: 'Daily' },
    weekly: { zh: '每週', en: 'Weekly' },
    monthly: { zh: '每月', en: 'Monthly' },
    quarterly: { zh: '每季', en: 'Quarterly' },
    manual: { zh: '人工確認', en: 'Manual review' },
  };
  return labels[value]?.[lang] ?? value;
}

function watchTypeLabel(value, lang) {
  const labels = {
    institution: { zh: '機構', en: 'Institution' },
    scholar: { zh: '學者', en: 'Scholar' },
    event: { zh: '活動', en: 'Event' },
    'official-stream': { zh: '官方動態', en: 'Official stream' },
    'secondary-signal': { zh: '輔助線索', en: 'Secondary clue' },
  };
  return labels[value]?.[lang] ?? value;
}

function priorityLabel(value, lang) {
  const labels = {
    high: { zh: '高', en: 'High' },
    medium: { zh: '中', en: 'Medium' },
    low: { zh: '低', en: 'Low' },
  };
  return labels[value]?.[lang] ?? value;
}

function riskLabel(value, lang) {
  const labels = {
    'version-sensitive': { zh: '版本敏感', en: 'Version sensitive' },
    'implementation-divergence': { zh: '各國落差', en: 'Implementation divergence' },
    'draft-process': { zh: '草案進行中', en: 'Draft process' },
    'politically-contested': { zh: '政治爭議高', en: 'Politically contested' },
    'secondary-source': { zh: '輔助來源', en: 'Secondary source' },
    'login-gated': { zh: '可能需登入', en: 'May require sign-in' },
    'methodology-sensitive': { zh: '方法敏感', en: 'Method sensitive' },
    'policy-contested': { zh: '政策爭議高', en: 'Policy contested' },
  };
  return labels[value]?.[lang] ?? value;
}

export default function InternationalTaxOps() {
  useEffect(() => {
    document.title = '國際稅法研究桌 · Canvas Lab';
  }, []);

  const [lang, setLang] = useState('zh');
  const [layer, setLayer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(topics[0]);
  const t = ui[lang];

  const layers = schema.axes.epistemicLayer;
  const query = searchTerm.trim().toLowerCase();
  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const byLayer = layer === 'all' || topic.epistemicLayer.includes(layer);
      if (!byLayer) return false;
      if (!query) return true;
      return [
        topic.title.zh,
        topic.title.en,
        topic.summary.zh,
        topic.summary.en,
        ...topic.topicDomain,
        ...topic.riskFlags,
      ].join(' ').toLowerCase().includes(query);
    });
  }, [layer, query]);

  const filteredSources = useMemo(() => {
    if (!query) return sources;
    return sources.filter((source) => [
      source.title.zh,
      source.title.en,
      source.institution,
      source.authorityTier,
      ...source.topicDomain,
    ].join(' ').toLowerCase().includes(query));
  }, [query]);

  const filteredWatchlist = useMemo(() => {
    if (!query) return watchlist;
    return watchlist.filter((item) => [
      item.label.zh,
      item.label.en,
      item.latestObserved,
      item.latestObservedZh,
      item.watchType,
      ...item.signals,
    ].join(' ').toLowerCase().includes(query));
  }, [query]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const officialCount = sources.filter((s) => s.authorityTier.startsWith('official') || s.authorityTier === 'binding-law').length;
  const queuedCount = sources.filter((s) => s.workflowState.includes('needed')).length;
  const watchCount = watchlist.length;
  const graphNodes = useMemo(() => {
    const topicNodes = topics.map((topic, index) => ({
      id: topic.id,
      type: 'default',
      position: { x: 300, y: index * 150 },
      data: { label: topic.title[lang] },
      className: 'topicNode',
    }));

    const sourceNodes = sources.map((source, index) => ({
      id: source.id,
      type: 'default',
      position: { x: index % 2 === 0 ? 30 : 570, y: Math.floor(index / 2) * 132 + 24 },
      data: { label: `${source.institution} · ${source.title[lang]}` },
      className: 'sourceNode',
    }));

    const watchNodes = watchlist.slice(0, 5).map((item, index) => ({
      id: `watch-${item.id}`,
      type: 'default',
      position: { x: 810, y: index * 112 + 10 },
      data: { label: item.label[lang] },
      className: 'watchNode',
    }));

    return [...sourceNodes, ...topicNodes, ...watchNodes];
  }, [lang]);

  const graphEdges = useMemo(() => {
    const sourceEdges = topics.flatMap((topic) => topic.sourceIds.map((sourceId) => ({
      id: `${sourceId}-${topic.id}`,
      source: sourceId,
      target: topic.id,
      animated: topic.id === selected.id,
      className: topic.id === selected.id ? 'activeEdge' : '',
    })));

    const watchEdges = watchlist.slice(0, 5).map((item, index) => ({
      id: `${topics[index % topics.length].id}-watch-${item.id}`,
      source: topics[index % topics.length].id,
      target: `watch-${item.id}`,
      className: 'watchEdge',
    }));

    return [...sourceEdges, ...watchEdges];
  }, [selected.id]);

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandMark}><Globe2 size={20} /></div>
          <div>
            <strong>Tax Desk</strong>
            <span>Intl Tax</span>
          </div>
        </div>

        <label className={styles.quickSearch}>
          <Filter size={14} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={lang === 'zh' ? '搜尋來源、命題、學者' : 'Search sources, claims, actors'}
          />
        </label>

        <nav className={styles.sideNav}>
          <Link to="/"><ArrowLeft size={15} />{lang === 'zh' ? '回總入口' : 'Back to Canvas'}</Link>
          <button type="button" onClick={() => scrollToSection('sources')}><Database size={15} />{t.sourceRegistry}</button>
          <button type="button" onClick={() => scrollToSection('lens')}><Layers3 size={15} />{t.lens}</button>
          <button type="button" onClick={() => scrollToSection('frontier')}><Radar size={15} />{t.frontier}</button>
          <button type="button" onClick={() => scrollToSection('relations')}><GitBranch size={15} />{lang === 'zh' ? '關係圖譜' : 'Relations'}</button>
        </nav>

        <div className={styles.sideSection}>
          <div className={styles.filterHeader}>
            <Filter size={13} />
            <p>{t.filterLens}</p>
          </div>
          <button className={layer === 'all' ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter} onClick={() => setLayer('all')}>
            <span />
            {t.allViews}
          </button>
          {layers.slice(0, 6).map((item) => (
            <button key={item.id} className={layer === item.id ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter} onClick={() => setLayer(item.id)}>
              <span />
              {item[lang]}
            </button>
          ))}
        </div>

        <button className={`${styles.langButton} ${styles.sideLang}`} onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
          <Languages size={16} />
          {t.lang}
        </button>
      </aside>

      <section className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div>
              <p className={styles.eyebrow}>International Tax Intelligence Workspace</p>
              <h1>{t.app}</h1>
              <p>{t.subtitle}</p>
            </div>
          </div>
          <div className={styles.topActions}>
            <Pill icon={RefreshCcw} text={lang === 'zh' ? '更新觀察中' : 'Watching updates'} />
            <Pill icon={ShieldCheck} text={lang === 'zh' ? '來源已標註' : 'Sources labelled'} />
          </div>
        </header>

        <section className={styles.snapshot} aria-label={t.snapshot}>
          <Metric icon={Database} label={t.sources} value={sources.length} tone="blue" onClick={() => scrollToSection('sources')} />
          <Metric icon={Layers3} label={t.topics} value={topics.length} tone="green" onClick={() => scrollToSection('lens')} />
          <Metric icon={Radar} label={t.watch} value={watchCount} tone="amber" onClick={() => scrollToSection('frontier')} />
          <Metric icon={FileSearch} label={t.queued} value={queuedCount} tone="red" onClick={() => scrollToSection('sources')} />
          <Metric icon={ShieldCheck} label={t.verified} value={officialCount} tone="slate" onClick={() => scrollToSection('sources')} />
        </section>

        <section id="lens" className={styles.lensPanel}>
          <div className={styles.sectionHead}>
            <div>
              <h2>{t.lens}</h2>
              <p>{t.desc}</p>
            </div>
          </div>
          <div className={styles.chips}>
            <button className={layer === 'all' ? `${styles.chip} ${styles.active}` : styles.chip} onClick={() => setLayer('all')}>{t.all}</button>
            {layers.map((item) => (
              <button key={item.id} className={layer === item.id ? `${styles.chip} ${styles.active}` : styles.chip} onClick={() => setLayer(item.id)}>
                {item[lang]}
              </button>
            ))}
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>{t.matrix}</h2>
              <GitBranch size={18} />
            </div>
            <div className={styles.topicList}>
              {filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  className={selected.id === topic.id ? `${styles.topic} ${styles.active}` : styles.topic}
                  onClick={() => setSelected(topic)}
                >
                  <div className={styles.topicTop}>
                    <span className={`${styles.priority} ${styles[topic.priority] ?? ''}`}>{priorityLabel(topic.priority, lang)}</span>
                    <span>{labelFor('temporalStatus', topic.temporalStatus, lang)}</span>
                  </div>
                  <h3>{topic.title[lang]}</h3>
                  <p>{topic.summary[lang]}</p>
                  <div className={styles.tagRow}>
                    {topic.epistemicLayer.slice(0, 3).map((id) => <span key={id}>{labelFor('epistemicLayer', id, lang)}</span>)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className={`${styles.panel} ${styles.inspector}`}>
            <div className={styles.sectionHead}>
              <h2>{selected.title[lang]}</h2>
              <Activity size={18} />
            </div>
            <p className={styles.summary}>{selected.summary[lang]}</p>
            <InfoLine label={t.authority} value={labelFor('authorityTier', selected.authorityTier, lang)} />
            <InfoLine label={t.temporal} value={labelFor('temporalStatus', selected.temporalStatus, lang)} />
            <InfoLine label={t.workflow} value={labelFor('workflowState', selected.workflowState, lang)} />
            <h4>{t.nextActions}</h4>
            <ul className={styles.actionList}>
              {selected.nextActions[lang].map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h4>{t.risk}</h4>
            <div className={`${styles.tagRow} ${styles.danger}`}>
              {selected.riskFlags.map((flag) => <span key={flag}>{riskLabel(flag, lang)}</span>)}
            </div>
          </aside>
        </div>

        <section id="sources" className={styles.panel}>
          <div className={styles.sectionHead}>
            <h2>{t.sourceRegistry}</h2>
            <CheckCircle2 size={18} />
          </div>
          <div className={styles.sourceTable}>
            {filteredSources.map((source) => (
              <article key={source.id} className={styles.sourceRow}>
                <div>
                  <strong>{source.title[lang]}</strong>
                  <span>{source.institution}</span>
                </div>
                <Pill icon={ShieldCheck} text={labelFor('authorityTier', source.authorityTier, lang)} />
                <Pill icon={RefreshCcw} text={`${t.cadence}: ${cadenceLabel(source.refreshCadence, lang)}`} />
                <Pill icon={CheckCircle2} text={`${t.checked}: ${source.dateChecked}`} />
                <a href={source.url} target="_blank" rel="noreferrer" aria-label={t.open}>
                  <ArrowUpRight size={17} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="frontier" className={`${styles.panel} ${styles.frontier}`}>
          <div className={styles.sectionHead}>
            <h2>{t.frontier}</h2>
            <Sparkles size={18} />
          </div>
          <div className={styles.watchGrid}>
            {filteredWatchlist.slice(0, 6).map((item) => (
              <article key={item.id} className={styles.watchCard}>
                <div className={styles.watchIcon}>{item.watchType === 'secondary-signal' ? <TriangleAlert size={18} /> : <Radar size={18} />}</div>
                <h3>{item.label[lang]}</h3>
                <p>{lang === 'zh' ? item.latestObservedZh ?? item.latestObserved : item.latestObserved}</p>
                <div className={styles.tagRow}>
                  <span>{watchTypeLabel(item.watchType, lang)}</span>
                  <span>{cadenceLabel(item.cadence, lang)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="relations" className={`${styles.panel} ${styles.frontier}`}>
          <div className={styles.sectionHead}>
            <div>
              <h2>{lang === 'zh' ? '關係圖譜' : 'Relations'}</h2>
              <p>{lang === 'zh' ? '拖曳節點、縮放畫面，查看議題、來源與動態之間的連線。' : 'Drag nodes and zoom the canvas to inspect how topics, sources, and live signals connect.'}</p>
            </div>
            <GitBranch size={18} />
          </div>
          <div className={styles.relationCanvas}>
            <ReactFlow
              nodes={graphNodes}
              edges={graphEdges}
              fitView
              minZoom={0.35}
              maxZoom={1.45}
              onNodeClick={(_, node) => {
                const topic = topics.find((item) => item.id === node.id);
                if (topic) setSelected(topic);
              }}
            >
              <Background color="#d9dee2" gap={18} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone, onClick }) {
  return (
    <button className={`${styles.metric} ${styles[tone] ?? ''}`} type="button" onClick={onClick}>
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function Pill({ icon: Icon, text }) {
  return <span className={styles.pill}><Icon size={14} />{text}</span>;
}

function InfoLine({ label, value }) {
  return (
    <div className={styles.infoLine}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
