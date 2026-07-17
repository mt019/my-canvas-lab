import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BookMarked, ChevronRight, ExternalLink, FileText,
  LayoutGrid, Library, ListTree, Newspaper, Search,
} from 'lucide-react';
import styles from './IiasPublications.module.css';
import data from '../data/iiasPublications.json';

// 分類 → 固定 token 槽位（順序不重排；淡底 -bg 填面、ink -tx 細框，見 docs/DESIGN.md 色彩哲學）
const CATS = [
  { name: '法學期刊', slot: 1 },
  { name: '法學專書', slot: 2 },
  { name: '法學叢書', slot: 3 },
  { name: '外文出版品', slot: 4 },
];
const catVars = (name) => {
  const c = CATS.find((x) => x.name === name);
  const n = c ? c.slot : 8;
  return { tx: `var(--cat-${n}-tx)`, bg: `var(--cat-${n}-bg)` };
};

const pdfHref = (url) => `/api/pdf?url=${encodeURIComponent(url)}`;
const coverSrc = (pub) => `/covers/iias/${pub.cover}`;

// 卡片允許選取文字：拖曳選字放開時不當成點擊
const guarded = (fn) => () => {
  if (window.getSelection?.()?.toString()) return;
  fn();
};

const MAIN_TABS = [
  { id: 'overview', label: '總覽', Icon: LayoutGrid },
  { id: 'catalog', label: '完整清單', Icon: Library },
  { id: 'shelf', label: '期刊架', Icon: Newspaper },
  { id: 'index', label: '篇章檢索', Icon: ListTree },
];

function CatBadge({ name }) {
  const v = catVars(name);
  return (
    <span className={styles.badge} style={{ '--badge-tx': v.tx, '--badge-bg': v.bg }}>
      {name}
    </span>
  );
}

function GetLink({ ch }) {
  if (ch.type === 'pdf') {
    return (
      <a className={styles.getLink} href={pdfHref(ch.url)} target="_blank" rel="noreferrer">
        <FileText size={12} />PDF{ch.pdfPages ? `・${ch.pdfPages} 頁` : ''}
      </a>
    );
  }
  if (ch.type === 'read') {
    return (
      <a className={styles.getLink} href={ch.url} target="_blank" rel="noreferrer">
        <ExternalLink size={12} />線上閱覽
      </a>
    );
  }
  return <span className={styles.noFile}>—</span>;
}

