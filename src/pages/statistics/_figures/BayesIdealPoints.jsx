import { useState } from 'react';
import ChartFrame from '../../../components/lab/chart/ChartFrame';
import { linearScale } from '../../../components/lab/chart/scale';

/*
 * 投票層的貝氏理想點：19 位大法官的違憲宣告傾向，古典 MDS 位置（左欄，空心點、
 * 只有位置）與貝氏 GRM 估計（右欄，實心點＋90% 可信區間）並排、同人同序。顏色依提名
 * 總統（cat-1 / cat-2，設計系統固定順序）；識別另加二次編碼——古典空心 vs 貝氏實心、
 * 姓名直接標於左側，不靠顏色單獨承載。資料由 figures.json 帶入（抽自司法院計量母本
 * 立場表GRM.json + 立場表分析.json，非虛擬）。教學重點：右欄區間普遍很寬、彼此重疊，
 * 顏色交錯不成塊——同提名總統者在投票立場上並沒有站在一起。
 */
const COPY = {
  zh: {
    colClassical: '古典（只有位置）',
    colBayes: '貝氏（位置＋90% 可信區間）',
    axisNote: '越右＝越常投違憲',
    legendPrefix: '顏色＝提名總統：',
    caption: (c) =>
      `十九位大法官的違憲宣告傾向。左欄是古典多維標度法的位置，只有一個點；右欄是貝氏分級反應模型的估計，每個位置多一條 90% 可信區間。區間普遍很寬、相鄰彼此重疊，顏色（提名總統）交錯不成塊——同一位總統提名的大法官在投票立場上並沒有站在一起。貝氏 GRM：${c?.nJustices ?? 19} 位、${c?.nObs ?? 1388} 筆觀測，R̂ ${c?.rhat ?? 1.003}、0 divergent；傾向值與違憲側淨異議率相關 ${c?.corrNetDissent ?? 0.967}。`,
    hover: (r) =>
      `${r.name}（${r.president ?? '—'} 提名）：貝氏估計 ${r.theta >= 0 ? '+' : ''}${r.theta.toFixed(2)}、90% 可信區間 [${r.ciLo.toFixed(2)}, ${r.ciHi.toFixed(2)}]${r.classical != null ? `；古典位置 ${r.classical >= 0 ? '+' : ''}${r.classical.toFixed(2)}` : ''}`,
  },
  en: {
    colClassical: 'Classical (position only)',
    colBayes: 'Bayesian (position + 90% CI)',
    axisNote: 'right = more often votes to strike down',
    legendPrefix: 'colour = nominating president: ',
    caption: (c) =>
      `Each justice's tendency to vote for unconstitutionality. Left: classical MDS position, a single point. Right: Bayesian graded-response estimate with a 90% credible interval. The intervals are wide and overlap; colours (nominating president) interleave rather than clustering — justices nominated by the same president do not stand together on the merits. Bayesian GRM: ${c?.nJustices ?? 19} justices, ${c?.nObs ?? 1388} observations, R-hat ${c?.rhat ?? 1.003}, 0 divergent.`,
    hover: (r) =>
      `${r.name} (nominated by ${r.president ?? '—'}): Bayesian estimate ${r.theta >= 0 ? '+' : ''}${r.theta.toFixed(2)}, 90% CI [${r.ciLo.toFixed(2)}, ${r.ciHi.toFixed(2)}]${r.classical != null ? `; classical ${r.classical >= 0 ? '+' : ''}${r.classical.toFixed(2)}` : ''}`,
  },
};

