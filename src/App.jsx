import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Droplets, FileSearch, Gavel, Globe2, GraduationCap, Landmark, Languages, Mic, Music, Music2, Palette, Piano, Scale, ScrollText, Wind } from 'lucide-react';

const pages = import.meta.glob('./pages/*.{jsx,tsx}');

const PAGE_META = { // token-exempt: per-page identity chip colors (data, not styling)
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
    group: 'doctrine',
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
  ConstitutionalCourt: {
    name: '憲法法庭案例庫',
    desc: '813 件釋字與憲法法庭裁判的主題檢索、意見書網絡與引註匯出',
    Icon: Gavel,
    accent: '#e8dae0',
    accentText: '#8f6071',
    group: 'research',
  },
  GermanLawCourseTimeline: {
    name: '德文法學課程時序',
    desc: '德文法學名著選讀一的歷年教師開課時間軸，領域著色與課綱摘要',
    Icon: GraduationCap,
    accent: '#ece5d5',
    accentText: '#8b6f25',
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
  TaipeiFilmFestival: {
    name: '台北電影節售票雷達',
    desc: 'OpenTix 即時餘額同步，將可買場次壓成首頁式決策儀表板',
    Icon: CalendarDays,
    accent: '#d8e8e0',
    accentText: '#2f6f60',
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

const GROUPS = [
  { key: 'research', label: '研究地圖', desc: '資料層分離、可延伸成長期研究的小型工作台' },
  { key: 'doctrine', label: '法政解析', desc: '法律、財稅、投資與制度案例的結構化拆解' },
  { key: 'tool', label: '即用工具', desc: '可直接操作的音樂與聲音工具' },
  { key: 'life', label: '生活雷達', desc: '活動、餘額、行程與日常決策輔助' },
];

export default function App() {
  const routes = useMemo(() => {
    return Object.keys(pages).map((path) => {
      const name = path.split('/').pop().replace(/\.(jsx|tsx)$/, '');
      return {
        name,
        path: `/${name.toLowerCase()}`,
        component: lazy(pages[path]),
        meta: PAGE_META[name] ?? null,
      };
    });
  }, []);

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-line-soft border-t-ink-faint rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage routes={routes} />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<route.component />} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
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
  research: { note: 'long-running research canvas' },
  doctrine: { note: 'legal and policy analysis' },
  tool: { note: 'interactive instruments' },
  life: { note: 'practical decision radar' },
};

function HomePage({ routes }) {
  useEffect(() => {
    document.title = 'Phenom Canvas Lab';
  }, []);

  const known = routes.filter((r) => r.meta);
  const unknown = routes.filter((r) => !r.meta);
  return (
    <div
      className="min-h-screen bg-[var(--home-bg)] px-4 font-sans text-[var(--home-ink)] sm:px-6"
      style={{ ...HOME_VARS, paddingTop: 46, paddingBottom: 64 }}
    >
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

        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1.05fr_0.95fr]">
          {GROUPS.map(({ key, label }) => {
            const items = known.filter((r) => r.meta.group === key);
            if (items.length === 0) return null;
            const gm = GROUP_META[key];
            return (
              <section key={key}>
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
              <section>
                <div className="flex flex-col gap-2">
                  {ungrouped.map((route) => <RouteRow key={route.path} route={route} />)}
                </div>
              </section>
            ) : null;
          })()}

          {unknown.length > 0 && (
            <section>
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
