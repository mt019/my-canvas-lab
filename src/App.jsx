import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate } from 'react-router-dom';
import { ArrowRight, BookMarked, CalendarDays, Droplets, FileSearch, Film, Gavel, Globe2, GraduationCap, Landmark, Languages, Mic, Music, Music2, Palette, Piano, Scale, ScrollText, ShieldAlert, Sigma, Wind } from 'lucide-react';
import SeoHead from './components/SeoHead';
import ScrollToTop from './components/ScrollToTop';
import { CC_BASE_SEO, CC_TABS_SEO, ccDataset } from './pages/_constitutional-court/seo';

// A single justice's / single case's indexable page. Lazy-loaded so the
// Constitutional Court archive JSON they pull in never lands in the main bundle.
const CCJusticeRoute = lazy(() => import('./pages/_constitutional-court/JusticeRoute'));
const CCCaseRoute = lazy(() => import('./pages/_constitutional-court/CaseRoute'));

/*
 * Pages are routed by file path. A file directly under pages/ keeps the old flat
 * rule (AutoTuner.jsx -> /autotuner), so every existing URL is untouched; a file
 * in a sub-directory gets a namespaced route (statistics/NullHypothesis.jsx ->
 * /statistics/null-hypothesis), which is how a site with several articles under
 * one topic stays legible in the address bar. Anything under a path segment
 * starting with "_" is a building block, not a page — figures, simulation code —
 * and never becomes a route.
 */
const pages = import.meta.glob('./pages/**/*.{jsx,tsx}');

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/* The file-path rule cannot express a parameter, and one page needs one: the
   glossary has a page per term and the term is in the URL. Rather than teach the
   glob a syntax for it, the two or three pages like this name their own path. */
const PARAM_ROUTES = {
  GlossaryTerm: '/statistics/glossary/:slug',
};

function routeFor(path) {
  const rel = path.replace('./pages/', '').replace(/\.(jsx|tsx)$/, '');
  const parts = rel.split('/');
  const name = parts.pop();
  if (PARAM_ROUTES[name]) return PARAM_ROUTES[name];
  return parts.length === 0
    ? `/${name.toLowerCase()}`
    : `/${parts.map(kebab).join('/')}/${kebab(name)}`;
}

