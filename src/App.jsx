import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate } from 'react-router-dom';
import { ArrowRight, AudioLines, BookMarked, CalendarDays, ChevronsDown, Coins, Droplets, FileSearch, Film, Gavel, Globe2, GraduationCap, Landmark, Languages, Mic, Music, Music2, NotebookPen, Palette, Piano, Puzzle, Receipt, Scale, ScrollText, ShieldAlert, Sigma, Wind } from 'lucide-react';
import SeoHead from './components/SeoHead';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import FrontDoor from './components/FrontDoor';
import AccountControl from './components/AccountControl';
import { AuthProvider } from './personal-state/AuthProvider';
import { ZJH_BASE_SEO, ZJH_TABS_SEO } from './pages/_zhu-jiahua/seo';
import { CHEN_BASE_SEO, CHEN_SELECTIONS_SEO } from './lib/chenYinkeSeo';
import { GLCT_KEYWORDS, GLCT_TITLE, GLCT_DESC, glctSchema } from './pages/_law-classics/seo';
import { VT_KEYWORDS, VT_TITLE, VT_DESC, vtSchema } from './pages/_vocal-training/seo';
import { USERSCRIPTS_KEYWORDS, USERSCRIPTS_TITLE, USERSCRIPTS_DESC, userscriptsSchema, scriptSeo, scriptSchema } from './pages/_userscripts/seo';

/*
 * Pages are routed by file path. A file directly under pages/ keeps the old flat
 * rule (AutoTuner.jsx -> /autotuner), so every existing URL is untouched; a file
 * in a sub-directory gets a namespaced route (statistics/NullHypothesis.jsx ->
 * /statistics/null-hypothesis), which is how a site with several articles under
 * one topic stays legible in the address bar. Anything under a path segment
 * starting with "_" is a building block, not a page — figures, simulation code —
 * and never becomes a route.
 */
// Constitutional Court and the two judicial-translation pages are now
// independent sites and their files are gone from this repo entirely — the
// cards on /all are external links with no page or data graph behind them,
// assembled from a PAGE_META entry plus a route stub in App() below.
const pages = import.meta.glob([
  './pages/**/*.{jsx,tsx}',
  '!./pages/Notes.jsx',
  '!./pages/_notes/**',
  '!./pages/JirsForeignLaw.jsx',
  '!./pages/LegalGlossary.jsx',
  '!./pages/_jirs-glossary/**',
]);

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/* The file-path rule cannot express a parameter, and one page needs one: the
   glossary has a page per term and the term is in the URL. Rather than teach the
   glob a syntax for it, the two or three pages like this name their own path. */
