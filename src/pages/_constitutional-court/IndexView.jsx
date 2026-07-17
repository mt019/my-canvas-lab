import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, BookOpen, CalendarClock, ChevronDown, ChevronRight, Download, FileText, Info, Search, Shuffle } from 'lucide-react';
import { A_ORDER, CaseCard, SegControl, Select, TYPO_AXES, citeString, docs, downloadFile, findCases, pickOnThisDay, pickRandomDoc, toBibtex, toCsv, toManifest, typoLabel, typoValues, usePref } from './shared';

// 篩選列滾動自動收合：往下捲藏、往上捲顯示。**只在黏著列真正「卡住」（sticky 貼齊頂端、
// 其原始流內空間已捲離視窗）時才收合**——否則列還在正常流內，用 transform 上移會留下它原本
// 佔的版面高度（＝那塊大空白）。用列前的 0 高 sentinel 判斷是否卡住：sentinel.top ≤ 貼齊
// 偏移即代表列已 pin，此時上移只會露出底下滾動的卡片、不留空白。回傳 [sentinelRef, hidden]。
function useHideOnScrollDown(stickyOffset = 49) {
  const sentinelRef = useRef(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const s = sentinelRef.current;
        const stuck = s ? s.getBoundingClientRect().top <= stickyOffset + 1 : y > 400;
        if (!stuck) setHidden(false);            // 還沒卡住＝仍在正常流，絕不收（避免留白）
        else if (y > last + 4) setHidden(true);  // 卡住後往下捲才收
        else if (y < last - 4) setHidden(false); // 往上捲即還原
        last = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [stickyOffset]);
  return [sentinelRef, hidden];
}
// 機關維度（行憲前後切分）：預設只顯示行憲後（大法官＋憲法法庭），行憲前 6,354 件 opt-in，
// 避免舊號淹沒 874 新號。順序＝解釋權沿革時序。
const 機關_序 = ['大理院', '最高法院', '司法院', '大法官', '憲法法庭'];
const 機關_ERA = { 行憲後: ['大法官', '憲法法庭'], 行憲前: ['大理院', '最高法院', '司法院'] };
function inScope(d, sel) {
  if (sel === '全部') return true;
  if (機關_ERA[sel]) return 機關_ERA[sel].includes(d.機關);
  return d.機關 === sel;
}
// 沿革分頁的機關段可深連到 ?tab=index&機關=大理院，開啟即預篩該機關。
function readInitial機關() {
  if (typeof window === 'undefined') return '行憲後';
  const v = new URLSearchParams(window.location.search).get('機關');
  return v === '全部' || v === '行憲前' || 機關_序.includes(v) ? v : '行憲後';
}

