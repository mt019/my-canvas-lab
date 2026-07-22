import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, ExternalLink, Maximize2, Minus, Plus } from 'lucide-react';
import collation from '../../data/daliyuanCollation.json';
import './CollationView.css';

const sourceOrder = ['Paddle繁體模型', 'Paddle新版模型', '維基文庫', '校定稿'];
const sourceShort = { Paddle繁體模型: '繁辨', Paddle新版模型: '新辨', 維基文庫: '維基', 校定稿: '校定' };

function splitDate(text) {
  const match = text?.match(/^(民國[^日]{1,20}日)([\s\S]*)$/);
  return match ? { date: match[1], body: match[2] } : { date: '', body: text ?? '' };
}

export default function CollationView() {
  const page = collation.樣本[0];
  const [zoom, setZoom] = useState(0.3);
  const [enhanced, setEnhanced] = useState(true);
  const zoomRef = useRef(0.3);
  const imageViewportRef = useRef(null);
  const comparisonViewportRef = useRef(null);
  const [horizontalScroll, setHorizontalScroll] = useState(0);
  const [horizontalMax, setHorizontalMax] = useState(0);
  const [globalCardWidth, setGlobalCardWidth] = useState(100);
  const [cardWidthOverrides, setCardWidthOverrides] = useState({});
  const clampZoom = (next) => Math.min(2.5, Math.max(0.25, next));
  const applyZoom = (next) => {
    const value = clampZoom(next);
    zoomRef.current = value;
    setZoom(value);
  };

  useEffect(() => {
    const viewport = imageViewportRef.current;
    if (!viewport) return undefined;
    const onPinch = (event) => {
      // Chromium 將觸控板捏合手勢送成 ctrl+wheel；普通雙指捲動不帶 ctrlKey，
      // 因而仍由 overflow 容器自然處理水平／垂直平移。
      if (!event.ctrlKey) return;
      event.preventDefault();
      const oldZoom = zoomRef.current;
      const nextZoom = clampZoom(oldZoom * Math.exp(-event.deltaY * 0.01));
      const rect = viewport.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const imageX = viewport.scrollLeft + localX;
      const imageY = viewport.scrollTop + localY;
      applyZoom(nextZoom);
      requestAnimationFrame(() => {
        const ratio = nextZoom / oldZoom;
        viewport.scrollLeft = imageX * ratio - localX;
        viewport.scrollTop = imageY * ratio - localY;
      });
    };
    viewport.addEventListener('wheel', onPinch, { passive: false });
    return () => viewport.removeEventListener('wheel', onPinch);
  }, []);

  useEffect(() => {
    const viewport = comparisonViewportRef.current;
    if (!viewport) return undefined;
    const measure = () => {
      const nextMax = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      setHorizontalMax(nextMax);
      setHorizontalScroll(Math.min(viewport.scrollLeft, nextMax));
    };
    const onScroll = () => setHorizontalScroll(viewport.scrollLeft);
    measure();
    viewport.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    for (const child of viewport.children) observer.observe(child);
    return () => {
      viewport.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);
  return (
    <div className="py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--cc-line)] pb-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] text-[var(--cc-eyebrow)]">原典校勘</p>
          <h2 className="mt-1 text-xl font-bold text-[var(--cc-title-ink)]">紙本、OCR 與維基逐頁對讀</h2>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
            紙本影像是第一證據；電腦辨識稿與維基文庫都尚待校對。只有完成兩次獨立核校的文字才會成為校定稿。
          </p>
        </div>
        <span className="rounded-full border border-[var(--cc-line)] bg-white px-3 py-1 text-[12px] font-bold text-[var(--cc-accent)]">{collation.狀態}</span>
      </div>

      <div className="grid items-start gap-4 pb-3 min-[680px]:grid-cols-[minmax(320px,370px)_minmax(0,1fr)]">
        <aside className="w-full min-[680px]:sticky min-[680px]:top-16">
          <div className="mb-2 flex items-end justify-between gap-2">
            <p className="text-[11.5px] leading-relaxed text-[var(--cc-ink-soft)]">第 {page.冊} 冊・PDF 第 {page.PDF頁} 頁・紙本第 {page.紙本頁} 頁</p>
            <span className="font-display text-[11px] font-bold tabular-nums text-[var(--cc-ink-soft)]">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--cc-line)] bg-white shadow-sm">
            <div className="flex items-center gap-1 border-b border-[var(--cc-line)] bg-white px-2 py-1.5">
              <button type="button" aria-label="縮小紙本" onClick={() => applyZoom(zoomRef.current - 0.1)} className="rounded p-1.5 text-[var(--cc-ink-mid)] hover:bg-[var(--cc-hover-bg)]"><Minus size={14} /></button>
              <button type="button" aria-label="放大紙本" onClick={() => applyZoom(zoomRef.current + 0.1)} className="rounded p-1.5 text-[var(--cc-ink-mid)] hover:bg-[var(--cc-hover-bg)]"><Plus size={14} /></button>
              <input aria-label="紙本縮放比例" type="range" min="25" max="250" step="1" value={Math.round(zoom * 100)} onChange={(event) => applyZoom(Number(event.target.value) / 100)} className="cc-control-range w-20" />
              <button type="button" onClick={() => applyZoom(1)} className="rounded px-2 py-1 text-[11px] font-bold text-[var(--cc-ink-mid)] hover:bg-[var(--cc-hover-bg)]">100%</button>
              <button type="button" onClick={() => applyZoom(0.3)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-[var(--cc-ink-mid)] hover:bg-[var(--cc-hover-bg)]"><Maximize2 size={11} />框寬</button>
              <button type="button" aria-pressed={enhanced} onClick={() => setEnhanced((value) => !value)} className="rounded border border-[var(--cc-line)] px-2 py-1 text-[11px] font-bold text-[var(--cc-ink-mid)] hover:bg-[var(--cc-hover-bg)]">{enhanced ? '清晰' : '原掃描'}</button>
              <a href={page.影像} target="_blank" rel="noreferrer" className="ml-auto rounded p-1.5 text-[var(--cc-accent)] hover:bg-[var(--cc-hover-bg)]" aria-label="另開紙本影像"><ExternalLink size={13} /></a>
            </div>
            <div ref={imageViewportRef} className="h-[560px] overflow-auto overscroll-contain bg-white">
              <img src={enhanced ? page.影像 : page.原掃描影像} alt="大理院解釋例全文第一冊紙本第二頁" className="block max-w-none" style={{ width: `${1177 * zoom}px`, height: 'auto' }} />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--cc-ink-soft)]">預設 30% 清晰閱讀；雙指滑動平移，觸控板捏合可連續縮放。疑似筆畫請切回原掃描核證。</p>
          <a className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-bold text-[var(--cc-accent)] hover:underline" href={collation.來源.網址} target="_blank" rel="noreferrer">國家圖書館原書 <ExternalLink size={11} /></a>
        </aside>

        <section ref={comparisonViewportRef} className="min-w-0 space-y-3 overflow-x-auto pb-2">
          <div className="sticky left-0 top-14 z-10 w-full space-y-1.5 border-y border-[var(--cc-line)] bg-white/95 px-2 py-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={13} className="shrink-0 text-[var(--cc-ink-soft)]" />
              <span className="w-[58px] shrink-0 text-[10.5px] font-bold text-[var(--cc-ink-soft)]">左右移動</span>
              <input
                type="range"
                aria-label="整體比較區左右移動"
                min="0"
                max={Math.max(1, horizontalMax)}
                step="1"
                value={Math.min(horizontalScroll, Math.max(1, horizontalMax))}
                disabled={horizontalMax === 0}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (comparisonViewportRef.current) comparisonViewportRef.current.scrollLeft = next;
                  setHorizontalScroll(next);
                }}
                className="cc-control-range min-w-0 flex-1"
              />
              <span className="w-10 shrink-0 text-right font-display text-[10px] tabular-nums text-[var(--cc-ink-soft)]">{horizontalMax ? Math.round((horizontalScroll / horizontalMax) * 100) : 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Maximize2 size={13} className="shrink-0 text-[var(--cc-ink-soft)]" />
              <span className="w-[58px] shrink-0 text-[10.5px] font-bold text-[var(--cc-ink-soft)]">全部卡寬</span>
              <input
                type="range"
                aria-label="全部辨識卡片寬度"
                min="30"
                max="100"
                step="1"
                value={globalCardWidth}
                onChange={(event) => {
                  setGlobalCardWidth(Number(event.target.value));
                  setCardWidthOverrides({});
                }}
                className="cc-control-range min-w-0 flex-1"
              />
              <span className="w-10 shrink-0 text-right font-display text-[10px] tabular-nums text-[var(--cc-ink-soft)]">{globalCardWidth}%</span>
            </div>
          </div>
          <details className="rounded-lg border border-[var(--cc-line)] bg-white px-3 py-2 text-[12px] text-[var(--cc-ink-mid)]">
            <summary className="cursor-pointer font-bold text-[var(--cc-title-ink)]">辨識版本說明</summary>
            <div className="mt-2 grid gap-1.5 leading-relaxed sm:grid-cols-2">
              <p><strong>繁辨</strong>：優先保留繁體字形，但仍可能錯認字形。</p>
              <p><strong>新辨</strong>：通常認出較多文字，但可能混入簡體字。</p>
              <p><strong>維基主文</strong>：維基文庫自稱取自司法院法學資料檢索系統；逐號頁多只收一段解釋文字，不是國圖掃描本的完整來函與覆函。</p>
              <p><strong>校定</strong>：兩次獨立核校完成後的版本；目前尚未建立。</p>
            </div>
          </details>
          <div className="space-y-3">{page.案件.map((item, caseIndex) => {
            return <section key={item.字號} className="w-fit border-b border-[var(--cc-line)] pb-3">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--cc-line)] pb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[9.5px] font-bold tracking-[0.08em] text-[var(--cc-ink-soft)]">案號</span>
                  <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">{item.字號}</h3>
                </div>
                <span className="h-4 w-px bg-[var(--cc-line)]" aria-hidden="true" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[9.5px] font-bold tracking-[0.08em] text-[var(--cc-ink-soft)]">日期</span>
                  <span className="text-[14px] text-[var(--cc-ink)]">{item.日期}</span>
                  <time className="text-[13px] tabular-nums text-[var(--cc-ink-mid)]" dateTime={item.日期ISO}>{item.日期ISO}</time>
                </div>
              </div>
              <p className="mb-1.5 text-[9.5px] font-bold tracking-[0.1em] text-[var(--cc-ink-soft)]">正文對照</p>
              <div className="flex gap-2">
                {sourceOrder.map((source) => {
                  const line = page.轉錄[source][caseIndex];
                  const comparisonText = line?.includes('｜') ? line.split('｜').slice(1).join('｜') : line;
                  const parts = splitDate(comparisonText);
                  const bodyLines = parts.body.split(/\n+/).filter(Boolean);
                  const caseNoIndex = bodyLines.findIndex((column) => /^[統统]字第.+號$/.test(column));
                  const caseNoCandidate = caseNoIndex >= 0 ? bodyLines[caseNoIndex] : '';
                  const contentLines = bodyLines.filter((_, index) => index !== caseNoIndex);
                  const dateHeading = parts.date ? `${parts.date}${contentLines[0] ?? ''}` : '';
                  const remainingLines = parts.date ? contentLines.slice(1) : contentLines;
                  const rawColumns = [...(caseNoCandidate ? [caseNoCandidate] : []), ...(dateHeading ? [dateHeading] : []), ...remainingLines];
                  const longestColumn = Math.max(7, ...rawColumns.map((column) => column.length));
                  // 每個 OCR 原始行就是紙本的一條竪欄；高度要容得下最長一欄，不能因卡片
                  // 高度不足而把同一行折到左邊、偽裝成下一欄。極端長欄才在卡內縱向捲動。
                  const cardHeight = Math.min(1100, Math.max(360, longestColumn * 15 + 54));
                  // 100% 的語意是「所有原始竪欄完整展開、卡內沒有橫向裁切」。每欄實際
                  // 佔寬約為 14px × 1.85 行距＋左右 padding＋分隔線，故以 36px 計。
                  const naturalCardWidth = Math.max(76, rawColumns.length * 36 + 28);
                  const cardKey = `${caseIndex}:${source}`;
                  const cardWidthPercent = cardWidthOverrides[cardKey] ?? globalCardWidth;
                  const cardWidth = Math.max(76, Math.round(naturalCardWidth * cardWidthPercent / 100));
                  return <div key={source} className="group/card flex shrink-0 flex-col border-l border-[var(--cc-line)] bg-white pl-2 pr-1" style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }} title={source}>
                    <div className="mb-1.5 border-b border-[var(--cc-row-border)] pb-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-[11.5px] font-bold text-[var(--cc-title-ink)]">{sourceShort[source]}</h4>
                        <span className="text-[9px] tabular-nums text-[var(--cc-ink-soft)] opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100">{cardWidthPercent}%</span>
                      </div>
                      <input
                        type="range"
                        aria-label={`${item.字號}${sourceShort[source]}卡片寬度`}
                        min="30"
                        max="100"
                        step="1"
                        value={cardWidthPercent}
                        onChange={(event) => setCardWidthOverrides((current) => ({ ...current, [cardKey]: Number(event.target.value) }))}
                        className="cc-card-width-range block"
                      />
                    </div>
                    {comparisonText ? <p className="min-h-0 flex-1 overflow-auto text-[14px] leading-[1.85] text-[var(--cc-ink-mid)]" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                      {caseNoCandidate ? <span className="block border-l border-[var(--cc-row-border)] px-1 text-[14px] font-bold text-[var(--cc-ink)]">{caseNoCandidate}</span> : null}
                      {dateHeading ? <span className="block border-l border-[var(--cc-row-border)] px-1 text-[14px] text-[var(--cc-ink)]">{dateHeading}</span> : null}
                      {remainingLines.map((column, columnIndex) => <span key={columnIndex} className="block border-l border-[var(--cc-row-border)] px-1 font-sans text-[14px] text-[var(--cc-ink)]">{column}</span>)}
                    </p> : <p className="min-h-0 flex-1 text-[12px] leading-relaxed text-[var(--cc-ink-soft)]" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>待兩次獨立核校</p>}
                  </div>;
                })}
              </div>
            </section>;
          })}</div>
          <div className="rounded-lg border border-dashed border-[var(--cc-line)] px-4 py-3">
            <p className="text-[12px] font-bold text-[var(--cc-title-ink)]">校勘提醒</p>
            <ul className="mt-1 ml-4 list-disc space-y-1 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{page.已知問題.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </section>
      </div>
    </div>
  );
}