const PARAM_ROUTES = {
  GlossaryTerm: '/statistics/glossary/:slug',
  TagPage: '/statistics/tags/:slug',
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
  Tags: {
    name: '統計標籤',
    desc: '文章的主題標籤總覽：每個標籤通往談同一件事的所有文章',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'CollectionPage',
  },
  TagPage: {
    name: '統計標籤',
    desc: '帶同一個標籤的所有文章；標籤剛好是術語時通往它的定義',
    Icon: Sigma,
    accent: '#dfe3ea',
    accentText: '#6c7690',
    group: 'learn',
    listed: false,
    type: 'CollectionPage',
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
  JudicialIdealPoints: {
    name: '大法官站在哪裡：從投票估計理想點',
    desc: '用貝氏分級反應模型把真投票變成違憲宣告傾向的軸——投票層測不到任命政治的有紀律 null，加一層測得到的共同具名訊號',
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
  // 使用者腳本區：總覽上首頁，三支各自的落地頁只從總覽進得去（listed: false）。
  // 安裝檔本身是 public/scripts/ 的靜態檔，不是路由——validate:userscripts 檢查兩邊一致。
  Userscripts: {
    name: '使用者腳本',
    desc: '法規項次、社群貼文展開、裁判書一鍵查詢，三支自己在用的瀏覽器腳本',
    Icon: Puzzle,
    accent: '#dde0f0',
    accentText: '#6a6fa0',
    group: 'tool',
    title: USERSCRIPTS_TITLE,
    seoDesc: USERSCRIPTS_DESC,
    keywords: USERSCRIPTS_KEYWORDS,
    type: 'CollectionPage',
    buildSchema: userscriptsSchema,
  },
  LawItemLabeler: {
    name: '法規條文項次顯示器',
    desc: '全國法規資料庫的「第 X 項」改成可以複製的文字',
    Icon: ScrollText,
    accent: '#dde0f0',
    accentText: '#6a6fa0',
    group: 'tool',
    listed: false,
    title: scriptSeo('law-item-labeler').title,
    seoDesc: scriptSeo('law-item-labeler').description,
    keywords: scriptSeo('law-item-labeler').keywords,
    type: 'SoftwareApplication',
    buildSchema: scriptSchema('law-item-labeler'),
    parent: { name: '使用者腳本', path: '/userscripts' },
  },
  SocialAutoExpand: {
    name: '社群貼文自動展開',
    desc: 'LinkedIn 與 Facebook 動態的「查看更多」自動按掉',
    Icon: ChevronsDown,
    accent: '#dde0f0',
    accentText: '#6a6fa0',
    group: 'tool',
    listed: false,
    title: scriptSeo('social-auto-expand').title,
    seoDesc: scriptSeo('social-auto-expand').description,
    keywords: scriptSeo('social-auto-expand').keywords,
    type: 'SoftwareApplication',
    buildSchema: scriptSchema('social-auto-expand'),
    parent: { name: '使用者腳本', path: '/userscripts' },
  },
  Fjud: {
    name: '裁判書一鍵查詢',
    desc: '選一段文字按快捷鍵，直接開司法院裁判書系統並送出',
    Icon: Gavel,
    accent: '#dde0f0',
    accentText: '#6a6fa0',
    group: 'tool',
    listed: false,
    title: scriptSeo('fjud').title,
    seoDesc: scriptSeo('fjud').description,
    keywords: scriptSeo('fjud').keywords,
    type: 'SoftwareApplication',
    buildSchema: scriptSchema('fjud'),
    parent: { name: '使用者腳本', path: '/userscripts' },
  },
  AirPollutionFee: {
    name: '空氣污染防制費',
    desc: '空污費構成要件、稽徵流程、逃漏效果與財政收入脈絡',
    Icon: Wind,
    accent: '#d0dce8',
    accentText: '#3a5878',
    group: 'analysis',
  },
  FuelTaxBreakdown: {
    name: '日本油稅分析',
    desc: '日本油價中的稅費層次、二重課稅爭議與制度結構',
    Icon: Droplets,
    accent: '#f0e8d8',
    accentText: '#9a7e5a',
    group: 'analysis',
  },
  GovernmentDebt: {
    name: '政府債務地圖',
    desc: '主權債務、地方融資平台與國際比較',
    Icon: Landmark,
    accent: '#c8d8e8',
    accentText: '#305878',
    group: 'analysis',
  },
  ChenYinke: {
    name: CHEN_BASE_SEO.name,
    title: CHEN_BASE_SEO.title,
    desc: CHEN_BASE_SEO.description,
    Icon: BookMarked,
    accent: '#eae4d6',
    accentText: '#8a6d3b',
    group: 'humanities',
    keywords: CHEN_BASE_SEO.keywords,
    type: CHEN_BASE_SEO.type,
    buildSchema: CHEN_BASE_SEO.buildSchema,
  },
  ZhuJiahua: {
    name: '朱家驊研究室',
    title: ZJH_BASE_SEO.title,
    desc: ZJH_BASE_SEO.description,
    Icon: ScrollText,
    accent: '#e3edeb',
    accentText: '#4c7971',
    group: 'humanities',
    keywords: ZJH_BASE_SEO.keywords,
    type: ZJH_BASE_SEO.type,
    buildSchema: ZJH_BASE_SEO.buildSchema,
  },
  ManusMetaAcquisition: {
    name: 'Manus–Meta 跨境收購',
    desc: 'AI 新創退出、投資審查、技術管制與國際稅法案例剖析',
    Icon: Scale,
    accent: '#d8dff0',
    accentText: '#3b4f78',
    // 實證研究而非議題解析：吃 intlTaxOps/manusCase.json，有分離資料層、可延伸的 IEL 研究案例
    // （見 memory project_manus_research），不是靜態制度拆解。
    group: 'empirical',
  },
  InternationalTaxOps: {
    name: '國際稅法前沿',
    desc: 'OECD、UN、洛桑稅法圈與跨境稅制前沿監測',
    Icon: Globe2,
    accent: '#d7e7e5',
    accentText: '#1f6f69',
    group: 'analysis',
  },
  FiscalEnforcementRisk: {
    name: '地方財政與遠洋捕撈',
    desc: '地方財政缺口、罰沒收入、異地執法與資料可信度',
    Icon: FileSearch,
    accent: '#dfe8dc',
    accentText: '#315f4d',
    group: 'empirical',
  },
  XiaohongshuRisk: {
    name: '小紅書資料集查核',
    title: '165「小紅書」資料集可信度查核',
    desc: '把 446 筆官方「小紅書詐騙」案例拆開：文本經改寫、平台歸因靠關鍵字、敘事由官方端建構',
    Icon: ShieldAlert,
    accent: '#f2e4dd',
    accentText: '#9b5f4c',
    group: 'empirical',
  },
  ConstitutionalCourt: {
    name: '憲法法庭案例庫',
    desc: '813 件釋字與憲法法庭裁判的主題檢索、意見書網絡與引註匯出',
    Icon: Gavel,
    accent: '#e8dae0',
    accentText: '#8f6071',
    group: 'empirical',
    externalUrl: 'https://cc.phenomcanvas.com/constitutionalcourt/',
  },
  IiasPublications: {
    name: '中研院法研所出版品',
    desc: '中研院法律學研究所期刊、專書、叢書全集清單，797 篇章直達原文',
    Icon: BookMarked,
    accent: '#eae4d6',
    accentText: '#8a6d3b',
    group: 'corpus',
  },
  GermanLawCourseTimeline: {
    name: '法學名著選讀時序',
    title: GLCT_TITLE,
    desc: '臺大法學名著選讀 26 個學年、20 位教師的開課時序，每個班次標註法學領域',
    seoDesc: GLCT_DESC,
    keywords: GLCT_KEYWORDS,
    type: 'CollectionPage',
    buildSchema: glctSchema,
    Icon: GraduationCap,
    accent: '#ece5d5',
    accentText: '#7c5a43',
    group: 'corpus',
  },
  TranslationAtlas: {
    name: '翻譯工程總覽',
    desc: '德英中譯工程儀表板：判決、文學、書籍與法規的進度與公版全文',
    Icon: Languages,
    accent: '#d5e0e8',
    accentText: '#246b8f',
    group: 'corpus',
  },
  JirsForeignLaw: {
    name: '司法院外國法翻譯總覽',
    desc: '司法院半世紀來的外國法中譯：39 筆官方報告、544 件全文，可按時間與分類瀏覽',
    Icon: Landmark,
    accent: '#d9dfe6',
    accentText: '#3f5a72',
    group: 'corpus',
    externalUrl: 'https://judicial-translations.phenomcanvas.com/',
  },
  LegalGlossary: {
    name: '德語法學譯語表',
    desc: '德國聯邦憲法法院裁判選輯的德中法學詞彙索引：1,897 組雙語對照，標示多譯衝突',
    Icon: ScrollText,
    accent: '#e8e1d2',
    accentText: '#7a6440',
    group: 'corpus',
    externalUrl: 'https://judicial-translations.phenomcanvas.com/glossary/',
  },
  FamilyWealth: {
    name: 'Patrimonia｜家族財富研究室',
    desc: '家族財富的跨法域知識體系：信託、繼承、稅制平行法域檔案，逐條讀最新規範',
    Icon: Coins,
    accent: '#ece1d4',
    accentText: '#8a6035',
    group: 'corpus',
    externalUrl: 'https://wealth.phenomcanvas.com/',
  },
  TaxLitigation: {
    name: '稅務訴訟計量研究',
    desc: '逐件讀司法院公開稅務判決：租稅協定被援引時法院怎麼判、撤銷判決撤的是原核定還是復查決定',
    Icon: Receipt,
    accent: '#dde3ec',
    accentText: '#3c5470',
    group: 'empirical',
  },
  ECFAResearch: {
    name: 'ECFA 地圖',
    desc: 'ECFA 前史、官方文本、早收產品與 2024 中止優惠範圍',
    Icon: ScrollText,
    accent: '#eadde2',
    accentText: '#8f6071',
    group: 'analysis',
  },
  PaletteLab: {
    name: '色票試穿間',
    desc: '全站色票庫：現有色票與名畫取樣即時試穿、輸出 tokens.css',
    Icon: Palette,
    accent: '#e4e0d8',
    accentText: '#6f6455',
    group: 'tool',
  },
  Notes: {
    name: '手記',
    desc: '聽講、讀書與整理資料時寫下的短文',
    externalUrl: 'https://phenomcanvas.com/notes/',
    Icon: NotebookPen,
    accent: '#e7e2d8',
    accentText: '#6f6552',
    group: 'life',
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
  VocalTraining: {
    name: '聲樂訓練・Vaccai 練習本',
    title: VT_TITLE,
    desc: 'Vaccai 二十二首練習的歌詞、逐行中譯、技術重點與 Metastasio 出處',
    seoDesc: VT_DESC,
    keywords: VT_KEYWORDS,
    type: 'CollectionPage',
    buildSchema: vtSchema,
    Icon: AudioLines,
    accent: '#e6dfe8',
    accentText: '#6f5f7a',
    group: 'life',
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
  '--home-glow-core': '#f6f0f2',
  '--home-foot': '#b8a3ab',
};

/* 順序＝首頁區塊的先後（每天會打開的 Brief 所在生活雷達放最前，研究與資料庫的主線緊接在後，
   工具收尾）。版面是 CSS 多欄，區塊照這個順序在兩欄裡按高度均分填入，短區塊底下不留空。
   研究側原本擠成一個 15 件的大群，拆成三條：實證研究（有資料層的工作台）、語料・譯庫（可搜尋的
   資料庫）、人文文庫；只做議題總覽或現況地圖的頁降級併入議題解析。 */
const GROUPS = [
  { key: 'life', label: '生活雷達', desc: '活動、餘額、行程與日常決策輔助' },
  { key: 'empirical', label: '實證研究', desc: '自己蒐集原始材料、逐件讀過、可長期延伸的研究工作台' },
  { key: 'corpus', label: '語料・譯庫', desc: '可搜尋的語料庫、譯庫與書目目錄，直達原文' },
  { key: 'humanities', label: '人文文庫', desc: '以人物與文本為軸的重排本與文集' },
  { key: 'analysis', label: '議題解析', desc: '法律、財稅與制度議題的拆解' },
  { key: 'learn', label: '教學實驗室', desc: '方法本身的來歷與限制，配上可以親手轉動的模擬' },
  { key: 'tool', label: '即用工具', desc: '可直接操作的工具：音樂、聲音與設計' },
];

export default function App() {
  const routes = useMemo(() => {
    const localRoutes = Object.keys(pages)
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
    // Sites that moved out of this repo stay discoverable on /all without
    // restoring a local React route or importing their former page/data graph:
    // each keeps a PAGE_META entry with an externalUrl, and the entry below is
    // what actually puts the card on the page — PAGE_META alone renders nothing.
    return [
      ...localRoutes,
      {
        name: 'ConstitutionalCourt',
        path: '/constitutionalcourt',
        component: null,
        meta: PAGE_META.ConstitutionalCourt,
      },
      {
        name: 'Notes',
        path: '/notes',
        component: null,
        meta: PAGE_META.Notes,
      },
      {
        name: 'JirsForeignLaw',
        path: '/jirsforeignlaw',
        component: null,
        meta: PAGE_META.JirsForeignLaw,
      },
      {
        name: 'LegalGlossary',
        path: '/legalglossary',
        component: null,
        meta: PAGE_META.LegalGlossary,
      },
      {
        name: 'FamilyWealth',
        path: '/familywealth',
        component: null,
        meta: PAGE_META.FamilyWealth,
      },
    ];
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ ...HOME_VARS, background: 'var(--home-bg)' }}
        >
          {/* A soft breathing light, not a spinner — the same motif as the front
              door, so a route load reads as the light carrying you in. */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--home-glow-core)',
              boxShadow: '0 0 26px 8px rgba(201,169,180,.55)',
              animation: 'fdBreathe 1.8s ease-in-out infinite',
            }}
          />
          <style>{'@keyframes fdBreathe{0%,100%{opacity:.35;transform:scale(.82)}50%{opacity:1;transform:scale(1.12)}}'}</style>
        </div>
      }>
        <Routes>
          <Route path="/" element={<FrontDoor />} />
          <Route path="/all" element={<HomePage routes={routes} />} />
          {routes.filter((route) => route.component).map((route) => (
            <Route key={route.path} path={route.path} element={<PageRoute route={route} />} />
          ))}
          <Route path="/zhujiahua/:zhuTab" element={<ZhuJiahuaTabRoute routes={routes} />} />
          <Route path="/chenyinke/liu-rushi/:selectionId" element={<ChenYinkeSelectionRoute routes={routes} />} />
        </Routes>
        </Suspense>
        <BackToTop />
      </Router>
    </AuthProvider>
  );
}

