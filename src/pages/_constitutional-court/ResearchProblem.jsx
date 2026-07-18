import { useMemo, useState } from 'react';
import data from '../../data/constitutionalCourt.json';
import { Badge, PRES_COLOR, heatFill, inkToFill } from './shared';
import { renderInline } from './TypologyReportView';

// 立場表真投票分析（資料層 analyze-lct.mjs 母本）：57 判決立場表由 fetch-lct 回官網重抓、parse-lct 重解
// （動態欄界＋名冊錨定），並以大法官意見書不同意作者獨立交叉校驗（見 data.立場表分析.交叉校驗）。
// 平均同意率＝共投≥8 次的對其同意率平均；同質性附置換檢定；理想點＝古典 MDS on 1−同意率（符號任意）。
// 立場表計量結果讀資料層母本 data.立場表分析（analyze-lct.mjs 產、build-app-json 嵌入）。
// 舊硬編快照已移除：parser 去噪＋許宗力歸蔡英文後由資料層現算，前端不再各自維護一份。
const LCT_RESULT = data.立場表分析;

// 意見書覆蓋（逐時期）：哪些時期、哪些號沒有大法官意見書。讀資料層稽核鍵 data.意見書覆蓋
// （audit-opinion-coverage.mjs 產，含官方原始頁漏抓交叉核對）；點時期展開該期無意見書字號。
// 意見書色帶：一直條＝一號，色深＝該號大法官意見書份數（沿用矩陣的 heatFill 熱度標，0＝heat-zero）。
function HeatStrip({ id, rows, maxN, marks, ticks, label, sub, hov, setHov }) {
  const slices = useMemo(
    () => rows.map((d) => <span key={d.字號} className="block h-full flex-1" style={{ background: heatFill(d.c, maxN) }} />),
    [rows, maxN],
  );
  const a = hov?.id === id ? hov : null;
  return (
    <div className="mt-2.5">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{label}</p>
        <p className="text-[11px] text-[var(--cc-ink-soft)]">{sub}</p>
      </div>
      {marks?.length ? (
        <div className="relative mt-1 h-3 max-w-2xl">
          {marks.map((m) => <span key={m.label} className="absolute top-0 -translate-x-1/2 text-[9.5px] text-[var(--cc-ink-soft)]" style={{ left: `${m.frac * 100}%` }}>{m.label}</span>)}
        </div>
      ) : null}
      <div
        className="relative h-7 max-w-2xl cursor-crosshair rounded-md border border-[var(--cc-line)]"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(rows.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * rows.length))); setHov({ id, left: e.clientX - r.left, ...rows[i] }); }}
        onMouseLeave={() => setHov(null)}
      >
        {/* slices 圓角裁切放在內層，外層不 overflow-hidden，否則上方 tooltip 被裁掉＝hover 看不到 */}
        <div className="flex h-full w-full overflow-hidden rounded-md">{slices}</div>
        {marks?.map((m) => <span key={m.label} className="pointer-events-none absolute inset-y-0 w-px" style={{ left: `${m.frac * 100}%`, background: 'var(--cc-bg)', opacity: 0.65 }} />)}
        {a ? <span className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[var(--cc-ink-strong)]" style={{ left: `${a.left}px` }} /> : null}
        {a ? (
          <div className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-[var(--cc-line)] bg-[var(--cc-bg)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--cc-ink-strong)] shadow-sm" style={{ left: `${a.left}px` }}>
            {a.字號}・{a.c ? `${a.c} 份意見書` : '無'}
          </div>
        ) : null}
      </div>
      {ticks?.length ? (
        <div className="relative mt-0.5 h-3 max-w-2xl">
          {ticks.map((t) => <span key={t.label} className="absolute top-0 -translate-x-1/2 text-[9.5px] text-[var(--cc-ink-soft)]" style={{ left: `${t.frac * 100}%` }}>{t.label}</span>)}
        </div>
      ) : null}
    </div>
  );
}

// 問題意識分頁圖表統一規格（字級貼近內文、淡底 ink 細框；dataviz：thin marks、text 用 ink token、≥8px 標記）。
const RVIZ = { lbl: 12, tick: 11, r: 4 };
const VIZ_PALE = inkToFill('var(--cat-7-tx)');

