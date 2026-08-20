import React, { useMemo, useState } from 'react';
import { oklchToHex, oklabDistance, SEPARATION_MIN } from '@phenomcanvas/ui/oklch';

/*
 * 配色四原理的可推版本。每一組都是「一支滑桿 ＋ 即時重算的色塊 ＋ 一個數字」，
 * 推到極端就看得到規則在擋什麼。數字全部當場從 OKLCH 算，不寫死。
 *
 * 這頁刻意不生成要拿去用的顏色——它示範的是規則本身，真正要進系統的墨色一律抄
 * 已審過的真實色碼（docs/DESIGN.md「配新分類色的土法」）。
 */

const INK = 'var(--pl-ink)';
const MUTED = 'var(--pl-ink-muted)';
const FAINT = 'var(--pl-ink-faint)';
const LINE = 'var(--pl-line)';

/* 隨互動變動的讀數：固定寬度＋不換行＋等寬數字（docs/DESIGN.md「會動的值」） */
function Readout({ children, w = 'w-24' }) {
  return (
    <span className={`${w} shrink-0 whitespace-nowrap text-right font-mono text-[12px] tabular-nums`} style={{ color: INK }}>
      {children}
    </span>
  );
}

function Slider({ label, value, min, max, step, onChange, readout, readoutWidth }) {
  return (
    <label className="mt-4 flex items-center gap-3">
      <span className="w-20 shrink-0 text-[12px]" style={{ color: MUTED }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full outline-none
                   [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--pl-ink)]
                   [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--pl-ink)]"
        style={{ background: LINE }}
      />
      <Readout w={readoutWidth}>{readout}</Readout>
    </label>
  );
}

function Block({ n, title, sub, children, note }) {
  return (
    <section className="mt-11 border-t pt-7" style={{ borderColor: LINE }}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: FAINT }}>原理 {n}</div>
      <h3 className="mt-1 font-display text-[17px]" style={{ color: INK }}>{title}</h3>
      <p className="mt-2 max-w-3xl text-[14px] leading-relaxed" style={{ color: MUTED }}>{sub}</p>
      {children}
      {note ? <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed" style={{ color: FAINT }}>{note}</p> : null}
    </section>
  );
}

/* ── 一、座標的選擇 ───────────────────────────────────────────── */
const DEMO_HUES = [
  { h: 95, hsl: 60, name: '黃' },
  { h: 150, hsl: 130, name: '綠' },
  { h: 265, hsl: 225, name: '藍' },
];

