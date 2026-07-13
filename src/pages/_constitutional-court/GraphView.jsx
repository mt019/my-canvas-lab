import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import data from '../../data/constitutionalCourt.json';
import { Badge, CaseRef, PRES_COLOR, Select, docs, inkToFill, justices, pdfHref, usePref } from './shared';

// ── 意見書圖譜：分期共同具名矩陣 ───────────────────────────────────────────
// 全部現算自 docs[].意見書，對缺漏免疫（意見書資料仍在增補）。色彩全走 token：量值以
// color-mix 在校準過的 --tone-*-bg（近白淡底）↔ --tone-*-tx（墨色）之間插值，不寫死任何 hex；
// 量值靠色深、身分/狀態靠形狀與細框（見 docs/DESIGN.md 色彩哲學 2026-07-08 裁定）。
const GRAPH_ERAS = [
  { key: 'xianfa', label: '2022– 憲法法庭', short: '憲法法庭', test: (y) => y >= 2022, lo: 2022, hi: 9999 },
  { key: 'late', label: '2015–2021 釋字晚期', short: '釋字晚期', test: (y) => y >= 2015 && y < 2022, lo: 2015, hi: 2021 },
  { key: 'reform', label: '2003–2014 改制後', short: '改制後', test: (y) => y >= 2003 && y < 2015, lo: 2003, hi: 2014 },
  { key: 'early', label: '2003 前 釋字早中', short: '早中期', test: (y) => y < 2003, lo: 0, hi: 2002 },
];
// 分期上色用：把「跨期再任」的大法官依當期任期段回其當期提名總統（許宗力扁 2003–2011／英 2016–2024 是主案例，
// 通則亦適用翁岳生、城仲模等再任者）。用 justices.json 的 各段提名總統＋任期段（段序對齊）判斷段落與各期重疊。
function presInEra(j, lo, hi) {
  const segs = j.任期 ?? [], multi = j.各段提名總統;
  if (Array.isArray(multi) && segs.length === multi.length) {
    for (let i = 0; i < segs.length; i++) {
      const s = Number(String(segs[i].起).slice(0, 4)) || 0;
      const e = segs[i].訖 ? (Number(String(segs[i].訖).slice(0, 4)) || 9999) : 9999;
      if (s <= hi && e >= lo) return multi[i];
    }
  }
  return j.提名總統 ?? null;
}
const GRAPH_MODES = [
  ['合計', '合計共同具名'],
  ['協同', '協同聯盟'],
  ['不同', '不同聯盟'],
  ['有向', '主筆→加入（有向）'],
];
// 四模式各給一個清楚可辨的校準色調（tokens.css Layer 0），並對齊 Badge 語意：
// 合計＝slate 中性、協同＝blue、不同＝red（與 Badge 同）、有向＝teal（與前三者拉開色相）。
const MODE_TONE = { 合計: 'slate', 協同: 'blue', 不同: 'red', 有向: 'teal' };
const SEP = ' ';
const pairKey = (a, b) => (a < b ? `${a}${SEP}${b}` : `${b}${SEP}${a}`);

// 量值→填色：同色相 --tone-*-bg ↔ -tx 之間 color-mix，全 token、零硬寫色；v=0 用中性極淡底。
const rampFill = (v, max, tone) =>
  v > 0 && max > 0
    ? `color-mix(in oklab, var(--tone-${tone}-tx) ${Math.round(Math.sqrt(v / max) * 100)}%, var(--tone-${tone}-bg))`
    : 'var(--cc-heat-zero)';

// spectral seriation：以扣掉常數分量的 power iteration 逼近 Fiedler 向量，讓高權重對相鄰、聯盟沿對角線成塊。
function seriateOrder(n, weight) {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (n < 3) return idx;
  const w = idx.map((i) => idx.map((j) => (i === j ? 0 : weight(i, j))));
  const deg = w.map((row) => row.reduce((a, b) => a + b, 0));
  const maxDeg = Math.max(1, ...deg);
  const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
  const unit = (x) => { const m = Math.sqrt(x.reduce((a, b) => a + b * b, 0)) || 1; return x.map((e) => e / m); };
  let v = idx.map((i) => { const s = Math.sin((i + 1) * 12.9898) * 43758.5453; return s - Math.floor(s); });
  v = unit(v.map((x) => x - mean(v)));
  for (let it = 0; it < 120; it++) {
    const nv = idx.map((i) => {
      let s = (maxDeg - deg[i]) * v[i];            // B = maxDeg·I − Laplacian
      for (let j = 0; j < n; j++) if (j !== i) s += w[i][j] * v[j];
      return s;
    });
    v = unit(nv.map((x) => x - mean(nv)));         // 扣掉常數分量 → 收斂到第二特徵向量
  }
  return idx.sort((a, b) => v[a] - v[b]);
}

