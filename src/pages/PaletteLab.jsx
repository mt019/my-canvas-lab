import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Palette } from 'lucide-react';

/*
 * 色票庫＋試穿間。點任一套色票，整頁 demo 版面即時換裝；
 * 「複製 tokens.css」把該票輸出成全站 token 片段。
 * demo 版面刻意做成密度樣本（列表、表格、badge、引文），
 * 看的是色票在真實 UI 的樣子，不是色塊。
 */

// token-exempt: 本頁通篇是色票資料與試穿樣本，hex 即內容本身。
const PALETTES = [
  {
    id: 'rose',
    name: '藕粉玫瑰',
    story: '首頁與翻譯工程現用。藕粉底、灰褐墨、深玫瑰點染。',
    origin: '站內',
    vars: { bg: '#fbf8f9', surface: '#f4edef', ink: '#332b30', inkMuted: '#74636a', inkFaint: '#a89ba0', line: '#eadde2', accent: '#8f6071', accent2: '#a77b89' },
  },
  {
    id: 'terracotta',
    name: '陶土粉',
    story: '空氣污染費頁現用。暖陶粉底、褐墨、一抹霧藍。',
    origin: '站內',
    vars: { bg: '#f5eceb', surface: '#faf6f5', ink: '#6b5b58', inkMuted: '#8a7a78', inkFaint: '#c5b4b2', line: '#e8d3d1', accent: '#b08060', accent2: '#4a6880' },
  },
  {
    id: 'indigo-copper',
    name: '靛藍銅',
    story: 'Manus–Meta 頁現用。冷靛藍為主、銅棕作對比點。',
    origin: '站內',
    vars: { bg: '#f2f4f8', surface: '#eef1fa', ink: '#3a4a5a', inkMuted: '#8892a8', inkFaint: '#b8c0d0', line: '#dde2ef', accent: '#3b4f78', accent2: '#b87333' },
  },
  {
    id: 'cool-teal',
    name: '冷灰茶青',
    story: '國際稅法研究桌現用。冷白工作台、淡淡的灰綠。',
    origin: '站內',
    vars: { bg: '#fbfcfd', surface: '#f4f7f8', ink: '#23262b', inkMuted: '#66707b', inkFaint: '#9aa3ad', line: '#e2e7eb', accent: '#4c7971', accent2: '#61799d' },
  },
  {
    id: 'morandi',
    name: 'Morandi 靜物',
    story: '喬治·莫蘭迪的瓶罐：粉塵般的灰調，彩度壓到將熄未熄。',
    origin: '名畫',
    vars: { bg: '#f6f4f0', surface: '#eeebe4', ink: '#46413a', inkMuted: '#7d766c', inkFaint: '#a49c90', line: '#dcd5c9', accent: '#9c7f6d', accent2: '#7e8a93' },
  },
  {
    id: 'monet',
    name: 'Monet 睡蓮',
    story: '橘園美術館那一圈水面：霧藍、水綠、一點薰衣草。',
    origin: '名畫',
    vars: { bg: '#f4f7f6', surface: '#e9f0ee', ink: '#35434a', inkMuted: '#5f7276', inkFaint: '#8fa0a2', line: '#cfdedb', accent: '#6a8caf', accent2: '#8ba081' },
  },
  {
    id: 'wheatfield',
    name: 'Van Gogh 麥田',
    story: '麥田群鴉的金與那條土路：暖金壓灰，藍只留天際一線。',
    origin: '名畫',
    vars: { bg: '#faf6ea', surface: '#f2ecd9', ink: '#4a4234', inkMuted: '#7a6f58', inkFaint: '#a89c80', line: '#e3d9bd', accent: '#a8862e', accent2: '#5b7290' },
  },
  {
    id: 'klimt',
    name: 'Klimt 金衣',
    story: '《吻》的金箔與深褐：金作點不作面，底色退成舊紙。',
    origin: '名畫',
    vars: { bg: '#f7f2e8', surface: '#efe7d6', ink: '#3d3226', inkMuted: '#6f6250', inkFaint: '#9c8d76', line: '#e2d7bf', accent: '#b08d3e', accent2: '#7c5a43' },
  },
  {
    id: 'hammershoi',
    name: 'Hammershøi 室內',
    story: '哥本哈根的灰色房間：光從窗簾漏進來的那種安靜。',
    origin: '名畫',
    vars: { bg: '#f2f2f1', surface: '#e9e9e7', ink: '#3a3d40', inkMuted: '#6b7074', inkFaint: '#989c9e', line: '#d4d6d5', accent: '#6e7b85', accent2: '#8a8577' },
  },
  {
    id: 'ru-ware',
    name: '汝窯天青',
    story: '「雨過天青雲破處」：宋瓷的青，釉下開片的淡金線。',
    origin: '器物',
    vars: { bg: '#f3f6f5', surface: '#e9efed', ink: '#2f3b3a', inkMuted: '#5c6f6d', inkFaint: '#8ba09d', line: '#ccd9d6', accent: '#6f9c93', accent2: '#a89078' },
  },
  {
    id: 'neutral-interim',
    name: '過渡中性（現行全站預設）',
    story: '選定前的安全牌：冷白、近黑、壓灰的深藍。',
    origin: '站內',
    vars: { bg: '#fdfdfc', surface: '#f6f7f8', ink: '#1f2328', inkMuted: '#57606a', inkFaint: '#848d97', line: '#d1d9e0', accent: '#3d5a80', accent2: '#4a6d8c' },
  },
];

const ROLE_MAP = {
  bg: '--c-paper',
  surface: '--c-surface',
  ink: '--c-ink',
  inkMuted: '--c-ink-muted',
  inkFaint: '--c-ink-faint',
  line: '--c-line',
  accent: '--c-accent',
  accent2: '--c-info',
};

