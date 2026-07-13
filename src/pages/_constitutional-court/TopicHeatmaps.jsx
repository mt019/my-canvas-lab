import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { A_ORDER, docs, heatFill, typoLabel } from './shared';

// 粗軸→A 軸換算：只給無 agent 細軸值的行憲後案件。精度受粗軸盲點所限——合憲無法細分
// P2 限縮／P3 附警告，補充／變更本質是 D 軸現象、A 暫歸純解釋——故換算件只用於 A 軸母體分佈，
// 不冒充逐件覆核。編碼本每個 A 值的「對應既有結論」即此對照的依據。
const COARSE_TO_A = {
  合憲: 'A-P1', 違憲: 'A-P4', 違憲即失效: 'A-P4', 違憲定期失效: 'A-P4',
  法令解釋: 'A-P5', 補充前解釋: 'A-P5', 變更前解釋: 'A-P5',
};
// 回傳 { A, source: 'agent' | 'bridge' | null }：agent 有細軸就用細軸，否則粗軸換算。
function resolveA(d) {
  const A = d.結論類型?.A;
  if (A) return { A, source: 'agent' };
  const b = COARSE_TO_A[d.審查結論?.結論];
  return b ? { A: b, source: 'bridge' } : { A: null, source: null };
}
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

  const outcomes = ['違憲', '違憲定期失效', '合憲', '非合憲性審查', '其他/待人工'];
  const { oGrid, oMax } = useMemo(() => {
    const g = new Map();
    for (const d of docs) {
      let c = d.審查結論?.結論 ?? '未分類';
      if (c === '違憲即失效') c = '違憲';
      if (c === '未分類') c = '其他/待人工';
      if (c === '法令解釋' || c === '補充前解釋' || c === '變更前解釋') c = '非合憲性審查';
      for (const t of d.主題) g.set(`${t}|${c}`, (g.get(`${t}|${c}`) ?? 0) + 1);
    }
    return { oGrid: g, oMax: Math.max(...g.values()) };
  }, []);

  // 主題×處分模式（A 軸）：agent 覆核件用細軸，其餘行憲後件由粗軸換算 A 軸（resolveA）。
  const { aCols, aGrid, aMax, aAgentN, aBridgeN } = useMemo(() => {
    const g = new Map();
    const present = new Set();
    let agentN = 0;
    let bridgeN = 0;
    for (const d of docs) {
      const { A, source } = resolveA(d);
      if (!A || !d.主題.length) continue; // 只計進得了矩陣的件（有主題＝行憲後機標件），與圖說數字一致
      if (source === 'agent') agentN += 1; else bridgeN += 1;
      present.add(A);
      for (const t of d.主題) g.set(`${t}|${A}`, (g.get(`${t}|${A}`) ?? 0) + 1);
    }
    const aCols = A_ORDER.filter((a) => present.has(a));
    return { aCols, aGrid: g, aMax: Math.max(1, ...g.values()), aAgentN: agentN, aBridgeN: bridgeN };
  }, []);
  const A_SHORT = { 'A-P1': '合憲', 'A-P2': '限縮', 'A-P3': '附警告', 'A-P4': '違憲', 'A-P9': '位階', 'A-P5': '純解釋', 'A-P6': '權限', 'A-P7': '程序', 'A-P8': '不受理' };

  const LABEL_W = 130;
  const CW = 17;
  const RH = 17;
  const H = topics.length * RH;

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
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×審查結論</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">哪些領域最常被宣告違憲（機標結論，待人工欄為尚未覆核件）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={LABEL_W + outcomes.length * 74 + 12} height={H + 30} role="img" aria-label="主題與審查結論矩陣">
            {outcomes.map((o, c) => (
              <text key={o} x={LABEL_W + c * 74 + 34} y={12} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--cc-table-head-ink)">{o === '其他/待人工' ? '待人工' : o}</text>
            ))}
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + 21.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {topics.map((t, r) => outcomes.map((o, c) => {
              const v = oGrid.get(`${t}|${o}`) ?? 0;
              const dark = Math.sqrt(v / oMax) > 0.55;
              return (
                <g key={`${t}${o}`}>
                  <rect
                    x={LABEL_W + c * 74} y={r * RH + 18}
                    width={68} height={RH - 2} rx={3}
                    fill={heatFill(v, oMax)}
                    onMouseEnter={() => setCell({ t, o, v, kind: 'outcome' })}
                    onMouseLeave={() => setCell(null)}
                  />
                  {v ? (
                    <text x={LABEL_W + c * 74 + 34} y={r * RH + 18 + RH / 2 + 3} textAnchor="middle" fontSize={9.5} fill={dark ? 'var(--cc-heat-text-light)' : 'var(--cc-heat-text-dark)'} pointerEvents="none">{v}</text>
                  ) : null}
                </g>
              );
            }))}
          </svg>
          {cell?.kind === 'outcome' ? (
            <div className="pointer-events-none absolute left-4 top-0 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{cell.t}</strong>　{cell.o}　<strong className="text-[var(--cc-accent)]">{cell.v} 件</strong>
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          審查結論為文字規則機標（違憲即失效併入違憲欄；法令解釋／補充前解釋／變更前解釋併入非合憲性審查欄），僅供分布觀察；個案請以卡片上的官方連結查證原文。
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p onClick={onEyebrowTap} className="select-none text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×處分模式（類型學 A 軸）</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">把「待人工」拆開後的九種處分模式（色深＝件數）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={LABEL_W + aCols.length * 58 + 12} height={H + 30} role="img" aria-label="主題與處分模式矩陣">
            {aCols.map((a, c) => (
              <text key={a} x={LABEL_W + c * 58 + 26} y={12} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--cc-table-head-ink)">{A_SHORT[a] ?? a}</text>
            ))}
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + 21.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {topics.map((t, r) => aCols.map((a, c) => {
              const v = aGrid.get(`${t}|${a}`) ?? 0;
              const dark = Math.sqrt(v / aMax) > 0.55;
              return (
                <g key={`${t}${a}`}>
                  <rect
                    x={LABEL_W + c * 58} y={r * RH + 18}
                    width={52} height={RH - 2} rx={3}
                    fill={heatFill(v, aMax)}
                    onMouseEnter={() => setCell({ t, a, v, kind: 'amode' })}
                    onMouseLeave={() => setCell(null)}
                  />
                  {v ? (
                    <text x={LABEL_W + c * 58 + 26} y={r * RH + 18 + RH / 2 + 3} textAnchor="middle" fontSize={9.5} fill={dark ? 'var(--cc-heat-text-light)' : 'var(--cc-heat-text-dark)'} pointerEvents="none">{v}</text>
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
          A 軸把粗軸的「待人工」欄拆成合憲附警告（P3）、純解釋（P5）、權限歸屬（P6）、不受理（P8）、位階審查（P9）等格。其中 {aAgentN} 件為 agent 逐件雙盲覆核，其餘 {aBridgeN} 件由粗軸換算（合憲→P1、違憲→P4、法令解釋→P5…）——換算無法細分限縮（P2）與附警告（P3），故 P2／P3 兩欄僅計已覆核件。
          A 軸為單選「主處分」（編碼本設計）：一件「部分違憲、部分合憲」的複合主文只計入主處分欄，其混合結構記在多值的 B 軸（部分違憲 B-B6）與 E 軸（部分不受理 E-E6），見卡片 chip 與 6 軸篩選。複合結構多發生在違憲案，而多數違憲案尚未套細軸（僅粗軸換算為 A-P4），故此矩陣尚看不到其部分結構。僅供分布觀察，個案以官方原文為準。
        </p>
      </section>
    </>
  );
}
