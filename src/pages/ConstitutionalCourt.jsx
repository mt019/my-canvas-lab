import { useEffect } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  FileText,
  Gavel,
  History,
  Info,
  Landmark,
  Network,
  Search,
  Users,
} from 'lucide-react';
import data from '../data/constitutionalCourt.json';
import { ccJusticePath } from './_constitutional-court/seo';
import { CaseCard, CC_VARS, DocSpotlight, docs, usePref } from './_constitutional-court/shared';
import IndexView from './_constitutional-court/IndexView';
import TimelineView from './_constitutional-court/TimelineView';
import JusticesView from './_constitutional-court/JusticesView';
import JusticeDetail from './_constitutional-court/JusticeDetail';
import TenureView from './_constitutional-court/TenureView';
import GraphView from './_constitutional-court/GraphView';
import ResearchProblem from './_constitutional-court/ResearchProblem';
import HistoryView from './_constitutional-court/HistoryView';
import TypologyReportView from './_constitutional-court/TypologyReportView';
import AboutView, { Case1Analysis } from './_constitutional-court/AboutView';

const tabs = [
  { id: 'index', label: '案件索引', icon: Search },
  { id: 'timeline', label: '案件時間軸', icon: CalendarClock },
  { id: 'justices', label: '大法官', icon: Users },
  { id: 'tenure', label: '任期時間軸', icon: History },
  { id: 'graph', label: '意見書圖譜', icon: Network },
  { id: 'research', label: '問題意識', icon: FileText },
  { id: 'case1', label: '114 憲判 1 號', icon: Gavel },
  { id: 'history', label: '沿革', icon: Landmark },
  { id: 'about', label: '資料說明', icon: Info },
];

