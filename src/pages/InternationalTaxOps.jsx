import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Background, Controls, ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Database,
  Filter,
  GitBranch,
  Globe2,
  Languages,
  Layers3,
  Library,
  Scale,
  ShieldCheck,
  } from 'lucide-react';
import sources from '../data/intlTaxOps/sources.json';
import topics from '../data/intlTaxOps/topics.json';
import schema from '../data/intlTaxOps/data_classification_schema.json';
import watchlist from '../data/intlTaxOps/frontier_watchlist.json';
import controversies from '../data/intlTaxOps/controversies.json';
import digest from '../data/intlTaxOps/frontier_digest.json';
import researchAnalyses from '../data/intlTaxOps/research_analyses.json';
import thematicAnalyses from '../data/intlTaxOps/thematic_analyses.json';
import glossary from '../data/intlTaxOps/glossary.json';
import styles from './InternationalTaxOps.module.css';

const ui = {
  zh: {
    app: '國際稅法研究桌',
    subtitle: '從規範文本、制度設計與實務材料提出可追問的國際稅法問題',
    lang: 'English',
    sources: '來源',
    topics: '議題',
    queued: '待處理',
    verified: '可核實來源',
    lens: '分類視角',
    matrix: '議題矩陣',
    sourceRegistry: '來源登錄',
    relations: '關係圖譜',
    controversies: '案例與爭議',
    nextActions: '待補研究',
    risk: '風險',
    open: '打開來源',
    cadence: '更新頻率',
    checked: '核實日',
    authority: '權威層',
    temporal: '時間狀態',
    type: '材料類型',
    layer: '認識層',
    all: '全部',
    desc: '把法律權威、實務觀察、趨勢訊號與研究熱點分開標記，避免把不同證據強度的材料混在一起。',
    relatedTopics: '相關議題',
    citation: '引用',
    liveCase: '對照案例頁面',
    digest: '最新動態',
    digestEmpty: '尚無研究過的動態。',
    research: '主題判讀',
    researchLead: '已完成的研究判讀，從問題、結論與研究意義展開。',
    closeReading: '深度研讀',
    closeReadingLead: '單篇文獻的完整分析：問題、方法、發現、規範意涵與對研究題目的意義。',
    wiki: '名詞與機構',
    wikiLead: '本研究反覆出現的概念、機構與文書，每則附權威出處。',
    conceptCat: '概念',
    institutionCat: '機構',
    instrumentCat: '文書',
    provisionCat: '條文',
    whyMatters: '研究相關性',
    question: '研究問題',
    finding: '目前判讀',
    researchMeaning: '對研究題目的意義',
    evidence: '依據',
    readAt: '研讀日',
  },
  en: {
    app: 'International Tax Research Desk',
    subtitle: 'Research questions developed from legal texts, institutional design, and practice materials',
    lang: '中文',
    sources: 'Sources',
    topics: 'Topics',
    queued: 'Queued',
    verified: 'Verifiable sources',
    lens: 'Classification Lens',
    matrix: 'Topic Matrix',
    sourceRegistry: 'Source Registry',
    relations: 'Relations',
    controversies: 'Cases & Controversies',
    nextActions: 'Research follow-up',
    risk: 'Risk',
    open: 'Open source',
    cadence: 'Cadence',
    checked: 'Checked',
    authority: 'Authority',
    temporal: 'Temporal',
    type: 'Material type',
    layer: 'Epistemic layer',
    all: 'All',
    desc: 'Separates legal authority, implementation facts, trend signals, and research hotspots so claims are not mixed across evidence strength.',
    relatedTopics: 'Related topics',
    citation: 'Citation',
    liveCase: 'See the applied case page',
    digest: 'Latest Digest',
    digestEmpty: 'No researched updates yet.',
    research: 'Thematic Analysis',
    researchLead: 'Completed research readings developed through questions, findings, and implications.',
    closeReading: 'Close Reading',
    closeReadingLead: 'Full single-work analyses: question, method, findings, normative stakes, and what they mean for this project.',
    wiki: 'Glossary',
    wikiLead: 'Recurring concepts, institutions, and instruments in this research, each with an authoritative source.',
    conceptCat: 'Concepts',
    institutionCat: 'Institutions',
    instrumentCat: 'Instruments',
    provisionCat: 'Provisions',
    whyMatters: 'Why it matters here',
    question: 'Research question',
    finding: 'Current reading',
    researchMeaning: 'Implication for the project',
    evidence: 'Basis',
    readAt: 'Read',
  },
};

