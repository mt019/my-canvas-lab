import { useState } from 'react';
import data from '../../data/constitutionalCourt.json';

// 資料一律來自資料倉：`職權分類摘要.釋字五年期` 由 classify-jurisdiction.mjs 產生、
// validate-jurisdiction.mjs 驗過合計 813 與年份連續。前端不自己分期、不自己加總。
const buckets = data.職權分類摘要?.釋字五年期 ?? [];

// 統一解釋的色相跟時間軸下緣那條職權色帶對齊（那裡 0% 端＝cat-5）。整張圖只有一個色相：
// 這是一條單一數列，不是分類比較。
const TONE = 5;
const STEM = `color-mix(in oklab, var(--cat-${TONE}-tx) 22%, var(--cat-${TONE}-bg))`;
const CAP = `var(--cat-${TONE}-tx)`;

const PAD_L = 30;
const PAD_T = 8;
const PAD_B = 34;
const W = 40; // 每期寬度
const H = 132; // 繪圖區高度

export default function JurisdictionShiftChart() {
  const [hover, setHover] = useState(null);
  if (!buckets.length) return null;

  const chartW = buckets.length * W;
  const svgW = PAD_L + chartW + 8;
  const svgH = PAD_T + H + PAD_B;
  const yAt = (pct) => PAD_T + H - (pct / 100) * H;

  return (
    <div>
      {/* Y 軸標題橫排放在軸頂，不旋轉 90 度立在側邊（DESIGN.md）。 */}
      <p className="text-[11.5px] text-[var(--cc-ink-soft)]">統一解釋佔該期釋字的百分比</p>
      {/* minWidth 讓窄螢幕橫向捲動，而不是把整張圖等比縮到字看不清：390px 的手機上，若讓 svg
          縮成 358px 寬（實測值），9.5px 的年份標籤會變成 5px 上下。寬的東西自己捲，別連字一起縮。 */}
      <div className="relative mt-1 overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMinYMin meet"
          role="img"
          aria-label={`釋字五年期統一解釋佔比長條圖，${buckets[0].起年} 至 ${buckets.at(-1).迄年}`}
          style={{ width: '100%', height: 'auto', maxWidth: svgW, minWidth: 560 }}
        >
          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line x1={PAD_L} y1={yAt(g)} x2={PAD_L + chartW} y2={yAt(g)} stroke="var(--cc-line)" strokeWidth={1} strokeOpacity={g === 0 ? 0.9 : 0.5} />
              <text x={PAD_L - 5} y={yAt(g) + 3} textAnchor="end" fontSize={9} fill="var(--cc-axis-text)">{g}</text>
            </g>
          ))}
          {buckets.map((row, i) => {
            const pct = (row.統一解釋法律及命令 / row.總數) * 100;
            const top = yAt(pct);
            const focus = hover?.起年 === row.起年;
            const dim = hover && !focus;
            // 長條的畫法照 TimelineView：茎＝淡彩實色填充、無外框；頂端一道 2.6px 的深墨小蓋
            // 承載色相辨識。淡出下限 0.82／0.6，再低淡色會整根消失。
            return (
              <g
                key={row.起年}
                transform={`translate(${PAD_L + i * W}, 0)`}
                onMouseEnter={() => setHover(row)}
                onMouseLeave={() => setHover(null)}
              >
                <rect x={0} y={PAD_T} width={W} height={H} fill="transparent" />
                {pct > 0 ? (
                  <>
                    <rect x={4} y={top} width={W - 8} height={PAD_T + H - top} rx={1} fill={STEM} opacity={dim ? 0.82 : 1} />
                    <rect x={4} y={top} width={W - 8} height={Math.min(2.6, PAD_T + H - top)} rx={1} fill={CAP} opacity={dim ? 0.6 : 1} />
                  </>
                ) : (
                  // 末期一件統一解釋都沒有。畫一條貼著軸底的細線，讓「這一期有資料而值是 0」
                  // 跟「這一期沒有資料」看得出差別。
                  <rect x={4} y={PAD_T + H - 1} width={W - 8} height={1} fill={CAP} opacity={0.45} />
                )}
                {i % 2 === 0 ? (
                  <text x={W / 2} y={PAD_T + H + 13} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{row.起年}</text>
                ) : null}
                <text x={W / 2} y={PAD_T + H + 27} textAnchor="middle" fontSize={9} fill="var(--cc-axis-text)" opacity={0.85} style={{ fontVariantNumeric: 'tabular-nums' }}>{row.總數}</text>
              </g>
            );
          })}
          <text x={PAD_L - 5} y={PAD_T + H + 27} textAnchor="end" fontSize={9} fill="var(--cc-axis-text)" opacity={0.85}>件數</text>
        </svg>
        {hover ? (
          // 標籤固定在圖頂正中、不跟游標移動：曲線右半段長期貼著軸底，圖的上緣右側恆是留白。
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
            <strong className="text-[var(--cc-ink-strong)]">{hover.起年}–{hover.迄年}</strong>
            {'　共 '}{hover.總數}{' 件　統一解釋 '}{hover.統一解釋法律及命令}{'　憲法解釋 '}{hover.憲法解釋}
            <span className="tabular-nums">{'　'}{((hover.統一解釋法律及命令 / hover.總數) * 100).toFixed(1)}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
