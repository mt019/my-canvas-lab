import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Eyebrow from '../components/Eyebrow';
import { useFontScale } from '../components/FontSizeControl';
import SiteHeader from '../components/SiteHeader';
import ArticleLayout from '../components/lab/ArticleLayout';
import BookTree from '../components/lab/BookTree';
import Dropdown from '../components/lab/Dropdown';
import FilterBar from '../components/lab/FilterBar';
import SearchField from '../components/lab/SearchField';
import Tabs, { useTabParams } from '../components/lab/Tabs';
import data from '../data/zhuJiahua.json';

/* 已校訂全文各有一個可預先產生的網址。順序即原書篇次，前後篇導覽吃這份清單。
   tocId 是全書篇目裡的編號，id 是校訂全文自己的編號——法律教育六篇兩者不同號。 */
const TEXTS = [
  { id: 'ZJH-001', tocId: 'ZJH-001', slug: 'text-two-guang-geological-survey' },
  { id: 'ZJH-LE-001', tocId: 'ZJH-074', slug: 'original-text' },
  { id: 'ZJH-LE-002', tocId: 'ZJH-075', slug: 'text-a-view-of-legal-education' },
  { id: 'ZJH-LE-003', tocId: 'ZJH-076', slug: 'text-committee-5th' },
  { id: 'ZJH-LE-004', tocId: 'ZJH-077', slug: 'text-committee-6th' },
  { id: 'ZJH-LE-005', tocId: 'ZJH-078', slug: 'text-committee-7th' },
  { id: 'ZJH-LE-006', tocId: 'ZJH-079', slug: 'text-rule-of-law-administration' },
];
const TEXT_PATH = Object.fromEntries(TEXTS.map(({ id, slug }) => [id, `/zhujiahua/${slug}`]));
const TEXT_BY_ID = Object.fromEntries(data.verifiedTexts.map((text) => [text.id, text]));
const ITEM_BY_ID = Object.fromEntries(data.legalEducation.items.map((item) => [item.id, item]));

const TOC = data.tableOfContents;
const TOC_ITEM_BY_ID = Object.fromEntries(TOC.items.map((item) => [item.id, item]));

const LINK = 'border-b border-transparent transition-colors duration-fast hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';

/* 區塊抬頭。h2 帶 id 才進得了右欄目次；標題寫完整、側欄那條 13rem 讀 data-toc 的短標。 */
function SectionHead({ id, toc, kicker, children, className = '' }) {
  return (
    <div className={className}>
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      <h2 id={id} data-toc={toc} className={`font-serif text-token-xl font-bold leading-snug ${kicker ? 'mt-2' : ''}`}>
        {children}
      </h2>
    </div>
  );
}

/* 左欄目次樹與這份清單裡每一片葉子的去處。已校訂的 7 篇有自己的網址（可預先產生、
   進 sitemap）；其餘 191 篇走 ?item=——它們沒有正文可讓搜尋引擎收，鑄兩百個薄頁面只會
   稀釋整站，而查詢字串照樣貼得出去、上一頁回得來。哪篇校訂完成，它就升格成真網址。 */
const hrefOf = (item) => item.textPath ?? `/zhujiahua?item=${item.id}`;

/* 左欄那棵樹吃的是 BookTree 的通用形狀，不是這本書的欄位名——攤平一次，模組載入時算完。
   部次是最上層分組；分節與再分節（「（一）國立中山大學」這層）併成一個標籤層，
   樹才不會深到讀不動。 */
const TREE_ITEMS = TOC.items.map((item) => ({
  id: item.id,
  title: item.title,
  href: hrefOf(item),
  group: item.part,
  subgroup: [item.section, item.subsection].filter(Boolean).join('／') || null,
  lead: item.bookStartPage,
  badge: item.textPath ? '全文' : null,
  hint: item.date,
}));

const NAV_LINK = (on) => `block transition-colors duration-fast hover:text-accent ${
  on ? 'font-bold text-accent' : 'text-ink-muted'
}`;

/* 一列＝一篇。起頁與年份靠 tabular-nums 對齊。每篇都點得進去（未校訂的進篇目頁）——
   左欄目次樹在 lg 以下收起，窄螢幕就靠這份清單導覽。
   「已校訂全文」在 198 篇裡只有 7 篇，屬少數狀態，才掛得起標記（DESIGN.md「資料頁的形狀」）。 */
