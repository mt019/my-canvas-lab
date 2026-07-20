import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { docs, heatFill, typoLabel } from './shared';

// 處分模式（類型學 A 軸）分兩段呈現：
//   實體審查結果＝合憲→違憲的一條梯度（P1 單純合憲／P2 合憲性限縮／P3 合憲附警告／P4 違憲宣告）；
//   其他處分＝非合憲性判斷（P9 位階審查／P5 純解釋／P6 權限歸屬／P7 程序・暫時／P8 不受理）。
// 兩段分開排的理由寫在圖說：後者沒有「多違憲」的意義，混排會讓不同分母的領域被錯誤相比。
const MERITS = ['A-P1', 'A-P2', 'A-P3', 'A-P4'];
const OTHER = ['A-P9', 'A-P5', 'A-P6', 'A-P7', 'A-P8'];
const A_SHORT = {
  'A-P1': '合憲', 'A-P2': '限縮', 'A-P3': '附警告', 'A-P4': '違憲',
  'A-P9': '位階', 'A-P5': '純解釋', 'A-P6': '權限', 'A-P7': '程序', 'A-P8': '不受理',
};

export default function TopicHeatmaps() {
  const [cell, setCell] = useState(null);
  const [, setParams] = useSearchParams();
  const tapRef = useRef({ n: 0, t0: 0 });
  const onEyebrowTap = () => {
    const now = Date.now();
    const r = tapRef.current;
    if (now - r.t0 > 3000) { r.n = 0; r.t0 = now; }
    r.n += 1;
    if (r.n >= 5) { r.n = 0; setParams({ tab: 'typology-report' }); }
  };

  const { topics, bins, grid, maxCell } = useMemo(() => {
    const counts = new Map();
    for (const d of docs) for (const t of d.主題) counts.set(t, (counts.get(t) ?? 0) + 1);
    const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
    const years = docs.filter((d) => !d.系列).map((d) => d.日期 && Number(d.日期.slice(0, 4))).filter(Boolean);
    const b0 = Math.floor(Math.min(...years) / 5) * 5;
    const b1 = Math.floor(Math.max(...years) / 5) * 5;
    const bins = [];
    for (let b = b0; b <= b1; b += 5) bins.push(b);
    const grid = new Map();
    for (const d of docs) {
      if (!d.日期) continue;
      const b = Math.floor(Number(d.日期.slice(0, 4)) / 5) * 5;
      for (const t of d.主題) {
        const k = `${t}|${b}`;
        grid.set(k, (grid.get(k) ?? 0) + 1);
      }
    }
    return { topics, bins, grid, maxCell: Math.max(...grid.values()) };
  }, []);

  // 主題×處分模式：每件逐件雙盲覆核的 A 軸主處分（結論類型.A）。只計進得了矩陣的件（有主題＝已標主題
  // 的行憲後案件）。無粗軸換算——全部 874 件行憲後案件皆已逐件編碼，不存在「機標補洞」的件。
  const { meritCols, otherCols, aGrid, aMax, codedN } = useMemo(() => {
    const g = new Map();
    const present = new Set();
    let n = 0;
    for (const d of docs) {
      const A = d.結論類型?.A;
      if (!A || !d.主題.length) continue;
      n += 1;
      present.add(A);
      for (const t of d.主題) g.set(`${t}|${A}`, (g.get(`${t}|${A}`) ?? 0) + 1);
    }
    return {
      meritCols: MERITS.filter((a) => present.has(a)),
      otherCols: OTHER.filter((a) => present.has(a)),
      aGrid: g,
      aMax: Math.max(1, ...g.values()),
      codedN: n,
    };
  }, []);

  const LABEL_W = 130;
  const CW = 17;
  const RH = 17;
  const H = topics.length * RH;

  // 處分矩陣欄位版面：實體段與其他段之間留一道間隙 GAP，兩段各給一列小標。
  const CWA = 58;
  const GAP = 20;
  const HEAD = 32; // 群組標題列＋欄名列的總高
  const cols = [...meritCols, ...otherCols];
  const colX = (i) => LABEL_W + i * CWA + (i >= meritCols.length ? GAP : 0);
  const groupCenter = (start, len) => (colX(start) + colX(start + len - 1) + 52) / 2;
  const dividerX = meritCols.length ? colX(meritCols.length) - GAP / 2 : null;
  const aSvgW = LABEL_W + cols.length * CWA + GAP + 12;

  return (
    <>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×年代</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">哪個年代在吵哪些問題（每 5 年一格，色深＝件數）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={LABEL_W + bins.length * CW + 12} height={H + 26} role="img" aria-label="主題與年代分布熱圖">
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + 3.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {bins.map((b, c) => (b % 10 === 0 ? (
              <text key={b} x={LABEL_W + c * CW + CW / 2} y={H + 16} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{b}</text>
            ) : null))}
            {topics.map((t, r) => bins.map((b, c) => {
              const v = grid.get(`${t}|${b}`) ?? 0;
              return (
                <rect
                  key={`${t}${b}`}
                  x={LABEL_W + c * CW} y={r * RH}
                  width={CW - 2} height={RH - 2} rx={3}
                  fill={heatFill(v, maxCell)}
                  stroke={cell?.t === t && cell?.b === b ? 'var(--cc-highlight)' : 'none'}
                  strokeWidth={1.5}
                  onMouseEnter={() => setCell({ t, b, v, kind: 'year' })}
                  onMouseLeave={() => setCell(null)}
                />
              );
            }))}
          </svg>
          {cell?.kind === 'year' ? (
            <div className="pointer-events-none absolute left-4 top-0 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{cell.t}</strong>　{cell.b}–{cell.b + 4} 年　<strong className="text-[var(--cc-accent)]">{cell.v} 件</strong>
            </div>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[var(--cc-ink-soft)]">
          少
          {[0.08, 0.25, 0.5, 0.75, 1].map((f) => (
            <span key={f} className="inline-block h-3 w-3 rounded-[3px]" style={{ background: heatFill(f * maxCell, maxCell) }} />
          ))}
          多（單格最高 {maxCell} 件）
        </div>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p onClick={onEyebrowTap} className="select-none text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×處分模式</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">哪些領域最常被判違憲（色深＝件數）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={aSvgW} height={H + HEAD + 10} role="img" aria-label="主題與處分模式矩陣">
            {/* 群組標題：實體審查結果 ｜ 其他處分 */}
            {meritCols.length ? (
              <text x={groupCenter(0, meritCols.length)} y={11} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--cc-eyebrow)">實體審查結果</text>
            ) : null}
            {otherCols.length ? (
              <text x={groupCenter(meritCols.length, otherCols.length)} y={11} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--cc-eyebrow)">其他處分</text>
            ) : null}
            {dividerX != null && otherCols.length ? (
              <line x1={dividerX} y1={16} x2={dividerX} y2={H + HEAD} stroke="var(--cc-line)" strokeWidth={1} />
            ) : null}
            {/* 欄名 */}
            {cols.map((a, i) => (
              <text key={a} x={colX(i) + 26} y={25} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--cc-table-head-ink)">{A_SHORT[a] ?? a}</text>
            ))}
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + HEAD + 3.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {topics.map((t, r) => cols.map((a, i) => {
              const v = aGrid.get(`${t}|${a}`) ?? 0;
              const dark = Math.sqrt(v / aMax) > 0.55;
              return (
                <g key={`${t}${a}`}>
                  <rect
                    x={colX(i)} y={r * RH + HEAD}
                    width={52} height={RH - 2} rx={3}
                    fill={heatFill(v, aMax)}
                    onMouseEnter={() => setCell({ t, a, v, kind: 'amode' })}
                    onMouseLeave={() => setCell(null)}
                  />
                  {v ? (
                    <text x={colX(i) + 26} y={r * RH + HEAD + RH / 2 + 3} textAnchor="middle" fontSize={9.5} fill={dark ? 'var(--cc-heat-text-light)' : 'var(--cc-heat-text-dark)'} pointerEvents="none">{v}</text>
                  ) : null}
                </g>
              );
            }))}
          </svg>
          {cell?.kind === 'amode' ? (
            <div className="pointer-events-none absolute left-4 top-0 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{cell.t}</strong>　{typoLabel(cell.a)}　<strong className="text-[var(--cc-accent)]">{cell.v} 件</strong>
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          每件只算一次，看它最主要的一種處分。左段「實體審查結果」是合憲性審查的結論，從合憲、合憲但限縮、合憲但附警告，到違憲；右段「其他處分」——純解釋、權限歸屬、位階審查、程序或暫時處分、不受理——都不是在判合憲或違憲。一個領域若多半停在程序駁回或純解釋，真正進入違憲判斷的件本來就少，兩段因此分開看、不宜跨段相比。
          主文「部分違憲、部分合憲」的案件，這裡歸入它最主要的那種處分，其部分違憲、部分不受理的細節見案件卡片。本圖收 {codedN} 件釋字與憲判（另有部分案件尚未歸入領域，不在此圖）。個案以官方原文為準。
        </p>
      </section>
    </>
  );
}