export default function ConstitutionalCourt() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  // Tab and justice come from the clean path route when present
  // (/constitutionalcourt/:tab, /constitutionalcourt/justices/:justiceName),
  // else the legacy ?tab=／?j= query deep links, else the default index.
  const routeParams = useParams();
  const queryJustice = params.get('j');
  const routeJustice = routeParams.justiceName ? decodeURIComponent(routeParams.justiceName) : null;
  const justiceName = queryJustice ?? routeJustice;
  // A single-case landing page (/constitutionalcourt/case/<字號>) shows that case
  // as the main view rather than a tab; the ?doc= overlay is untouched.
  const routeCase = routeParams.caseNo ? decodeURIComponent(routeParams.caseNo) : null;
  const active = params.get('tab') ?? routeParams.tab ?? (justiceName ? 'justices' : 'index');
  const focusDoc = params.get('doc');
  const [pdfMode] = usePref('pdfMode', 'preview');

  const tabPath = (id) => (id === 'index' ? '/constitutionalcourt' : `/constitutionalcourt/${id}`);
  // Justices navigate to their own clean, indexable URL; a crawler that reaches
  // the 大法官 tab can follow every one of them from there.
  const openJustice = (name) => navigate(ccJusticePath(name));
  // ?doc=字號 案件浮層：疊在目前路由上，關閉即移除 doc 參數，不動路由。
  const openDoc = (字號) => { if (!字號) return; const next = Object.fromEntries(params); next.doc = 字號; setParams(next); };
  const closeDoc = () => { const next = Object.fromEntries(params); delete next.doc; setParams(next); };
  const viewInIndex = (字號) => navigate(`/constitutionalcourt?q=${encodeURIComponent(字號)}`); // 跳索引分頁、以字號預搜、關浮層

  useEffect(() => {
    // The legacy ?j= deep view has no registered route, so SeoHead can't title
    // it — set it here. The clean /justices/<name> path owns its own title via
    // JusticeRoute's SeoHead, so don't clobber that.
    if (queryJustice) document.title = `${queryJustice}｜憲法法庭案例庫`;
  }, [queryJustice]);

  // 切換分頁／大法官個人頁時捲回頂端：SPA 不會自動重置 window 捲動位置，否則案件索引捲到
  // 很下面點大法官，換到的個人頁會沿用同一捲動量、看起來也停在下面（兩頁捲動「聯動」）。
  // 只依 active／justiceName——開關案件浮層（focusDoc）不重置，讓關浮層後回到索引原位。
  useEffect(() => { window.scrollTo(0, 0); }, [active, justiceName, routeCase]);

  const caseDoc = routeCase ? docs.find((x) => x.字號 === routeCase) : null;

  return (
    <div className="min-h-screen paper-texture bg-[var(--cc-bg)] font-sans text-[var(--cc-ink)]" style={{ ...CC_VARS, paddingBottom: 60, overflowX: 'clip' }}>
      <header className="border-b border-[var(--cc-line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-2 font-accent text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow-header)]">
            <Gavel size={13} />
            Constitutional Court Archive
          </div>
          <h1 className="max-w-3xl leading-tight text-[var(--cc-heading)]">
            <span className="font-sans text-2xl font-semibold sm:text-[2.15rem]">憲法法庭案例庫</span>
            <span className="ml-3 align-baseline text-base sm:text-lg text-[var(--cc-body-text)]">釋字・憲判・暫時處分</span>
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--cc-body-text)]">
            把中華民國司法解釋沿革——行憲後 {data.統計.行憲後} 件（大法官釋字・憲法法庭裁判，取自憲法法庭官網）與
            行憲前 {data.統計.行憲前} 件（大理院／最高法院／司法院統一解釋，取自維基文庫）——做成可檢索的研究工作台：
            主題與年代篩選、意見書作者與立場、共同具名網絡、引用統計，以及可直接進論文的引註與 BibTeX 匯出。
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {[
              ['大法官解釋', data.統計.機關?.大法官 ?? 0],
              ['憲法法庭判決', data.統計.判決],
              ['實體裁定', data.統計.實體裁定],
              ['具名意見書', docs.reduce((s, d) => s + d.意見書.filter((o) => o.作者類別 === '大法官').length, 0)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-[12px] font-bold text-[var(--cc-icon)]">{label}</span>
                <span className="font-display text-lg sm:text-xl font-bold text-[var(--cc-ink)]">{value}</span>
              </div>
            ))}
            {/* 行憲前另列一段、以分隔線區隔——非大法官解釋，不併入上面計數 */}
            <div className="flex items-baseline gap-2 border-l border-[var(--cc-line)] pl-8">
              <span className="text-[12px] font-bold text-[var(--cc-eyebrow)]">行憲前統一解釋</span>
              <span className="font-display text-lg sm:text-xl font-bold text-[var(--cc-ink)]">{data.統計.行憲前}</span>
              <span className="text-[12px] text-[var(--cc-ink-soft)]">
                大理院 {data.統計.機關?.大理院}・最高法院 {data.統計.機關?.最高法院}・司法院 {data.統計.機關?.司法院}
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-[var(--cc-line)] bg-white/94 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              to={tabPath(id)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold transition hover:bg-[var(--cc-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cc-highlight)]"
              style={{ background: active === id ? 'var(--cc-tab-active-bg)' : undefined, color: active === id ? 'var(--cc-tab-active-text)' : 'var(--cc-tab-inactive-text)' }}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {routeCase ? (
          <section className="py-5">
            <Link to="/constitutionalcourt" className="text-[13px] font-bold text-[var(--cc-accent)] hover:underline">← 回案件索引</Link>
            <div className="mt-3">
              {caseDoc
                ? <CaseCard d={caseDoc} q="" reasoningDefault pdfMode={pdfMode} />
                : <p className="py-8 text-[14px] text-[var(--cc-ink-mid)]">案例庫查無「{routeCase}」這一件。</p>}
            </div>
          </section>
        ) : null}
        {!routeCase && active === 'index' ? <IndexView initialQ={params.get('q') ?? ''} onOpenDoc={openDoc} /> : null}
        {active === 'timeline' ? <TimelineView /> : null}
        {active === 'justices' ? (
          justiceName
            ? <JusticeDetail name={justiceName} onBack={() => navigate('/constitutionalcourt/justices')} onOpen={openJustice} onOpenDoc={openDoc} />
            : <JusticesView />
        ) : null}
        {active === 'tenure' ? <TenureView onOpen={openJustice} /> : null}
        {active === 'graph' ? <GraphView /> : null}
        {active === 'research' ? <ResearchProblem /> : null}
        {active === 'case1' ? <Case1Analysis /> : null}
        {active === 'history' ? <HistoryView onOpenIndex={(機關) => navigate(機關 && 機關 !== '行憲後' ? `/constitutionalcourt?機關=${encodeURIComponent(機關)}` : '/constitutionalcourt')} /> : null}
        {active === 'about' ? <AboutView /> : null}
        {active === 'typology-report' ? <TypologyReportView /> : null}
      </main>

      {focusDoc ? (
        <DocSpotlight
          字號={focusDoc}
          onClose={closeDoc}
          onPick={openDoc}
          onViewIndex={viewInIndex}
        />
      ) : null}
    </div>
  );
}