// 右欄：預設 top 組合排行
function TopPairs({ list, mode, onPick }) {
  const label = mode === '有向' ? '最多加入的組合（加入者→提出者）' : `最常一起${mode === '合計' ? '共同具名' : mode}的組合`;
  const max = list[0]?.v ?? 1;
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">{label}</h3>
      <div className="mt-2 divide-y divide-[var(--cc-line)]">
        {list.map((e) => (
          <button key={`${e.a}-${e.b}`} onClick={() => onPick(e.a, e.b)}
            className="grid w-full grid-cols-[1fr_44px_84px] items-center gap-2 py-1.5 text-left text-[13px] hover:bg-[var(--cc-hover-bg)]">
            <span className="font-bold text-[var(--cc-ink-strong)]">{mode === '有向' ? `${e.b}→${e.a}` : `${e.a}・${e.b}`}</span>
            <span className="font-bold text-[var(--cc-accent)]">{e.v} 次</span>
            <span className="block h-1.5 rounded-full bg-[var(--cc-track)]">
              <span className="block h-1.5 rounded-full" style={{ width: `${(e.v / max) * 100}%`, background: 'var(--cc-highlight)' }} />
            </span>
          </button>
        ))}
        {!list.length ? <p className="py-2 text-[13px] text-[var(--cc-ink-soft)]">本期無資料。</p> : null}
      </div>
    </div>
  );
}

// 右欄：選定大法官 → 夥伴協同/不同雙色拆分
function NameDetail({ name, partners, onName }) {
  const max = Math.max(1, ...partners.map((p) => p.合計));
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">{name}　本期共同具名對象</h3>
      <div className="mt-2 divide-y divide-[var(--cc-line)]">
        {partners.map((p) => (
          <button key={p.對象} onClick={() => onName(p.對象)}
            className="grid w-full grid-cols-[68px_1fr] items-center gap-2 py-1.5 text-left text-[13px] hover:bg-[var(--cc-hover-bg)]">
            <span className="font-bold text-[var(--cc-accent)]">{p.對象}</span>
            <span className="flex items-center gap-2">
              <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-[var(--cc-track)]">
                <span className="h-2" style={{ width: `${(p.協同 / max) * 100}%`, background: 'var(--tone-blue-tx)' }} />
                <span className="h-2" style={{ width: `${(p.不同 / max) * 100}%`, background: 'var(--tone-red-tx)' }} />
              </span>
              <span className="shrink-0 text-[11.5px] text-[var(--cc-ink-soft)]">協{p.協同}・不{p.不同}</span>
            </span>
          </button>
        ))}
        {!partners.length ? <p className="py-2 text-[13px] text-[var(--cc-ink-soft)]">本期無共同具名。</p> : null}
      </div>
    </div>
  );
}

// 右欄：點格子 → 該對實際共同署名的意見書（含類型 Badge 與 PDF）
function PairDetail({ pair, list, onClose }) {
  const [pdfMode] = usePref('pdfMode', 'preview'); // 與案件/大法官頁共用同一 localStorage 偏好
  const toneOf = (t) => (t.includes('不同') ? 'red' : t.includes('協同') ? 'blue' : 'slate');
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">{pair.a}・{pair.b}　共同署名 {list.length} 份</h3>
        <button onClick={onClose} className="shrink-0 text-[12px] font-bold text-[var(--cc-accent)] hover:underline">清除</button>
      </div>
      <div className="mt-2 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
        {list.map((d, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-[13px]">
            <CaseRef 字號={d.字號} className="font-bold text-[var(--cc-ink-strong)]" />
            <Badge tone={toneOf(d.類型 ?? '')}>{(d.類型 ?? '意見書').replace('意見書', '') || '意見書'}</Badge>
            {d.下載網址 ? (
              <a href={pdfHref(d.下載網址, pdfMode)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]">PDF <ExternalLink size={11} /></a>
            ) : <span className="text-[11.5px] text-[var(--cc-figure-note)]">（內嵌官方頁）</span>}
          </div>
        ))}
        {!list.length ? <p className="py-2 text-[13px] text-[var(--cc-ink-soft)]">無可列意見書。</p> : null}
      </div>
    </div>
  );
}