const PAGE_META = { // token-exempt: per-page identity chip colors (data, not styling)
  StatisticsLab: {
    name: '統計學實驗室',
    desc: '把統計方法拆開來，用可以親手操作的模擬解釋它為什麼長這樣',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
  },
  // Articles carry meta for SEO (canonical, title, Article schema) but stay off
  // the index: the hub lists them, the front page lists the hub.
  Glossary: {
    name: '統計術語表',
    desc: '每個術語一句話定義、一個真實發生過的例子，以及它會在哪裡騙到你',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'WebPage',
  },
  GlossaryTerm: {
    name: '統計術語',
    desc: '單一術語的完整說明：定義、來歷、具體例子、常見誤讀',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'DefinedTerm',
  },
  NullHypothesis: {
    name: '為什麼叫虛無假設',
    desc: 'null 的語源、Fisher 與 Neyman-Pearson 的兩套邏輯，以及教科書把它們縫在一起之後',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'Article',
  },
  JusticePartialPooling: {
    name: '大法官的差異有多大？',
    desc: '用貝氏階層模型處理小樣本比例、部分匯聚與司法院資料的可比較性',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'Article',
  },
  EquivalenceTesting: {
    name: '怎麼證明「沒有差別」',
    desc: '檢定力與等價檢定：把「沒測到差異」變成「差異小到不重要」，用學名藥生體相等性當例子',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'Article',
  },
  ConfidenceInterval: {
    name: '到底什麼是信賴區間',
    desc: '一則民調的「誤差 ±4 個百分點」，那句 95% 到底掛在誰身上——覆蓋率、潛艇、比值區間與六句自測',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'Article',
  },
  About: {
    name: '本站說明',
    desc: '統計學實驗室在做什麼：方法、例子怎麼查證、模擬為何每次跑出同樣數字',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'WebPage',
  },
  AutoTuner: {
    name: '自動調音器',
    desc: '吉他、烏克麗麗、吉他麗麗全支援，含 Open G、DADGAD 等特殊定弦',
    Icon: Music2,
    accent: '#e8d3d1',
    accentText: '#8a7a78',
    group: 'tool',
  },
  UkuleleTuner: {
    name: '烏克麗麗調音器',
    desc: '視覺化品格指引，適合初學者快速對準四弦音高',
    Icon: Music,
    accent: '#d8e2dc',
    accentText: '#6d8b74',
    group: 'tool',
  },
  VocalTuner: {
    name: '聲音調音器',
    desc: '即時音高偵測，以鋼琴捲軸呈現聲線的走向與起伏',
    Icon: Mic,
    accent: '#dde0f0',
    accentText: '#7a7ea8',
    group: 'tool',
  },
  ElectricPiano: {
    name: 'Klavier',
    desc: '六種音色合成音源，支援多指和弦與電腦鍵盤彈奏',
    Icon: Piano,
    accent: '#dde0f0',
    accentText: '#6a6fa0',
    group: 'tool',
  },
  AirPollutionFee: {
    name: '空氣污染防制費',
    desc: '空污費構成要件、稽徵流程、逃漏效果與財政收入脈絡',
    Icon: Wind,
    accent: '#d0dce8',
    accentText: '#3a5878',
    group: 'doctrine',
  },
  FuelTaxBreakdown: {
    name: '日本油稅分析',
    desc: '日本油價中的稅費層次、二重課稅爭議與制度結構',
    Icon: Droplets,
    accent: '#f0e8d8',
    accentText: '#9a7e5a',
    group: 'doctrine',
  },
  GovernmentDebt: {
    name: '政府債務研究',
    desc: '主權債務、地方融資平台與國際比較研究地圖',
    Icon: Landmark,
    accent: '#c8d8e8',
    accentText: '#305878',
    group: 'research',
  },
  ManusMetaAcquisition: {
    name: 'Manus–Meta 跨境收購',
    desc: 'AI 新創退出、投資審查、技術管制與國際稅法案例剖析',
    Icon: Scale,
    accent: '#d8dff0',
    accentText: '#3b4f78',
    // 研究而非法政解析：吃 intlTaxOps/manusCase.json，跟「國際稅法研究桌」同一個資料域，
    // 是有資料層的 IEL 研究案例（見 memory project_manus_research），不是靜態制度解析。
    group: 'research',
  },
  InternationalTaxOps: {
    name: '國際稅法研究桌',
    desc: 'OECD、UN、洛桑稅法圈與跨境稅制前沿監測',
    Icon: Globe2,
    accent: '#d7e7e5',
    accentText: '#1f6f69',
    group: 'research',
  },
  FiscalEnforcementRisk: {
    name: '地方財政與遠洋捕撈',
    desc: '地方財政缺口、罰沒收入、異地執法與資料可信度',
    Icon: FileSearch,
    accent: '#dfe8dc',
    accentText: '#315f4d',
    group: 'research',
  },
  XiaohongshuRisk: {
    name: '小紅書詐騙風險',
    title: '小紅書詐騙風險研究',
    desc: '165 打詐案例與數位素養材料整理：平台風險、詐騙樣態與研究資料成熟度',
    Icon: ShieldAlert,
    accent: '#f2e4dd',
    accentText: '#9b5f4c',
    group: 'research',
  },
  ConstitutionalCourt: {
    name: '憲法法庭案例庫',
    desc: '813 件釋字與憲法法庭裁判的主題檢索、意見書網絡與引註匯出',
    Icon: Gavel,
    accent: '#e8dae0',
    accentText: '#8f6071',
    group: 'research',
    // Richer SEO for the archive: keywords + CollectionPage + a Dataset node
    // (Google Dataset Search eligible). Tab sub-routes add their own below.
    keywords: CC_BASE_SEO.keywords,
    type: CC_BASE_SEO.type,
    buildSchema: (SITE_URL) => [ccDataset(SITE_URL)],
  },
  IiasPublications: {
    name: '中研院法研所出版品',
    desc: '中研院法律學研究所期刊、專書、叢書全集清單，797 篇章直達原文',
    Icon: BookMarked,
    accent: '#eae4d6',
    accentText: '#8a6d3b',
    group: 'research',
  },
  GermanLawCourseTimeline: {
    name: '德文法學課程時序',
    desc: '德文法學名著選讀一的歷年教師開課時間軸，領域著色與課綱摘要',
    Icon: GraduationCap,
    accent: '#ece5d5',
    accentText: '#7c5a43',
    group: 'research',
  },
  TranslationAtlas: {
    name: '翻譯工程總覽',
    desc: '德英中譯工程儀表板：判決、文學、書籍與法規的進度與公版全文',
    Icon: Languages,
    accent: '#d5e0e8',
    accentText: '#246b8f',
    group: 'research',
  },
  ECFAResearch: {
    name: 'ECFA 研究地圖',
    desc: 'ECFA 前史、官方文本、早收產品與 2024 中止優惠範圍',
    Icon: ScrollText,
    accent: '#eadde2',
    accentText: '#8f6071',
    group: 'research',
  },
  PaletteLab: {
    name: '色票試穿間',
    desc: '全站色票庫：現有色票與名畫取樣即時試穿、輸出 tokens.css',
    Icon: Palette,
    accent: '#e4e0d8',
    accentText: '#6f6455',
    group: 'tool',
  },
  Brief: {
    name: '簡報',
    desc: '打開就看得到的東西，每天累積：快關門的講座、接下來的活動、值得讀的論文與講辭',
    Icon: CalendarDays,
    accent: '#dde4ec',
    accentText: '#4a5f7a',
    group: 'life',
  },
  // 活動曆與讀的東西都從簡報的門口進去，不上首頁——首頁列站，站列它自己的東西。
  Reading: {
    name: '讀的東西',
    desc: '論文、講辭、機構報告、學者部落格與社群討論，連摘要；來源逐個可切',
    Icon: BookMarked,
    accent: '#dde4ec',
    accentText: '#4a5f7a',
    group: 'life',
    listed: false,
  },
  Events: {
    name: '活動曆',
    desc: '各來源的活動攤在同一張表上：條列、月曆、交叉表，軸自己選',
    Icon: CalendarDays,
    accent: '#dde4ec',
    accentText: '#4a5f7a',
    group: 'life',
    listed: false,
  },
  TaipeiFilmFestival: {
    name: '台北電影節・回顧',
    desc: '2026 台北電影節的售票片單、我的觀影名單與講座論壇，閉幕後留成的一份回顧',
    Icon: Film,
    accent: '#f2e3e7',
    accentText: '#945d70',
    group: 'life',
  },
};

