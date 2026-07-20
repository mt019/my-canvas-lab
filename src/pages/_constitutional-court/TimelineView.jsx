import { useMemo, useState } from 'react';
import { ERA_TONE, citeEdges, docs, timelineGaps } from './shared';
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

// 零案件的「空窗年」：整年無解釋、且屬史實而非資料漏收的年段。內容一律來自資料倉（`timelineGaps`，
// 每筆 { 起, 迄, 屬, 說明, 來源 }，經 build-app-json 投影進快照），前端不寫死史實——史實是資料、
// 前端只負責畫。目前只有 1950–51 政府遷台一筆（1949 底遷台、大法官四散人數不足、會議無法召開，
// 至 1952.05 釋字第3號恢復）。展開成 年→{說明, tone} 的查詢表：`屬` 決定用哪個時代色相（色相是
// 呈現、留在前端），`說明` 是 hover 標籤要顯示的文字。不入此表的空年仍 return null（留白）。
const EMPTY_YEAR_INFO = new Map();
for (const g of timelineGaps) {
  const tone = ERA_TONE[g.屬] ?? ERA_TONE.釋字;
  for (let y = g.起; y <= g.迄; y++) EMPTY_YEAR_INFO.set(y, { 說明: g.說明, tone });
}
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
              {/* 圖例的色塊要跟圖裡的長條同一種畫法，否則對不起來 */}
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--cat-${b.tone}-tx) 60%, var(--cat-${b.tone}-bg))` }} />
              {b.label}
            </span>
          ))}
        </div>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMinYMin meet" role="img" aria-label="每年作成件數對數長條圖" style={{ width: '100%', height: 'auto', maxWidth: svgW }}>
            {[1, 10, 100].filter((g) => g <= maxTotal).map((g) => (
              <g key={g}>
                <line x1={PAD_L} y1={yAt(g)} x2={PAD_L + chartW} y2={yAt(g)} stroke="var(--cc-line)" strokeWidth={1} strokeOpacity={0.55} />
                <text x={PAD_L - 5} y={yAt(g) + 3} textAnchor="end" fontSize={9} fill="var(--cc-axis-text)">{g}</text>
              </g>
            ))}
            {span.map((y, i) => {
              const v = byYear.get(y);
              if (!v) {
                // 空窗年（目前 1950–51 政府遷台）：不 return null，改畫一個立在軸底的空心小環、可 hover。
                // 空心＝「該有卻沒有」（有其它年那種實心色柱作對比）；色相取自資料倉該筆的 `屬`（釋字期）。
                const info = EMPTY_YEAR_INFO.get(y);
                if (!info) return null;
                const focus = hover && hover.y === y;
                return (
                  <g key={y} transform={`translate(${PAD_L + i * W}, 0)`}
                    onMouseEnter={() => setHover({ y, empty: true, 說明: info.說明 })}
                    onMouseLeave={() => setHover(null)}>
                    <rect x={0} y={PAD_T} width={W} height={H} fill="transparent" />
                    {/* 空心環立在軸底（count=1 線稍下方，示意「不足一件」）。逐一交代參數：
                        cy PAD_T+H-2：環心到軸底的距離，2px；越大越往上浮。
                        r 1.7：環半徑（px），越大環越大。
                        strokeWidth 1：環厚。fill none＝空心，是「缺席」的視覺語言。
                        strokeOpacity {focus ? 0.95 : 0.5}：平時 0.5 克制不搶戲，hover 該年時加深到 0.95。 */}
                    <circle cx={W / 2} cy={PAD_T + H - 2} r={1.7} fill="none"
                      stroke={`var(--cat-${info.tone}-tx)`} strokeWidth={1}
                      strokeOpacity={focus ? 0.95 : 0.5} />
                    {y % 10 === 0 ? (
                      <text x={W / 2} y={PAD_T + H + 14} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{y}</text>
                    ) : null}
                  </g>
                );
              }
              const tone = BAND_TONE[v.band];
              const top = yAt(v.total);
              return (
                <g key={y} transform={`translate(${PAD_L + i * W}, 0)`}
                  onMouseEnter={() => setHover({ y, ...v })}
                  onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={PAD_T} width={W} height={H} fill="transparent" />
                  {/* 每根長條拆兩層，複刻右欄滾輪時間軸（TimeRail）的用色原則：深墨色只出現在小面積
                      （滾輪用在 1.5px 刻度線）、大面積吃極淡底。因為校準色的 -tx 彩度只有 0.05–0.10
                      （為 badge／細線設計），鋪成大面積長條時濃了沉悶、淡了發灰，怎麼調都不對——使用者
                      2026-07-20 連否四輪填色濃度後拍板改此畫法。逐一交代每個參數控制什麼：

                      〔第一個 rect＝茎，佔滿長條高度的主體〕
                        fill  color-mix(-tx 22%, -bg)：茎的淡彩濃度，22% 深墨混進近白底。這個數字越大茎
                              越實、越小越淡。不可用純 -bg——太淡，rose 的 -bg（近乎白的極淡粉）在近白
                              paper 上會消失（踩過）。
                        opacity {hover 非焦點年 ? 0.82 : 1}：hover 時其它年的淡出程度。0.82，不可低於
                              0.8，否則粉色那類淡色在 hover 態會不見（踩過兩次）。沒 hover 時為 1（滿）。

                      〔第二個 rect＝頂帽，頂端那道承載色相辨識的深墨細線〕
                        height Math.min(2.6, 條高)：頂帽厚度（px）。2.6（原 3.4，2026-07-20 使用者要求再細
                              一點）。這個數字越大頂帽越粗。取 min(條高) 是防矮條（count 小、整條高度不到
                              2.6px）被頂帽撐爆變形。
                        opacity {hover 非焦點年 ? 0.6 : 1}：hover 時其它年淡出到 0.6；沒 hover 為 1（滿色
                              深墨，才看得清）。 */}
                  <rect x={0.75} y={top} width={W - 1.5} height={PAD_T + H - top} rx={1} fill={`color-mix(in oklab, var(--cat-${tone}-tx) 22%, var(--cat-${tone}-bg))`} opacity={hover && hover.y !== y ? 0.82 : 1} />
                  <rect x={0.75} y={top} width={W - 1.5} height={Math.min(2.6, PAD_T + H - top)} rx={1} fill={`var(--cat-${tone}-tx)`} opacity={hover && hover.y !== y ? 0.6 : 1} />
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
            // 標籤固定在圖表頂部正中（left-1/2 + -translate-x-1/2），不跟游標移動。理由：圖的頂部
            // 中段（1960–2010 釋字期都是個位到十餘件的矮條）恆是留白，標籤置中就落在這片空白上、
            // 不壓任何條；而舊版寫死在左上角（left-8）會永遠擋住左邊司法院那片上百件的高條。
            // 曾試「跟著 hover 的條走」，被否——跟隨反而把標籤帶到當前那根條頭上。top-1＝貼圖頂。
            // 空窗年的說明句較長，改用固定寬度換行（max-w＋居中對齊）；件數標籤仍維持不換行單行。
            <div className={`pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm ${hover.empty ? 'max-w-[280px] text-center leading-relaxed' : 'whitespace-nowrap'}`}>
              {hover.empty ? (
                <>
                  <strong className="text-[var(--cc-ink-strong)]">{hover.y} 年 · 無解釋</strong>
                  <span className="mt-0.5 block text-[var(--cc-ink-soft)]">{hover.說明}</span>
                </>
              ) : (
                <>
                  <strong className="text-[var(--cc-ink-strong)]">{hover.y} 年</strong>　共 {hover.total} 件
                  {Object.entries(hover.detail).map(([k, n]) => `　${k} ${n}`).join('')}
                </>
              )}
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          縱軸為對數刻度（每格 ×10）：統一解釋期每年上百件、釋字期每年個位到十餘件，跨兩個量級，對數軸方能同框並列。1948 年院解字止、1949 年釋字起，中間銜接無斷——司法院的統一解釋轉為大法官解釋，同一釋憲脈絡的延續。惟 1950、1951 兩年整年無解釋，是全序列唯一的空窗：1949 年底政府遷台，大法官四散、人數不足，會議無法召開，至 1952 年釋字第3號始恢復（滑過那兩個軸底空環可見說明）。大理院統字 2,011 件未載作成日期，號次雖為大致時序卻無公曆年，不入此軸（見下）。2022 年憲法訴訟法施行後，改由憲法法庭以判決、裁定行使職權；2024 年底起大法官人數不足，作成件數明顯下降。
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
  const 系列TONE = { 統字: ERA_TONE.大理院, 解字: ERA_TONE.最高法院, 院字: ERA_TONE.司法院, 院解字: 2 }; // 統字red6/解字teal5/院字green3/院解字blue2，四類皆分得開 // 院解字改 plum(H358)：最高法院已改吃 cat-3，原本的 3 會在同一張圖裡撞色

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