function ChapterTable({ chapters }) {
  const rows = [];
  let prevSection = null;
  chapters.forEach((ch, i) => {
    const sec = ch.section || '';
    if (sec && sec !== prevSection) {
      rows.push(
        <tr key={`s${i}`} className={styles.sectionRow}>
          <td colSpan={4}>{sec}</td>
        </tr>,
      );
    }
    prevSection = sec || prevSection;
    rows.push(
      <tr key={i}>
        <td className={styles.chTitle}>{ch.title}</td>
        <td className={styles.chAuthors}>{ch.authors}</td>
        <td className={styles.chPages}>{ch.pages || ''}</td>
        <td><GetLink ch={ch} /></td>
      </tr>,
    );
  });
  return (
    <table className={styles.chapterTable}>
      <thead>
        <tr>
          <th>篇名</th>
          <th>作者</th>
          <th className={styles.chPages}>頁碼</th>
          <th>取得</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

// 出版年表：年 × 分類堆疊條。淡底填色＋同色相 ink 1px 細框、段間 2px 留白、hover 明細。
function YearChart({ pubs }) {
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);

  const { years, maxTotal } = useMemo(() => {
    const byYear = new Map();
    for (const p of pubs) {
      const y = (p.date || '').slice(0, 4);
      if (!y) continue;
      if (!byYear.has(y)) byYear.set(y, Object.fromEntries(CATS.map((c) => [c.name, 0])));
      byYear.get(y)[p.category] += 1;
    }
    const ys = [...byYear.keys()].map(Number);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const list = [];
    let m = 0;
    for (let y = min; y <= max; y++) {
      const counts = byYear.get(String(y)) || Object.fromEntries(CATS.map((c) => [c.name, 0]));
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      m = Math.max(m, total);
      list.push({ year: y, counts, total });
    }
    return { years: list, maxTotal: m };
  }, [pubs]);

  const W = 960;
  const H = 240;
  const M = { top: 18, right: 8, bottom: 26, left: 26 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const slot = plotW / years.length;
  const barW = Math.min(30, slot - 8);
  const yScale = (v) => (v / maxTotal) * plotH;
  const ticks = maxTotal <= 6 ? [...Array(maxTotal + 1).keys()] : [0, 3, 6, 9, 12].filter((t) => t <= maxTotal);

  const showTip = (e, y) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: e.clientX - box.left + 12, y: e.clientY - box.top - 10, ...y });
  };

  return (
    <div className={styles.chartWrap} ref={wrapRef}>
      <div className={styles.chartLegend}>
        {CATS.map((c) => {
          const v = catVars(c.name);
          const n = pubs.filter((p) => p.category === c.name).length;
          return (
            <span key={c.name} className={styles.item}>
              <span className={styles.swatch} style={{ '--sw-tx': v.tx, '--sw-bg': v.bg }} />
              {c.name}・{n} 種
            </span>
          );
        })}
      </div>
      <svg className={styles.chartSvg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="各年份出版品數量，依分類堆疊">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={M.left} x2={W - M.right}
              y1={M.top + plotH - yScale(t)} y2={M.top + plotH - yScale(t)}
              stroke="var(--c-line-soft)" strokeWidth="1"
            />
            <text x={M.left - 6} y={M.top + plotH - yScale(t) + 3} textAnchor="end" fontSize="10" fill="var(--c-ink-faint)">{t}</text>
          </g>
        ))}
        {years.map((y, i) => {
          const x = M.left + i * slot + (slot - barW) / 2;
          let acc = 0;
          return (
            <g key={y.year} onMouseMove={(e) => showTip(e, y)} onMouseLeave={() => setTip(null)}>
              <rect x={M.left + i * slot} y={M.top} width={slot} height={plotH} fill="transparent" />
              {CATS.map((c) => {
                const v = y.counts[c.name];
                if (!v) return null;
                const h = Math.max(yScale(v) - 2, 1.5);
                const yTop = M.top + plotH - yScale(acc) - yScale(v) + 1;
                acc += v;
                const cv = catVars(c.name);
                return (
                  <rect
                    key={c.name}
                    x={x} y={yTop} width={barW} height={h} rx="2"
                    fill={cv.bg} stroke={cv.tx} strokeWidth="1"
                  />
                );
              })}
              {y.total > 0 && (
                <text x={x + barW / 2} y={M.top + plotH - yScale(y.total) - 5} textAnchor="middle" fontSize="10" fill="var(--c-ink-faint)">{y.total}</text>
              )}
              <text x={M.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--c-ink-muted)">{y.year}</text>
            </g>
          );
        })}
        <line x1={M.left} x2={W - M.right} y1={M.top + plotH} y2={M.top + plotH} stroke="var(--c-line)" strokeWidth="1" />
      </svg>
      {tip && (
        <div className={styles.chartTip} style={{ left: tip.x, top: tip.y }}>
          <div className={styles.tipYear}>{tip.year} 年・共 {tip.total} 種</div>
          {CATS.filter((c) => tip.counts[c.name] > 0).map((c) => {
            const v = catVars(c.name);
            return (
              <div key={c.name} className={styles.tipRow}>
                <span className={styles.name}>
                  <span className={styles.swatch} style={{ '--sw-tx': v.tx, '--sw-bg': v.bg }} />
                  {c.name}
                </span>
                <span>{tip.counts[c.name]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PubCard({ pub, open, onToggle }) {
  return (
    <article className={styles.pubCard}>
      <button type="button" className={styles.pubHead} onClick={guarded(onToggle)} aria-expanded={open}>
        <img className={styles.pubCover} src={coverSrc(pub)} alt="" loading="lazy" />
        <div className={styles.pubMain}>
          <div className={styles.pubTitleRow}>
            <span className={styles.pubTitle}>{pub.title}</span>
            <span className={styles.pubDate}>{pub.date}</span>
            <CatBadge name={pub.category} />
          </div>
          {pub.summary && <p className={styles.pubSummary}>{pub.summary}</p>}
          <div className={styles.pubMeta}>
            <span>{pub.chapters.length} 篇</span>
            <a href={pub.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              官網頁面 <ExternalLink size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
            </a>
          </div>
        </div>
        <ChevronRight size={18} className={`${styles.chevron} ${open ? styles.open : ''}`} />
      </button>
      {open && <ChapterTable chapters={pub.chapters} />}
    </article>
  );
}

export default function IiasPublications() {
  const [tab, setTab] = useState('overview');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  // 預設全展開：collapsed 集合為空＝全開（站規：可展開卡片一律預設展開）
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [issueId, setIssueId] = useState(null);

  useEffect(() => { document.title = '中研院法研所出版品'; }, []);

  const pubs = data.publications;
  const query = q.trim().toLowerCase();

  // 下面三個 useMemo 都用它。它只依賴 query，而三處都列了 query，所以原本沒列它也還是對的——
  // 但那是碰巧對的。用 useCallback 把它固定住並列進依賴，往後改動 chapterHit 吃什麼都不會漏。
  const chapterHit = useCallback(
    (ch) =>
      ch.title.toLowerCase().includes(query) ||
      (ch.authors || '').toLowerCase().includes(query) ||
      (ch.section || '').toLowerCase().includes(query),
    [query],
  );

  const filteredPubs = useMemo(() => {
    let list = pubs;
    if (cat !== 'all') list = list.filter((p) => p.category === cat);
    if (query) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.summary || '').toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query) ||
          p.chapters.some(chapterHit),
      );
    }
    return list;
  }, [pubs, cat, query, chapterHit]);

  const journals = useMemo(() => {
    let list = pubs.filter((p) => p.category === '法學期刊');
    if (query) list = list.filter((p) => p.title.toLowerCase().includes(query) || p.chapters.some(chapterHit));
    return list;
  }, [pubs, query, chapterHit]);

  const indexRows = useMemo(() => {
    let rows = [];
    for (const p of filteredPubs) {
      for (const ch of p.chapters) {
        if (query && !chapterHit(ch)) continue;
        rows.push({ ch, pub: p });
      }
    }
    return rows;
  }, [filteredPubs, query, chapterHit]);

  const selectedIssue = journals.find((p) => p.id === issueId) || null;

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const recent = pubs.slice(0, 4);
  const yearSpan = `${pubs[pubs.length - 1].date.slice(0, 4)}–${pubs[0].date.slice(0, 4)}`;

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandMark}><BookMarked size={18} /></div>
          <div>
            <strong>中研院法律學研究所</strong>
            <span>出版品總覽</span>
          </div>
        </div>

        <label className={styles.quickSearch}>
          <Search size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋書名、篇名、作者"
          />
        </label>

        <nav className={styles.sideNav}>
          <Link to="/"><ArrowLeft size={15} />回總入口</Link>
        </nav>

        <div className={styles.sideSection}>
          <p className={styles.filterHeader}>分類</p>
          <button
            type="button"
            className={cat === 'all' ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
            onClick={() => setCat('all')}
          >
            <span className={styles.catDot} />
            全部
            <span className={styles.count}>{pubs.length}</span>
          </button>
          {CATS.map((c) => {
            const v = catVars(c.name);
            const n = pubs.filter((p) => p.category === c.name).length;
            return (
              <button
                type="button"
                key={c.name}
                className={cat === c.name ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
                onClick={() => setCat(c.name)}
              >
                <span className={styles.catDot} style={{ '--dot-tx': v.tx, '--dot-bg': v.bg }} />
                {c.name}
                <span className={styles.count}>{n}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.sideFoot}>
          資料截至 {data.meta.資料截至}
          <br />
          來源：<a href={data.meta.來源} target="_blank" rel="noreferrer">中研院法律學研究所</a>
        </div>
      </aside>

      <section className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Institutum Iurisprudentiae, Academia Sinica</p>
            <h1>中研院法律學研究所出版品</h1>
            <p className={styles.subtitle}>法學期刊、專書、叢書與外文出版品的全集清單，篇章直達原文</p>
          </div>
          <span className={styles.headerMeta}>
            {data.meta.出版品數} 種出版品 · {data.meta.篇章數} 篇章 · {yearSpan}
          </span>
        </header>

        <nav className={styles.mainTabBar}>
          {MAIN_TABS.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              className={tab === id ? `${styles.mainTabButton} ${styles.active}` : styles.mainTabButton}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>這批館藏</h2>
                <span className={styles.aside}>資料截至 {data.meta.資料截至}</span>
              </div>
              <p className={styles.prose}>
                中央研究院法律學研究所自 2005 年起出版四類刊物：半年刊《中研院法學期刊》（創刊號至第 38 期，另有三本特刊）、主題式法學專書與法學叢書（「憲法解釋之理論與實務」「行政管制與行政爭訟」「兩岸四地法律發展」等系列），以及三種外文出版品。本頁收錄全部 {data.meta.出版品數} 種出版品、{data.meta.篇章數} 篇章的完整目錄；各篇論文可直接開啟原檔——多數為 PDF，早期專書篇章為官網線上閱覽版。
              </p>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>分類構成</h2>
              </div>
              <table className={styles.statTable}>
                <thead>
                  <tr>
                    <th>分類</th>
                    <th className={styles.num}>出版品</th>
                    <th className={styles.num}>篇章</th>
                    <th className={styles.num}>PDF</th>
                    <th className={styles.num}>線上閱覽</th>
                  </tr>
                </thead>
                <tbody>
                  {CATS.map((c) => {
                    const list = pubs.filter((p) => p.category === c.name);
                    const chs = list.flatMap((p) => p.chapters);
                    return (
                      <tr key={c.name}>
                        <td><CatBadge name={c.name} /></td>
                        <td className={styles.num}>{list.length}</td>
                        <td className={styles.num}>{chs.length}</td>
                        <td className={styles.num}>{chs.filter((x) => x.type === 'pdf').length}</td>
                        <td className={styles.num}>{chs.filter((x) => x.type === 'read').length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>出版年表</h2>
                <span className={styles.aside}>各年出版品數，依分類堆疊</span>
              </div>
              <YearChart pubs={pubs} />
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>最新出版</h2>
              </div>
              <div className={styles.recentRow}>
                {recent.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className={styles.recentCard}
                    onClick={guarded(() => { setTab('catalog'); setCat('all'); setQ(p.title); })}
                  >
                    <img src={coverSrc(p)} alt="" loading="lazy" />
                    <span>
                      <span className={styles.rTitle}>{p.title}</span>
                      <span className={styles.rDate}>{p.date}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'catalog' && (
          <>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>完整清單</h2>
                <div className={styles.listControls}>
                  <span className={styles.aside}>{filteredPubs.length} 種</span>
                  <button type="button" className={styles.ghostBtn} onClick={() => setCollapsed(new Set())}>全部展開</button>
                  <button type="button" className={styles.ghostBtn} onClick={() => setCollapsed(new Set(pubs.map((p) => p.id)))}>全部收合</button>
                </div>
              </div>
              {filteredPubs.length === 0 && <p className={styles.emptyNote}>沒有符合條件的出版品。</p>}
            </section>
            {filteredPubs.map((p) => (
              <PubCard key={p.id} pub={p} open={!collapsed.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </>
        )}

        {tab === 'shelf' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>期刊架</h2>
              <span className={styles.aside}>《中研院法學期刊》{journals.length} 期・點封面看目次</span>
            </div>
            <div className={styles.shelfGrid}>
              {journals.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={p.id === issueId ? `${styles.shelfItem} ${styles.selected}` : styles.shelfItem}
                  onClick={guarded(() => setIssueId(p.id === issueId ? null : p.id))}
                >
                  <img src={coverSrc(p)} alt={p.title} loading="lazy" />
                  <span className={styles.sTitle}>{p.title}</span>
                  <span className={styles.sDate}>{p.date}</span>
                </button>
              ))}
            </div>
            {selectedIssue && (
              <div className={styles.issueDetail}>
                <div className={styles.sectionHead}>
                  <h2>{selectedIssue.title}</h2>
                  <span className={styles.aside}>
                    {selectedIssue.date}・
                    <a href={selectedIssue.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--c-info)' }}>官網頁面</a>
                  </span>
                </div>
                {selectedIssue.summary && <p className={styles.pubSummary} style={{ marginBottom: 10 }}>{selectedIssue.summary}</p>}
                <ChapterTable chapters={selectedIssue.chapters} />
              </div>
            )}
          </section>
        )}

        {tab === 'index' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>篇章檢索</h2>
              <span className={styles.aside}>{indexRows.length} 篇</span>
            </div>
            {indexRows.length === 0 ? (
              <p className={styles.emptyNote}>沒有符合條件的篇章。</p>
            ) : (
              <table className={styles.indexTable}>
                <thead>
                  <tr>
                    <th>篇名</th>
                    <th>作者</th>
                    <th>出處</th>
                    <th className={styles.chPages}>頁碼</th>
                    <th>取得</th>
                  </tr>
                </thead>
                <tbody>
                  {indexRows.map(({ ch, pub }, i) => (
                    <tr key={i}>
                      <td className={styles.chTitle}>{ch.title}</td>
                      <td className={styles.chAuthors}>{ch.authors}</td>
                      <td className={styles.src}>{pub.title}（{pub.date}）</td>
                      <td className={styles.chPages}>{ch.pages || ''}</td>
                      <td><GetLink ch={ch} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