// 可重現的偽亂數（置換檢定用）：同一資料每次載入 p 值穩定，資料變則跟著變。
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export default function GraphView() {
  const [eraKey, setEraKey] = useState(GRAPH_ERAS[0].key);
  const [mode, setMode] = useState('合計');
  const [minEdge, setMinEdge] = useState(2);
  const [selName, setSelName] = useState(null);
  const [selPair, setSelPair] = useState(null);
  const [hover, setHover] = useState(null);
  const [colorByPres, setColorByPres] = useState(false); // 預設關：姓名走中性墨，畫面不花

  // 分期上色的提名總統：依當期任期段回各期提名總統（再任者如許宗力，扁期→陳水扁、英期→蔡英文）。
  const presByName = useMemo(() => {
    const era = GRAPH_ERAS.find((e) => e.key === eraKey) ?? GRAPH_ERAS[0];
    return new Map(justices.map((j) => [j.姓名, presInEra(j, era.lo, era.hi)]));
  }, [eraKey]);

  // 每段現算：pairStats / directed / byPair / degree（缺欄跳過不 throw）
  const eraData = useMemo(() => {
    // pairs/directed/deg 優先讀資料層預算好的 data.共同具名圖譜（單一事實來源，build-justices.mjs 產出）；
    // 缺時（資料層尚未重跑）退回就地現算，圖不斷線。byPair（點格子下探的意見書清單）不在資料層，永遠現算自 docs。
    const graphByKey = new Map((data.共同具名圖譜?.分期 ?? []).map((e) => [e.key, e]));
    const out = {};
    for (const era of GRAPH_ERAS) {
      const pairs = new Map();     // pairKey → {協同,不同,合計}
      const directed = new Map();  // `${提出者}${SEP}${加入者}` → n
      const byPair = new Map();    // pairKey → [{字號,類型,下載網址,日期}]
      const deg = new Map();       // 姓名 → 合計 degree
      for (const d of docs) {
        const y = d.日期 ? Number(String(d.日期).slice(0, 4)) : null;
        if (!y || !era.test(y)) continue;
        for (const op of d.意見書 ?? []) {
          const proposers = op.提出 ?? [];
          const joiners = op.加入 ?? [];
          const signers = [...new Set([...proposers, ...joiners])];
          const t = op.類型 ?? '';
          const isD = t.includes('不同');
          const isC = t.includes('協同');
          for (let i = 0; i < signers.length; i++) for (let j = i + 1; j < signers.length; j++) {
            const k = pairKey(signers[i], signers[j]);
            const o = pairs.get(k) ?? { 協同: 0, 不同: 0, 合計: 0 };
            o.合計 += 1; if (isD) o.不同 += 1; if (isC) o.協同 += 1;
            pairs.set(k, o);
            const arr = byPair.get(k) ?? [];
            arr.push({ 字號: d.字號, 類型: t, 下載網址: op.下載網址 ?? null, 日期: d.日期 ?? null });
            byPair.set(k, arr);
            deg.set(signers[i], (deg.get(signers[i]) ?? 0) + 1);
            deg.set(signers[j], (deg.get(signers[j]) ?? 0) + 1);
          }
          for (const p of proposers) for (const jn of joiners) {
            if (p === jn) continue;
            const dk = `${p}${SEP}${jn}`;
            directed.set(dk, (directed.get(dk) ?? 0) + 1);
          }
        }
      }
      const g = graphByKey.get(era.key);
      if (g) { // 資料層優先：以預算好的計數覆蓋 pairs/directed/deg，byPair 仍用 docs 下探
        const gp = new Map(), gd = new Map(), gdeg = new Map();
        for (const p of g.共同具名 ?? []) {
          gp.set(pairKey(p.甲, p.乙), { 協同: p.協同 ?? 0, 不同: p.不同 ?? 0, 合計: p.合計 ?? 0 });
          gdeg.set(p.甲, (gdeg.get(p.甲) ?? 0) + (p.合計 ?? 0));
          gdeg.set(p.乙, (gdeg.get(p.乙) ?? 0) + (p.合計 ?? 0));
        }
        for (const dd of g.主筆加入 ?? []) gd.set(`${dd.提出}${SEP}${dd.加入}`, dd.次數 ?? 0);
        out[era.key] = { pairs: gp, directed: gd, byPair, deg: gdeg };
      } else {
        out[era.key] = { pairs, directed, byPair, deg };
      }
    }
    return out;
  }, []);

  const ed = eraData[eraKey] ?? { pairs: new Map(), directed: new Map(), byPair: new Map(), deg: new Map() };

  const density = useMemo(() => {
    const m = {};
    for (const era of GRAPH_ERAS) {
      let s = 0;
      for (const o of eraData[era.key]?.pairs.values() ?? []) s += o.合計;
      m[era.key] = s;
    }
    return m;
  }, [eraData]);
  const maxDensity = Math.max(1, ...Object.values(density));

  // 門檻＝只留「至少有一條共同具名 ≥ minEdge 次的關係」的大法官（對強聯盟設門檻，
  // 而非個人總量——後者在密集屆別幾乎人人破 3、按了沒差）。seriation 用合計權重、跨模式穩定。
  const members = useMemo(() => {
    const maxTie = new Map();
    for (const [k, o] of ed.pairs) {
      const [a, b] = k.split(SEP);
      const h = o.合計 ?? 0;
      if (h > (maxTie.get(a) ?? 0)) maxTie.set(a, h);
      if (h > (maxTie.get(b) ?? 0)) maxTie.set(b, h);
    }
    const names = [...maxTie.entries()].filter(([, v]) => v >= minEdge).map(([nm]) => nm);
    const wOf = (i, j) => ed.pairs.get(pairKey(names[i], names[j]))?.合計 ?? 0;
    return seriateOrder(names.length, wOf).map((i) => names[i]);
  }, [ed, minEdge]);

  const cellVal = (a, b) => (mode === '有向'
    ? ed.directed.get(`${a}${SEP}${b}`) ?? 0
    : ed.pairs.get(pairKey(a, b))?.[mode] ?? 0);

  const maxVal = useMemo(() => {
    let mx = 0;
    for (let i = 0; i < members.length; i++) for (let j = 0; j < members.length; j++) {
      if (mode !== '有向' && i === j) continue;
      mx = Math.max(mx, cellVal(members[i], members[j]));
    }
    return mx;
  }, [members, mode, ed]);

  const namePartners = useMemo(() => {
    if (!selName) return [];
    const res = [];
    for (const [k, o] of ed.pairs) {
      const [x, z] = k.split(SEP);
      if (x === selName || z === selName) res.push({ 對象: x === selName ? z : x, ...o });
    }
    const sk = mode === '有向' ? '合計' : mode;
    return res.sort((a, b) => b[sk] - a[sk]);
  }, [ed, selName, mode]);

  const topPairs = useMemo(() => {
    if (mode === '有向') {
      return [...ed.directed.entries()].map(([k, v]) => { const [a, b] = k.split(SEP); return { a, b, v }; })
        .sort((x, y) => y.v - x.v).slice(0, 12);
    }
    return [...ed.pairs.entries()].map(([k, o]) => { const [a, b] = k.split(SEP); return { a, b, v: o[mode] }; })
      .filter((x) => x.v > 0).sort((x, y) => y.v - x.v).slice(0, 12);
  }, [ed, mode]);

  const pairDocs = selPair ? (ed.byPair.get(pairKey(selPair.a, selPair.b)) ?? []) : [];
  const presLegend = useMemo(() => {
    const seen = new Set(members.map((nm) => presByName.get(nm)).filter(Boolean));
    return Object.keys(PRES_COLOR).filter((p) => seen.has(p));
  }, [members, presByName]);

  const tone = MODE_TONE[mode];
  const modeLabel = GRAPH_MODES.find((m) => m[0] === mode)?.[1] ?? mode;
  const eraLabel = GRAPH_ERAS.find((e) => e.key === eraKey)?.label ?? '';
  const presInk = (name) => (colorByPres ? (PRES_COLOR[presByName.get(name)] ?? 'var(--cc-ink-mid)') : 'var(--cc-ink-strong)');

  const n = members.length;
  const CW = Math.max(10, Math.min(20, Math.floor(560 / Math.max(n, 1))));
  const LABEL_W = 68;
  const TOP = 72;
  const nameFont = Math.max(9, Math.min(11, CW - 2));

  const hoverText = (() => {
    if (!hover || !members[hover.r] || !members[hover.c]) return '';
    const a = members[hover.r], b = members[hover.c];
    if (mode === '有向') return `${b} 加入 ${a} 主筆意見書 ${ed.directed.get(`${a}${SEP}${b}`) ?? 0} 次`;
    const o = ed.pairs.get(pairKey(a, b)) ?? { 協同: 0, 不同: 0, 合計: 0 };
    return `${a} × ${b} — 協同 ${o.協同}・不同 ${o.不同}・合計 ${o.合計}`;
  })();

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">共同具名矩陣</p>
      <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">誰和誰一起署名意見書（分期・資料驅動分群・{modeLabel}）</h2>
      <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        共同具名只在同時在任時才可能，故按制度斷點分四期各一張矩陣。行列順序由共同具名關係自動分群，聯盟沿對角線成塊。切換「關係」可分看協同聯盟、不同聯盟，或「主筆→加入」的有向影響；點格子看該對實際共同署名的意見書。勾「依提名總統上色」才會為姓名套色（用來檢驗聯盟是否吻合任命世代），預設關閉以免畫面過花。
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Select label="時期" value={eraKey} onChange={setEraKey} options={GRAPH_ERAS.map((e) => [e.key, e.label])} />
        <Select label="關係" value={mode} onChange={setMode} options={GRAPH_MODES} />
        <Select label="門檻" value={String(minEdge)} onChange={(v) => setMinEdge(Number(v))} options={[['1', '≥1 次'], ['2', '≥2 次'], ['3', '≥3 次']]} />
        <label className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--cc-ink-soft)]">
          <input type="checkbox" checked={colorByPres} onChange={(e) => setColorByPres(e.target.checked)} />
          依提名總統為姓名上色
        </label>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--cc-ink-soft)]">
        {GRAPH_ERAS.map((e) => (
          <button key={e.key} onClick={() => setEraKey(e.key)}
            className={`inline-flex items-center gap-1.5 ${e.key === eraKey ? 'font-bold text-[var(--cc-accent)]' : 'hover:text-[var(--cc-accent)]'}`}>
            {e.short}
            <span className="block h-1.5 w-12 rounded-full bg-[var(--cc-track)]">
              <span className="block h-1.5 rounded-full" style={{ width: `${(density[e.key] / maxDensity) * 100}%`, background: 'var(--tone-rose-tx)' }} />
            </span>
            <span className="text-[var(--cc-figure-note)]">{density[e.key]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,600px)_1fr]">
        <div className="relative overflow-x-auto pb-2">
          {n < 2 ? (
            <p className="py-8 text-[13px] text-[var(--cc-ink-soft)]">本期尚無足量具名意見書（門檻 ≥{minEdge} 次）。可調低門檻或切換時期。</p>
          ) : (
            <svg width={LABEL_W + n * CW + 8} height={TOP + n * CW + 8} role="img" aria-label={`${eraLabel} 大法官共同具名矩陣`}>
              {members.map((name, r) => {
                const active = selName === name;
                return (
                  <text key={`r${name}`} x={LABEL_W - 6} y={TOP + r * CW + CW / 2 + 3} textAnchor="end"
                    fontSize={nameFont} fontWeight={active ? 700 : 500}
                    style={{ fill: presInk(name), cursor: 'pointer' }}
                    onClick={() => { setSelName(active ? null : name); setSelPair(null); }}>{name}</text>
                );
              })}
              {members.map((name, c) => {
                const active = selName === name;
                const x = LABEL_W + c * CW + CW / 2;
                return (
                  <text key={`c${name}`} x={x} y={TOP - 6} textAnchor="start"
                    transform={`rotate(-90 ${x} ${TOP - 6})`}
                    fontSize={nameFont} fontWeight={active ? 700 : 500}
                    style={{ fill: presInk(name), cursor: 'pointer' }}
                    onClick={() => { setSelName(active ? null : name); setSelPair(null); }}>{name}</text>
                );
              })}
              {members.map((rowName, r) => members.map((colName, c) => {
                if (mode !== '有向' && r === c) {
                  return <rect key={`${r}-${c}`} x={LABEL_W + c * CW} y={TOP + r * CW} width={CW - 1.6} height={CW - 1.6} rx={2} fill="var(--cc-track)" opacity={0.55} />;
                }
                // 門檻：共同具名不足 minEdge 次的關係留白（跨模式一致地吃「合計」，切模式不會忽有忽無）
                const heji = ed.pairs.get(pairKey(rowName, colName))?.合計 ?? 0;
                if (heji < minEdge) {
                  return <rect key={`${r}-${c}`} x={LABEL_W + c * CW} y={TOP + r * CW} width={CW - 1.6} height={CW - 1.6} rx={2} fill="var(--cc-heat-zero)" />;
                }
                const v = cellVal(rowName, colName);
                const inRowCol = selName && (selName === rowName || selName === colName);
                const isHover = hover && hover.r === r && hover.c === c;
                const isSelPair = selPair && ((selPair.a === rowName && selPair.b === colName) || (selPair.a === colName && selPair.b === rowName));
                return (
                  <rect key={`${r}-${c}`}
                    x={LABEL_W + c * CW} y={TOP + r * CW}
                    width={CW - 1.6} height={CW - 1.6} rx={2}
                    style={{ fill: rampFill(v, maxVal, tone), cursor: v ? 'pointer' : 'default' }}
                    stroke={isSelPair || isHover ? 'var(--cc-highlight)' : 'none'} strokeWidth={1.4}
                    opacity={selName && !inRowCol ? 0.3 : 1}
                    onMouseEnter={() => setHover({ r, c })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => v && setSelPair({ a: rowName, b: colName })}
                  />
                );
              }))}
            </svg>
          )}
          {hoverText ? (
            <div className="pointer-events-none absolute left-2 top-0 z-10 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">{hoverText}</div>
          ) : null}
        </div>

        <div>
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[11.5px] text-[var(--cc-ink-soft)]">
              少
              {[0.1, 0.3, 0.55, 0.8, 1].map((f) => (
                <span key={f} className="inline-block h-3 w-3 rounded-[2px]" style={{ background: rampFill(f * (maxVal || 1), maxVal || 1, tone) }} />
              ))}
              多{maxVal ? `（單格最高 ${maxVal}）` : ''}
            </div>
            {colorByPres && presLegend.length ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-[var(--cc-ink-soft)]">
                {presLegend.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: inkToFill(PRES_COLOR[p]), borderColor: PRES_COLOR[p] }} />{p}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {selPair ? (
            <PairDetail pair={selPair} list={pairDocs} onClose={() => setSelPair(null)} />
          ) : selName ? (
            <NameDetail name={selName} partners={namePartners} onName={(nm) => { setSelName(nm); setSelPair(null); }} />
          ) : (
            <TopPairs list={topPairs} mode={mode} onPick={(a, b) => setSelPair({ a, b })} />
          )}
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-[11.5px] leading-relaxed text-[var(--cc-figure-note)]">
        資料註：合計每份意見書計一次共同具名；「部分協同部分不同」等混合類型同時計入協同與不同，故各對「協同＋不同」可能大於合計。「主筆→加入」為有向：列＝提出者、欄＝加入者，格值＝該加入者加入該提出者意見書的次數，矩陣不對稱即資訊本身。早期釋字意見書多整卷收於抄本、作者未逐一標，故早中期為下限。意見書資料仍在增補。
      </p>
    </section>
  );
}
