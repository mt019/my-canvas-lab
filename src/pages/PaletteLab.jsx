import React, { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy, Copy, Palette, Pin, RotateCcw, Sparkles } from 'lucide-react';
import {
  GOLD_FOIL_INK,
  PALETTES,
  TEXTURES,
  getSitePaletteId,
  getSiteTextureId,
  getTexture,
  setSitePalette,
  setSiteTexture,
  tokensSnippet,
} from '../styles/palettes.js';
import { POLLUTANT_TONES, SECTION_TONES, SEGMENT_FILLS } from '../styles/tone-candidates.js';

/*
 * 這個測驗不再生成任何顏色——上一版用公式硬算色塊，結果跟站內真正的色票庫（PALETTES，
 * 「試穿色票」那邊看起來都順眼的那些）是兩套不同的東西：公式套一個固定飽和度/明度到
 * 所有色相上，但每個色相能撐住不難看的飽和度/明度其實都不一樣，這正是專業配色系統
 * （Notion 的 tag 色、Radix Colors 之類）從來不用單一公式硬套的原因。改成：每個測驗選項
 * 的「墨色」（ink，實際看得見色相的那個顏色）都直接抄站內 PALETTES 裡已經有人挑過、
 * 用在真實頁面上的 accent／accent2 原始色碼；只有淡底色（bg）是算出來的，而淡底色不管
 * 什麼色相都很難出事——難看幾乎只在中高彩度才會發生。呈現方式也改成 Notion 風格的小
 * 標籤（淡底＋深墨色文字，不是實色色塊），never 一次擺三種色相互相撞色——pop／撞色在
 * 這個站的規矩本來就是「一畫面最多一處」，測驗不該逼使用者一次看三色打架。
 */

// hex → OKLCH，正向轉換（跟下面 tagTones 用的反向轉換矩陣同源），只用來幫 PALETTES
// 裡的真實色碼標色相角度/飽和度，好分組跟計分，不用來生成任何新顏色。
function hexToOklch(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const s2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [rl, gl, bl] = [r, g, b].map(s2lin);
  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const C = Math.hypot(a, bb);
  const H = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { L, C, H };
}