function CatalogRow({ item, showPart }) {
  return (
    <li className={`grid gap-x-5 gap-y-1 border-b border-line-soft py-3 sm:items-baseline ${CATALOG_GRID}`}>
      <span className="text-token-sm tabular-nums text-ink-faint">{item.bookStartPage}</span>
      <div>
        <h4 className="font-serif text-token-body leading-snug">
          <Link to={hrefOf(item)} className={item.textPath ? `font-bold ${LINK}` : LINK}>{item.title}</Link>
          {item.textPath ? <span className="ml-2 align-middle text-token-xs text-accent">全文</span> : null}
        </h4>
        {showPart ? (
          <p className="mt-0.5 text-token-xs text-ink-faint">{item.part}{item.section ? `／${item.section}` : ''}</p>
        ) : null}
        {item.note ? <p className="mt-0.5 text-token-xs leading-relaxed text-ink-faint">{item.note}</p> : null}
      </div>
      {/* 最長的值是「民國二十七年十二月二十三日」十三個字：欄寬照它預留並鎖不換行，
          否則長日期折成兩行、每一列高度都不一樣（DESIGN.md「會動的值要預留寬度」）。 */}
      <span className="whitespace-nowrap text-token-sm tabular-nums text-ink-muted sm:text-right">{item.date || '—'}</span>
    </li>
  );
}

/* 起頁／篇名／日期三欄的欄寬只定義一次，表頭與每一列共用——分開寫遲早對不齊。 */
const CATALOG_GRID = 'sm:grid-cols-[3.5rem_1fr_13.5rem]';

function CatalogHeader() {
  return (
    <div className={`hidden gap-x-5 border-b border-line pb-2 text-token-xs text-ink-faint sm:grid ${CATALOG_GRID}`}>
      <span>原書起頁</span>
      <span>篇名</span>
      <span className="text-right">原文日期</span>
    </div>
  );
}

function Catalog() {
  // 篩選進網址（貼得出去、上一頁可回）；搜尋字串留在本地 state——逐字進網址會塞爆上一頁。
  const [{ part, only }, setFilter] = useTabParams({ part: 'all', only: 'no' });
  const [query, setQuery] = useState('');

  const partOptions = useMemo(() => [
    { value: 'all', label: '全部部次', hint: String(TOC.itemCount) },
    ...TOC.parts.map((p) => ({ value: p.name, label: p.name, hint: String(p.count) })),
  ], []);

  const shown = useMemo(() => {
    const q = query.trim();
    return TOC.items.filter((item) => {
      if (part !== 'all' && item.part !== part) return false;
      if (only === 'yes' && !item.textPath) return false;
      if (q && !item.title.includes(q)) return false;
      return true;
    });
  }, [part, only, query]);

  const searching = query.trim().length > 0;
  // 搜尋時攤平成一條清單（結果散在各部次，再分組只會剩一堆單筆的標題）
  const grouped = useMemo(() => {
    if (searching) return [];
    const out = [];
    for (const item of shown) {
      const last = out[out.length - 1];
      if (!last || last.name !== item.part) out.push({ name: item.part, items: [item] });
      else last.items.push(item);
    }
    return out;
  }, [shown, searching]);

  return (
    <div>
      <section>
        <SectionHead id="catalog" toc="全書篇目" kicker="朱家驊先生言論集">
          全書 {TOC.itemCount} 篇，依原書篇次
        </SectionHead>
        <p className="mt-4 max-w-3xl text-token-body leading-[1.85] text-ink-muted">
          篇名、日期與起頁依原書目次逐欄核對。各篇題下的場合與訖頁另從全書辨讀稿抽出，尚未逐頁核對原頁圖，標為待核，印在單篇頁面上。{TOC.readableCount} 篇已完成逐頁人工校訂，篇名可點進全文；其餘只列篇目。{TOC.pageNote}
        </p>
      </section>

      <section className="mt-8">
        <FilterBar note={`列出 ${shown.length} 篇${shown.length !== TOC.itemCount ? `，全書共 ${TOC.itemCount} 篇` : ''}`}>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="搜尋篇名…"
            className="min-w-[14rem] flex-1 sm:max-w-md"
          />

          <Dropdown
            value={part}
            onChange={(value) => setFilter({ part: value })}
            options={partOptions}
            panelWidth="w-64"
          />

          <button
            type="button"
            onClick={() => setFilter({ only: only === 'yes' ? 'no' : 'yes' })}
            aria-pressed={only === 'yes'}
            className={`whitespace-nowrap border-b pb-0.5 text-token-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
              only === 'yes' ? 'border-accent font-bold text-accent' : 'border-transparent text-ink-muted hover:text-accent'
            }`}
          >
            只看已校訂全文（{TOC.readableCount}）
          </button>
        </FilterBar>

        {shown.length === 0 ? (
          <p className="mt-8 text-token-body text-ink-muted">沒有符合的篇目。改用較短的關鍵字，或把部次改回全部。</p>
        ) : null}

        {searching ? (
          <div className="mt-6">
            <CatalogHeader />
            <ol>
              {shown.map((item) => <CatalogRow key={item.id} item={item} showPart />)}
            </ol>
          </div>
        ) : (
          grouped.map((group, groupIndex) => (
            <section key={group.name} className="mt-10">
              <h3
                id={`part-${groupIndex + 1}`}
                data-toc={group.name}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-2 font-serif text-token-lg font-bold"
              >
                {group.name}
                <span className="text-token-sm font-normal tabular-nums text-ink-faint">{group.items.length} 篇</span>
              </h3>
              <CatalogHeader />
              <ol>
                {group.items.map((item) => <CatalogRow key={item.id} item={item} />)}
              </ol>
            </section>
          ))
        )}
      </section>
    </div>
  );
}

