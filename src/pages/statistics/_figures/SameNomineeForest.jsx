import { useState } from 'react';
import { linearScale } from '../../../components/lab/chart/scale';

/*
 * 協作層的森林圖：同提名人對共同具名的效果，換八種算法設定各估一次。點＝勝算倍數
 * exp(beta)，橫線＝90% 可信區間 exp(CI)；1× 是「沒差」的參考線。單一序列、單一 hue
 * （cat-8 slate，淡底＋ink 細框），八列全在 1× 右邊、下界都大於 1＝結論換算法都成立。
 * 資料由 figures.json 帶入（抽自司法院計量母本 共同具名-TierB-{階層,穩健}.json，非虛擬）。
 */
const COPY = {
  zh: {
    ref: '1×（沒差）',
    caption: (m) =>
      `每一列是一種算法設定（不同共事門檻、年代控制、過度離散寫法）；點是同提名人效果的勝算倍數，橫線是 90% 可信區間。八條全部在「1×（沒差）」右邊、下界都大於 1——同一位總統提名的大法官每件共事案共同具名的勝算約高一點五倍，換算法都成立。貝氏階層二項模型，${m?.dyad ?? 111} 位法官、${m?.N ?? 1144} 對共事；種子 ${m?.seed ?? 20260718} 可重現。`,
    hover: (r) =>
      `${r.algo}（${r.note}）：勝算 ${Math.exp(r.beta).toFixed(2)}×、90% 可信區間 [${Math.exp(r.ciLo).toFixed(2)}, ${Math.exp(r.ciHi).toFixed(2)}]，效果為正的把握 ${Math.round(r.pgt0 * 100)}%`,
  },
  en: {
    ref: '1× (no effect)',
    caption: (m) =>
      `Each row is one algorithm setting (co-service threshold, era control, over-dispersion form). The dot is the same-nominee effect as an odds ratio, the bar its 90% credible interval. All eight sit to the right of "1× (no effect)" with lower bounds above 1 — justices nominated by the same president co-sign about 1.5× more often per shared case, and the result holds across settings. Bayesian hierarchical binomial model, ${m?.dyad ?? 111} justices, ${m?.N ?? 1144} co-serving pairs; seed ${m?.seed ?? 20260718}.`,
    hover: (r) =>
      `${r.algo} (${r.note}): odds ${Math.exp(r.beta).toFixed(2)}×, 90% CI [${Math.exp(r.ciLo).toFixed(2)}, ${Math.exp(r.ciHi).toFixed(2)}], P(effect > 0) = ${Math.round(r.pgt0 * 100)}%`,
  },
};

export default function SameNomineeForest({ rows = [], meta = {}, lang = 'zh' }) {
  const [hov, setHov] = useState(null);
  const c = COPY[lang] ?? COPY.zh;
  if (!rows.length) return null;

  const data = rows.map((r) => ({ ...r, or: Math.exp(r.beta), lo: Math.exp(r.ciLo), hi: Math.exp(r.ciHi) }));

  const FW = 640;
  const LBL = 168;
  const RGT = 60;
  const top = 24;
  const rowH = 30;
  const FH = top + data.length * rowH + 28;
  const dLo = 0.9;
  const dHi = Math.max(2.1, ...data.map((r) => r.hi));
  const x = linearScale({ domain: [dLo, dHi], range: [LBL, FW - RGT] });
  const ink = 'var(--cat-8-tx)';

  return (
    <figure className="my-6">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${FW} ${FH}`} role="img" style={{ width: '100%', height: 'auto', maxWidth: FW }}
          aria-label={lang === 'en' ? 'Forest plot of the same-nominee effect across eight algorithms' : '同提名人效果的森林圖（八種算法的勝算倍數與 90% 可信區間）'}>
          <line x1={x(1)} y1={top - 6} x2={x(1)} y2={top + data.length * rowH} stroke="var(--c-ink-muted)" strokeWidth={1} />
          <text x={x(1)} y={top - 9} textAnchor="middle" fontSize={10} fill="var(--c-ink-muted)">{c.ref}</text>
          {[1.5, 2].filter((t) => t <= dHi).map((t) => (
            <g key={t}>
              <line x1={x(t)} y1={top - 4} x2={x(t)} y2={top + data.length * rowH} stroke="var(--c-line)" strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
              <text x={x(t)} y={FH - 8} textAnchor="middle" fontSize={10} fill="var(--c-ink-muted)">{t}×</text>
            </g>
          ))}
          {data.map((r, i) => {
            const y = top + i * rowH + rowH / 2;
            return (
              <g key={r.algo} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
                <rect x={0} y={y - rowH / 2} width={FW} height={rowH} fill={hov === i ? 'var(--c-line-soft)' : 'transparent'} opacity={hov === i ? 0.6 : 1} />
                <text x={LBL - 8} y={y + 3} textAnchor="end" fontSize={10.5} fill="var(--c-ink)">{r.algo}</text>
                <line x1={x(r.lo)} y1={y} x2={x(r.hi)} y2={y} stroke={ink} strokeWidth={2} />
                <line x1={x(r.lo)} y1={y - 3.5} x2={x(r.lo)} y2={y + 3.5} stroke={ink} strokeWidth={1.5} />
                <line x1={x(r.hi)} y1={y - 3.5} x2={x(r.hi)} y2={y + 3.5} stroke={ink} strokeWidth={1.5} />
                <circle cx={x(r.or)} cy={y} r={4} fill="var(--cat-8-bg)" stroke={ink} strokeWidth={1.5} />
                <text x={FW - RGT + 6} y={y + 3} textAnchor="start" fontSize={10} fill="var(--c-ink-muted)">{r.or.toFixed(2)}×</text>
              </g>
            );
          })}
        </svg>
      </div>
      {hov != null ? (
        <div className="mt-1 rounded-token-md border border-line-soft bg-paper px-2.5 py-1 text-[12px] leading-snug text-ink">
          {c.hover(data[hov])}
        </div>
      ) : null}
      <figcaption className="mt-2 text-[12.5px] leading-relaxed text-[var(--c-ink-muted)]">{c.caption(meta)}</figcaption>
    </figure>
  );
}
