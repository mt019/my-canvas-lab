import { useEffect, useMemo, useRef, useState } from 'react';

/*
 * 案件索引右欄的時間軸捲軸——縱向時間脊柱＋隨捲動連續滑動的焦點。
 *
 * 縱軸＝全部年份均分敷滿整條右欄（不留空、不擠在一端），順序吃工具欄的新→舊／舊→新。
 * 刻度長度＝那年件數，對數刻度（同「案件時間軸」頁的年度密度），件數多的年刻度長、少的短；
 * 不做「靠中間變長」的透鏡放大——那視覺不好看。背景淡色帶＝大時代，隨工具欄母體增減。
 *
 * 焦點：一枚小指標＋年份浮標，永遠指向你目前捲到的位置。位置用「分數索引」算——年索引＋
 * 該卡在那年裡的序位，所以捲過件數多的年份也一路連續滑，不會卡在同一格。焦點用
 * requestAnimationFrame 緩動追過去（阻尼，有重量、柔和收束、不過衝）。滑鼠移過會 highlight
 * 該年，點一下跳到那年第一件。只在 lg 以上出現。
 */

const TICK_MIN = 4;    // 最短刻度 px（件數最少的年）
const TICK_SPAN = 22;  // 最長刻度的額外長度 px（件數最多的年）
const PAD = 10;        // 上下留白 px
const MAX_STEP = 15;   // 每年間距上限 px：年份少（如統一解釋只 ~21 年）時不把尺拉滿整條、改壓短，避免刻度太稀疏
const SPINE_RIGHT = 13;// 脊柱距右緣 px
const FOCUS_LINE = 96; // 視窗上緣往下這麼多 px＝「目前在讀」的焦點線
const EASE = 0.12;     // 阻尼係數：每影格朝目標靠近的比例（小＝更綿、更有重量）

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function TimeRail({ years, posByJid, onJump }) {
  const wrapRef = useRef(null);
  const [railH, setRailH] = useState(0);
  const [focusF, setFocusF] = useState(0);     // 顯示中的分數焦點（阻尼後）
  const [focusYear, setFocusYear] = useState(null); // 焦點線上那張卡的實際年（浮標用，精確不飄）
  const [hoverIdx, setHoverIdx] = useState(null);

  const N = years.length;
  // 對數正規化：把 count∈[1,max] 映到刻度長度。count=1 也看得見，最多者最長。
  const logNorm = useMemo(() => {
    const max = Math.max(1, ...years.map((y) => y.count));
    const lo = Math.log10(0.72);
    const hi = Math.log10(max) + 0.04;
    return (c) => (Math.log10(Math.max(1, c)) - lo) / (hi - lo);
  }, [years]);

  const focusRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef(0);
  const hoverRef = useRef(null);
  const posRef = useRef(posByJid);
  posRef.current = posByJid;
  const nRef = useRef(N);
  nRef.current = N;

  const inner = Math.max(0, railH - 2 * PAD);
  const step = N ? Math.min(inner / N, MAX_STEP) : 0; // 年份多＝均分敷滿；年份少＝間距封頂、尺壓短不拉稀
  const yFor = (idx) => PAD + (idx + 0.5) * step;

  const animate = () => {
    const cur = focusRef.current;
    const tgt = targetRef.current;
    const next = cur + (tgt - cur) * EASE;
    if (Math.abs(tgt - next) < 0.004) {
      focusRef.current = tgt;
      setFocusF(tgt);
      rafRef.current = 0;
      return;
    }
    focusRef.current = next;
    setFocusF(next);
    rafRef.current = requestAnimationFrame(animate);
  };
  const setTarget = (idx) => {
    targetRef.current = clamp(idx, 0, Math.max(0, nRef.current - 1));
    if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
  };

  // 由捲動位置求焦點：焦點線上正在跨越的那張卡→它在時間軸的分數位置＋實際年。
  const focusFromScroll = () => {
    const cards = document.querySelectorAll('[data-jid][data-year]');
    let cur = null;
    for (const c of cards) {
      if (c.getBoundingClientRect().top - FOCUS_LINE <= 0) cur = c;
      else break;
    }
    if (!cur) return cards.length ? { pos: 0, year: null } : null;
    const jid = cur.getAttribute('data-jid');
    const pos = posRef.current.get(jid);
    const year = Number(cur.getAttribute('data-year'));
    return pos == null ? null : { pos, year };
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRailH(el.clientHeight));
    ro.observe(el);
    setRailH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (hoverRef.current != null || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const f = focusFromScroll();
        if (f) { setTarget(f.pos); if (f.year != null) setFocusYear(f.year); }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    setTarget(clamp(targetRef.current, 0, Math.max(0, N - 1)));
    const f = focusFromScroll();
    if (f) { setTarget(f.pos); if (f.year != null) setFocusYear(f.year); }
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  // 清理：取消動畫並把 rafRef 歸零。StrictMode 的 mount→cleanup→remount 共用同一 ref，
  // 若 cancel 後不歸零，remount 後的 setTarget 會誤以為迴圈還在跑而永不重排（焦點卡住）。
  useEffect(() => () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; } }, []);

  if (!N || step <= 0) return N ? <div ref={wrapRef} className="h-full w-full" /> : null;

  const idxFromEvent = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    return clamp(Math.round((e.clientY - rect.top - PAD) / step - 0.5), 0, N - 1);
  };
  const onMove = (e) => setHoverIdx(idxFromEvent(e));
  const onLeave = () => { hoverRef.current = null; setHoverIdx(null); };
  const onClick = (e) => onJump(years[idxFromEvent(e)]);

  // 時代帶：相鄰同 band 併成連續段。
  const bands = [];
  for (let i = 0; i < N; i++) {
    const b = years[i].band;
    const prev = bands[bands.length - 1];
    if (prev && prev.band === b) prev.end = i;
    else bands.push({ band: b, tone: years[i].tone, label: years[i].label, start: i, end: i });
  }

  // 浮標顯示的年：優先用焦點線那張卡的實際年（精確）；退回最接近焦點的格。
  const nearIdx = clamp(Math.round(focusF), 0, N - 1);
  const shownYear = hoverIdx != null ? years[hoverIdx] : (focusYear != null ? (years.find((y) => y.year === focusYear) ?? years[nearIdx]) : years[nearIdx]);
  const markY = hoverIdx != null ? yFor(hoverIdx) : yFor(focusF);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full cursor-pointer select-none"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="slider"
      aria-label="案件時間軸"
      aria-valuemin={years[N - 1]?.year}
      aria-valuemax={years[0]?.year}
      aria-valuenow={shownYear?.year}
    >
      {railH > 0 ? (
        <>
          {/* 大時代淡塗背景帶＋交界細線＋時代標 */}
          {bands.map((bd, i) => {
            const top = yFor(bd.start) - step / 2;
            const h = (bd.end - bd.start + 1) * step;
            return (
              <div key={`${bd.band}-${i}`} aria-hidden>
                <div className="absolute inset-x-0 rounded-[3px]" style={{ top, height: h, background: `var(--cat-${bd.tone}-bg)`, opacity: 0.38 }} />
                {i > 0 ? <div className="absolute inset-x-0" style={{ top, height: 1, background: 'var(--cc-line)' }} /> : null}
                {h > 30 ? (
                  <span className="absolute left-0 text-[9.5px] font-bold tracking-tight" style={{ top: top + 3, color: `var(--cat-${bd.tone}-tx)`, opacity: 0.7 }}>
                    {bd.label}
                  </span>
                ) : null}
              </div>
            );
          })}

          {/* 脊柱 */}
          <div className="absolute top-0 bottom-0" style={{ right: SPINE_RIGHT, width: 1, background: 'var(--cc-line)' }} aria-hidden />

          {/* 年刻度：長度＝件數對數密度（不做透鏡放大） */}
          {years.map((y, i) => {
            const len = TICK_MIN + TICK_SPAN * clamp(logNorm(y.count), 0, 1);
            const isHover = i === hoverIdx;
            return (
              <div
                key={y.year}
                aria-hidden
                className="absolute"
                style={{
                  right: SPINE_RIGHT,
                  top: yFor(i),
                  width: len,
                  height: isHover ? 2.5 : 1.5,
                  transform: 'translateY(-50%)',
                  background: isHover ? 'var(--cc-ink-strong)' : `var(--cat-${y.tone}-tx)`,
                  opacity: isHover ? 0.95 : 0.62,
                  borderRadius: 2,
                }}
              />
            );
          })}

          {/* 十年整數的淡年標 */}
          {years.map((y, i) =>
            y.year % 10 === 0 ? (
              <span key={`dec-${y.year}`} aria-hidden className="absolute text-[8.5px] tabular-nums" style={{ right: SPINE_RIGHT + 5, top: yFor(i), transform: 'translateY(-50%)', color: 'var(--cc-ink-soft)', opacity: 0.5 }}>
                {String(y.year).slice(2)}
              </span>
            ) : null,
          )}

          {/* 焦點：脊柱上的圓點＋左側浮標（年・件數），隨捲動阻尼滑動 */}
          {shownYear ? (
            <>
              <div
                className="pointer-events-none absolute rounded-full ring-2 ring-white"
                style={{ right: SPINE_RIGHT - 3.5, top: markY, width: 7, height: 7, transform: 'translateY(-50%)', background: `var(--cat-${shownYear.tone}-tx)` }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute z-20 flex items-baseline gap-1.5 whitespace-nowrap rounded-md border border-[var(--cc-border)] bg-white/95 px-2 py-0.5 shadow-sm backdrop-blur"
                style={{ right: SPINE_RIGHT + 10, top: markY, transform: 'translateY(-50%)' }}
              >
                <span className="text-[13px] font-bold tabular-nums text-[var(--cc-ink-strong)]">{shownYear.year}</span>
                <span className="text-[10.5px] tabular-nums text-[var(--cc-ink-soft)]">{shownYear.count} 件</span>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