/* 篇目時序：一篇一列，年份與頁碼靠 tabular-nums 對齊。
   六篇的校訂狀態現在完全相同，所以不掛狀態籤——在某一欄上佔多數的值掛籤，
   等於整欄喊同一句話，把真正的差別蓋掉（DESIGN.md「資料頁的形狀」）。 */
function TimelineView() {
  return (
    <ol className="border-t border-line">
      {data.legalEducation.items.map((item, index) => (
        <li key={item.id} className="grid gap-x-5 gap-y-2 border-b border-line-soft py-6 sm:grid-cols-[3rem_7rem_1fr] sm:items-baseline">
          <span className="font-accent text-token-lg tabular-nums text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
          <p className="text-token-sm leading-relaxed tabular-nums text-ink-muted">
            {item.dateIso.slice(0, 4)}
            <span className="block text-ink-faint">第 {item.bookPages} 頁</span>
          </p>
          <div>
            <h3 className="font-serif text-token-lg font-bold leading-snug">
              <Link to={TEXT_PATH[item.id]} className={LINK}>{item.title}</Link>
            </h3>
            <p className="mt-1.5 text-token-sm leading-relaxed text-ink-muted">{item.date}・{item.occasion}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* 議題交叉：同一批言論換一個軸看——不是按時間排，而是按「同一條線在哪幾篇出現」排。 */
function ThemeView() {
  return (
    <div className="border-t border-line">
      {data.legalEducation.themes.map((theme) => (
        <article key={theme.id} className="grid gap-x-6 gap-y-3 border-b border-line-soft py-6 sm:grid-cols-[13rem_1fr]">
          <div>
            <h3 className="font-serif text-token-body font-bold leading-snug">{theme.label}</h3>
            <p className="mt-1.5 text-token-sm leading-relaxed text-ink-muted">{theme.summary}</p>
          </div>
          <ul className="space-y-3">
            {theme.appearances.map((appearance) => {
              const item = ITEM_BY_ID[appearance.id];
              return (
                <li key={appearance.id} className="grid gap-x-4 gap-y-1 sm:grid-cols-[8.5rem_1fr]">
                  <Link to={TEXT_PATH[appearance.id]} className={`w-fit whitespace-nowrap text-token-sm tabular-nums ${LINK}`}>
                    <span className="text-ink-faint">{item.dateIso.slice(0, 4)}</span>　{item.shortTitle}
                  </Link>
                  <p className="text-token-sm leading-[1.8] text-ink-muted">{appearance.note}</p>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}

function LegalEducation() {
  const section = data.legalEducation;
  // 區內看法切換：進網址（貼得出去、上一頁可回），但不回捲——讀者是在原地換一個軸看
  // 同一批東西，不是進入另一個章節（DESIGN.md「分頁與捲動位置」）。
  const [{ view }, setView] = useTabParams({ view: 'timeline' });

  return (
    <div>
      <section>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-token-sm tabular-nums text-ink-faint">
          <span>{section.period}</span>
          <span>六篇言論</span>
          <span>原書第 303–330 頁</span>
          <span>全文皆已逐頁校訂</span>
        </div>
        <SectionHead id="topic" toc="專題總覽" className="mt-4">法律教育如何成為民主政治的基礎</SectionHead>
        <p className="mt-5 max-w-3xl text-token-body leading-[1.85] text-ink-muted">{section.introduction}</p>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <SectionHead id="threads" toc="五條閱讀線索">五條閱讀線索</SectionHead>
        <dl className="mt-6 divide-y divide-line-soft border-y border-line">
          {section.readingGuide.map((item) => (
            <div key={item.title} className="grid gap-2 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
              <dt className="font-serif text-token-body font-bold leading-snug">{item.title}</dt>
              <dd className="max-w-3xl text-token-body leading-[1.85] text-ink-muted">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
          <SectionHead id="pieces" toc="六篇言論">六篇言論</SectionHead>
          <Tabs
            label="篇目看法"
            variant="quiet"
            value={view}
            onChange={(value) => setView({ view: value })}
            items={[
              { id: 'timeline', label: '依年代', count: section.items.length },
              { id: 'themes', label: '依議題', count: section.themes.length },
            ]}
          />
        </div>
        <p className="mt-4 max-w-3xl text-token-sm leading-relaxed text-ink-muted">
          {view === 'themes'
            ? '同一批言論按議題重排：每條線索列出它出現在哪幾篇，以及該篇怎麼談。點篇名讀全文。'
            : '按原書篇次排列。點篇名讀該篇校訂全文。'}
        </p>
        <div className="mt-6">{view === 'themes' ? <ThemeView /> : <TimelineView />}</div>
      </section>
    </div>
  );
}

function OriginalText({ textId }) {
  const index = TEXTS.findIndex((item) => item.id === textId);
  const text = TEXT_BY_ID[textId];
  const previous = index > 0 ? TEXTS[index - 1] : null;
  const next = index >= 0 && index < TEXTS.length - 1 ? TEXTS[index + 1] : null;
  const label = (entry) => TEXT_BY_ID[entry.id]?.title ?? TOC_ITEM_BY_ID[entry.tocId]?.title;
  const page = (entry) => TOC_ITEM_BY_ID[entry.tocId]?.bookStartPage;

  return (
    <article className="max-w-3xl">
      {/* 篇名、日期與場合由外殼的抬頭負責，這裡不重印一次；文內只留原書出處那一行。 */}
      <p className="border-b border-line pb-4 text-token-sm tabular-nums text-ink-faint">
        《朱家驊先生言論集》原書第 {text.bookPages} 頁
      </p>

      {/* 字級由外殼的 reader-scale 統一縮放；這裡不再掛 text-scaled-*，兩者疊乘會失控。 */}
      {/* prose-body：校訂全文是整段連續閱讀的面，吃灰階字體平滑（見 index.css）。 */}
      <div className="prose-body mt-9 text-justify text-token-body leading-[1.85] text-ink">
        {text.paragraphs.map((paragraph, i) => (
          <p key={i} className="mt-6 first:mt-0">{paragraph}</p>
        ))}
      </div>

      <footer className="mt-12 border-t border-line pt-6">
        <p className="text-token-sm leading-relaxed text-ink-muted">
          本文依《朱家驊先生言論集》原頁校訂，保留原書用字。字形有疑之處與分段依據另有校訂記錄。
        </p>
        <nav className="mt-8 grid gap-4 border-t border-line-soft pt-6 sm:grid-cols-2">
          {previous ? (
            <Link to={TEXT_PATH[previous.id]} className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
              <span className="text-token-xs tabular-nums text-ink-faint">前一篇全文・原書第 {page(previous)} 頁</span>
              <span className="mt-1 block font-serif text-token-body font-bold leading-snug group-hover:text-accent">{label(previous)}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={TEXT_PATH[next.id]} className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-right">
              <span className="text-token-xs tabular-nums text-ink-faint">後一篇全文・原書第 {page(next)} 頁</span>
              <span className="mt-1 block font-serif text-token-body font-bold leading-snug group-hover:text-accent">{label(next)}</span>
            </Link>
          ) : null}
        </nav>
        <Link to="/zhujiahua" className={`mt-8 inline-flex items-center gap-2 pb-1 text-token-sm font-bold text-accent ${LINK} border-accent`}>
          回全書篇目 <ArrowRight size={16} />
        </Link>
      </footer>
    </article>
  );
}

/* 尚未校訂的 191 篇：目次知道的每一件事都在這裡，並直說全文還沒有。
   不給這些篇各自的網址（見下方 hrefOf 的說明），所以這一頁是 /zhujiahua?item=<id>。 */
function TocEntry({ item }) {
  const index = TOC.items.findIndex((entry) => entry.id === item.id);
  const previous = index > 0 ? TOC.items[index - 1] : null;
  const next = index >= 0 && index < TOC.items.length - 1 ? TOC.items[index + 1] : null;

  /* 起訖頁與場合抽自辨讀稿、尚未逐頁核對原頁圖，值後面帶「待核」；共頁的篇在頁碼後註明，
     否則兩篇各印同一個頁碼，讀者會以為其中一個是錯的。 */
  const extent = item.bookEndPage && item.bookEndPage !== item.bookStartPage
    ? `${item.bookStartPage}–${item.bookEndPage}${item.sharesEndPage ? '（末頁與次篇接排）' : ''}　待核`
    : String(item.bookStartPage);
  const facts = [
    [item.bookEndPage ? '原書起訖頁' : '原書起頁', extent],
    ...(item.occasion ? [['場合', `${item.occasion}　${item.occasionStatus || '待核'}`]] : []),
    ['原文日期', item.date || '原書未載'],
    ...(item.dateInText ? [['正文題下日期', `${item.dateInText}　${item.dateInTextStatus || '待核'}`]] : []),
    ['所屬部次', [item.part, item.section, item.subsection].filter(Boolean).join('／')],
    ['全書篇次', `第 ${index + 1} 篇，共 ${TOC.itemCount} 篇`],
  ];

  return (
    /* 篇名、日期與出處由外殼的抬頭負責，這裡不重印一次（與 OriginalText 同）。 */
    <article className="max-w-3xl">
      <dl className="divide-y divide-line-soft border-y border-line">
        {facts.map(([term, value]) => (
          <div key={term} className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-token-sm text-ink-muted">{term}</dt>
            <dd className="text-token-body tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {item.note ? <p className="mt-5 text-token-sm leading-relaxed text-ink-muted">{item.note}</p> : null}

      <p className="mt-8 text-token-body leading-[1.85] text-ink-muted">
        本篇尚未校訂全文。篇名、日期與起頁依原書目次逐欄核對，正文仍只存在於原書影像；
        目前已完成逐頁人工校訂的是 {TOC.readableCount} 篇。{TOC.pageNote}
      </p>

      <nav className="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        {previous ? (
          <Link to={hrefOf(previous)} className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            <span className="text-token-xs tabular-nums text-ink-faint">前一篇・原書第 {previous.bookStartPage} 頁</span>
            <span className="mt-1 block font-serif text-token-body font-bold leading-snug group-hover:text-accent">{previous.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={hrefOf(next)} className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-right">
            <span className="text-token-xs tabular-nums text-ink-faint">後一篇・原書第 {next.bookStartPage} 頁</span>
            <span className="mt-1 block font-serif text-token-body font-bold leading-snug group-hover:text-accent">{next.title}</span>
          </Link>
        ) : null}
      </nav>

      <Link to="/zhujiahua" className={`mt-8 inline-flex items-center gap-2 pb-1 text-token-sm font-bold text-accent ${LINK} border-accent`}>
        回全書篇目 <ArrowRight size={16} />
      </Link>
    </article>
  );
}

export default function ZhuJiahua({ forcedTab, forcedText }) {
  const [scale, setScale] = useFontScale();
  const [{ tab: queryTab, item: queryItem }] = useTabParams({ tab: 'catalog', item: '' });
  const tab = forcedTab || queryTab;

  const textId = forcedText || 'ZJH-LE-001';
  const isText = tab === 'text';
  const textEntry = TEXTS.find((item) => item.id === textId);
  const textMeta = TOC_ITEM_BY_ID[textEntry?.tocId];
  const legalMeta = ITEM_BY_ID[textId];

  // ?item= 只在全書篇目那一支有意義；指到已校訂的篇就讓真網址接手，別留兩個入口。
  const entry = !isText && tab === 'catalog' && queryItem ? TOC_ITEM_BY_ID[queryItem] : null;
  const showEntry = Boolean(entry) && !entry.textPath;

  const activeId = isText ? textEntry?.tocId : (showEntry ? entry.id : null);

  const headerTitle = tab === 'legal'
    ? '朱家驊的法律教育論'
    : isText ? (TEXT_BY_ID[textId]?.title ?? textMeta?.title)
      : showEntry ? entry.title
        : data.project.title;
  const headerSummary = tab === 'legal'
    ? '六篇言論、年代、場合與制度脈絡，全文皆已逐頁校訂'
    : isText
      ? [textMeta?.date, legalMeta?.occasion, '人工逐頁校訂全文'].filter(Boolean).join('・')
      : showEntry
        ? [entry.date, `原書第 ${entry.bookStartPage} 頁`, '尚未校訂全文'].filter(Boolean).join('・')
        : `《朱家驊先生言論集》全書 ${TOC.itemCount} 篇篇目，${TOC.readableCount} 篇已校訂全文`;

  const atCatalogRoot = tab === 'catalog' && !showEntry;
  const refreshKey = isText ? textId : (showEntry ? entry.id : tab);

  // 換篇時回到頂端。三欄殼沒有吸頂分頁列，點了左欄卻停在上一篇的捲動位置，
  // 讀者會以為連結沒反應。
  useEffect(() => { window.scrollTo({ top: 0 }); }, [refreshKey]);

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
      {/* 返回鍵的落點走全站配置（src/backNav.js）：研究室門面回素首頁、站內頁回研究室。 */}
      <SiteHeader
        width="article"
        scale={scale}
        onScaleChange={setScale}
      />

      <ArticleLayout
        title={headerTitle}
        /* 眉標走 Erikas 打字機體（見 components/Eyebrow.jsx），中文會落到 Huiwen fallback、
           再被 0.26em 字距拆成「朱 家 驊 研 究 室」，而且門面上還與大標一字不差。
           改成拉丁文的來源書名，字體對、也不跟任何一支的大標重複。 */
        eyebrow="ZHU JIAHUA · COLLECTED SPEECHES"
        summary={headerSummary}
        tocLabel="本頁區塊"
        tocKey={refreshKey}
        /* 右欄只在法律教育專題那一支有東西可列。全書篇目的區塊標題就是十四個部次，
           左欄目次樹已經列了同一份；同一件事講兩次正是 DashboardLayout 2026-07-20
           從三欄收成兩欄的原因。全文與篇目兩支則本來就沒有區塊標題。 */
        hideToc={tab !== 'legal'}
        nav={
          <BookTree
            items={TREE_ITEMS}
            activeId={activeId}
            label="全書目次"
            header={
              <nav aria-label="研究室導覽" className="mb-4 space-y-1.5 text-token-sm">
                <Link to="/zhujiahua" className={NAV_LINK(atCatalogRoot)}>全書篇目</Link>
                <Link to="/zhujiahua/legal-education" className={NAV_LINK(tab === 'legal')}>法律教育專題</Link>
              </nav>
            }
          />
        }
      >
        {isText ? <OriginalText textId={textId} /> : null}
        {!isText && tab === 'legal' ? <LegalEducation /> : null}
        {!isText && tab === 'catalog' ? (showEntry ? <TocEntry item={entry} /> : <Catalog />) : null}
      </ArticleLayout>
    </main>
  );
}