// OKLCH → sRGB hex（反向），只用來把某個真實色相的「淡底色」算出來——不生成 ink。
function oklchToHex(L, C, hueDeg) {
  const hr = (hueDeg * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gamma = (c) => { const cc = Math.max(0, Math.min(1, c)); return cc <= 0.0031308 ? 12.92 * cc : 1.055 * cc ** (1 / 2.4) - 0.055; };
  const toHex = (c) => Math.round(Math.max(0, Math.min(1, gamma(c))) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

// Notion 風格標籤色：ink 是真實色票原色（不動），bg 是同色相算出來的極淡底
function tagTones(hex) {
  const { C, H } = hexToOklch(hex);
  return { bg: oklchToHex(0.94, Math.min(C * 0.28, 0.045), H), ink: hex };
}

const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

// 8 個色相分組的目標角度／名字——只用來把 PALETTES 裡的真實色票分組，本身不是顏色
const HUE_BUCKETS = [
  { h: 15, name: '玫瑰胭脂' },
  { h: 40, name: '陶土銅棕' },
  { h: 150, name: '草木綠' },
  { h: 175, name: '茶青' },
  { h: 220, name: '鋼藍' },
  { h: 260, name: '靛藍' },
  { h: 300, name: '堇紫' },
  { h: 330, name: '紫紅' },
];

// 真實色票池：只收 accent／accent2，不收 pop——pop 定義就是「一畫面最多一處」的撞色裝飾，
// 不該進常態比較（這正是使用者說的「跳色」）。
const REAL_ACCENTS = PALETTES.flatMap((p) => {
  const list = [{ hex: p.vars.accent, from: p.id }];
  if (p.vars.accent2) list.push({ hex: p.vars.accent2, from: p.id });
  return list;
}).map((e) => ({ ...e, ...hexToOklch(e.hex) }));

// 每個分組挑站內離目標角度最近的一顆真實色票值——顏色本身完全不是算出來的
const HUE_ANCHORS = HUE_BUCKETS.map((bucket) => {
  const nearest = REAL_ACCENTS.reduce((best, e) => (hueDist(e.H, bucket.h) < hueDist(best.H, bucket.h) ? e : best));
  return { ...bucket, hex: nearest.hex, L: nearest.L, C: nearest.C, from: nearest.from };
});
const WARM_IDX = new Set([0, 1, 7]);

// 5 組：「同一色票裡設計好的 accent+accent2」vs「跨色票硬湊的兩個 accent」
const HARMONY_SPEC = [
  { pid: 'rose', mismatchWith: 'greengage' },
  { pid: 'terracotta', mismatchWith: 'ru-ware' },
  { pid: 'indigo-copper', mismatchWith: 'wheatfield' },
  { pid: 'cool-teal', mismatchWith: 'yanzhi' },
  { pid: 'dai-blue', mismatchWith: 'mango' },
];
const paletteVars = (id) => PALETTES.find((p) => p.id === id).vars;

// 底色情境：4 組真實取自 PALETTES 的紙面／鉻件底色，不新配顏色
const _rose = paletteVars('rose');
const _indigo = paletteVars('indigo-copper');
const _teal = paletteVars('cool-teal');
const CONTEXT_BG = [
  { hex: _rose.paper, name: '近白紙面' },
  { hex: _indigo.surface, name: '冷靛藍底' },
  { hex: _rose.surface, name: '暖玫瑰底' },
  { hex: _teal.surface, name: '冷茶青底' },
];
const CONTEXT_PAIRS = [
  { hueIdx: 0, bgA: 0, bgB: 1 }, // 玫瑰：紙面 vs 靛藍底
  { hueIdx: 3, bgA: 0, bgB: 2 }, // 茶青：紙面 vs 玫瑰底
  { hueIdx: 5, bgA: 0, bgB: 3 }, // 靛藍：紙面 vs 茶青底
  { hueIdx: 2, bgA: 2, bgB: 3 }, // 草木綠：玫瑰底 vs 茶青底
];

function buildTrials() {
  const trials = [];
  const n = HUE_ANCHORS.length;
  for (let i = 0; i < n; i++) {
    trials.push({ kind: 'hue', aIdx: i, bIdx: (i + 1) % n });
  }
  [[0, 4], [2, 6], [1, 7]].forEach(([i, j]) => trials.push({ kind: 'hue', aIdx: i, bIdx: j }));
  HARMONY_SPEC.forEach((_spec, idx) => trials.push({ kind: 'harmony', idx }));
  for (const pair of CONTEXT_PAIRS) {
    trials.push({ kind: 'context', ...pair });
  }
  return trials;
}

function trialSwatches(trial) {
  if (trial.kind === 'hue') {
    return {
      a: { tags: [tagTones(HUE_ANCHORS[trial.aIdx].hex)], tag: trial.aIdx },
      b: { tags: [tagTones(HUE_ANCHORS[trial.bIdx].hex)], tag: trial.bIdx },
    };
  }
  if (trial.kind === 'harmony') {
    const spec = HARMONY_SPEC[trial.idx];
    const p = paletteVars(spec.pid);
    const m = paletteVars(spec.mismatchWith);
    return {
      a: { tags: [tagTones(p.accent), tagTones(p.accent2)], tag: 'designed' },
      b: { tags: [tagTones(p.accent), tagTones(m.accent)], tag: 'mismatched' },
    };
  }
  // context：同一顆真實色票標籤放在兩種不同底色上，測的是「底色會不會影響這個顏色好不好看」
  const t = tagTones(HUE_ANCHORS[trial.hueIdx].hex);
  return {
    a: { tags: [t], bg: CONTEXT_BG[trial.bgA].hex, tag: trial.bgA },
    b: { tags: [t], bg: CONTEXT_BG[trial.bgB].hex, tag: trial.bgB },
  };
}

function scoreTaste(trials, picks) {
  const hueWins = HUE_ANCHORS.map(() => 0);
  const bgWins = CONTEXT_BG.map(() => 0);
  let designedPicks = 0, harmonyN = 0, contextN = 0, dL = 0, dC = 0, hueN = 0;
  trials.forEach((trial, i) => {
    const picked = picks[i];
    if (picked == null) return;
    const sw = trialSwatches(trial);
    const chosenTag = picked === 'a' ? sw.a.tag : sw.b.tag;
    if (trial.kind === 'hue') {
      hueWins[chosenTag] += 1;
      const otherTag = picked === 'a' ? sw.b.tag : sw.a.tag;
      dL += HUE_ANCHORS[chosenTag].L - HUE_ANCHORS[otherTag].L;
      dC += HUE_ANCHORS[chosenTag].C - HUE_ANCHORS[otherTag].C;
      hueN += 1;
    } else if (trial.kind === 'harmony') {
      harmonyN += 1;
      if (chosenTag === 'designed') designedPicks += 1;
    } else {
      contextN += 1;
      bgWins[chosenTag] += 1;
    }
  });
  const ranked = HUE_ANCHORS.map((h, i) => ({ ...h, wins: hueWins[i] })).sort((x, y) => y.wins - x.wins);
  const warmWins = HUE_ANCHORS.reduce((s, _, i) => s + (WARM_IDX.has(i) ? hueWins[i] : 0), 0) / WARM_IDX.size;
  const coolWins = HUE_ANCHORS.reduce((s, _, i) => s + (WARM_IDX.has(i) ? 0 : hueWins[i]), 0) / (HUE_ANCHORS.length - WARM_IDX.size);
  const bgRanked = CONTEXT_BG.map((b, i) => ({ ...b, wins: bgWins[i] })).sort((x, y) => y.wins - x.wins);
  return {
    ranked,
    chromaLean: hueN ? dC / hueN : null,
    lightnessLean: hueN ? dL / hueN : null,
    warmLean: warmWins - coolWins,
    designedPref: harmonyN ? designedPicks / harmonyN : null,
    bgRanked,
    contextN,
  };
}

function tasteSummaryText(result) {
  const topWithSource = result.ranked.slice(0, 3).map((h) => `${h.name}(${h.from})`).join('、');
  const bottom = result.ranked.slice(-2).map((h) => h.name).join('、');
  const chroma = result.chromaLean == null ? '未測' :
    result.chromaLean > 0.01 ? '選中的色相普遍比落選的更飽和一點' :
    result.chromaLean < -0.01 ? '選中的色相普遍比落選的更低調一點' :
    '飽和度沒有明顯偏好';
  const light = result.lightnessLean == null ? '未測' :
    result.lightnessLean > 0.02 ? '選中的色相普遍比落選的更淺淡' :
    result.lightnessLean < -0.02 ? '選中的色相普遍比落選的更深沉' :
    '明度沒有明顯偏好';
  const warm = result.warmLean > 0.3 ? '整體偏暖色' : result.warmLean < -0.3 ? '整體偏冷色' : '冷暖沒有明顯偏向';
  const harmony = result.designedPref == null ? '未測' :
    result.designedPref >= 0.7 ? '明顯偏好色票本身設計好的搭配，不喜歡跨色票硬湊' :
    result.designedPref <= 0.3 ? '對「硬湊的組合」意外地不排斥' :
    '兩種都能接受，沒有強烈偏好';
  const bgTop = result.bgRanked[0];
  const bgLine = result.contextN ? `同一個顏色放在不同底色上時，比較常選「${bgTop.name}」這組底色（${bgTop.wins}/${result.contextN}）——同一個顏色換底色可能就不耐看了，選色時建議連底色一起看，不要只看色塊本身。` : '未測';
  return `【色票品味測驗結果】（每個顏色都直接取自站內既有 PALETTES 色票庫，不是生成的）\n最愛色相（前三，附來源色票）：${topWithSource}\n最不愛色相（後二）：${bottom}\n飽和度傾向：${chroma}\n明度傾向：${light}\n冷暖傾向：${warm}（warmLean=${result.warmLean.toFixed(2)}）\n配色和諧偏好：${harmony}\n底色搭配：${bgLine}`;
}

const QUIZ_KEY = 'canvaslab:tastequiz:v3'; // v3：全面改抄 PALETTES 真實色票，不再生成任何顏色，跟舊題組不相容

/*
 * 色票試穿間。鐵律：色票管裝飾與框架，正文閱讀面永遠近白——
 * demo 右欄就是這個規則的示範：外框吃 surface 色，閱讀區坐在 paper 上。
 * 「設為全站配色」把選定票寫進 localStorage 並套到 :root 的 --c-* token，
 * 全站吃全域 token 的頁面即時換裝；各頁自己的識別色票不受影響。
 */

const ORIGIN_ORDER = ['站內', '名畫', '器物', '水果', '中國色'];

const DEMO_ROWS = [
  { title: '憲法法庭案例庫', desc: '813 件釋字與裁判的主題檢索、意見書網絡', tag: '研究' },
  { title: 'ECFA 研究地圖', desc: '前史、官方文本、早收產品與 2024 中止範圍', tag: '研究' },
  { title: '國際稅法研究桌', desc: 'OECD、UN、洛桑稅法圈與前沿監測', tag: '研究' },
  { title: '翻譯工程總覽', desc: '判決、文學、書籍與法規的進度與公版全文', tag: '翻譯' },
];

function TasteQuiz() {
  const trials = useMemo(() => buildTrials(), []);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState(() => trials.map(() => null));
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      const raw = localStorage.getItem(QUIZ_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const done = step >= trials.length;
  const result = useMemo(() => (done ? scoreTaste(trials, picks) : null), [done, trials, picks]);

  useEffect(() => {
    if (!done || !result) return;
    try {
      const record = { picks, completedAt: new Date().toISOString() };
      localStorage.setItem(QUIZ_KEY, JSON.stringify(record));
      setSaved(record);
    } catch { /* localStorage unavailable */ }
  }, [done, result, picks]);

  const pick = (side) => {
    setPicks((p) => { const next = [...p]; next[step] = side; return next; });
    setStep((s) => s + 1);
  };

  const restart = () => {
    setStep(0);
    setPicks(trials.map(() => null));
  };

  const copySummary = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(tasteSummaryText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  if (!done) {
    const trial = trials[step];
    const sw = trialSwatches(trial);
    const KIND_LABEL = { hue: '色相偏好', harmony: '配色和諧感', context: '底色情境' };
    const KIND_PROMPT = {
      hue: '比較喜歡哪一個顏色？（Aa 標籤取自站內真實色票，不是生成的）',
      harmony: '哪一組配色比較耐看？（色票本身設計好的搭配 vs 跨色票硬湊）',
      context: '同一個顏色，放在哪個底色上比較好看？',
    };
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--pl-ink-faint)' }}>
          {KIND_LABEL[trial.kind]}・第 {step + 1} / {trials.length} 題
        </div>
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--pl-surface)' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(step / trials.length) * 100}%`, background: 'var(--pl-accent)' }} />
        </div>
        <p className="mb-4 text-[14px]" style={{ color: 'var(--pl-ink-muted)' }}>{KIND_PROMPT[trial.kind]}</p>
        {/* Notion 風格：淡底＋深墨色文字的小標籤，不是實色色塊——每個 ink 都是站內
            PALETTES 裡已經在用的真實色碼，bg 只是同色相算出來的極淡底，never 三色並排撞色。 */}
        <div className="grid grid-cols-2 gap-4">
          {[['a', sw.a], ['b', sw.b]].map(([side, s]) => (
            <button
              key={side}
              onClick={() => pick(side)}
              className="flex h-28 items-center justify-center gap-2 overflow-hidden rounded-lg border transition-transform duration-150 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2"
              style={{ borderColor: 'var(--pl-line)', outlineColor: 'var(--pl-accent)', background: s.bg ?? 'var(--pl-paper)' }}
              aria-label={trial.kind === 'harmony' ? '選這組配色' : trial.kind === 'context' ? '選這個底色' : '選這個顏色'}
            >
              {s.tags.map((t, i) => (
                <span
                  key={i}
                  className="rounded-md border px-3 py-1.5 text-[13px] font-bold"
                  style={{ background: t.bg, color: t.ink, borderColor: `${t.ink}33` }}
                >
                  Aa
                </span>
              ))}
            </button>
          ))}
        </div>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="mt-5 text-[11px] font-bold uppercase tracking-wider hover:underline"
            style={{ color: 'var(--pl-ink-faint)' }}
          >
            ← 上一題重選
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={14} style={{ color: 'var(--pl-accent)' }} />
        <h2 className="font-display text-xl">你的色票品味</h2>
      </div>

      <div className="mb-5 rounded-lg border p-4" style={{ borderColor: 'var(--pl-line)', background: 'var(--pl-surface)' }}>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>色相排行</div>
        <div className="flex flex-wrap gap-2">
          {result.ranked.map((h, i) => (
            <span
              key={h.name}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold"
              style={{ borderColor: 'var(--pl-line)', background: 'var(--pl-paper)', opacity: i < 3 ? 1 : i >= result.ranked.length - 2 ? 0.45 : 0.75 }}
            >
              <i className="h-3 w-3 rounded-full" style={{ background: h.hex }} />
              {h.name}
              <span style={{ color: 'var(--pl-ink-faint)' }}>{h.wins}</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--pl-ink-faint)' }}>依對戰勝場排序，越靠前越常被選中；每個色相只比較 2-4 次，樣本小，當作粗略傾向看，不是精確排名。每個色點都是站內真實色票的原色，不是生成的。</p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--pl-line)' }}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>飽和度傾向</div>
          <p className="text-[13px]" style={{ color: 'var(--pl-ink-muted)' }}>
            {result.chromaLean > 0.01 ? '選中的比落選的更飽和一點' : result.chromaLean < -0.01 ? '選中的比落選的更低調一點' : '沒有明顯偏好'}
          </p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--pl-line)' }}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>明度傾向</div>
          <p className="text-[13px]" style={{ color: 'var(--pl-ink-muted)' }}>
            {result.lightnessLean > 0.02 ? '選中的比落選的更淺淡' : result.lightnessLean < -0.02 ? '選中的比落選的更深沉' : '沒有明顯偏好'}
          </p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--pl-line)' }}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>配色和諧偏好</div>
          <p className="text-[13px]" style={{ color: 'var(--pl-ink-muted)' }}>
            {result.designedPref >= 0.7 ? '明顯偏好色票設計好的搭配，不喜歡硬湊' : result.designedPref <= 0.3 ? '對硬湊的組合意外不排斥' : '兩種都能接受'}
          </p>
        </div>
        <div className="rounded-lg border p-4 sm:col-span-2" style={{ borderColor: 'var(--pl-line)' }}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>底色搭配（同一顏色換底色，好不好看會不會變）</div>
          <div className="flex flex-wrap gap-2">
            {result.bgRanked.map((b) => (
              <span key={b.name} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold" style={{ borderColor: 'var(--pl-line)', background: b.hex }}>
                {b.name}<span style={{ color: 'var(--pl-ink-faint)' }}>{b.wins}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--pl-ink-faint)' }}>
            這裡測的是同一顆色塊分別放在不同底色上時你選誰，不是底色本身好不好看——如果票數很集中在某個底色，代表你選色時對「搭配的底色」很敏感，不能只看色塊單獨長什麼樣子。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={copySummary}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-bold"
          style={{ background: 'var(--pl-accent)', color: 'var(--pl-paper)' }}
        >
          {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
          {copied ? '已複製' : '複製摘要（貼給 Claude 存成品味檔案）'}
        </button>
        <button
          onClick={restart}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-bold"
          style={{ borderColor: 'var(--pl-line)', color: 'var(--pl-ink-muted)' }}
        >
          <RotateCcw size={13} /> 重新測驗
        </button>
      </div>
      {saved && (
        <p className="mt-2 text-[10px]" style={{ color: 'var(--pl-ink-faint)' }}>
          結果已存在這台瀏覽器（{new Date(saved.completedAt).toLocaleString('zh-TW')}），下次開頁會記得。
        </p>
      )}
    </div>
  );
}

/*
 * 分類色候選（tone-candidates.js 的 18 對）。這裡不只是把色塊印出來——每一對都當場
 * 算 OKLCH 並對照 validate-color-system.mjs 的帶寬，超標的直接標出來。沒有這一欄的話，
 * 「好不好看」與「進不進得了系統」會被混為一談：這 18 對好看，但有四處超標。
 */
const BANDS = { txL: [0.46, 0.58], txC: [0.045, 0.13], bgL: [0.90, 0.97], bgC: [0, 0.035] };

function outOfBand(v, [lo, hi]) {
  return v < lo || v > hi;
}

function ToneRow({ name, bg, ink }) {
  const B = hexToOklch(bg);
  const I = ink ? hexToOklch(ink) : null;
  let hueGap = null;
  if (I) {
    const d = Math.abs(B.H - I.H);
    hueGap = Math.round(d > 180 ? 360 - d : d);
  }
  const flags = [];
  if (I && outOfBand(I.L, BANDS.txL)) flags.push(`墨色明度 ${I.L.toFixed(3)}`);
  if (I && outOfBand(I.C, BANDS.txC)) flags.push(`墨色彩度 ${I.C.toFixed(3)}`);
  if (outOfBand(B.L, BANDS.bgL)) flags.push(`底色明度 ${B.L.toFixed(3)}`);
  if (outOfBand(B.C, BANDS.bgC)) flags.push(`底色彩度 ${B.C.toFixed(3)}`);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b py-3 last:border-b-0" style={{ borderColor: 'var(--pl-line)' }}>
      {/* 實際用法的樣子：淡底填色＋同色相墨色細框與文字 */}
      <div
        className="flex h-9 w-32 shrink-0 items-center justify-center rounded-md border text-[12px] font-bold"
        style={{ background: bg, borderColor: ink ?? 'transparent', color: ink ?? 'var(--pl-ink-muted)' }}
      >
        {name}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="size-4 rounded-full" style={{ background: bg }} title={bg} />
        {ink ? <span className="size-4 rounded-full" style={{ background: ink }} title={ink} /> : null}
        <code className="ml-1 text-[11px]" style={{ color: 'var(--pl-ink-faint)' }}>
          {bg}{ink ? ` / ${ink}` : ''}
        </code>
      </div>
      <div className="shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums" style={{ color: 'var(--pl-ink-muted)' }}>
        底 L{B.L.toFixed(2)} H{Math.round(B.H)}
        {I ? `　墨 L${I.L.toFixed(2)} C${I.C.toFixed(3)} H${Math.round(I.H)}` : ''}
        {hueGap != null ? `　色相差 ${hueGap}°` : ''}
      </div>
      {flags.length ? (
        <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: 'var(--pl-surface)', color: 'var(--pl-pop)' }}>
          超標：{flags.join('、')}
        </span>
      ) : (
        <span className="text-[11px]" style={{ color: 'var(--pl-ink-faint)' }}>帶內</span>
      )}
    </div>
  );
}

function ToneCandidates() {
  const groups = [
    { label: '污染物識別色（原為實色色塊，底色偏深）', entries: Object.entries(POLLUTANT_TONES) },
    { label: '章節・條目・時間軸（較接近站內帶寬，是比較好的擴充候選）', entries: Object.entries(SECTION_TONES) },
  ];
  return (
    <div>
      <h2 className="font-display text-xl">分類色候選</h2>
      <p className="mt-2 max-w-3xl text-[14px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>
        這 18 對「淡底＋深墨」原本是空氣污染防制費頁自帶的識別色。它們同色相配對（色相差中位數約 8°）、
        墨色明度全部擠在 L 0.39–0.52，色相卻鋪滿整個色環——明度齊一負責和諧，色相多樣負責豐富。
        它靠的是把 hex 通道值鎖在一把量化梯子上（墨色每階 8、底色每階 4），不是逐個憑眼睛調。
      </p>
      <p className="mt-3 max-w-3xl text-[14px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>
        右邊標「超標」的，是照 <code>validate-color-system.mjs</code> 的帶寬實算出來的——<strong>好看與進得了系統是兩件事</strong>。
        要升進 tokens.css 的 Layer-0，得保留色相（色相才是身分）、把明度與彩度收進帶內。
      </p>

      {groups.map((g) => (
        <div key={g.label} className="mt-7">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--pl-ink-faint)' }}>
            {g.label}
          </div>
          {g.entries.map(([name, pair]) => (
            <ToneRow key={name} name={name} bg={pair.bg} ink={pair.ink} />
          ))}
        </div>
      ))}

      <div className="mt-7">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--pl-ink-faint)' }}>
          支出分段底色（當年只有底色，沒配墨色）
        </div>
        {Object.entries(SEGMENT_FILLS).map(([name, hex]) => (
          <ToneRow key={name} name={name} bg={hex} ink={null} />
        ))}
      </div>
    </div>
  );
}