/* Home page identity palette (rose/mauve). Page-local by design — global
   tokens only carry neutral + brand roles; see docs/DESIGN.md. */
const HOME_VARS = { // token-exempt
  '--home-bg': '#fbf8f9',
  '--home-ink-strong': '#332b30',
  '--home-ink': '#3f3339',
  '--home-ink-soft': '#74636a',
  '--home-ink-faint': '#8a7480',
  '--home-line': '#eadde2',
  '--home-line-strong': '#d9c8cf',
  '--home-accent': '#a77b89',
  '--home-arrow': '#c9a9b4',
  '--home-arrow-hover': '#8f6071',
  '--home-hover': '#fffafb',
  '--home-foot': '#b8a3ab',
};

/* 順序＝首頁區塊的先後（研究地圖在最前＝主線工作，工具與生活雷達收在後面）。版面是
   CSS 多欄，區塊照這個順序在兩欄裡按高度均分填入，不再是舊的 row grid 把 1 項的
   「教學實驗室」和 8 項的「研究地圖」硬排在同一列、底下留一大片空。 */
const GROUPS = [
  { key: 'research', label: '研究地圖', desc: '資料層分離、可延伸成長期研究的小型工作台' },
  { key: 'doctrine', label: '法政解析', desc: '法律、財稅、投資與制度案例的結構化拆解' },
  { key: 'learn', label: '教學實驗室', desc: '方法本身的來歷與限制，配上可以親手轉動的模擬' },
  { key: 'tool', label: '即用工具', desc: '可直接操作的工具：音樂、聲音與設計' },
  { key: 'life', label: '生活雷達', desc: '活動、餘額、行程與日常決策輔助' },
];