function tokensSnippet(p) {
  const lines = Object.entries(ROLE_MAP).map(([k, cssVar]) => `  ${cssVar}: ${p.vars[k]};`);
  return `/* palette: ${p.name} (${p.id}) — from PaletteLab */\n:root {\n${lines.join('\n')}\n}`;
}

const DEMO_ROWS = [
  { title: '憲法法庭案例庫', desc: '813 件釋字與裁判的主題檢索、意見書網絡', tag: '研究' },
  { title: 'ECFA 研究地圖', desc: '前史、官方文本、早收產品與 2024 中止範圍', tag: '研究' },
  { title: '國際稅法研究桌', desc: 'OECD、UN、洛桑稅法圈與前沿監測', tag: '研究' },
  { title: '翻譯工程總覽', desc: '判決、文學、書籍與法規的進度與公版全文', tag: '翻譯' },
];

export default function PaletteLab() {
  const [activeId, setActiveId] = useState('rose');
  const [copiedId, setCopiedId] = useState(null);
  const active = useMemo(() => PALETTES.find((p) => p.id === activeId), [activeId]);

  useEffect(() => {
    document.title = '色票試穿間 · Palette Lab';
  }, []);

  const style = Object.fromEntries(
    Object.entries(active.vars).map(([k, v]) => [`--pl-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`, v]),
  );

  const copy = async (p) => {
    try {
      await navigator.clipboard.writeText(tokensSnippet(p));
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{ ...style, background: 'var(--pl-bg)', color: 'var(--pl-ink)' }}
    >
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-[13px]" style={{ color: 'var(--pl-ink-faint)' }}>← Canvas Lab</a>
        <div className="mb-1 mt-3 flex items-center gap-2 font-accent text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--pl-accent)' }}>
          <Palette size={13} /> Palette Lab
        </div>
        <h1 className="font-display text-3xl leading-tight">色票試穿間</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>
          點左欄任一套色票，右邊整個版面即時換裝。看順眼了按「複製 tokens.css」，那套就能成為全站預設。
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* 色票清單 */}
          <div className="space-y-1.5">
            {PALETTES.map((p) => {
              const isActive = p.id === activeId;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className="block w-full rounded-md border px-3 py-2 text-left transition-colors duration-150"
                  style={{
                    borderColor: isActive ? 'var(--pl-accent)' : 'var(--pl-line)',
                    background: isActive ? 'var(--pl-surface)' : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold">{p.name}</span>
                    <span className="flex shrink-0 gap-1">
                      {['bg', 'surface', 'line', 'inkMuted', 'accent', 'accent2'].map((k) => (
                        <span key={k} className="h-3.5 w-3.5 rounded-full border" style={{ background: p.vars[k], borderColor: 'rgba(0,0,0,0.12)' }} />
                      ))}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="text-[11px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>{p.story}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--pl-ink-faint)' }}>{p.origin}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); copy(p); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); copy(p); } }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:underline"
                      style={{ color: 'var(--pl-accent)' }}
                    >
                      {copiedId === p.id ? <Check size={11} /> : <Copy size={11} />}
                      {copiedId === p.id ? '已複製' : '複製 tokens.css'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 試穿樣本：密度版面 */}
          <div>
            {/* 標題區 */}
            <div className="border-b pb-5" style={{ borderColor: 'var(--pl-line)' }}>
              <div className="font-accent text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: 'var(--pl-accent2)' }}>
                Sample · {active.name}
              </div>
              <h2 className="mt-2 font-display text-2xl leading-tight">研究地圖與資料層的一頁樣本</h2>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: 'var(--pl-ink-muted)' }}>
                這段是正文密度的段落。長文的行距、灰階層次、連結的
                <a href="#demo" className="underline decoration-1 underline-offset-2" style={{ color: 'var(--pl-accent)' }}>強調色</a>
                都在這裡一次看清楚。{active.story}
              </p>
            </div>

            {/* 密集列表（GitHub 式） */}
            <div className="mt-5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--pl-ink-faint)' }}>密集列表</div>
              {DEMO_ROWS.map((row) => (
                <div key={row.title} className="flex items-center justify-between gap-3 border-b py-2" style={{ borderColor: 'var(--pl-line)' }}>
                  <div className="min-w-0">
                    <span className="text-[13px] font-bold">{row.title}</span>
                    <span className="ml-2 text-[12px]" style={{ color: 'var(--pl-ink-muted)' }}>{row.desc}</span>
                  </div>
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: 'var(--pl-line)', color: 'var(--pl-accent)', background: 'var(--pl-surface)' }}>
                    {row.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* 小表格＋按鈕列 */}
            <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_220px]">
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
                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-md px-3 py-1.5 text-[12px] font-bold" style={{ background: 'var(--pl-accent)', color: 'var(--pl-bg)' }}>主要動作</button>
                  <button className="rounded-md border px-3 py-1.5 text-[12px] font-bold" style={{ borderColor: 'var(--pl-line)', color: 'var(--pl-ink-muted)' }}>次要</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['已核實', '待補來源', '早收清單'].map((t, i) => (
                    <span key={t} className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--pl-surface)', color: i === 1 ? 'var(--pl-accent2)' : 'var(--pl-accent)', border: '1px solid var(--pl-line)' }}>{t}</span>
                  ))}
                </div>
                <blockquote className="mt-4 border-l-2 pl-3 text-[12px] italic leading-relaxed" style={{ borderColor: 'var(--pl-accent)', color: 'var(--pl-ink-muted)' }}>
                  「引文的樣子：低彩度的世界裡，強調色只出現在該出現的地方。」
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