// 排序主鍵：行憲前（有系列）按 系列＋號次 排在前段（號次即時序，統字多無日期，不靠日期）；
// 行憲後按日期排在後段。全部檢視下自然呈行憲前→行憲後的時序。
const SERIES_RANK = { 統字: 0, 解字: 1, 院字: 2, 院解字: 3 };
function sortKey(d) {
  if (d.系列) return `A${SERIES_RANK[d.系列] ?? 9}${String(d.號次 ?? 0).padStart(5, '0')}`;
  return `B${d.日期 ?? ''}`;
}
// 字號寫法說明：搜尋框右側一顆 info 圓圈鈕點開。放進 placeholder 會拉成一長條淺字，做成常駐
// 範例鈕則佔掉搜尋框寬度；收進圓圈鈕裡，不想知道的人看不到它，想知道的人一次看到全部寫法。
// 每列的範例本身可點＝說明與捷徑同一個東西。
// 註：本檔在字型子集的掃描範圍內（scripts/font-chars.mjs），註解裡打 U+24D8 那個圈 i 字元
// 會把它塞進出貨字型，而畫面上用的是 lucide 的 Info 向量圖示、根本不需要那個字。
const 字號寫法 = [
  ['#88', '釋字第88號'],
  ['釋88', '同上，釋字也可以寫出來'],
  ['113-1', '113年憲判字第1號（判決）'],
  ['111憲裁57', '裁定要打明字別'],
  ['院解2876', '行憲前：院解字第2876號'],
  ['統1000', '行憲前：院字・統字・解字同理'],
];
function SyntaxHint({ onPick }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  // 點別處或按 Esc 就收。只在開著時掛監聽。
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <span ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="字號怎麼打"
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className={`flex items-center transition-colors ${open ? 'text-[var(--cc-accent)]' : 'text-[var(--cc-eyebrow)] hover:text-[var(--cc-accent)]'}`}
      >
        <Info size={14} />
      </button>
      {open ? (
        <span className="absolute right-0 top-full z-30 mt-2 block w-max rounded-lg border border-[var(--cc-border)] bg-white p-3 shadow-lg">
          <span className="block text-[12px] font-bold text-[var(--cc-ink-strong)]">字號直接打就跳到那一件</span>
          <span className="mt-2 block">
            {字號寫法.map(([ex, 說明]) => (
              <button
                key={ex}
                type="button"
                onClick={(e) => { e.preventDefault(); onPick(ex); setOpen(false); }}
                className="flex w-full items-baseline gap-2.5 rounded px-1 py-1 text-left hover:bg-[var(--cc-track)]"
              >
                <span className="min-w-[72px] font-mono text-[12px] font-bold text-[var(--cc-accent)]">{ex}</span>
                <span className="text-[11.5px] text-[var(--cc-ink-mid)]">{說明}</span>
              </button>
            ))}
          </span>
          <span className="mt-2 block max-w-[260px] border-t border-[var(--cc-line)] pt-2 text-[11px] leading-relaxed text-[var(--cc-ink-soft)]">
            命中的那件會置頂，且不受上方篩選影響。只打數字（如 88）仍當一般關鍵字搜尋。
          </span>
        </span>
      ) : null}
    </span>
  );
}