export default function App() {
  const routes = useMemo(() => {
    return Object.keys(pages)
      .filter((path) => !path.includes('/_'))
      .map((path) => {
        const name = path.split('/').pop().replace(/\.(jsx|tsx)$/, '');
        return {
          name,
          path: routeFor(path),
          component: lazy(pages[path]),
          meta: PAGE_META[name] ?? null,
        };
      });
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-line-soft border-t-ink-faint rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage routes={routes} />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<PageRoute route={route} />} />
          ))}
          {/* One clean, indexable URL per justice / per case — matched before the
              tab route since they have an extra path segment. Lazy so the archive
              JSON stays out of the main bundle. */}
          <Route path="/constitutionalcourt/justices/:justiceName" element={<CCJusticeRoute />} />
          <Route path="/constitutionalcourt/case/:caseNo" element={<CCCaseRoute />} />
          {/* Clean, separately-indexable URL per Constitutional Court tab
              (/constitutionalcourt/research …). Backward-compatible: the ?tab=
              query deep links still resolve on the base route above. */}
          <Route path="/constitutionalcourt/:tab" element={<CCTabRoute routes={routes} />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function PageRoute({ route }) {
  const page = route.meta ? {
    ...route.meta,
    title: route.meta.title ?? `${route.meta.name}｜Phenom Canvas Lab`,
    description: route.meta.desc,
    type: route.meta.type ?? (route.meta.group === 'tool' ? 'SoftwareApplication' : 'WebPage'),
    indexable: !['PaletteLab', 'TaipeiFilmFestival'].includes(route.name),
  } : undefined;
  const Page = route.component;
  return <><SeoHead page={page} /><Page /></>;
}

// A Constitutional Court tab under its own clean URL. Renders the same lazy
// ConstitutionalCourt component (which reads the tab from the path param) with
// tab-specific SEO; unknown slugs fall back to the base archive.
function CCTabRoute({ routes }) {
  const { tab } = useParams();
  const seo = CC_TABS_SEO.find((t) => t.slug === tab);
  const cc = routes.find((r) => r.name === 'ConstitutionalCourt');
  if (!seo || !cc) return <Navigate to="/constitutionalcourt" replace />;
  const page = {
    name: seo.name,
    title: seo.title,
    description: seo.description,
    type: seo.type,
    keywords: seo.keywords,
    indexable: true,
    parent: { name: '憲法法庭案例庫', path: '/constitutionalcourt' },
  };
  const Page = cc.component;
  return <><SeoHead page={page} /><Page /></>;
}

function RouteRow({ route }) {
  const { name, desc, Icon, accent, accentText } = route.meta;
  return (
    <Link
      to={route.path}
      className="group grid grid-cols-[34px_1fr_auto] items-center gap-3 border-b border-[var(--home-line)] py-3 transition-colors hover:bg-[var(--home-hover)]"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: accent }}
      >
        <Icon size={16} style={{ color: accentText }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-token-sm font-bold leading-snug text-[var(--home-ink-strong)]">{name}</div>
        <div className="mt-0.5 text-token-xs leading-relaxed text-[var(--home-ink-faint)]">{desc}</div>
      </div>
      <ArrowRight
        size={14}
        className="shrink-0 text-[var(--home-arrow)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--home-arrow-hover)]"
      />
    </Link>
  );
}

const GROUP_META = {
  learn: { note: 'interactive method teaching' },
  research: { note: 'long-running research canvas' },
  doctrine: { note: 'legal and policy analysis' },
  tool: { note: 'interactive tools' },
  life: { note: 'practical decision radar' },
};