export default function PaletteLab() {
  const [mode, setMode] = useState('browse');
  const [activeId, setActiveId] = useState(() => getSitePaletteId());
  const [siteId, setSiteId] = useState(() => getSitePaletteId());
  const [textureId, setTextureId] = useState(() => getSiteTextureId());
  const [copiedId, setCopiedId] = useState(null);
  const active = useMemo(() => PALETTES.find((p) => p.id === activeId), [activeId]);
  const texture = useMemo(() => getTexture(textureId), [textureId]);

  useEffect(() => {
    document.title = '色票試穿間 · Palette Lab';
  }, []);

  const v = active.vars;
  const style = {
    '--pl-paper': v.paper,
    '--pl-surface': v.surface,
    '--pl-ink': v.ink,
    '--pl-ink-muted': v.inkMuted,
    '--pl-ink-faint': v.inkFaint,
    '--pl-line': v.line,
    '--pl-accent': v.accent,
    '--pl-accent2': v.accent2,
    '--pl-pop': v.pop ?? v.accent2,
  };
  const foil = active.accentGradient ?? null;

  const copy = async (p) => {
    try {
      await navigator.clipboard.writeText(tokensSnippet(p));
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch { /* clipboard unavailable */ }
  };

  const pin = (p) => {
    setSitePalette(p.id);
    setSiteId(p.id);
  };

  const pickTexture = (t) => {
    setSiteTexture(t.id);
    setTextureId(t.id);
  };

  const textureStyle = texture && texture.id !== 'none'
    ? { backgroundImage: texture.css, backgroundSize: texture.size ?? 'auto' }
    : {};

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{ ...style, background: 'var(--pl-paper)', color: 'var(--pl-ink)' }}
    >
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-[13px]" style={{ color: 'var(--pl-ink-faint)' }}>← Canvas Lab</a>
        <div className="mb-1 mt-3 flex items-center gap-2 font-accent text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--pl-accent)' }}>
          <Palette size={13} /> Palette Lab
        </div>
        <h1 className="font-display text-3xl leading-tight">色票試穿間</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>
          點左欄試穿，右欄即時換裝。看順眼了按 <Pin size={12} className="inline" />「設為全站配色」——整站跟著換，記在這台瀏覽器。
          鐵律：色票只管框架與裝飾，<strong>大段正文的底永遠是近白的紙面</strong>。
        </p>

        <div className="mt-5 inline-flex rounded-md border p-0.5" style={{ borderColor: 'var(--pl-line)' }}>
          {[['browse', '試穿色票'], ['tones', '分類色候選'], ['quiz', '品味測驗']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className="rounded px-3 py-1.5 text-[12px] font-bold transition-colors duration-150"
              style={{
                background: mode === id ? 'var(--pl-accent)' : 'transparent',
                color: mode === id ? 'var(--pl-paper)' : 'var(--pl-ink-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'quiz' ? (
          <div className="mt-8 rounded-lg border p-6 sm:p-8" style={{ borderColor: 'var(--pl-line)', background: 'var(--pl-surface)' }}>
            <TasteQuiz />
          </div>
        ) : mode === 'tones' ? (
          <div className="mt-8">
            <ToneCandidates />
          </div>
        ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
          {/* 色票清單（按來源分組）：lg 以上獨立捲動＋sticky，比對色票時右側預覽不會被捲走 */}
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
            <div className="mb-4">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--pl-ink-faint)' }}>紙面材質</div>
              <div className="flex flex-wrap gap-1.5">
                {TEXTURES.map((t) => {
                  const isOn = t.id === textureId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => pickTexture(t)}
                      title={t.story}
                      className="rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors duration-150"
                      style={{
                        borderColor: isOn ? 'var(--pl-accent)' : 'var(--pl-line)',
                        color: isOn ? 'var(--pl-accent)' : 'var(--pl-ink-muted)',
                        background: 'var(--pl-paper)',
                        backgroundImage: t.id !== 'none' ? t.css : undefined,
                        backgroundSize: t.size ?? 'auto',
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--pl-ink-faint)' }}>程式生成、極低透明度；選定即套用全站紙面。</p>
            </div>
            {ORIGIN_ORDER.map((origin) => (
              <div key={origin} className="mb-4">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--pl-ink-faint)' }}>{origin}</div>
                <div className="space-y-1.5">
                  {PALETTES.filter((p) => p.origin === origin).map((p) => {
                    const isActive = p.id === activeId;
                    const isSite = p.id === siteId;
                    return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveId(p.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setActiveId(p.id); }}
                        className="block w-full cursor-pointer rounded-md border px-3 py-2 text-left transition-colors duration-150"
                        style={{
                          borderColor: isActive ? 'var(--pl-accent)' : 'var(--pl-line)',
                          background: isActive ? 'var(--pl-surface)' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold">
                            {p.name}
                            {isSite && (
                              <span className="ml-1.5 rounded px-1 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider" style={{ background: 'var(--pl-accent)', color: 'var(--pl-paper)' }}>
                                全站
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 gap-1">
                            {['paper', 'surface', 'line', 'inkMuted', 'accent', 'accent2', 'pop'].filter((k) => p.vars[k]).map((k) => (
                              <span
                                key={k}
                                className="h-3.5 w-3.5 rounded-full border"
                                style={{
                                  background: k === 'accent' && p.accentGradient ? p.accentGradient : p.vars[k],
                                  borderColor: 'rgba(0,0,0,0.12)',
                                }}
                              />
                            ))}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>{p.story}</div>
                        <div className="mt-1 flex items-center gap-3">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); pin(p); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); pin(p); } }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:underline"
                            style={{ color: 'var(--pl-accent)' }}
                          >
                            <Pin size={11} /> {isSite ? '現行全站' : '設為全站配色'}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); copy(p); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); copy(p); } }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:underline"
                            style={{ color: 'var(--pl-ink-faint)' }}
                          >
                            {copiedId === p.id ? <Check size={11} /> : <Copy size={11} />}
                            {copiedId === p.id ? '已複製' : 'tokens.css'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 試穿樣本：外框吃 surface，閱讀區坐 paper——「色票作框、正文近白」的示範 */}
          <div className="self-start rounded-lg border p-4 sm:p-5" style={{ background: 'var(--pl-surface)', borderColor: 'var(--pl-line)' }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              {foil ? (
                <div className="foil-text font-accent text-[11px] font-bold uppercase tracking-[0.28em]" style={{ backgroundImage: foil }}>
                  Sample · {active.name}
                </div>
              ) : (
                <div className="font-accent text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: 'var(--pl-accent2)' }}>
                  Sample · {active.name}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${foil ? 'foil' : ''}`}
                  style={foil
                    ? { backgroundImage: foil, color: GOLD_FOIL_INK, textShadow: '0 1px 0 rgba(255,240,180,0.6)' }
                    : { background: 'var(--pl-accent)', color: 'var(--pl-paper)' }}
                >
                  主要動作
                </button>
                <button className="rounded-md border px-3 py-1.5 text-[12px] font-bold" style={{ borderColor: 'var(--pl-line)', color: 'var(--pl-ink-muted)', background: 'var(--pl-paper)' }}>次要</button>
              </div>
            </div>

            {/* 閱讀區：近白紙面（含所選材質） */}
            <div className="rounded-md border px-5 py-5 sm:px-6" style={{ background: 'var(--pl-paper)', borderColor: 'var(--pl-line)', ...textureStyle }}>
              <h2 className="font-display text-2xl leading-tight">研究地圖與資料層的一頁樣本</h2>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>
                這段是正文密度的段落，坐在近白的紙面上——色彩只出現在周圍的框架、badge 與
                <a href="#demo" className="underline decoration-1 underline-offset-2" style={{ color: 'var(--pl-accent)' }}>強調色</a>
                上，讀長文才不累。{active.story}
              </p>

              <div className="mt-4">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>密集列表</div>
                {DEMO_ROWS.map((row, i) => (
                  <div key={row.title} className="flex items-center justify-between gap-3 border-b py-2" style={{ borderColor: 'var(--pl-line)' }}>
                    <div className="flex min-w-0 items-center gap-2">
                      {/* 撞色示範：一個畫面最多一處 —— 只給第一列一顆 pop 標記 */}
                      {i === 0 && active.vars.pop && (
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--pl-pop)' }} title="撞色標記" />
                      )}
                      <span className="text-[13px] font-bold">{row.title}</span>
                      <span className="text-[12px]" style={{ color: 'var(--pl-ink-muted)' }}>{row.desc}</span>
                    </div>
                    {i === 0 && active.vars.pop ? (
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--pl-pop)', color: 'var(--pl-paper)' }}>
                        NEW
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: 'var(--pl-line)', color: 'var(--pl-accent)', background: 'var(--pl-surface)' }}>
                        {row.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_210px]">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>表格</div>
                  <table className="w-full border-collapse text-left text-[12px]">
                    <thead>
                      <tr className="border-b text-[10px] uppercase tracking-wide" style={{ borderColor: 'var(--pl-line)', color: 'var(--pl-ink-faint)' }}>
                        <th className="py-1.5 pr-3 font-bold">項目</th>
                        <th className="py-1.5 pr-3 text-right font-bold">數值</th>
                        <th className="py-1.5 text-right font-bold">占比</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[['消費稅', '15.91', '9.1%'], ['汽油稅', '53.80', '30.7%'], ['油價本體', '102.49', '58.6%']].map(([a, b, c]) => (
                        <tr key={a} className="border-b" style={{ borderColor: 'var(--pl-line)' }}>
                          <td className="py-1.5 pr-3 font-bold">{a}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums" style={{ color: 'var(--pl-ink-muted)' }}>{b}</td>
                          <td className="py-1.5 text-right tabular-nums" style={{ color: 'var(--pl-ink-faint)' }}>{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>元件</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['已核實', '待補來源', '早收清單'].map((t, i) => (
                      <span key={t} className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--pl-surface)', color: i === 1 ? 'var(--pl-accent2)' : 'var(--pl-accent)', border: '1px solid var(--pl-line)' }}>{t}</span>
                    ))}
                  </div>
                  <blockquote className="mt-3 border-l-2 pl-3 text-[12px] italic leading-relaxed" style={{ borderColor: 'var(--pl-accent)', color: 'var(--pl-ink-muted)' }}>
                    「引文的樣子：低彩度的世界裡，強調色只出現在該出現的地方。」
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
