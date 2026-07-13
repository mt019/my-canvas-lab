import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { PRES_COLOR, Select, formatTenureRange, inkToFill, justices, presidents } from './shared';

// 任期時間軸（生涯甘特圖）。124 人官方名冊＋簡歷/屆次/人工核定三層任期。
// 著色改吃全站語意色 token 的分類色 --cat-N-tx（2026-07-08，tokens.css Layer 1b）：
// 學者=cat-1 紫、法官=cat-2 藍、律師=cat-3 綠、檢察官=cat-4 金——這組 cat 色的值就是
// 站內 Badge 校準色調，明度齊一（L≈0.5）、彩度中低、色相各異（Notion tag 的和諧原理），
// 由 validate:colors 在 build 時鎖住明度帶，改色相不超出帶才過得了 build。其他／待確認
// 保持淺灰退場（不在分類色內，是「無類別」的中性退場色，故留字面值）。
const TENURE_BG_COLOR = { // token-exempt: 分類色引用 --cat-* token；退場中性用 --cc-retire-*
  學者: 'var(--cat-1-tx)', 法官: 'var(--cat-2-tx)', 律師: 'var(--cat-3-tx)', 檢察官: 'var(--cat-4-tx)', 其他: 'var(--cc-retire-tx)', 待確認: 'var(--cc-retire-tx)',
};
// 留學地分群：null 再分「國內」（逐人查核確認無外國學位）與「待確認」（查不到可靠線索）
const ABROAD_GROUP = (j) => {
  const c = j.留學國;
  if (c === '德國' || c === '奧地利' || c === '瑞士') return '德語圈';
  if (c === '美國' || c === '英國') return '英美';
  if (c === '日本') return '日本';
  if (c) return '其他';
  return (j.留學國來源 ?? '').includes('查核') ? '國內' : '待確認';
};
// 與 TENURE_BG_COLOR 共用同一組分類色（--cat-1..4），維持兩種著色模式視覺一致
const TENURE_ABROAD_COLOR = { // token-exempt: 分類色引用 --cat-* token；退場中性用 --cc-retire-*
  德語圈: 'var(--cat-1-tx)', 英美: 'var(--cat-2-tx)', 日本: 'var(--cat-3-tx)', 其他: 'var(--cat-4-tx)', 國內: 'var(--cc-retire-tx)', 待確認: 'var(--cc-retire-tx)',
};
// 各總統提名大法官人數（鍵與 presidents[].總統／PRES_COLOR 同一套字串，含「（代）」）
const PRES_NOM_COUNT = justices.reduce((m, j) => {
  if (j.提名總統) m.set(j.提名總統, (m.get(j.提名總統) ?? 0) + 1);
  return m;
}, new Map());
function tenureYear(s, isEnd) {
  if (!s) return null;
  const str = String(s);
  const y = Number(str.slice(0, 4));
  const m = str.length >= 7 ? Number(str.slice(5, 7)) : (isEnd ? 12 : 1);
  return y + (m - 0.5) / 12;
}
// 合併同一人相接／重疊的任期段。連任（第 N 屆→第 N+1 屆）在「只到年」的精度下，會因 tenureYear
// 把起點寄到 1 月、訖點寄到 12 月，於交界年重疊約 0.9 年——這是解析造成的假重疊，非真的同時任兩職。
// 相隔在容差內就併成一條連續橫條；真正離任多年後再回任（間隔逾容差）才保留為分段。openEnd＝現任的畫圖終點。
function tenureSpans(tenures, openEnd) {
  const segs = (tenures ?? [])
    .map((t) => ({ a: tenureYear(t.起, false), b: t.訖 ? tenureYear(t.訖, true) : openEnd, open: !t.訖 }))
    .filter((s) => s.a != null)
    .sort((p, q) => p.a - q.a);
  const out = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && s.a <= last.b + 0.3) { // 0.3 年容差：吸收年精度交界重疊與數月行政空檔，不併真正的多年中斷
      if (s.b > last.b) { last.b = s.b; last.open = s.open; }
    } else out.push({ ...s });
  }
  return out;
}
export default function TenureView({ onOpen }) {
  const [colorBy, setColorBy] = useState('出身');
  const [onlyAuthors, setOnlyAuthors] = useState(false);
  const [hover, setHover] = useState(null);
  const [asc, setAsc] = useState(true); // true＝最早在上（由上而下遞增），false＝最新在上

  const rows = useMemo(() => {
    const dir = asc ? 1 : -1;
    const list = justices
      .filter((j) => j.任期?.length)
      .map((j) => ({ ...j, start: tenureYear(j.任期[0].起, false) }))
      .sort((a, b) => dir * (a.start - b.start) || dir * a.姓名.localeCompare(b.姓名));
    return onlyAuthors ? list.filter((j) => j.提出意見書 + j.加入意見書 > 0) : list;
  }, [onlyAuthors, asc]);

  const Y0 = 1948, Y1 = 2027;
  const ROW = 14, LABEL = 62, CHART = 830, COUNT = 52;
  const H = rows.length * ROW;
  const x = (yr) => LABEL + ((yr - Y0) / (Y1 - Y0)) * CHART;
  const maxOps = Math.max(...justices.map((j) => j.提出意見書 + j.加入意見書), 1);
  const colorOf = (j) => (colorBy === '出身'
    ? TENURE_BG_COLOR[j.出身] ?? TENURE_BG_COLOR.待確認
    : colorBy === '提名總統'
      ? PRES_COLOR[j.提名總統] ?? TENURE_BG_COLOR.待確認
      : TENURE_ABROAD_COLOR[ABROAD_GROUP(j)]);
  const fillOf = (j) => inkToFill(colorOf(j)); // 大條吃淡底，色相辨識交給 colorOf 的 ink 細框與圖例
  // 「待確認」畫空心條（描邊無填滿）：留學地模式與「國內」灰實心區分，出身模式與「其他」（查核後四類皆非）區分
  const isHollow = (j) => (colorBy === '留學國' && ABROAD_GROUP(j) === '待確認')
    || (colorBy === '出身' && j.出身 === '待確認');
  const legend = colorBy === '出身' ? TENURE_BG_COLOR : colorBy === '提名總統' ? PRES_COLOR : TENURE_ABROAD_COLOR;

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">制度 77 年</p>
          <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">歷任大法官任期時間軸（{rows.length} 人）</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select label="著色" value={colorBy} onChange={setColorBy} options={[['出身', '按出身'], ['留學國', '按留學地'], ['提名總統', '按提名總統']]} />
          <button
            onClick={() => setAsc((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--cc-border)] px-2 py-1 text-[12px] font-bold text-[var(--cc-ink-soft)] hover:text-[var(--cc-accent)]"
          >
            <ArrowUpDown size={11} />{asc ? '最早在上' : '最新在上'}
          </button>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--cc-ink-soft)]">
            <input type="checkbox" checked={onlyAuthors} onChange={(e) => setOnlyAuthors(e.target.checked)} />
            僅顯示有具名意見書者
          </label>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
        {Object.entries(legend).map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            {k === '待確認' && colorBy !== '提名總統'
              ? <span className="h-2.5 w-2.5 rounded-sm border border-dashed" style={{ borderColor: c }} />
              : <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: inkToFill(c), borderColor: c }} />}
            {k}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <svg width={11} height={11} aria-hidden>
            <rect width={11} height={11} rx={2} fill="var(--cc-dim-text)" />
            <path d="M-2 5 l8 -8 M0 13 l13 -13 M6 13 l8 -8" stroke="var(--cc-bg)" strokeWidth={1.6} />
          </svg>
          斜紋＝女性大法官
        </span>
        <span className="ml-2">右欄細條＝具名意見書數；底色帶＝總統任期</span>
      </div>

      {/* 圖已攤開全高，資訊列 sticky 貼在頁面導覽下緣，滾到圖底仍看得到 */}
      <div className="sticky top-[49px] z-10 mt-2 rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg)]/95 px-3 py-1.5 text-[12.5px] backdrop-blur">
        {hover ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-[var(--cc-ink-strong)]">
            <strong>{hover.姓名}</strong>
            <span>{hover.任期.map(formatTenureRange).join('；')}</span>
            <span><span className="text-[var(--cc-ink-soft)]">出身</span> {hover.出身}</span>
            <span><span className="text-[var(--cc-ink-soft)]">留學</span> {hover.留學國 ?? ((hover.留學國來源 ?? '').includes('查核') ? '無（國內）' : '待確認')}</span>
            {hover.提名總統 ? <span><span className="text-[var(--cc-ink-soft)]">提名</span> {hover.提名總統}</span> : null}
            {hover.性別 === '女' ? <span><span className="text-[var(--cc-ink-soft)]">性別</span> 女</span> : null}
            {hover.提出意見書 + hover.加入意見書 > 0
              ? <span><span className="text-[var(--cc-ink-soft)]">意見書</span> 提出 {hover.提出意見書}／加入 {hover.加入意見書}</span>
              : null}
            {hover.任期來源 !== '簡歷頁' ? <span className="text-[var(--cc-ink-soft)]">（任期{hover.任期來源}）</span> : null}
          </div>
        ) : (
          <span className="text-[var(--cc-ink-soft)]">游標移到列上看任期細節；點姓名開個人頁（意見書清單、參與裁判與打包下載）。</span>
        )}
      </div>

      <div className="mt-1 overflow-x-auto">
        <div style={{ width: LABEL + CHART + COUNT + 10 }}>
          <svg width={LABEL + CHART + COUNT + 10} height={H + 50} role="img" aria-label="歷任大法官任期甘特圖">
            <defs>
              {/* 女性大法官的 45° 斜紋覆層：紙色細線疊在任何 bar 色上都可辨（非僅顏色編碼） */}
              <pattern id="tenure-hatch-f" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={4} stroke="var(--cc-bg)" strokeWidth={1.6} />
              </pattern>
            </defs>
            {/* 總統任期背景直帶（交錯淡染＋帶頂總統名） */}
            {presidents.map((p, i) => {
              const a = Math.max(tenureYear(p.起, false), Y0);
              const b = Math.min(p.訖 === '9999-12-31' ? Y1 : tenureYear(p.訖, true), Y1);
              if (b <= Y0 || a >= Y1) return null;
              const w = x(b) - x(a);
              return (
                <g key={`${p.總統}${p.起}`}>
                  {i % 2 ? <rect x={x(a)} y={18} width={w} height={H + 2} fill="var(--cc-hover-bg)" opacity={0.55} /> : null}
                  {w >= 26 ? (
                    <text x={x(a) + w / 2} y={H + 46} textAnchor="middle" fontSize={8.5} fill="var(--cc-eyebrow)">
                      {p.總統.replace('（代）', '')}
                      {w >= 60 && PRES_NOM_COUNT.get(p.總統) ? `（提名 ${PRES_NOM_COUNT.get(p.總統)} 位）` : ''}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {/* 十年格線 */}
            {Array.from({ length: 8 }, (_, i) => 1950 + i * 10).map((yr) => (
              <g key={yr}>
                <line x1={x(yr)} y1={18} x2={x(yr)} y2={H + 20} stroke="var(--cc-line)" strokeWidth={1} />
                <text x={x(yr)} y={12} textAnchor="middle" fontSize={10} fill="var(--cc-axis-text)">{yr}</text>
                {/* 全圖攤開後頂軸會滾出視野，底部重標一次年份 */}
                <text x={x(yr)} y={H + 33} textAnchor="middle" fontSize={10} fill="var(--cc-axis-text)">{yr}</text>
              </g>
            ))}
            {/* 憲訴法施行 */}
            <line x1={x(2022)} y1={18} x2={x(2022)} y2={H + 20} stroke="var(--cc-type-judgment)" strokeDasharray="3 3" strokeWidth={1} />
            <text x={x(2022) + 3} y={12} fontSize={9} fill="var(--cc-type-judgment)">憲訴法</text>

            {rows.map((j, i) => {
              const y = 20 + i * ROW;
              const dim = hover && hover.姓名 !== j.姓名;
              const ops = j.提出意見書 + j.加入意見書;
              return (
                <g key={j.姓名}
                  onMouseEnter={() => setHover(j)} onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={y} width={LABEL + CHART + COUNT} height={ROW} fill={hover?.姓名 === j.姓名 ? 'var(--cc-hover-bg)' : 'transparent'} />
                  <text x={LABEL - 6} y={y + ROW / 2 + 3.5} textAnchor="end" fontSize={10.5}
                    fontWeight={hover?.姓名 === j.姓名 ? 700 : 500}
                    fill={dim ? 'var(--cc-dim-text)' : 'var(--cc-ink-strong)'} className="cursor-pointer"
                    onClick={() => onOpen?.(j.姓名)}>
                    {j.姓名}
                  </text>
                  {tenureSpans(j.任期, Y1 - 0.4).map((s, k) => {
                    const w = Math.max(x(s.b) - x(s.a), 2.5);
                    return (
                      <g key={k}>
                        <rect x={x(s.a)} y={y + 3} width={w} height={ROW - 6} rx={2}
                          fill={isHollow(j) ? 'var(--cc-bg)' : fillOf(j)}
                          stroke={colorOf(j)} strokeWidth={1}
                          strokeDasharray={isHollow(j) || s.open ? '3 2' : undefined}
                          opacity={dim ? 0.3 : 1} />
                        {j.性別 === '女' && !isHollow(j) ? (
                          <rect x={x(s.a)} y={y + 3} width={w} height={ROW - 6} rx={2}
                            fill="url(#tenure-hatch-f)" opacity={dim ? 0.3 : 1} />
                        ) : null}
                      </g>
                    );
                  })}
                  {ops > 0 ? (
                    <rect x={LABEL + CHART + 6} y={y + 4.5}
                      width={Math.max((ops / maxOps) * (COUNT - 8), 1.5)} height={ROW - 9} rx={1.5}
                      fill="var(--cc-highlight)" opacity={dim ? 0.25 : 0.85} />
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="mt-2 max-w-4xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        任期資料三層來源：官方個人簡歷（48 人，精確到月日，含早逝、辭職與連任）、官方屆次區間（其餘多數）、
        逐人查核後的人工核定（現任八人與翁岳生、城仲模等特殊任期）。橫條一律淡底＋同色細邊框；虛線邊框＝現任（任期未封口）。
        出身與留學地由官方經歷、官職資料庫與維基百科條目逐人查核標註；「國內」「其他」（灰底實線框）＝查核後確認
        （無外國學位／非學者法官律師檢察官四類的行政文官），「待確認」（無色底虛線框）＝尚查不到可靠線索。
        提名總統逐批查證核定：每位大法官的提名事件對到政大官職資料庫（『任命者:總統』欄）、總統府與司法院官方名冊，
        再任者逐段歸批（如許宗力 2003 陳水扁提名、2016 蔡英文再任）；性別由維基條目語彙機標（女 14 人），
        無條目的 20 人（多為第一、二屆與部分現任）尚待人工補注，圖上暫不標。
      </p>
    </section>
  );
}