function ChenYinkeSelectionRoute({ routes }) {
  const { selectionId } = useParams();
  const seo = CHEN_SELECTIONS_SEO[selectionId];
  const chen = routes.find((route) => route.name === 'ChenYinke');
  if (!seo || !chen) return <Navigate to="/chenyinke" replace />;
  const page = {
    ...seo,
    parent: { name: CHEN_BASE_SEO.name, path: '/chenyinke' },
  };
  const Page = chen.component;
  return <><SeoHead page={page} /><Page forcedSelection={selectionId} /></>;
}

function ZhuJiahuaTabRoute({ routes }) {
  const { zhuTab } = useParams();
  const seo = ZJH_TABS_SEO[zhuTab];
  const zhu = routes.find((route) => route.name === 'ZhuJiahua');
  if (!seo || !zhu) return <Navigate to="/zhujiahua" replace />;
  const page = {
    name: seo.name,
    title: seo.title,
    description: seo.description,
    type: seo.type,
    keywords: seo.keywords,
    buildSchema: seo.buildSchema,
    parent: { name: '朱家驊研究室', path: '/zhujiahua' },
  };
  const Page = zhu.component;
  return <><SeoHead page={page} /><Page forcedTab={seo.tab} forcedText={seo.textId} /></>;
}

function PageRoute({ route }) {
  const page = route.meta ? {
    ...route.meta,
    title: route.meta.title ?? `${route.meta.name}｜Phenom Canvas Lab`,
    // desc 是首頁卡片上的一行文案，seoDesc 是給搜尋與答案引擎的長描述（塞得下數字與涵蓋範圍）。
    // 兩者用途不同：卡片要一眼掃過，描述要能被整段引用。只寫 desc 時兩邊共用。
    description: route.meta.seoDesc ?? route.meta.desc,
    type: route.meta.type ?? (route.meta.group === 'tool' ? 'SoftwareApplication' : 'WebPage'),
    indexable: !['PaletteLab', 'TaipeiFilmFestival'].includes(route.name),
  } : undefined;
  const Page = route.component;
  return <><SeoHead page={page} /><Page /></>;
}

