import { useMemo, useState } from 'react';
import { ERA_TONE, citeEdges, docs } from './shared';
import TopicHeatmaps from './TopicHeatmaps';

// 合併案件時間軸的四條「解釋機制」色帶（沿革同色，時間上前後相接、幾乎不重疊）：
// 最高法院解字→司法院院字/院解字（統一解釋）→大法官釋字→憲法法庭憲判/裁定。大理院統字無日期，不入此軸。
const BANDS = [
  { key: '最高法院解字', tone: ERA_TONE.最高法院, label: '最高法院　解字' },
  { key: '司法院統一解釋', tone: ERA_TONE.司法院, label: '司法院　院字・院解字' },
  { key: '大法官釋字', tone: ERA_TONE.釋字, label: '大法官　釋字' },
  { key: '憲法法庭', tone: ERA_TONE.憲判, label: '憲法法庭　判決・裁定' },
];
const BAND_TONE = Object.fromEntries(BANDS.map((b) => [b.key, b.tone]));
const bandOf = (d) => {
  if (d.系列 === '統字') return null; // 大理院，無作成日期
  if (d.系列 === '解字') return '最高法院解字';
  if (d.系列 === '院字' || d.系列 === '院解字') return '司法院統一解釋';
  if (!d.系列) return d.類型 === '解釋' ? '大法官釋字' : '憲法法庭';
  return null;
};
// 為什麼被高頻引用：只收錄有把握、教科書等級公認的論述定位，逐筆上網對照官方解釋與
// 學說整理查證（2026-07-07）。已覆蓋前端顯示的前 15 名（cited.slice(0,15)）；名次更深者
// 暫缺不猜。補述沿革見 HANDOFF.md「被引用最多的解釋」條目。
const WHY_CITED = {
  釋字第443號: '確立「層級化法律保留」：依限制人民權利之密度區分憲法保留、絕對法律保留、相對法律保留與非法律保留事項，此後歷來解釋大量援引其保留密度分類。',
  釋字第371號: '確立法官聲請釋憲（具體規範審查）制度：各級法院法官於審理案件時，對應適用之法律合理確信有牴觸憲法之疑義者，得裁定停止訴訟聲請解釋，是最常被聲請案援引的程序性先例。',
  釋字第682號: '國家考試及格標準（單科零分、專業科目平均、特定科目最低分數不予及格）的合憲性指標案：應考試權具程序性基本權性質，考試方法與及格標準涉考選專業判斷，對其判斷餘地採低密度審查，並要求分類標準與考試目的具合理關聯以符平等原則。',
  釋字第572號: '補充釋字第371號，界定法官聲請釋憲的「先決問題」（系爭法律違憲須顯然影響原因案件裁判結果）與「客觀上形成確信違憲之具體理由」之意涵，與釋字第371、590號同為具體規範審查程序的常引先例。',
  釋字第185號: '確立司法院解釋有拘束全國各機關及人民之效力、違背解釋之判例當然失其效力，並確立受不利確定終局裁判者得據解釋聲請再審或非常上訴。是解釋效力與釋憲救濟途徑的根本先例。',
  釋字第400號: '揭示財產權保障旨在確保個人對財產「存續狀態」的自由使用收益處分，並確立既成道路成立公用地役關係屬特別犧牲、國家應予徵收補償。其財產權定義與特別犧牲補償法理為後案反覆援引。',
  釋字第590號: '補充釋字第371號，界定「法官於審理案件時」與「裁定停止訴訟程序」兼及民事、刑事、行政訴訟與非訟事件，與釋字第371、572號共構法官聲請釋憲的程序框架。',
  釋字第432號: '確立法律明確性原則的審查公式：構成要件雖用不確定概念或概括條款，仍須使受規範者可理解、可預見並得由司法審查確認，方為合憲。是明確性原則的奠基解釋，後為釋字第521、594號等沿用。',
  釋字第585號: '確立立法院本於憲法職權享有輔助性的調查權（含文件調閱與有限強制手段），並依權力分立與制衡界定其對象與界限。是立法院調查權的指標解釋。',
  釋字第177號: '確立確定判決「消極不適用法規」顯然影響裁判者屬「適用法規顯有錯誤」得提再審，並宣示本院依人民聲請所為之解釋，對聲請人據以聲請之原因案件亦有效力——後者為釋憲聲請人個案救濟的關鍵先例。',
  釋字第620號: '重申租稅法律主義，闡明夫妻剩餘財產差額分配請求權屬債權、非遺產稅課徵範圍，並就新法溯及課予立法者訂定過渡條款的信賴保護義務。',
  釋字第709號: '司法院自陳為首見強化「正當行政程序」概念的解釋：都市更新事業概要與計畫之審核須設適當審議組織、確保利害關係人知悉資訊並適時陳述意見（計畫核定並應舉行聽證）。後案正當行政程序審查的指標先例。',
  釋字第594號: '延續法律明確性審查於刑罰構成要件：商標刑罰所禁行為（附加相同或近似商標致相關消費者依通常注意力有混淆誤認之虞）範圍可得確定，不違法律明確性原則。',
  釋字第622號: '重申憲法第19條租稅法律主義，並據以否定對繼承人就被繼承人死亡前三年贈與另課贈與稅。是租稅法律主義的常引適用案例。',
  釋字第521號: '沿續釋字第432號，重申法律明確性容許立法者運用概括條款，惟其文義須非受規範者所不能理解且可經司法審查確認。與釋字第432號同為明確性原則的常引先例。',
};
export default function TimelineView() {
  const [hover, setHover] = useState(null);
  // 合併時間軸：四種解釋機制沿革相接（最高法院解字→司法院院字/院解字→大法官釋字→憲法法庭憲判/裁定）。
  // 各年幾乎只落在單一機制，故一年一柱、依色帶著色；年別件數跨兩量級，y 軸取對數。大理院統字無日期，不入軸。
  const { byYear, span, y0, y1, maxTotal } = useMemo(() => {
    const m = new Map();
    for (const d of docs) {
      if (!d.日期) continue;
      const band = bandOf(d);
      if (!band) continue;
      const y = Number(d.日期.slice(0, 4));
      if (!Number.isFinite(y)) continue;
      if (!m.has(y)) m.set(y, { band, total: 0, detail: {} });
      const rec = m.get(y);
      rec.total++;
      const sub = d.系列 || (d.類型 === '解釋' ? '釋字' : d.類型);
      rec.detail[sub] = (rec.detail[sub] ?? 0) + 1;
    }
    const ys = [...m.keys()].sort((a, b) => a - b);
    const y0 = ys[0];
    const y1 = ys[ys.length - 1];
    const span = [];
    for (let y = y0; y <= y1; y++) span.push(y);
    const maxTotal = Math.max(...[...m.values()].map((v) => v.total));
    return { byYear: m, span, y0, y1, maxTotal };
  }, []);

  const W = 9;
  const H = 200;
  const PAD_L = 30;
  const PAD_T = 6;
  const PAD_B = 22;
  const chartW = span.length * W;
  // 對數 y 軸：count=1 落在略高於軸底處仍可見；每格 ×10。
  const LMIN = Math.log10(0.72);
  const LMAX = Math.log10(maxTotal) + 0.04;
  const yAt = (v) => PAD_T + H - ((Math.log10(v) - LMIN) / (LMAX - LMIN)) * H;
  const idxOf = (yr) => span.indexOf(yr);

  const cited = useMemo(() => {
    const c = new Map();
    for (const e of citeEdges) c.set(e.引, (c.get(e.引) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, []);
  const docByNo = useMemo(() => new Map(docs.map((d) => [d.字號, d])), []);

  const svgW = PAD_L + chartW + 12;
  const svgH = PAD_T + H + PAD_B;
  return (
    <div>
      <section className="border-t border-[var(--cc-line)] pt-5 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">年度密度</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">每年作成件數（{y0}–{y1}，對數刻度）</h2>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
          {BANDS.map((b) => (
            <span key={b.key} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: `var(--cat-${b.tone}-bg)`, borderColor: `var(--cat-${b.tone}-tx)` }} />
              {b.label}
            </span>
          ))}
        </div>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMinYMin meet" role="img" aria-label="每年作成件數對數長條圖" style={{ width: '100%', height: 'auto', maxWidth: svgW }}>
            {[1, 10, 100].filter((g) => g <= maxTotal).map((g) => (
              <g key={g}>
                <line x1={PAD_L} y1={yAt(g)} x2={PAD_L + chartW} y2={yAt(g)} stroke="var(--cc-line)" strokeWidth={1} />
                <text x={PAD_L - 5} y={yAt(g) + 3} textAnchor="end" fontSize={9} fill="var(--cc-axis-text)">{g}</text>
              </g>
            ))}
            {span.map((y, i) => {
              const v = byYear.get(y);
              if (!v) return null;
              const tone = BAND_TONE[v.band];
              const top = yAt(v.total);
              return (
                <g key={y} transform={`translate(${PAD_L + i * W}, 0)`}
                  onMouseEnter={() => setHover({ y, ...v })}
                  onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={PAD_T} width={W} height={H} fill="transparent" />
                  <rect x={0.75} y={top} width={W - 1.5} height={PAD_T + H - top} rx={1} fill={`var(--cat-${tone}-bg)`} stroke={`var(--cat-${tone}-tx)`} strokeWidth={0.6} opacity={hover && hover.y !== y ? 0.4 : 1} />
                  {y % 10 === 0 ? (
                    <text x={W / 2} y={PAD_T + H + 14} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{y}</text>
                  ) : null}
                </g>
              );
            })}
            {[[1949, '行憲 1947.12'], [2022, '憲訴法']].map(([yr, label]) => {
              const i = idxOf(yr);
              if (i < 0) return null;
              const x = PAD_L + i * W;
              return (
                <g key={yr}>
                  <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + H} stroke="var(--cc-type-judgment)" strokeDasharray="3 3" strokeWidth={1} />
                  <text x={x + 3} y={PAD_T + 9} fontSize={9} fill="var(--cc-type-judgment)">{label}</text>
                </g>
              );
            })}
          </svg>
          {hover ? (
            <div className="pointer-events-none absolute left-8 top-1 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{hover.y} 年</strong>　共 {hover.total} 件
              {Object.entries(hover.detail).map(([k, n]) => `　${k} ${n}`).join('')}
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          縱軸為對數刻度（每格 ×10）：統一解釋期每年上百件、釋字期每年個位到十餘件，跨兩個量級，對數軸方能同框並列。1948 年院解字止、1949 年釋字起，中間無縫接續——司法院的統一解釋轉為大法官解釋，同一釋憲脈絡的延續。大理院統字 2,011 件未載作成日期，號次雖為大致時序卻無公曆年，不入此軸（見下）。2022 年憲法訴訟法施行後，改由憲法法庭以判決、裁定行使職權；2024 年底起大法官人數不足，作成件數明顯下降。
        </p>
      </section>

      <Pre1947Supplement />

      <TopicHeatmaps />

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">引用網絡</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">被後案引用最多的解釋（官方「相關法令」欄互引統計）</h2>
        <div className="mt-3 max-w-3xl divide-y divide-[var(--cc-line)]">
          {cited.map(([no, n]) => {
            const d = docByNo.get(no);
            const why = WHY_CITED[no];
            return (
              <div key={no} className="grid items-baseline gap-2 py-2 sm:grid-cols-[130px_56px_1fr]">
                {d ? (
                  <a href={d.官方頁} target="_blank" rel="noreferrer" className="text-[13.5px] font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">{no}</a>
                ) : (
                  <span className="text-[13.5px] font-bold text-[var(--cc-ink-strong)]">{no}</span>
                )}
                <span className="text-[13px] font-bold text-[var(--cc-ink-strong)]">{n} 次</span>
                <span className="text-[12.5px] leading-relaxed text-[var(--cc-ink-soft)]">
                  {d?.爭點?.slice(0, 56) ?? ''}
                  {why ? <span className="mt-0.5 block text-[var(--cc-ink-mid)]"><strong className="text-[var(--cc-accent)]">為何常被引用</strong>　{why}</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
// 行憲前補充：大理院統字無作成日期、不入上方合併時間軸，此處說明其整全性（號次連續無斷）與極簡性；
// 另以系列／時期做類型化辨識（行憲前「類型」欄一律為「解釋」，無語意主題標籤）。
function Pre1947Supplement() {
  const { seriesRows, eraRows, total } = useMemo(() => {
    const pre = docs.filter((d) => d.系列);
    // 系列（統字/院字/院解字/解字）＝行憲前的自然「類型」；時期＝北京政府/訓政/行憲。
    const tally = (key) => {
      const c = new Map();
      for (const d of pre) { const k = d[key] ?? '未標'; c.set(k, (c.get(k) ?? 0) + 1); }
      return [...c.entries()].sort((a, b) => b[1] - a[1]);
    };
    return { seriesRows: tally('系列'), eraRows: tally('時期'), total: pre.length };
  }, []);

  // 號次是等差序列，依號次分桶的密度圖必然近均勻、不含資訊，故不作圖；
  // 只報可驗證的整全性（號次連續無斷）與極簡性（主文長度中位），數字全由快照即時算出。
  const undatedStat = useMemo(() => {
    const tong = docs.filter((d) => d.系列 === '統字');
    const nums = tong.map((d) => Number(d.號次)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const lo = nums[0] ?? 0;
    const hi = nums[nums.length - 1] ?? 0;
    const present = new Set(nums);
    let missing = 0;
    for (let x = lo; x <= hi; x++) if (!present.has(x)) missing++;
    const undatedTong = tong.filter((d) => !d.日期).length;
    const lens = tong.map((d) => (d.主文 || '').length).filter((l) => l > 0).sort((a, b) => a - b);
    const median = lens.length ? lens[Math.floor(lens.length / 2)] : 0;
    return { total: tong.length, lo, hi, missing, undated: undatedTong, median };
  }, []);

  const barRow = (rows, palette) => {
    const rmax = Math.max(1, ...rows.map(([, n]) => n));
    return (
      <div className="mt-2 space-y-1.5">
        {rows.map(([label, n], i) => {
          const tone = palette(label, i);
          return (
            <div key={label} className="grid grid-cols-[84px_1fr_52px] items-center gap-2 text-[12px]">
              <span className="truncate font-bold text-[var(--cc-ink-strong)]">{label}</span>
              <span className="h-3 rounded-sm" style={{ width: `${(n / rmax) * 100}%`, minWidth: 2, background: `var(--cat-${tone}-bg)`, borderRight: `2px solid var(--cat-${tone}-tx)` }} />
              <span className="text-right text-[var(--cc-ink-soft)]">{n}</span>
            </div>
          );
        })}
      </div>
    );
  };
  const 系列TONE = { 統字: ERA_TONE.大理院, 解字: ERA_TONE.最高法院, 院字: ERA_TONE.司法院, 院解字: 3 };

  return (
    <>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">行憲前補充 · 大理院統字（無日期，未入上軸）</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">
          統字第 <span className="text-[var(--cc-highlight)]">{undatedStat.lo}</span>–<span className="text-[var(--cc-highlight)]">{undatedStat.hi}</span> 號完整收錄，{undatedStat.missing === 0 ? '號次連續無缺' : `範圍內缺 ${undatedStat.missing} 號`}
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--cc-ink-soft)]">
          上方合併時間軸未納入大理院統字：其 <strong className="text-[var(--cc-ink-strong)]">{undatedStat.undated.toLocaleString()}</strong> 件未載作成日期，號次雖為大致時序卻無法對應公曆年，故不虛構年份上軸。就整全性而言，統字共 <strong className="text-[var(--cc-ink-strong)]">{undatedStat.total.toLocaleString()}</strong> 件、第 {undatedStat.lo}–{undatedStat.hi} 號連續無斷，等於完整收錄；這批解釋多為一句古文了結，主文長度中位約 <strong className="text-[var(--cc-ink-strong)]">{undatedStat.median}</strong> 字。號次是等差序列，依號次分桶的密度圖必然接近均勻、不含資訊，故不作圖。
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">類型化 · 依既有結構欄位</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">系列與時期分佈（共 {total.toLocaleString()} 件）</h2>
        <div className="mt-3 grid max-w-4xl gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[12px] font-bold text-[var(--cc-title-ink)]">系列（＝行憲前的解釋類型）</p>
            {barRow(seriesRows, (label) => 系列TONE[label] ?? 8)}
          </div>
          <div>
            <p className="text-[12px] font-bold text-[var(--cc-title-ink)]">時期</p>
            {barRow(eraRows, (_label, i) => [2, 5, 4, 8][i % 4])}
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          行憲前「類型」欄一律為「解釋」，此處改以系列（統字／院字／院解字／解字）與時期做類型化辨識；語意主題分類需回研究資料庫貼標後另補。
        </p>
      </section>
    </>
  );
}