const INDEX_PAGE = 40; // 索引初始/重置顯示件數（比舊 30 多，配合下拉自動加載）
export default function IndexView({ initialQ = '', onOpenDoc }) {
  const [機關, set機關] = useState(readInitial機關);
  const [type, setType] = useState('全部');
  const [topic, setTopic] = useState('全部');
  const [subtopic, setSubtopic] = useState('全部');
  const [outcome, setOutcome] = useState('全部');
  const [standard, setStandard] = useState('全部');
  const [decade, setDecade] = useState('全部');
  const [q, setQ] = useState(initialQ);
  // 「在索引中檢視」由 URL ?q= 帶入字號預搜；此頁已掛載時亦同步（初次掛載為 no-op）。
  useEffect(() => { setQ(initialQ); }, [initialQ]);
  const [limit, setLimit] = useState(INDEX_PAGE);
  const [toolbarSentinel, toolbarHidden] = useHideOnScrollDown();
  const loadMoreRef = useRef(null);
  const [sortDir, setSortDir] = useState('desc');
  const [reasoningDefault, setReasoningDefault] = usePref('ccReasoningDefault', false);
  const [pdfMode, setPdfMode] = usePref('pdfMode', 'preview');
  const [typo, setTypo] = useState({});           // 類型學 6 軸篩選：{ 軸id: 代碼 }
  const [showTypo, setShowTypo] = useState(false); // 類型學篩選面板展開

  // 機關維度切分（預設行憲後）；其餘所有面向的件數都以選定機關為母體重算。
  const 機關Counts = useMemo(() => {
    const m = new Map();
    for (const d of docs) m.set(d.機關, (m.get(d.機關) ?? 0) + 1);
    const 行憲後 = 機關_ERA.行憲後.reduce((s, k) => s + (m.get(k) ?? 0), 0);
    const 行憲前 = 機關_ERA.行憲前.reduce((s, k) => s + (m.get(k) ?? 0), 0);
    return { m, 行憲後, 行憲前 };
  }, []);
  const scoped = useMemo(() => docs.filter((d) => inScope(d, 機關)), [機關]);

  // 主題一級選單只列大類＋件數；子主題另開一顆獨立選單，只在選到的大類確實有子主題時才出現
  // （目前只有稅法有子主題，但用「跟選定大類同時出現在同一文件」動態算，未來任何大類展開子主題都自動適用）
  const { typeCounts, topicOptions, subtopicsByTopic } = useMemo(() => {
    const tc = new Map();
    const c = new Map();
    for (const d of scoped) {
      tc.set(d.類型, (tc.get(d.類型) ?? 0) + 1);
      for (const t of d.主題) c.set(t, (c.get(t) ?? 0) + 1);
    }
    const topicOptions = [...c.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => [t, `${t}（${n}）`]);
    const subtopicsByTopic = new Map();
    for (const [t] of c) {
      const sub = new Map();
      for (const d of scoped) {
        if (!d.主題.includes(t)) continue;
        for (const s of d.子主題 ?? []) sub.set(s, (sub.get(s) ?? 0) + 1);
      }
      if (sub.size) subtopicsByTopic.set(t, [...sub.entries()].sort((a, b) => b[1] - a[1]));
    }
    return { typeCounts: tc, topicOptions, subtopicsByTopic };
  }, [scoped]);

  const subtopicOptions = subtopicsByTopic.get(topic);

  const { outcomeCounts, standardCounts } = useMemo(() => {
    const oc = { '違憲（含定期失效）': 0, 合憲: 0, 法令解釋: 0, 補充前解釋: 0, 變更前解釋: 0, '其他/待人工': 0 };
    const sc = new Map();
    for (const d of scoped) {
      const o = d.審查結論?.結論 ?? '未分類';
      if (o.startsWith('違憲')) oc['違憲（含定期失效）'] += 1;
      else if (o === '合憲') oc.合憲 += 1;
      else if (o === '法令解釋') oc.法令解釋 += 1;
      else if (o === '補充前解釋') oc.補充前解釋 += 1;
      else if (o === '變更前解釋') oc.變更前解釋 += 1;
      else oc['其他/待人工'] += 1;
      const s = d.審查基準?.基準;
      if (s) sc.set(s, (sc.get(s) ?? 0) + 1);
    }
    return { outcomeCounts: oc, standardCounts: sc };
  }, [scoped]);

  const decades = useMemo(() => {
    const s = new Set(scoped.map((d) => d.日期?.slice(0, 3)).filter(Boolean));
    return [...s].sort().map((p) => `${p}0`);
  }, [scoped]);

  // 類型學 6 軸各值在目前機關母體中的件數（僅 agent 覆核件）。
  const { typoCounts, typedN } = useMemo(() => {
    const counts = {};
    for (const { id } of TYPO_AXES) counts[id] = new Map();
    let n = 0;
    for (const d of scoped) {
      if (!d.結論類型) continue;
      n += 1;
      for (const { axis, code } of typoValues(d)) counts[axis].set(code, (counts[axis].get(code) ?? 0) + 1);
    }
    return { typoCounts: counts, typedN: n };
  }, [scoped]);
  const activeTypoN = Object.values(typo).filter((v) => v && v !== '全部').length;

  // 字號精準命中（#88／113-1／釋88／院解2876…）。刻意繞過機關與所有篩選：使用者指名一件時，
  // 那件不該因為視圖停在行憲前、或結論篩選卡著就搜不到。命中件在下方置頂，其餘關鍵字結果照舊接在後面
  // ——所以搜「釋字第88號」仍找得到引用它的那些件，精準只是多給一件，不是換掉原本的搜尋。
  const exact = useMemo(() => findCases(q), [q]);
  const exactSet = useMemo(() => new Set(exact.map((d) => d.字號)), [exact]);

  const rest = useMemo(() => {
    const kw = q.trim();
    return scoped.filter((d) => {
      if (exactSet.has(d.字號)) return false; // 已置頂，不重複列

      if (type !== '全部' && d.類型 !== type) return false;
      if (topic !== '全部' && !d.主題.includes(topic)) return false;
      if (subtopic !== '全部' && !d.子主題?.includes(subtopic)) return false;
      if (outcome !== '全部') {
        const c = d.審查結論?.結論 ?? '未分類';
        if (outcome === '違憲（含定期失效）' ? !c.startsWith('違憲') : c !== outcome) return false;
      }
      if (standard !== '全部' && (d.審查基準?.基準 ?? '') !== standard) return false;
      if (decade !== '全部' && d.日期?.slice(0, 3) !== decade.slice(0, 3)) return false;
      for (const { id } of TYPO_AXES) {
        const sel = typo[id];
        if (sel && sel !== '全部' && !typoValues(d).some((v) => v.axis === id && v.code === sel)) return false;
      }
      if (kw && !(d.字號.includes(kw) || d.爭點.includes(kw) || d.主文.includes(kw) || d.系爭法令?.some((x) => x.includes(kw)) || d.原理原則.some((x) => x.includes(kw)))) return false;
      return true;
    });
  }, [scoped, type, topic, subtopic, outcome, standard, decade, q, typo]);

  // 精準命中永遠在最前面，不隨新→舊／舊→新翻動：它是「你指名的那一件」，不是排序結果之一。
  const sorted = useMemo(() => {
    const arr = [...rest];
    arr.sort((a, b) => (sortDir === 'desc' ? sortKey(b).localeCompare(sortKey(a)) : sortKey(a).localeCompare(sortKey(b))));
    return [...exact, ...arr];
  }, [exact, rest, sortDir]);
  // 匯出／件數用的集合＝畫面上實際列出的集合。
  const filtered = sorted;

  const shown = sorted.slice(0, limit);
  // 下拉自動加載（取代「顯示更多」按鈕）：底部 sentinel 進入視窗前 800px 就預取下一批。
  // deps 含 limit——每次加載後重建 observer，若 sentinel 仍在預取區間會再次觸發、連續補到看得完為止；
  // 全部顯示（shown 覆蓋 sorted）時直接不掛 observer，避免無限迴圈。
  useEffect(() => {
    if (shown.length >= sorted.length) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setLimit((l) => Math.min(l + INDEX_PAGE, sorted.length));
    }, { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [limit, sorted.length, shown.length]);
  const stamp = new Date().toISOString().slice(0, 10);
  // 是否只看行憲前：決定隱藏大法官時代才有的篩選（類型/主題/審查基準對統一解釋無意義）。
  const isPre = 機關 === '行憲前' || 機關_ERA.行憲前.includes(機關);
  const seg = 機關 === '行憲後' ? '行憲後' : 機關 === '全部' ? '全部' : '行憲前';

  return (
    <div>
      <div ref={toolbarSentinel} aria-hidden className="h-0" />
      <div className={`sticky top-[49px] z-10 -mx-4 border-b border-[var(--cc-line)] bg-[var(--cc-bg)]/95 px-4 py-3 backdrop-blur transition-transform duration-200 ease-out sm:-mx-6 sm:px-6 ${toolbarHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        {/* 頂部大分段鈕：行憲前後明確切開（預設行憲後）。行憲前另給機關子篩選。 */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <SegControl
            value={seg}
            onChange={(v) => { set機關(v); setType('全部'); setTopic('全部'); setSubtopic('全部'); setOutcome('全部'); setStandard('全部'); setDecade('全部'); setTypo({}); setLimit(INDEX_PAGE); }}
            options={[
              ['行憲後', '行憲後　釋字・憲判', 機關Counts.行憲後],
              ['行憲前', '行憲前　統一解釋', 機關Counts.行憲前],
              ['全部', '全部', docs.length],
            ]}
          />
          {seg === '行憲前' ? (
            <Select label="機關" value={機關 === '行憲前' ? '行憲前' : 機關} onChange={(v) => { set機關(v); setLimit(INDEX_PAGE); }} options={[['行憲前', `全部機關（${機關Counts.行憲前}）`], ...機關_ERA.行憲前.map((k) => [k, `${k}（${機關Counts.m.get(k) ?? 0}）`])]} />
          ) : null}
          {seg === '行憲前' ? (
            <span className="text-[12px] text-[var(--cc-ink-soft)]">大理院／最高法院／司法院的統一解釋，非大法官憲法解釋；主題與審查基準為大法官時代機標，此處不適用。</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <label className="relative flex w-full items-center gap-2 rounded-md border border-[var(--cc-border)] bg-white px-2.5 py-1.5">
            <Search size={13} className="shrink-0 text-[var(--cc-eyebrow)]" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(INDEX_PAGE); }}
              placeholder="搜尋爭點、主文、系爭法令、原理原則"
              className="w-full bg-transparent text-[13px] text-[var(--cc-ink-strong)] placeholder-[var(--cc-placeholder)] focus:outline-none"
            />
            <SyntaxHint onPick={(ex) => { setQ(ex); setLimit(INDEX_PAGE); }} />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!isPre ? (
            <Select label="類型" value={type} onChange={(v) => { setType(v); setLimit(INDEX_PAGE); }} options={[['全部', '全部'], ['解釋', `解釋（${typeCounts.get('解釋') ?? 0}）`], ['判決', `憲法法庭判決（${typeCounts.get('判決') ?? 0}）`], ['實體裁定', `實體裁定（${typeCounts.get('實體裁定') ?? 0}）`]]} />
          ) : null}
          {!isPre ? (
            <Select label="主題" value={topic} onChange={(v) => { setTopic(v); setSubtopic('全部'); setLimit(INDEX_PAGE); }} options={[['全部', '全部'], ...topicOptions]} />
          ) : null}
          {subtopicOptions && !isPre ? (
            <Select label="細分" value={subtopic} onChange={(v) => { setSubtopic(v); setLimit(INDEX_PAGE); }} options={[['全部', '全部'], ...subtopicOptions.map(([s, n]) => [s, `${s}（${n}）`])]} />
          ) : null}
          <Select label="結論" value={outcome} onChange={(v) => { setOutcome(v); setLimit(INDEX_PAGE); }} options={[['全部', '全部'], ['違憲（含定期失效）', `違憲（含定期失效）（${outcomeCounts['違憲（含定期失效）']}）`], ['合憲', `合憲（${outcomeCounts.合憲}）`], ['法令解釋', `法令解釋（${outcomeCounts.法令解釋}）`], ['補充前解釋', `補充前解釋（${outcomeCounts.補充前解釋}）`], ['變更前解釋', `變更前解釋（${outcomeCounts.變更前解釋}）`], ['其他/待人工', `待人工判讀（${outcomeCounts['其他/待人工']}）`]]} />
          {!isPre ? (
            <Select label="審查基準" value={standard} onChange={(v) => { setStandard(v); setLimit(INDEX_PAGE); }} options={[['全部', '全部'], ['嚴格', `嚴格（${standardCounts.get('嚴格') ?? 0}）`], ['中度', `中度（${standardCounts.get('中度') ?? 0}）`], ['寬鬆', `寬鬆（${standardCounts.get('寬鬆') ?? 0}）`], ['多重（待人工）', `多重（待人工）（${standardCounts.get('多重（待人工）') ?? 0}）`], ['未明示', `未明示（${standardCounts.get('未明示') ?? 0}）`]]} />
          ) : null}
          <Select label="年代" value={decade} onChange={(v) => { setDecade(v); setLimit(INDEX_PAGE); }} options={[['全部', '全部'], ...decades.map((d) => [d, `${d} 年代`])]} />
        </div>
        {!isPre ? (
          <div className="mt-2">
            <button
              onClick={() => setShowTypo((s) => !s)}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"
            >
              {showTypo ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              審查結論類型學（6 軸細分）
              <span className="font-normal text-[var(--cc-ink-soft)]">
                已類型化 {typedN} 件{activeTypoN ? `・篩選中 ${activeTypoN} 軸` : ''}
              </span>
            </button>
            {showTypo ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {TYPO_AXES.map(({ id, name }) => {
                    const entries = [...typoCounts[id].entries()].sort(
                      (a, b) => (A_ORDER.indexOf(a[0]) - A_ORDER.indexOf(b[0])) || a[0].localeCompare(b[0]),
                    );
                    return (
                      <Select
                        key={id}
                        label={`${id}·${name}`}
                        value={typo[id] ?? '全部'}
                        onChange={(v) => { setTypo((t) => ({ ...t, [id]: v })); setLimit(INDEX_PAGE); }}
                        options={[['全部', '全部'], ...entries.map(([c, n]) => [c, `${typoLabel(c)}（${n}）`])]}
                      />
                    );
                  })}
                  {activeTypoN ? (
                    <button onClick={() => { setTypo({}); setLimit(INDEX_PAGE); }} className="text-[12px] font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">清除類型篩選</button>
                  ) : null}
                </div>
                <p className="mt-1.5 max-w-3xl text-[11.5px] leading-relaxed text-[var(--cc-ink-soft)]">
                  6 軸類型學目前僅涵蓋粗軸判不出的「待人工」殘餘 {typedN} 件（均逐件雙盲覆核）；已由粗軸分好的合憲／違憲等件尚未套細軸，故選任一軸值時只會列出已類型化件。軸別：A 處分模式・B 違憲處分技術・C 標的類型・D 對前解釋關係・E 救濟與後續・F 解釋權能。
                </p>
              </>
            ) : null}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
          <span className="font-bold text-[var(--cc-ink-strong)]">符合 {filtered.length} 件</span>
          {exact.length ? (
            <span className="text-[var(--cc-ink-soft)]" title="字號精準命中，已置頂；為了指名即找得到，這幾件不受機關與其他篩選影響">
              字號命中 <strong className="text-[var(--cc-ink-strong)]">{exact.map((d) => d.字號).join('、')}</strong>
            </span>
          ) : null}
          <button
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"
          >
            <ArrowUpDown size={11} />{sortDir === 'desc' ? '新→舊' : '舊→新'}
          </button>
          <button
            onClick={() => setReasoningDefault((v) => !v)}
            className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"
            title="切換行憲後案件卡片是否預設展開理由書（僅影響之後新出現的卡片）"
          >
            <BookOpen size={11} />理由書預設{reasoningDefault ? '展開' : '收合'}
          </button>
          <button
            onClick={() => setPdfMode((m) => (m === 'preview' ? 'download' : 'preview'))}
            className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"
            title="官方 PDF 點擊行為：預覽＝新分頁同源代理內嵌開啟；下載＝直接連官方（強制下載）"
          >
            <FileText size={11} />官方 PDF：{pdfMode === 'preview' ? '新分頁預覽' : '直接下載'}
          </button>
          <span className="text-[var(--cc-eyebrow)]">匯出目前篩選集：</span>
          <button onClick={() => downloadFile(toCsv(filtered), `憲法案件_${stamp}.csv`, 'text/csv')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />CSV</button>
          <button onClick={() => downloadFile(JSON.stringify(filtered, null, 1), `憲法案件_${stamp}.json`, 'application/json')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />JSON</button>
          <button onClick={() => downloadFile(toBibtex(filtered), `憲法案件_${stamp}.bib`, 'text/plain')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />BibTeX</button>
          <button onClick={() => downloadFile(filtered.map(citeString).join('\n'), `引註清單_${stamp}.txt`, 'text/plain')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />引註清單</button>
          <button onClick={() => downloadFile(toManifest(filtered), `下載清單_${stamp}.json`, 'application/json')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]"><Download size={11} />批次下載清單</button>
          <span className="ml-auto inline-flex items-center gap-3">
            <button onClick={() => onOpenDoc(pickRandomDoc())} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Shuffle size={11} />隨機一則</button>
            <button onClick={() => onOpenDoc(pickOnThisDay())} title="與今天同日期的解釋／判決" aria-label="與今天同日期的解釋／判決" className="inline-flex items-center text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><CalendarClock size={13} /></button>
          </span>
        </div>
      </div>

      {shown.map((d) => (
        <CaseCard key={d.字號} d={d} q={q} reasoningDefault={reasoningDefault} pdfMode={pdfMode} />
      ))}
      {/* 下拉自動加載：sentinel 進視窗前就補下一批，無需手動點。 */}
      {sorted.length > limit ? (
        <div ref={loadMoreRef} className="py-6 text-center text-[12px] text-[var(--cc-ink-soft)]">
          載入更多…（尚有 {sorted.length - limit} 件）
        </div>
      ) : sorted.length ? (
        <p className="py-6 text-center text-[12px] text-[var(--cc-ink-soft)]">已顯示全部 {sorted.length} 件</p>
      ) : null}
    </div>
  );
}