function Coordinates() {
  const [L, setL] = useState(0.62);
  const hslL = Math.round(L * 100);
  return (
    <Block
      n="一"
      title="同一個明度值在兩套座標裡的結果"
      sub="sRGB 與 HSL 的數值差距跟眼睛看到的差距沒有對應關係。上排是 OKLCH，三個色相共用同一個明度值；下排是 HSL，共用同一個 lightness。推滑桿看下排：黃色已經白掉的時候，藍色還是暗的。"
      note="OKLab 是為感知均勻擬合出來的座標，兩色之間的距離因此可以當成「差多少」來算。本站那條 0.05 門檻靠的就是這件事。"
    >
      <div className="mt-5 space-y-2">
        {[
          { tag: 'OKLCH', fill: (d) => oklchToHex(L, 0.09, d.h) },
          { tag: 'HSL', fill: (d) => `hsl(${d.hsl} 55% ${hslL}%)` },
        ].map((row) => (
          <div key={row.tag} className="flex items-center gap-3">
            <span className="w-14 shrink-0 font-mono text-[11px]" style={{ color: FAINT }}>{row.tag}</span>
            <div className="flex min-w-0 flex-1 gap-2">
              {DEMO_HUES.map((d) => (
                <div key={d.name} className="h-14 flex-1" style={{ background: row.fill(d) }} title={`${row.tag} ${d.name}`} />
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-3">
          <span className="w-14 shrink-0" />
          <div className="flex min-w-0 flex-1 gap-2">
            {DEMO_HUES.map((d) => (
              <span key={d.name} className="flex-1 text-center text-[11px]" style={{ color: FAINT }}>{d.name}</span>
            ))}
          </div>
        </div>
      </div>
      <Slider label="明度" value={L} min={0.35} max={0.92} step={0.01} onChange={setL}
        readout={`L ${L.toFixed(2)}　${hslL}%`} readoutWidth="w-28" />
    </Block>
  );
}

/* ── 二、明度齊一 ─────────────────────────────────────────────── */
const EIGHT = [356, 41, 86, 131, 176, 221, 266, 311];
/* 固定的偏移量，讓「拉散」每次長得一樣，推回去也回得到原狀 */
const JITTER = [0.22, -0.17, 0.09, -0.24, 0.15, -0.06, 0.20, -0.13];

function EqualLightness() {
  const [spread, setSpread] = useState(0);
  const tones = useMemo(() => EIGHT.map((h, i) => {
    const L = 0.52 + JITTER[i] * spread;
    return { h, L, tx: oklchToHex(L, 0.075, h), bg: oklchToHex(0.94, 0.016, h) };
  }), [spread]);
  const Ls = tones.map((t) => t.L);
  const range = Math.max(...Ls) - Math.min(...Ls);
  return (
    <Block
      n="二"
      title="明度拉散之後的八色"
      sub="眼睛讀畫面的順序是先明度、後色相。明度負責前後層次，色相負責身分。八個色的明度若不一致，有的往前跳、有的往後退，畫面就有洞；明度鎖在同一個值，色相才只剩下「這是哪一類」的功能。"
      note="全部壓成低彩度暖色是另一個極端，那等於連色相的身分功能也拿掉，只剩明度在做事。"
    >
      {/* 明度變動的是墨色，所以這裡畫實色塊——畫淡底看不出拉散，那組示範就白做了。
          下面那排標籤是實際用法（淡底＋墨色字），拉散之後對比度跟著壞掉。 */}
      <div className="mt-5 flex gap-2">
        {tones.map((t) => (
          <div key={t.h} className="h-20 flex-1" style={{ background: t.tx }} title={`L ${t.L.toFixed(2)}`} />
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {tones.map((t) => (
          <div key={t.h} className="h-7 flex-1 text-center text-[11px] leading-7" style={{ background: t.bg, color: t.tx }}>標籤</div>
        ))}
      </div>
      <Slider label="明度離散" value={spread} min={0} max={1} step={0.02} onChange={setSpread}
        readout={`極差 ${range.toFixed(3)}`} readoutWidth="w-24" />
      <p className="mt-1.5 text-[12px]" style={{ color: range > 0.10 ? 'var(--pl-pop)' : FAINT }}>
        {range > 0.10 ? `超出帶寬 0.10——這組不會通過 validate:colors` : '在帶寬 0.10 以內'}
      </p>
    </Block>
  );
}

/* ── 三、色相等距 ─────────────────────────────────────────────── */
/* 右端＝本站現行八支的實際色相，左端＝等距。中間是線性內插。 */
const CURRENT_HUES = [356, 358, 5, 80, 139, 182, 234, 293];

function EvenSpacing() {
  const [crowd, setCrowd] = useState(0);
  const hues = useMemo(() => EIGHT.map((even, i) => {
    let target = CURRENT_HUES[i];
    let d = target - even;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return (even + d * crowd + 360) % 360;
  }), [crowd]);
  const hexes = useMemo(() => hues.map((h) => oklchToHex(0.52, 0.075, h)), [hues]);
  const minD = useMemo(() => {
    let m = Infinity;
    for (let i = 0; i < hexes.length; i += 1) {
      for (let j = i + 1; j < hexes.length; j += 1) m = Math.min(m, oklabDistance(hexes[i], hexes[j]));
    }
    return m;
  }, [hexes]);
  const R = 96;
  return (
    <Block
      n="三"
      title="色環總距離的分配"
      sub="可辨識靠的是兩色之間的距離。總距離固定，八個色去分，等距時最小距離最大。任何擠在一起的排法必然在別處留洞，而擠在一起的那幾支讀成同一類。"
      note="本站現行八支擠在色相環的紅端，玫瑰 356 度、李 358 度、紅 5 度三支疊在 9 度內，對面 293 度到 356 度空著 63 度。"
    >
      <div className="mt-5 flex flex-wrap items-center gap-7">
        <svg viewBox="0 0 240 240" width="200" height="200" role="img" aria-label="八支色相在色環上的位置">
          <circle cx="120" cy="120" r={R} fill="none" stroke={LINE} />
          {hues.map((h, i) => {
            const a = ((h - 90) * Math.PI) / 180;
            const x = 120 + R * Math.cos(a);
            const y = 120 + R * Math.sin(a);
            return (
              <g key={i}>
                <line x1="120" y1="120" x2={x} y2={y} stroke={hexes[i]} strokeWidth="1.2" opacity="0.4" />
                <circle cx={x} cy={y} r="11" fill={hexes[i]} />
              </g>
            );
          })}
        </svg>
        <div className="flex min-w-0 flex-1 gap-2">
          {hexes.map((hex, i) => (
            <div key={i} className="h-20 flex-1" style={{ background: hex }} title={`${Math.round(hues[i])}°`} />
          ))}
        </div>
      </div>
      <Slider label="色相集中" value={crowd} min={0} max={1} step={0.02} onChange={setCrowd}
        readout={`最小 ${minD.toFixed(3)}`} readoutWidth="w-24" />
      <p className="mt-1.5 text-[12px]" style={{ color: minD < SEPARATION_MIN ? 'var(--pl-pop)' : FAINT }}>
        {minD < SEPARATION_MIN
          ? `最近的兩支低於 ${SEPARATION_MIN} 的門檻，無標籤時讀成同一類`
          : `八支都在 ${SEPARATION_MIN} 的門檻之上`}
      </p>
    </Block>
  );
}

/* ── 四、可辨門檻 ─────────────────────────────────────────────── */
function Threshold() {
  const [gap, setGap] = useState(45);
  const a = oklchToHex(0.52, 0.075, 356);
  const b = oklchToHex(0.52, 0.075, (356 + gap) % 360);
  const d = oklabDistance(a, b);
  const pass = d >= SEPARATION_MIN;
  return (
    <Block
      n="四"
      title="兩類之間的最小距離"
      sub="拉開兩支的色相，看感知距離怎麼變。低於 0.05 時，兩個色塊在沒有標籤的情況下讀成同一類。"
      note="分類色的支數因此不是想開幾支就開幾支。在本站的彩度帶內等距排列，第九支就掉到門檻以下。"
    >
      <div className="mt-5 flex items-stretch gap-1">
        <div className="h-20 flex-1" style={{ background: a }} />
        <div className="h-20 flex-1" style={{ background: b }} />
      </div>
      <Slider label="色相差" value={gap} min={0} max={90} step={1} onChange={setGap}
        readout={`${gap}°　${d.toFixed(3)}`} readoutWidth="w-28" />
      <p className="mt-1.5 text-[12px]" style={{ color: pass ? FAINT : 'var(--pl-pop)' }}>
        {pass ? '兩個色塊分得開' : `距離 ${d.toFixed(3)}，低於門檻 ${SEPARATION_MIN}`}
      </p>
    </Block>
  );
}

export default function Principles() {
  return (
    <div>
      <h2 className="font-display text-xl">配色的四條原理</h2>
      <p className="mt-2 max-w-3xl text-[14px] leading-relaxed" style={{ color: MUTED }}>
        本站的色票規則是三句話：明度齊一、彩度中低、色相多樣。下面四組都可以推。
      </p>
      <Coordinates />
      <EqualLightness />
      <EvenSpacing />
      <Threshold />
      <p className="mt-9 max-w-3xl border-t pt-6 text-[13.5px] leading-relaxed" style={{ borderColor: LINE, color: MUTED }}>
        八支是這三條規則同時成立的算術結果。要更多只有兩條路：彩度推到帶頂，或明度分兩圈，
        兩條都要拆掉上面其中一條規則。第九類開始靠形狀與標籤。
      </p>
    </div>
  );
}