function RouteRow({ route }) {
  const { name, desc, Icon, accent, accentText } = route.meta;
  const row = (
    <>
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
    </>
  );
  const className = "group grid grid-cols-[34px_1fr_auto] items-center gap-3 border-b border-[var(--home-line)] py-3 transition-colors hover:bg-[var(--home-hover)]";
  return route.meta.externalUrl ? (
    <a
      href={route.meta.externalUrl}
      className={className}
    >
      {row}
    </a>
  ) : (
    <Link
      to={route.path}
      className={className}
    >
      {row}
    </Link>
  );
}

const GROUP_META = {
  life: { note: 'practical decision radar' },
  empirical: { note: 'empirical research workbench' },
  corpus: { note: 'searchable corpora & reference' },
  humanities: { note: 'humanities archive' },
  analysis: { note: 'legal & policy analysis' },
  learn: { note: 'interactive method teaching' },
  tool: { note: 'interactive tools' },
};

function HomePage({ routes }) {
  // listed: false — the page is real and indexable, it just is not a front-door
  // entry (an article reached through its hub). Without this it would still
  // surface below, via the ungrouped fallback.
  const known = routes.filter((r) => r.meta && r.meta.listed !== false);
  const unknown = routes.filter((r) => !r.meta);
  // Directory of the front-door canvases, as an ItemList in the homepage JSON-LD.
  // Mirrors the links rendered below, so it describes on-screen content only.
  const directory = known.map((r) => ({
    name: r.meta.name,
    description: r.meta.desc,
    path: r.path,
    url: r.meta.externalUrl,
  }));
  return (
    <div
      className="min-h-screen paper-texture bg-[var(--home-bg)] px-4 font-sans text-[var(--home-ink)] sm:px-6"
      style={{ ...HOME_VARS, paddingTop: 46, paddingBottom: 64 }}
    >
      <SeoHead itemList={directory} />
      <div className="mx-auto w-full max-w-5xl">

        <header className="mb-8 border-b border-[var(--home-line)] pb-7">
          <div className="mb-4 flex justify-end">
            <AccountControl />
          </div>
          <p className="mb-4 font-accent text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--home-accent)]">
            <span className="inline-flex items-center gap-[0.9em] align-middle">
              <span>Phenom</span>
              <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" />
              <span className="inline-flex gap-[0.5em]"><span>Canvas</span><span>Lab</span></span>
            </span>
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--home-ink-strong)] sm:text-4xl">
            專案索引
          </h1>
          <p className="mt-3 max-w-2xl text-token-sm leading-relaxed text-[var(--home-ink-soft)]">
            陸續做的一些小站，分了幾區，方便找。
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
            <span className="inline-flex items-center gap-[0.9em] align-middle">
              <span>Phenom</span>
              <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" />
              <span className="inline-flex gap-[0.5em]"><span>Canvas</span><span>Lab</span></span>
            </span>
          </p>
          <p className="mt-1 text-[10px] font-medium tracking-wide text-[var(--home-foot)]">
            音樂 · 研究 · 實驗
          </p>
        </div>

      </div>
    </div>
  );
}