// 通用啞鈴圖（同組 vs 跨組）：證據二共同具名與證據三真投票同質性共用一套視覺語言。
// rows=[{維度,同組,跨組,p}]；domain=[lo,hi] 決定 x 軸範圍（真投票率用寬帶避免放大微小差）；dp=小數位。
function Dumbbell({ rows, domain, dp = 2 }) {
  const W = 672, PL = 120, PR = 552, top = 16, rowH = 30;
  const H = top + rows.length * rowH + 20;
  const [lo, hi] = domain;
  const xAt = (v) => PL + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (PR - PL);
  return (
    <div className="mt-2 max-w-2xl overflow-x-auto">
      <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--cc-ink-soft)]">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: VIZ_PALE, border: '1.5px solid var(--cc-ink-strong)' }} />同組</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--cc-bg)', border: '1.5px solid var(--cc-ink-soft)' }} />跨組</span>
        <span>連線＝同組−跨組差；p&lt;.05 標記為顯著（✓），p&lt;.1 標 ⁺</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="同組與跨組平均比較（啞鈴圖）" style={{ width: '100%', height: 'auto', maxWidth: W }}>
        {[lo, (lo + hi) / 2, hi].map((t) => (
          <g key={t}>
            <line x1={xAt(t)} y1={top - 4} x2={xAt(t)} y2={top + rows.length * rowH} stroke="var(--cc-line)" strokeWidth={1} strokeDasharray={t === lo || t === hi ? undefined : '2 2'} opacity={0.6} />
            <text x={xAt(t)} y={H - 4} textAnchor="middle" fontSize={RVIZ.tick} fill="var(--cc-axis-text)">{t.toFixed(dp)}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = top + i * rowH + rowH / 2;
          const sig = r.p < 0.05, c = sig ? 'var(--cc-accent)' : 'var(--cc-ink-strong)';
          return (
            <g key={r.維度}>
              <text x={PL - 8} y={y + 3} textAnchor="end" fontSize={RVIZ.lbl} fill="var(--cc-ink-mid)">{r.維度}</text>
              <line x1={xAt(r.同組)} y1={y} x2={xAt(r.跨組)} y2={y} stroke="var(--cc-line)" strokeWidth={2} />
              <circle cx={xAt(r.跨組)} cy={y} r={RVIZ.r} fill="var(--cc-bg)" stroke="var(--cc-ink-soft)" strokeWidth={1.5} />
              <circle cx={xAt(r.同組)} cy={y} r={RVIZ.r} fill={VIZ_PALE} stroke={c} strokeWidth={1.6} />
              <text x={PR + 8} y={y + 3} textAnchor="start" fontSize={RVIZ.tick} fontWeight={sig ? 700 : 400} fill={sig ? 'var(--cc-accent)' : 'var(--cc-ink-soft)'}>{`p ${r.p.toFixed(3)}${sig ? ' ✓' : (r.p < 0.1 ? ' ⁺' : '')}`}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 意見書覆蓋（逐號熱條）：色深＝該號分別意見份數，空白＝無。資料讀 data.問題意識.圖表.覆蓋
// （母本熱帶，analyze-research.mjs 產）；marks/ticks 由 rows 現推（純陣列運算，不碰 data.文件）。
function OpinionCoverage({ 覆蓋, eyebrow, 標題, 圖說 }) {
  const g = useMemo(() => {
    const s = 覆蓋.釋字, x = 覆蓋.憲判;
    const maxN = Math.max(1, ...s.map((d) => d.c), ...x.map((d) => d.c));
    const marks = [[1991, '1991'], [2003, '2003'], [2015, '2015']]
      .map(([y, label]) => { const i = s.findIndex((d) => d.年 && d.年 >= y); return i > 0 ? { frac: i / s.length, label } : null; }).filter(Boolean);
    const ticksS = [1, 200, 400, 600, 800].map((n) => { const i = s.findIndex((d) => d.n >= n); return i < 0 ? null : { frac: (i + 0.5) / s.length, label: n === 1 ? '釋1' : String(n) }; }).filter(Boolean);
    const ticksX = [1, 20, 40].map((n) => { const i = x.findIndex((d) => d.n >= n); return i < 0 ? null : { frac: (i + 0.5) / Math.max(1, x.length), label: n === 1 ? '憲判1' : String(n) }; }).filter(Boolean);
    return { s, x, maxN, marks, ticksS, ticksX, cS: s.filter((d) => d.c > 0).length, cX: x.filter((d) => d.c > 0).length };
  }, [覆蓋]);
  const [hov, setHov] = useState(null);
  if (!g.s.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">{eyebrow}</p>
      <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{標題}</h3>
      <HeatStrip
        id="shih" rows={g.s} maxN={g.maxN} marks={g.marks} ticks={g.ticksS} hov={hov} setHov={setHov}
        label={`釋字 1–${g.s[g.s.length - 1].n} 號`} sub={`${g.cS}/${g.s.length} 有意見書`}
      />
      <HeatStrip
        id="xian" rows={g.x} maxN={g.maxN} ticks={g.ticksX} hov={hov} setHov={setHov}
        label="憲法法庭 2022–（憲判）" sub={`${g.cX}/${g.x.length} 有意見書`}
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--cc-ink-soft)]">
        <span>意見書數</span>
        <span className="inline-block h-3 w-3 rounded-[3px] border border-[var(--cc-line)]" style={{ background: heatFill(0, g.maxN) }} />
        <span>無</span>
        {[1, 3, 5, g.maxN].map((v) => <span key={v} className="inline-block h-3 w-3 rounded-[3px]" style={{ background: heatFill(v, g.maxN) }} />)}
        <span>{g.maxN}+ 份</span>
      </div>
      <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[var(--cc-figure-note)]">{renderInline(圖說)}</p>
    </div>
  );
}

// 逐年意見書分歧指數（單一指標：意見書代理，全行憲後）：逐案分別意見加權（不同 1.0／部分 0.6／協同 0.3）
// ÷ 參與大法官數，逐年平均。[0,1] 分歧指數；早期低點含意見書覆蓋下限（非純共識，圖下明註）。
// 2022– 逐項真投票是不同的構念（投票分裂而非意見書書寫），另置於證據三，不在此疊圖。
function DivergenceTimeSeries({ 分歧時序, eyebrow, 標題, 圖說 }) {
  const B = useMemo(() => (分歧時序.代理 ?? []).map((d) => ({ y: d.年, n: d.n, v: d.值 })), [分歧時序]);
  const [hy, setHy] = useState(null);
  if (!B.length) return null;
  const PAD_L = 26, PAD_R = 10, PAD_T = 10, PAD_B = 18, W = 672, H = 168;
  const y0 = B[0].y, y1 = B[B.length - 1].y;
  const yMax = Math.max(0.3, Math.ceil(Math.max(...B.map((d) => d.v)) * 10) / 10);
  const yTicks = []; for (let t = 0; t <= yMax + 1e-9; t += 0.1) yTicks.push(+t.toFixed(1));
  const xAt = (y) => PAD_L + ((y - y0) / (y1 - y0)) * (W - PAD_L - PAD_R);
  const yAt = (v) => PAD_T + (1 - v / yMax) * H;
  const line = B.map((d, i) => `${i ? 'L' : 'M'}${xAt(d.y).toFixed(1)} ${yAt(d.v).toFixed(1)}`).join(' ');
  const area = `${line} L${xAt(y1).toFixed(1)} ${yAt(0).toFixed(1)} L${xAt(y0).toFixed(1)} ${yAt(0).toFixed(1)} Z`;
  const eras = [[1991, '1991'], [2003, '交錯任期 2003'], [2015, '2015'], [2022, '憲法法庭 2022']];
  const hb = hy != null ? B.find((d) => d.y === hy) : null;
  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">{eyebrow}</p>
      <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{標題}</h3>
      <div className="relative mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${PAD_T + H + PAD_B}`} preserveAspectRatio="xMinYMin meet" role="img"
          aria-label="逐年意見書分歧指數時序圖" style={{ width: '100%', height: 'auto', maxWidth: W }}
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const yy = Math.round(y0 + ((px - PAD_L) / (W - PAD_L - PAD_R)) * (y1 - y0)); setHy(Math.max(y0, Math.min(y1, yy))); }}
          onMouseLeave={() => setHy(null)}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD_L} y1={yAt(v)} x2={W - PAD_R} y2={yAt(v)} stroke="var(--cc-line)" strokeWidth={1} />
              <text x={PAD_L - 4} y={yAt(v) + 3} textAnchor="end" fontSize={RVIZ.tick} fill="var(--cc-axis-text)">{v.toFixed(1)}</text>
            </g>
          ))}
          {eras.map(([y, label]) => (
            <g key={y}>
              <line x1={xAt(y)} y1={PAD_T} x2={xAt(y)} y2={PAD_T + H} stroke="var(--cc-line)" strokeWidth={1} strokeDasharray="2 2" />
              <text x={xAt(y)} y={PAD_T + H + 11} textAnchor="middle" fontSize={9.5} fill="var(--cc-ink-soft)">{label}</text>
            </g>
          ))}
          <path d={area} fill="var(--cc-ink-strong)" opacity={0.06} />
          <path d={line} fill="none" stroke="var(--cc-ink-strong)" strokeWidth={1.6} strokeLinejoin="round" />
          {hy != null ? <line x1={xAt(hy)} y1={PAD_T} x2={xAt(hy)} y2={PAD_T + H} stroke="var(--cc-ink-soft)" strokeWidth={1} /> : null}
          {hb ? <circle cx={xAt(hb.y)} cy={yAt(hb.v)} r={2.8} fill="var(--cc-ink-strong)" stroke="var(--cc-bg)" strokeWidth={1} /> : null}
        </svg>
        {hb ? (
          <div className="pointer-events-none absolute top-0 rounded border border-[var(--cc-line)] bg-[var(--cc-bg)] px-1.5 py-1 text-[11px] shadow-sm" style={{ left: `${(xAt(hy) / W) * 100}%`, transform: 'translateX(-50%)' }}>
            <div className="font-bold text-[var(--cc-ink-strong)]">{hy} 年</div>
            <div className="text-[var(--cc-ink-mid)]">分歧 {hb.v.toFixed(2)}（{hb.n} 件）</div>
          </div>
        ) : null}
      </div>
      <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[var(--cc-figure-note)]">{renderInline(圖說)}</p>
    </div>
  );
}

