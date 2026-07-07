import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Palette, Pin } from 'lucide-react';
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

export default function PaletteLab() {
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* 色票清單（按來源分組） */}
          <div>
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
      </div>
    </div>
  );
}