export default function BayesIdealPoints({ justices = [], convergence = {}, lang = 'zh' }) {
  const [hov, setHov] = useState(null);
  const c = COPY[lang] ?? COPY.zh;
  if (!justices.length) return null;

  // 提名總統 → 類別色，依資料出現順序指派 cat-1、cat-2（設計系統固定順序）。純函數、
  // 每次由資料重算，無 module 層可變狀態（否則 re-render 時圖例會落空）。
  const presOrder = [...new Set(justices.map((j) => j.president).filter(Boolean))];
  const toneOf = (p) => `cat-${(presOrder.indexOf(p) % 8) + 1}`;
  const rows = justices
    .map((r) => ({ ...r, tone: toneOf(r.president) }))
    .sort((a, b) => a.theta - b.theta);

  const FW = 640;
  const NAME = 66;
  const CLS_W = 120;
  const GAP = 28;
  const top = 34;
  const rowH = 22;
  const FH = top + rows.length * rowH + 10;
  const BAY_X = NAME + CLS_W + GAP;
  const BAY_W = FW - BAY_X - 40;

  const clsVals = rows.map((r) => r.classical).filter((v) => v != null);
  const cScale = linearScale({ domain: [Math.min(...clsVals), Math.max(...clsVals)], range: [NAME, NAME + CLS_W] });
  const tLo = Math.min(...rows.map((r) => r.ciLo));
  const tHi = Math.max(...rows.map((r) => r.ciHi));
  const bScale = linearScale({ domain: [tLo, tHi], range: [BAY_X, BAY_X + BAY_W] });

  return (
    <figure className="my-6">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${FW} ${FH}`} role="img" style={{ width: '100%', height: 'auto', maxWidth: FW }}
          aria-label={lang === 'en' ? 'Classical and Bayesian ideal points of 19 justices, side by side' : '十九位大法官的古典與貝氏投票立場位置並排（貝氏含 90% 可信區間）'}>
          <text x={NAME} y={16} fontSize={11} fill="var(--c-ink-muted)">{c.colClassical}</text>
          <text x={BAY_X} y={16} fontSize={11} fill="var(--c-ink-muted)">{c.colBayes}</text>
          <line x1={cScale(0)} y1={top - 6} x2={cScale(0)} y2={top + rows.length * rowH} stroke="var(--c-line)" strokeWidth={1} />
          <line x1={bScale(0)} y1={top - 6} x2={bScale(0)} y2={top + rows.length * rowH} stroke="var(--c-line)" strokeWidth={1} />
          {rows.map((r, i) => {
            const y = top + i * rowH + rowH / 2;
            const ink = `var(--${r.tone}-tx)`;
            const fill = `var(--${r.tone}-bg)`;
            return (
              <g key={r.name} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
                <rect x={0} y={y - rowH / 2} width={FW} height={rowH} fill={hov === i ? 'var(--c-line-soft)' : 'transparent'} opacity={hov === i ? 0.6 : 1} />
                <text x={NAME - 8} y={y + 3} textAnchor="end" fontSize={10.5} fontWeight={700} fill={ink}>{r.name}</text>
                {r.classical != null ? (
                  <circle cx={cScale(r.classical)} cy={y} r={3.5} fill="var(--c-paper)" stroke={ink} strokeWidth={1.5} />
                ) : null}
                <line x1={bScale(r.ciLo)} y1={y} x2={bScale(r.ciHi)} y2={y} stroke={ink} strokeWidth={1.5} opacity={0.5} />
                <circle cx={bScale(r.theta)} cy={y} r={4} fill={fill} stroke={ink} strokeWidth={1.5} />
              </g>
            );
          })}
          <text x={BAY_X + BAY_W} y={FH - 2} textAnchor="end" fontSize={10} fill="var(--c-ink-faint, var(--c-ink-muted))">{c.axisNote} →</text>
        </svg>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--c-ink-muted)]">
        <span>{c.legendPrefix}</span>
        {presOrder.map((p) => (
          <span key={p} className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(--${toneOf(p)}-bg)`, border: `1.5px solid var(--${toneOf(p)}-tx)` }} />
            {p}
          </span>
        ))}
      </div>
      {hov != null ? (
        <div className="mt-1 rounded-token-md border border-line-soft bg-paper px-2.5 py-1 text-[12px] leading-snug text-ink">
          {c.hover(rows[hov])}
        </div>
      ) : null}
      <figcaption className="mt-2 text-[12.5px] leading-relaxed text-[var(--c-ink-muted)]">{c.caption(convergence)}</figcaption>
    </figure>
  );
}