// 問題意識分頁：純渲染 data.問題意識 發現母本（analyze-research.mjs 產：計量圖表資料＋佔位符已解析敘事）。
// 前端不再從 docs/justices 即時算統計；證據三三張圖仍讀已是母本的 data.立場表分析（LCT_RESULT）。

// 證據三 1D 理想點：同一提名總統者散落軸上、不整齊分塊。色＝PRES_COLOR（entity-based）、淡底 ink 圈。
function IdealPointChart() {
  const pts = LCT_RESULT.理想點; const xs = pts.map((p) => p.x);
  const lo = Math.min(...xs), hi = Math.max(...xs); const pad = (hi - lo) * 0.08;
  const pos = (x) => ((x - (lo - pad)) / ((hi + pad) - (lo - pad))) * 100;
  const ink = (p) => PRES_COLOR[p.提名總統] ?? 'var(--cc-ink-mid)';
  return (
    <div className="mt-2 max-w-2xl space-y-0.5">
      {pts.map((p) => (
        <div key={p.姓名} className="grid grid-cols-[64px_1fr_52px] items-center gap-2 text-[12.5px]">
          <span className="font-bold" style={{ color: ink(p) }}>{p.姓名}</span>
          <span className="relative block h-3.5">
            <span className="absolute inset-y-0 w-px bg-[var(--cc-line)]" style={{ left: `${pos(0)}%` }} />
            <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${pos(p.x)}%`, background: inkToFill(ink(p)), border: `1.5px solid ${ink(p)}` }} />
          </span>
          <span className="text-right text-[var(--cc-ink-soft)]">{p.x >= 0 ? '+' : ''}{p.x.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// 證據三 方法梯度：提名總統效果的置換 p 隨口徑收緊而消失（唯有全 roll 粗糙口徑落在門檻左側）。
function MethodGradientChart() {
  const R = LCT_RESULT;
  const dP = (arr) => (arr || []).find((r) => r.維度 === '提名總統') || {};
  const rows = [
    { label: '全案表決（粗糙口徑）', p: dP(R.同質性_全roll).p },
    { label: '主分析（僅爭議表決）', p: dP(R.同質性).p },
    { label: '共同視窗（馬蔡同任期）', p: (R.共同視窗?.維度 || []).find((r) => r.維度 === '提名總統')?.p },
    { label: '案件層級 FE（逐案固定）', p: R.案件層級?.提名總統?.p },
    { label: 'MRQAP（控批次＋資歷）', p: R.MRQAP?.p?.同提名人 },
    ...(R.分向票敏感性 ? [
      { label: `分向票·保守（${R.分向票敏感性.編碼涵蓋}）`, p: R.分向票敏感性.保守?.提名總統?.p },
      { label: '分向票·激進（上界）', p: R.分向票敏感性.激進?.提名總統?.p },
    ] : []),
  ].filter((r) => typeof r.p === 'number');
  const W = 672, PL = 180, PR = 582, PMAX = 0.6, rowH = 26, top = 22;
  const xP = (p) => PL + (Math.min(p, PMAX) / PMAX) * (PR - PL);
  const H = top + rows.length * rowH + 16;
  const ax = xP(0.05);
  return (
    <div className="mt-3 max-w-2xl overflow-x-auto">
      <p className="text-[11px] font-bold text-[var(--cc-ink-strong)]">方法梯度：提名總統效果隨口徑收緊而消失</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="提名總統效果的置換檢定 p 值隨方法口徑變化" style={{ width: '100%', height: 'auto', maxWidth: W }}>
        <line x1={ax} y1={top - 6} x2={ax} y2={top + rows.length * rowH} stroke="var(--cc-accent)" strokeWidth={1} strokeDasharray="3 2" />
        <text x={ax} y={top - 9} textAnchor="middle" fontSize={RVIZ.tick} fill="var(--cc-accent)">p=.05</text>
        {[0, 0.3, 0.6].map((t) => (
          <text key={t} x={xP(t)} y={H - 2} textAnchor="middle" fontSize={RVIZ.tick} fill="var(--cc-axis-text)">{t === 0 ? '0' : t.toFixed(1)}</text>
        ))}
        {rows.map((r, i) => {
          const y = top + i * rowH + rowH / 2, sig = r.p < 0.05, c = sig ? 'var(--cc-accent)' : 'var(--cc-ink-strong)';
          return (
            <g key={r.label}>
              <text x={PL - 6} y={y + 3} textAnchor="end" fontSize={RVIZ.lbl} fill="var(--cc-ink-mid)">{r.label}</text>
              <line x1={PL} y1={y} x2={PR} y2={y} stroke="var(--cc-line)" strokeWidth={1} />
              <circle cx={xP(r.p)} cy={y} r={RVIZ.r} fill={sig ? c : VIZ_PALE} stroke={c} strokeWidth={1.5} />
              <text x={Math.min(xP(r.p) + 8, PR)} y={y + 3} fontSize={RVIZ.tick} fontWeight={sig ? 700 : 400} fill={c}>{r.p.toFixed(3)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 文獻引註：[[cite:鍵|顯示]] → hover 顯示全引註卡；有公開 url 則外連（否則標「需館藏／付費取得」）。文獻 map 讀自母本。
function Cite({ rkey, disp }) {
  const ref = data.問題意識?.文獻?.[rkey];
  const full = ref?.全文 ?? disp;
  const link = ref?.url;
  const label = <span className="underline decoration-dotted decoration-[var(--cc-link-underline)] underline-offset-2">{disp}</span>;
  return (
    <span className="group relative">
      {link
        ? <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--cc-link-hover)]">{label}</a>
        : <span className="cursor-help">{label}</span>}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden w-[17rem] max-w-[80vw] -translate-x-1/2 rounded-md border border-[var(--cc-line)] bg-[var(--cc-bg)] px-2.5 py-1.5 text-[11.5px] font-normal leading-snug text-[var(--cc-ink-mid)] shadow-md group-hover:block">
        {full}
        {link
          ? <span className="mt-0.5 block text-[var(--cc-eyebrow)]">↗ 開啟公開來源</span>
          : <span className="mt-0.5 block text-[var(--cc-ink-soft)]">· 需館藏／付費取得</span>}
      </span>
    </span>
  );
}

// 敘事行內渲染：**粗體**、`code`、[[cite:鍵|顯示]]。（renderInline 為類型學報告專用、不含 cite，故另立此函式。）
function renderNarrative(text) {
  const nodes = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[\[cite:([^\]|]+)\|([^\]]+)\]\]/g;
  let last = 0, key = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={key++} className="font-bold text-[var(--cc-ink-strong)]">{m[1]}</strong>);
    else if (m[2] !== undefined) nodes.push(<code key={key++} className="rounded bg-[var(--cc-hover-bg)] px-1 text-[0.92em]">{m[2]}</code>);
    else nodes.push(<Cite key={key++} rkey={m[3]} disp={m[4]} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const rpP = (t, i) => <p key={i} className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink)]">{renderNarrative(t)}</p>;
const rpEyebrow = (t) => <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">{t}</p>;

// 敘事 beat 派工：依 beat.類型 選版面，文字一律取自母本成品字串（renderInline 轉 **粗體**）。
function BeatBlock({ beat: b, 圖 }) {
  switch (b.類型) {
    case '導言':
      return (
        <div>
          {rpEyebrow(b.eyebrow)}
          <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">{b.標題}</h2>
          {(b.段落 ?? []).map(rpP)}
          <div className="mt-3 grid max-w-3xl gap-3 sm:grid-cols-2">
            {(b.卡片 ?? []).map((c, i) => (
              <div key={i} className="rounded-lg border border-[var(--cc-line)] p-3">
                <div className="flex items-center gap-2"><Badge tone={c.tone}>{c.label}</Badge><span className="text-[12px] text-[var(--cc-ink-soft)]">{c.sub}</span></div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--cc-ink)]">{renderNarrative(c.text)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case '證據': {
      if (b.序 === '一') {
        const maxAvg = Math.max(1, ...圖.趨勢.map((r) => r.平均分別意見));
        const 覆蓋附 = (b.附圖 ?? []).find((f) => f.圖 === '覆蓋');
        const 時序附 = (b.附圖 ?? []).find((f) => f.圖 === '分歧時序');
        return (
          <div className="mt-5">
            {rpEyebrow(b.eyebrow)}
            <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{b.標題}</h3>
            <div className="mt-2 max-w-2xl space-y-1">
              {圖.趨勢.map((r) => (
                <div key={r.期} className="grid grid-cols-[86px_1fr_112px] items-center gap-2 text-[13px]">
                  <span className="text-[var(--cc-ink-mid)]">{r.期}</span>
                  <span className="block h-2 rounded-full bg-[var(--cc-track)]"><span className="block h-2 rounded-full" style={{ width: `${(r.平均分別意見 / maxAvg) * 100}%`, background: 'var(--cc-highlight)' }} /></span>
                  <span className="text-right text-[var(--cc-ink-soft)]">{r.平均分別意見.toFixed(2)} 份・{Math.round(r.不同意比例 * 100)}% 不同</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[var(--cc-figure-note)]">{renderInline(b.圖說)}</p>
            {覆蓋附 ? <OpinionCoverage 覆蓋={圖.覆蓋} eyebrow={覆蓋附.eyebrow} 標題={覆蓋附.標題} 圖說={覆蓋附.圖說} /> : null}
            {時序附 ? <DivergenceTimeSeries 分歧時序={圖.分歧時序} eyebrow={時序附.eyebrow} 標題={時序附.標題} 圖說={時序附.圖說} /> : null}
          </div>
        );
      }
      if (b.序 === '二') {
        const rows = 圖.共同具名.map((r) => ({ 維度: r.維度, 同組: r.同組, 跨組: r.跨組, p: r.p }));
        const max = Math.max(...圖.共同具名.flatMap((r) => [r.同組, r.跨組])) * 1.06;
        return (
          <div className="mt-5">
            {rpEyebrow(b.eyebrow)}
            <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{b.標題}</h3>
            <Dumbbell rows={rows} domain={[0, max]} dp={2} />
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{renderNarrative(b.圖說)}</p>
          </div>
        );
      }
      const homoRows = LCT_RESULT.同質性.map((r) => ({ 維度: r.維度, 同組: r.同組, 跨組: r.跨組, p: r.p }));
      return (
        <div className="mt-5">
          {rpEyebrow(b.eyebrow)}
          <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{b.標題}</h3>
          {(b.段落 ?? []).map((t, i) => <p key={i} className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--cc-ink)]">{renderNarrative(t)}</p>)}
          <IdealPointChart />
          <p className="mt-3 text-[11px] font-bold text-[var(--cc-ink-strong)]">真投票同質性：同組 vs 跨組同意率（四維度全測不到）</p>
          <Dumbbell rows={homoRows} domain={[0.5, 0.8]} dp={3} />
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{renderNarrative(b.表圖說)}</p>
          {b.梯度圖 ? <MethodGradientChart /> : null}
          {b.梯度圖說 ? <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-[var(--cc-figure-note)]">{renderNarrative(b.梯度圖說)}</p> : null}
        </div>
      );
    }
    case '方法教訓':
      return (
        <div className="mt-5 max-w-3xl">
          {rpEyebrow(b.eyebrow)}
          <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{b.標題}</h3>
          {(b.段落 ?? []).map((t, i) => <p key={i} className="mt-2 text-[13.5px] leading-relaxed text-[var(--cc-ink)]">{renderNarrative(t)}</p>)}
        </div>
      );
    case 'ModelGate':
      return (
        <div className="mt-5 max-w-3xl rounded-lg border border-[var(--cc-border)] bg-[var(--cc-hover-bg)] p-3.5">
          {rpEyebrow(b.eyebrow)}
          <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{b.標題}</h3>
          <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-[var(--cc-ink)]">
            {(b.清單 ?? []).map((t, i) => <li key={i}>{renderNarrative(t)}</li>)}
          </ul>
        </div>
      );
    case '資料解鎖':
      return (
        <div className="mt-3 max-w-3xl">
          {rpEyebrow(b.eyebrow)}
          {(b.段落 ?? []).map((t, i) => <p key={i} className="mt-1 text-[13.5px] leading-relaxed text-[var(--cc-ink)]">{renderNarrative(t)}</p>)}
        </div>
      );
    // 頁尾可折疊附錄（預設收合＝方法旁白，是本頁唯一對「展開卡預設全展開」的刻意破例）：
    // <summary> 顯示 eyebrow＋標題＋一句摘要，展開才顯段落。純渲染母本字串，不算數。
    case '分層附錄':
      return (
        <details className="group mt-6 max-w-3xl rounded-lg border border-[var(--cc-line)]">
          <summary className="cursor-pointer list-none px-3.5 py-3">
            <span className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold text-[var(--cc-ink-soft)] transition-transform group-open:rotate-90" aria-hidden="true">▸</span>
              <span className="flex-1">
                {rpEyebrow(b.eyebrow)}
                <span className="mt-0.5 block text-[14px] font-bold text-[var(--cc-title-ink)]">{b.標題}</span>
                {b.摘要 ? <span className="mt-1 block text-[12.5px] leading-relaxed text-[var(--cc-ink-soft)] group-open:hidden">{renderNarrative(b.摘要)}</span> : null}
              </span>
            </span>
          </summary>
          <div className="border-t border-[var(--cc-line)] px-3.5 py-3">
            {(b.段落 ?? []).map((t, i) => <p key={i} className="mt-2 first:mt-0 text-[13.5px] leading-relaxed text-[var(--cc-ink)]">{renderNarrative(t)}</p>)}
          </div>
        </details>
      );
    default:
      return null;
  }
}

export default function ResearchProblem() {
  const RP = data.問題意識;
  if (!RP?.敘事?.length) return null;
  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      {RP.敘事.map((b, i) => <BeatBlock key={i} beat={b} 圖={RP.圖表} />)}
    </section>
  );
}