function HomePage({ routes }) {
  // listed: false — the page is real and indexable, it just is not a front-door
  // entry (an article reached through its hub). Without this it would still
  // surface below, via the ungrouped fallback.
  const known = routes.filter((r) => r.meta && r.meta.listed !== false);
  const unknown = routes.filter((r) => !r.meta);
  // Directory of the front-door canvases, as an ItemList in the homepage JSON-LD.
  // Mirrors the links rendered below, so it describes on-screen content only.
  const directory = known.map((r) => ({ name: r.meta.name, description: r.meta.desc, path: r.path }));
  return (
    <div
      className="min-h-screen paper-texture bg-[var(--home-bg)] px-4 font-sans text-[var(--home-ink)] sm:px-6"
      style={{ ...HOME_VARS, paddingTop: 46, paddingBottom: 64 }}
    >
      <SeoHead itemList={directory} />
      <div className="mx-auto w-full max-w-5xl">

        <header className="mb-8 border-b border-[var(--home-line)] pb-7">
          <p className="mb-4 font-accent text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--home-accent)]">
            Phenom&nbsp;&nbsp;·&nbsp;&nbsp;Canvas Lab
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--home-ink-strong)] sm:text-4xl">
            專案索引
          </h1>
          <p className="mt-3 max-w-2xl text-token-sm leading-relaxed text-[var(--home-ink-soft)]">
            把頁面按用途分開：長期研究放在研究地圖，制度與案例放在法政解析，能直接操作的留在工具區。
          </p>
        </header>

        {/* 兩欄 masonry（CSS 多欄）：區塊照高度均分填入，短區塊底下不留空。lg 以下收成單欄。 */}
        <div className="lg:columns-2 lg:gap-x-10">
          {GROUPS.map(({ key, label }) => {
            const items = known.filter((r) => r.meta.group === key);
            if (items.length === 0) return null;
            const gm = GROUP_META[key];
            return (
              <section key={key} className="mb-8 break-inside-avoid">
                <div className="mb-2 flex items-end justify-between gap-3 border-b border-[var(--home-line-strong)] pb-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--home-accent)]">{gm?.note}</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-[var(--home-ink-strong)]">{label}</h2>
                  </div>
                </div>
                <p className="mb-1 text-token-xs leading-relaxed text-[var(--home-ink-faint)]">{GROUPS.find((group) => group.key === key)?.desc}</p>
                <div>
                  {items.map((route) => <RouteRow key={route.path} route={route} />)}
                </div>
              </section>
            );
          })}

          {(() => {
            const ungrouped = known.filter((r) => !r.meta.group);
            return ungrouped.length > 0 ? (
              <section className="mb-8 break-inside-avoid">
                <div className="flex flex-col gap-2">
                  {ungrouped.map((route) => <RouteRow key={route.path} route={route} />)}
                </div>
              </section>
            ) : null;
          })()}

          {unknown.length > 0 && (
            <section className="mb-8 break-inside-avoid">
              <p className="mb-2 border-b border-[var(--home-line-strong)] pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--home-accent)]">
                其他
              </p>
              <div>
                {unknown.map((route) => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className="group flex items-center gap-4 border-b border-[var(--home-line)] py-3 transition-colors hover:bg-[var(--home-hover)]"
                  >
                    <div className="min-w-0 flex-1 text-xs font-bold text-[var(--home-ink-faint)]">{route.name}</div>
                    <ArrowRight size={13} className="shrink-0 text-[var(--home-arrow)] transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="mt-12 border-t border-[var(--home-line)] pt-5">
          <p className="font-accent text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--home-accent)]">
            Phenom&nbsp;&nbsp;·&nbsp;&nbsp;Canvas Lab
          </p>
          <p className="mt-1 text-[10px] font-medium tracking-wide text-[var(--home-foot)]">
            音樂 · 研究 · 實驗
          </p>
        </div>

      </div>
    </div>
  );
}