const MAIN_TABS = [
  { id: 'research', labelKey: 'research', Icon: BookOpen },
  { id: 'closeReading', labelKey: 'closeReading', Icon: BookMarked },
  { id: 'wiki', labelKey: 'wiki', Icon: Library },
  { id: 'matrix', labelKey: 'matrix', Icon: Layers3 },
  { id: 'digest', labelKey: 'digest', Icon: Activity },
  { id: 'sources', labelKey: 'sourceRegistry', Icon: Database },
  { id: 'relations', labelKey: 'relations', Icon: GitBranch },
  { id: 'controversies', labelKey: 'controversies', Icon: Scale },
];

const WIKI_CATEGORIES = [
  { id: 'concept', labelKey: 'conceptCat' },
  { id: 'institution', labelKey: 'institutionCat' },
  { id: 'instrument', labelKey: 'instrumentCat' },
  { id: 'provision', labelKey: 'provisionCat' },
];

function labelFor(axis, id, lang) {
  const list = schema.axes[axis];
  if (!Array.isArray(list)) return id;
  const hit = list.find((item) => item.id === id || item === id);
  if (!hit) return id;
  if (typeof hit === 'string') return hit;
  return hit[lang] ?? hit.en ?? id;
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

function topicTitleById(id, lang) {
  return topics.find((topic) => topic.id === id)?.title?.[lang] ?? id;
}

function sourceTitleById(id, lang) {
  return watchlist.find((item) => item.id === id)?.label?.[lang]
    ?? sources.find((item) => item.id === id)?.title?.[lang]
    ?? id;
}

function verificationLabel(value, lang) {
  const labels = {
    'verified-against-snapshot': { zh: '已對照存檔文本核實', en: 'Verified against archived text' },
    'verified-against-source': { zh: '已對照原始來源', en: 'Verified against source' },
    pending: { zh: '待核實', en: 'Pending verification' },
  };
  return labels[value]?.[lang] ?? value;
}

export default function InternationalTaxOps() {
  useEffect(() => {
    document.title = '國際稅法研究桌 · Canvas Lab';
  }, []);

  const [lang, setLang] = useState('zh');
  const [mainTab, setMainTab] = useState('research');
  const [layer, setLayer] = useState('all');
  const [wikiCategory, setWikiCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Accordion cards default fully expanded, consistent with the rest of
  // Canvas Lab (see feedback_accordion_default), rather than a single-select
  // model that forces a separate detail panel far from the card you clicked.
  const [expandedTopics, setExpandedTopics] = useState(() => new Set(topics.map((topic) => topic.id)));
  const [expandedSections, setExpandedSections] = useState(() => new Set(
    researchAnalyses.flatMap((paper) => paper.sections.map((section) => `${paper.id}:${section.id}`)),
  ));
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

  const filteredDigest = useMemo(() => {
    const sorted = [...digest].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!query) return sorted;
    return sorted.filter((item) => [
      item.headline.zh,
      item.headline.en,
      item.analysis.zh,
      item.analysis.en,
      item.sourceId,
      ...(item.relatedTopicIds ?? []),
    ].join(' ').toLowerCase().includes(query));
  }, [query]);

  const glossaryGroups = useMemo(() => {
    const filtered = glossary.filter((entry) => {
      if (wikiCategory !== 'all' && entry.category !== wikiCategory) return false;
      if (!query) return true;
      return [
        entry.term.zh,
        entry.term.en,
        entry.definition.zh,
        entry.definition.en,
        entry.whyItMatters?.zh ?? '',
        entry.whyItMatters?.en ?? '',
      ].join(' ').toLowerCase().includes(query);
    });
    // Group under subcategory headings, preserving the array's order
    // (which mirrors docs/13_GLOSSARY_PLAN.md in the data repo).
    const groups = [];
    const byId = new Map();
    for (const entry of filtered) {
      const key = entry.subcategory.id;
      if (!byId.has(key)) {
        const group = { id: key, label: entry.subcategory, entries: [] };
        byId.set(key, group);
        groups.push(group);
      }
      byId.get(key).entries.push(entry);
    }
    return groups;
  }, [wikiCategory, query]);

  const toggleTopic = (id) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSection = (key) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Only source -> topic edges reflect a recorded research relationship.
  const { graphNodes: layoutNodes, graphEdges: layoutEdges } = useMemo(() => {
    const NODE_WIDTH = { source: 210, topic: 245 };
    const NODE_HEIGHT = 68;

    const sourceEdges = topics.flatMap((topic) => topic.sourceIds.map((sourceId) => ({
      id: `${sourceId}-${topic.id}`,
      source: sourceId,
      target: topic.id,
    })));

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 24, ranksep: 90 });

    sources.forEach((source) => {
      dagreGraph.setNode(source.id, { width: NODE_WIDTH.source, height: NODE_HEIGHT });
    });
    topics.forEach((topic) => {
      dagreGraph.setNode(topic.id, { width: NODE_WIDTH.topic, height: NODE_HEIGHT });
    });
    sourceEdges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));

    dagre.layout(dagreGraph);

    const sourceNodes = sources.map((source) => {
      const { x, y } = dagreGraph.node(source.id);
      return {
        id: source.id,
        type: 'default',
        position: { x: x - NODE_WIDTH.source / 2, y: y - NODE_HEIGHT / 2 },
        data: { label: `${source.institution} · ${source.title[lang]}` },
        className: 'sourceNode',
      };
    });

    const topicNodes = topics.map((topic) => {
      const { x, y } = dagreGraph.node(topic.id);
      return {
        id: topic.id,
        type: 'default',
        position: { x: x - NODE_WIDTH.topic / 2, y: y - NODE_HEIGHT / 2 },
        data: { label: topic.title[lang] },
        className: 'topicNode',
      };
    });

    return {
      graphNodes: [...sourceNodes, ...topicNodes],
      graphEdges: sourceEdges,
    };
  }, [lang]);

  // ReactFlow's `nodes`/`edges` props are controlled — without local state
  // synced via onNodesChange/onEdgesChange, dragging has nowhere to persist
  // to and silently resets on every render. useNodesState/useEdgesState own
  // that local state; the effects below re-sync from the dagre layout only
  // when the underlying data actually changes (language), not on every
  // render, so a drag isn't immediately undone by React Flow itself.
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);
  useEffect(() => { setNodes(layoutNodes); }, [layoutNodes, setNodes]);
  useEffect(() => { setEdges(layoutEdges); }, [layoutEdges, setEdges]);

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
        </nav>

        <div className={styles.sideSection}>
          <div className={styles.filterHeader}>
            <Filter size={13} />
            <p>{t.lens}</p>
          </div>
          <p className={styles.filterDesc}>{t.desc}</p>
          <button
            className={layer === 'all' ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
            onClick={() => { setLayer('all'); setMainTab('matrix'); }}
          >
            <span />
            {t.all}
          </button>
          {layers.map((item) => (
            <button
              key={item.id}
              className={layer === item.id ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
              onClick={() => { setLayer(item.id); setMainTab('matrix'); }}
            >
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
            <span className={styles.headerMeta}>{thematicAnalyses.length} {t.research} · {topics.length} {t.topics} · {digest.length} {t.digest}</span>
            <Pill icon={BookOpen} text={lang === 'zh' ? '持續研讀' : 'In active study'} />
          </div>
        </header>

        <nav className={styles.mainTabBar}>
          {MAIN_TABS.map(({ id, labelKey, Icon }) => (
            <button
              key={id}
              className={mainTab === id ? `${styles.mainTabButton} ${styles.active}` : styles.mainTabButton}
              onClick={() => setMainTab(id)}
            >
              <Icon size={15} />
              {t[labelKey]}
            </button>
          ))}
        </nav>

        {mainTab === 'matrix' && (
          <>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>{t.matrix}</h2>
                <GitBranch size={18} />
              </div>
              <div className={styles.topicList}>
                {filteredTopics.map((topic) => {
                  const isOpen = expandedTopics.has(topic.id);
                  return (
                    <div key={topic.id} className={styles.topic}>
                      <button
                        type="button"
                        className={styles.topicHeader}
                        onClick={() => toggleTopic(topic.id)}
                        aria-expanded={isOpen}
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
                        <ChevronDown size={16} className={isOpen ? `${styles.topicChevron} ${styles.open}` : styles.topicChevron} />
                      </button>
                      {isOpen && (
                        <div className={styles.topicDetail}>
                          <InfoLine label={t.authority} value={labelFor('authorityTier', topic.authorityTier, lang)} />
                          <InfoLine label={t.temporal} value={labelFor('temporalStatus', topic.temporalStatus, lang)} />
                          <h4>{t.nextActions}</h4>
                          <ul className={styles.actionList}>
                            {topic.nextActions[lang].map((item) => <li key={item}>{item}</li>)}
                          </ul>
                          <h4>{t.risk}</h4>
                          <div className={`${styles.tagRow} ${styles.danger}`}>
                            {topic.riskFlags.map((flag) => <span key={flag}>{riskLabel(flag, lang)}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {mainTab === 'research' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t.research}</h2>
                <p>{t.researchLead}</p>
              </div>
              <BookOpen size={18} />
            </div>
            <div className={styles.analysisGrid}>
              {thematicAnalyses.map((analysis) => (
                <article key={analysis.id} className={styles.analysisCard}>
                  <h3>{analysis.title[lang]}</h3>
                  <div className={styles.analysisBlock}>
                    <span>{t.question}</span>
                    <p>{analysis.question[lang]}</p>
                  </div>
                  <div className={styles.analysisBlock}>
                    <span>{t.finding}</span>
                    <p>{analysis.finding[lang]}</p>
                  </div>
                  <div className={`${styles.analysisBlock} ${styles.analysisMeaning}`}>
                    <span>{t.researchMeaning}</span>
                    <p>{analysis.researchMeaning[lang]}</p>
                  </div>
                  <footer>
                    <span>{t.evidence}: {analysis.evidence[lang]}</span>
                    <a href={analysis.sourceUrl} target="_blank" rel="noreferrer">{t.open}<ArrowUpRight size={14} /></a>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {mainTab === 'closeReading' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t.closeReading}</h2>
                <p>{t.closeReadingLead}</p>
              </div>
              <BookMarked size={18} />
            </div>
            <div className={styles.controversyList}>
              {researchAnalyses.map((paper) => (
                <article key={paper.id} className={styles.paperCard}>
                  <header className={styles.paperHead}>
                    <h3>{paper.citation.title}</h3>
                    <p className={styles.paperTagline}>{paper.tagline[lang]}</p>
                    <div className={styles.tagRow}>
                      <span>{paper.researchLineLabel[lang]}</span>
                      <span>{t.readAt}: {paper.readAt}</span>
                    </div>
                    {paper.relatedTopicIds?.length > 0 && (
                      <div className={styles.controversyRelated}>
                        <span>{t.relatedTopics}</span>
                        {paper.relatedTopicIds.map((id) => <span key={id}>{topicTitleById(id, lang)}</span>)}
                      </div>
                    )}
                    <div className={styles.controversyCitation}>
                      <span>{paper.citation.authors} — {paper.citation.venue[lang]}</span>
                      <a href={paper.citation.ssrnUrl} target="_blank" rel="noreferrer">SSRN<ArrowUpRight size={14} /></a>
                    </div>
                  </header>
                  <div>
                    {paper.sections.map((section) => {
                      const key = `${paper.id}:${section.id}`;
                      const isOpen = expandedSections.has(key);
                      return (
                        <div key={section.id} className={styles.paperSection}>
                          <button
                            type="button"
                            className={styles.paperSectionHeader}
                            onClick={() => toggleSection(key)}
                            aria-expanded={isOpen}
                          >
                            <span className={styles.paperSectionTitle}>{section.heading[lang]}</span>
                            <ChevronDown size={15} className={isOpen ? `${styles.topicChevron} ${styles.open}` : styles.topicChevron} />
                          </button>
                          {isOpen && (
                            <div className={styles.paperSectionBody}>
                              <p>{section.body[lang]}</p>
                              {section.table && (
                                <figure className={styles.analysisTableWrap}>
                                  <div className={styles.analysisTableScroll}>
                                    <table className={styles.analysisTable}>
                                      <thead>
                                        <tr>
                                          {section.table.columns.map((col) => <th key={col.en}>{col[lang]}</th>)}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {section.table.rows.map((row) => (
                                          <tr key={row.cells[0].en}>
                                            {row.cells.map((cell, cellIndex) => <td key={cellIndex}>{cell[lang]}</td>)}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <figcaption>{section.table.caption[lang]}</figcaption>
                                </figure>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {mainTab === 'wiki' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t.wiki}</h2>
                <p>{t.wikiLead}</p>
              </div>
              <Library size={18} />
            </div>
            <div className={styles.wikiFilters}>
              <button
                type="button"
                className={wikiCategory === 'all' ? styles.active : ''}
                onClick={() => setWikiCategory('all')}
              >
                {t.all}
              </button>
              {WIKI_CATEGORIES.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  className={wikiCategory === id ? styles.active : ''}
                  onClick={() => setWikiCategory(id)}
                >
                  {t[labelKey]}
                </button>
              ))}
            </div>
            {glossaryGroups.map((group) => (
              <div key={group.id}>
                <h3 className={styles.wikiGroupHead}>{group.label[lang]}</h3>
                <div className={styles.analysisGrid}>
                  {group.entries.map((entry) => (
                    <article key={entry.id} className={styles.analysisCard}>
                      <div className={styles.tagRow}>
                        <span>{t[`${entry.category}Cat`]}</span>
                      </div>
                      <h3>{entry.term[lang]}</h3>
                      <div className={styles.analysisBlock}>
                        <p>{entry.definition[lang]}</p>
                      </div>
                      {entry.whyItMatters && (
                        <div className={styles.analysisBlock}>
                          <span>{t.whyMatters}</span>
                          <p>{entry.whyItMatters[lang]}</p>
                        </div>
                      )}
                      <footer>
                        <span>{entry.sourceLabel[lang]}</span>
                        <a href={entry.sourceUrl} target="_blank" rel="noreferrer">{t.open}<ArrowUpRight size={14} /></a>
                      </footer>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {mainTab === 'digest' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>{t.digest}</h2>
              <Activity size={18} />
            </div>
            {filteredDigest.length === 0 ? (
              <p className={styles.filterDesc}>{t.digestEmpty}</p>
            ) : (
              <div className={styles.controversyList}>
                {filteredDigest.map((item) => (
                  <article key={item.id} className={styles.controversyCard}>
                    <h3>{item.headline[lang]}</h3>
                    <p>{item.analysis[lang]}</p>
                    <div className={styles.tagRow}>
                      <span>{item.date}</span>
                      <span>{labelFor('authorityTier', item.authorityTier, lang)}</span>
                      <span>{verificationLabel(item.verification, lang)}</span>
                    </div>
                    {item.relatedTopicIds?.length > 0 && (
                      <div className={styles.controversyRelated}>
                        <span>{t.relatedTopics}</span>
                        {item.relatedTopicIds.map((id) => <span key={id}>{topicTitleById(id, lang)}</span>)}
                      </div>
                    )}
                    <div className={styles.controversyCitation}>
                      <span>{sourceTitleById(item.sourceId, lang)}</span>
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer">{t.open}<ArrowUpRight size={14} /></a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {mainTab === 'sources' && (
          <section className={styles.panel}>
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
                  <Pill icon={CheckCircle2} text={`${t.checked}: ${source.dateChecked}`} />
                  <a href={source.url} target="_blank" rel="noreferrer" aria-label={t.open}>
                    <ArrowUpRight size={17} />
                  </a>
                </article>
              ))}
            </div>
          </section>
        )}

        {mainTab === 'relations' && (
          <section className={`${styles.panel} ${styles.frontier}`}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t.relations}</h2>
                  <p>{lang === 'zh' ? '拖曳節點、縮放畫面，查看已研究來源與議題之間的連線。' : 'Drag nodes and zoom to inspect the connections between researched sources and topics.'}</p>
              </div>
              <GitBranch size={18} />
            </div>
            <div className={styles.relationCanvas}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                minZoom={0.35}
                maxZoom={1.45}
              >
                <Background color="#d9dee2" gap={18} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </section>
        )}

        {mainTab === 'controversies' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>{t.controversies}</h2>
              <Scale size={18} />
            </div>
            <div className={styles.controversyList}>
              {controversies.map((item) => (
                <article key={item.id} className={styles.controversyCard}>
                  <h3>{item.title[lang]}</h3>
                  <p>{item.summary[lang]}</p>
                  <div className={styles.tagRow}>
                    <span>{labelFor('authorityTier', item.authorityTier, lang)}</span>
                    {item.topicDomain.slice(0, 3).map((domain) => <span key={domain}>{domain}</span>)}
                  </div>
                  {item.relatedTopicIds?.length > 0 && (
                    <div className={styles.controversyRelated}>
                      <span>{t.relatedTopics}</span>
                      {item.relatedTopicIds.map((id) => <span key={id}>{topicTitleById(id, lang)}</span>)}
                    </div>
                  )}
                  <div className={styles.controversyCitation}>
                    <span>{item.citation.author} — {item.citation.venue}, {item.citation.date}</span>
                    {item.internalLink ? (
                      <Link to={item.internalLink}>{t.liveCase}<ArrowUpRight size={14} /></Link>
                    ) : (
                      <a href={item.citation.url} target="_blank" rel="noreferrer">{t.citation}<ArrowUpRight size={14} /></a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
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
