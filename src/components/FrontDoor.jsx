import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from './SeoHead';

/* The bare-domain front face. It is NOT the project index — that lives one level
   deeper at /all. The root shows a name that prints slightly out of register (a
   letterpress plate whose colour passes never quite line up) and glitches at
   random, and a Karl Kraus love-poem fragment. There is no visible button: the
   way in is the poem's own image — a "distant light with a near glow" that stays
   invisible until the cursor drifts near it, then blooms. You find the door the
   way the poem finds the beloved, by moving toward a light. Keyboard (Tab→Enter)
   and touch both still reach it. Palette is the home rose/mauve identity plus two
   muted channels sampled from the design tokens (plum, misty-blue). */

const DOOR_VARS = { // token-exempt: page-local identity, mirrors App.jsx HOME_VARS
  '--fd-bg': '#fbf8f9',
  '--fd-ink': '#332b30',
  '--fd-soft': '#5c4b53',
  '--fd-faint': '#a98f9a',
  '--fd-accent': '#a77b89',
  '--fd-plum': 'var(--tone-rose-tx)',   // --tone-plum-tx — one chromatic channel
  '--fd-blue': 'var(--c-info)',   // --c-info (misty blue) — the other channel
  '--fd-glow': '#c9a9b4',
};

const CSS = `
.fd-root{position:relative;min-height:100vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;overflow:hidden;
  padding-bottom:22vh;/* lift the hero so the light lives in clear space below it */
  background:var(--fd-bg);color:var(--fd-ink);font-family:var(--font-display);}
/* faint horizontal engraving lines — the "plate" texture, barely there */
.fd-root::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;
  background:repeating-linear-gradient(0deg,rgba(51,43,48,.026) 0 1px,transparent 1px 4px);
  mix-blend-mode:multiply;opacity:.6;}
.fd-stage{position:relative;z-index:1;display:flex;flex-direction:column;
  align-items:center;gap:1.9rem;padding:2rem;text-align:center;max-width:34rem;}
.fd-eyebrow{display:flex;align-items:center;justify-content:center;gap:.9em;
  font-family:var(--font-accent);font-size:11px;font-weight:700;
  letter-spacing:.32em;text-transform:uppercase;color:var(--fd-accent);opacity:.75;}
/* separator + word-space drawn in CSS — the accent subset has no ·/space glyph */
.fd-dot{flex:none;width:3px;height:3px;border-radius:50%;background:currentColor;
  opacity:.55;margin-left:-.32em;}
.fd-word{display:inline-flex;gap:.5em;}
.fd-name{position:relative;display:inline-block;
  font-size:clamp(3rem,13vw,7rem);font-weight:600;line-height:.9;
  letter-spacing:.01em;color:var(--fd-ink);}
.fd-name::before,.fd-name::after{content:attr(data-text);position:absolute;
  left:0;top:0;width:100%;pointer-events:none;mix-blend-mode:multiply;}
.fd-name::before{color:var(--fd-plum);transform:translate(-.6px,.4px);opacity:.5;}
.fd-name::after{color:var(--fd-blue);transform:translate(.6px,-.4px);opacity:.42;}
.fd-name.is-glitch::before{animation:fd-a .3s steps(3,end) both;}
.fd-name.is-glitch::after{animation:fd-b .3s steps(3,end) both;}
.fd-name.is-glitch{animation:fd-jit .3s steps(3,end) both;}
@keyframes fd-a{
  0%{transform:translate(-.6px,.4px);clip-path:inset(0 0 82% 0);}
  30%{transform:translate(-5px,1px);clip-path:inset(16% 0 44% 0);}
  55%{transform:translate(4px,-1px);clip-path:inset(58% 0 12% 0);}
  80%{transform:translate(-3px,0);clip-path:inset(34% 0 52% 0);}
  100%{transform:translate(-.6px,.4px);clip-path:inset(0 0 0 0);}}
@keyframes fd-b{
  0%{transform:translate(.6px,-.4px);clip-path:inset(0 0 70% 0);}
  30%{transform:translate(5px,-1px);clip-path:inset(48% 0 8% 0);}
  55%{transform:translate(-4px,1px);clip-path:inset(10% 0 66% 0);}
  80%{transform:translate(3px,0);clip-path:inset(60% 0 20% 0);}
  100%{transform:translate(.6px,-.4px);clip-path:inset(0 0 0 0);}}
@keyframes fd-jit{0%,100%{transform:translate(0,0);}30%{transform:translate(1px,-1px);}
  55%{transform:translate(-1px,1px);}80%{transform:translate(1px,0);}}
/* the poem — set in the body Ming face, quiet and left-aligned as a block */
.fd-poem{font-family:var(--font-body);text-align:left;}
.fd-poem-de{font-size:1.02rem;line-height:1.8;font-style:italic;color:var(--fd-soft);
  letter-spacing:.01em;}
.fd-poem-zh{margin-top:.9rem;font-size:.82rem;line-height:1.9;color:var(--fd-faint);
  letter-spacing:.03em;}
.fd-cite{margin-top:1.1rem;font-family:var(--font-accent);font-size:9.5px;font-weight:700;
  letter-spacing:.24em;text-transform:uppercase;color:var(--fd-faint);opacity:.8;
  text-align:left;display:flex;align-items:center;gap:.9em;}
/* the hidden door: an ink word that surfaces as the cursor nears the empty band
   below the poem. No glow anywhere — the whole page is ink on paper. The word is
   set in the Ming italic, matching the poem's German lines. */
.fd-worddoor{position:absolute;left:50%;bottom:12%;transform:translateX(-50%);
  z-index:1;display:grid;place-items:center;padding:1.4rem 2.4rem;
  text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.fd-doorword{font-family:var(--font-display);text-transform:uppercase;font-weight:600;
  font-size:18px;letter-spacing:.4em;text-indent:.4em;color:var(--fd-soft);
  white-space:nowrap;
  /* near³：曲線更陡，游標要幾乎壓在上面才浮出來（原本是平方） */
  opacity:calc(var(--near,0)*var(--near,0)*var(--near,0));
  transition:opacity .4s ease;}
.fd-worddoor:focus-visible{outline:none;}
.fd-worddoor:focus-visible .fd-doorword{opacity:.85;}
/* 觸控裝置沒有游標，近接顯影不成立。原本固定露出 .42，等於在手機上它一直看得見；
   改成完全不露，改由長按（見 onPointerDown）與鍵盤兩條路進去。 */
.fd-worddoor.is-open .fd-doorword{opacity:.85;}
.fd-foot{position:absolute;bottom:1.4rem;left:0;right:0;z-index:1;
  display:flex;flex-direction:column;align-items:center;gap:.85rem;padding:0 1rem;}
.fd-tag{display:flex;align-items:center;justify-content:center;gap:.9em;
  font-family:var(--font-accent);font-size:10px;font-weight:700;letter-spacing:.28em;
  text-transform:uppercase;color:var(--fd-faint);opacity:.7;}
/* font credit — one inline line; each "· face" is a nowrap unit, so a narrow
   screen breaks only between faces, never mid-name and never an orphaned word */
.fd-credit{font-family:var(--font-body);font-size:10.5px;line-height:1.7;
  color:var(--fd-faint);opacity:.62;text-align:center;}
.fd-nb{white-space:nowrap;}
@media (prefers-reduced-motion:reduce){
  .fd-name.is-glitch::before,.fd-name.is-glitch::after,.fd-name.is-glitch{animation:none;}}
`;

export default function FrontDoor() {
  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const doorRef = useRef(null);
  // 近接顯影是給滑鼠的。這兩條是留給我自己、任何裝置都走得通的路：
  // 按 h（herein 的 h）叫出那個字，或在頁面上長按半秒。兩者都只是讓字浮出來，
  // 進去仍然要點它——所以它對誤觸依然是關著的。
  const [open, setOpen] = useState(false);

  // Random glitch bursts on the decorative nameplate.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let timer;
    const burst = () => {
      const el = nameRef.current;
      if (el) {
        el.classList.add('is-glitch');
        window.setTimeout(() => el.classList.remove('is-glitch'), 220 + Math.random() * 260);
      }
      timer = window.setTimeout(burst, 3500 + Math.random() * 5000);
    };
    timer = window.setTimeout(burst, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  // 鍵盤：按 h 切換那個字的顯影。在輸入框裡打字不算（素首頁沒有輸入框，但這條保險留著）。
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.key === 'h' || e.key === 'H') setOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 觸控：頁面上長按 600ms 叫出那個字。手指一離開就取消計時，所以一般點按不會誤觸發。
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let timer = 0;
    const start = () => { timer = window.setTimeout(() => setOpen(true), 600); };
    const cancel = () => { if (timer) { window.clearTimeout(timer); timer = 0; } };
    root.addEventListener('pointerdown', start);
    root.addEventListener('pointerup', cancel);
    root.addEventListener('pointercancel', cancel);
    root.addEventListener('pointermove', cancel);
    return () => {
      cancel();
      root.removeEventListener('pointerdown', start);
      root.removeEventListener('pointerup', cancel);
      root.removeEventListener('pointercancel', cancel);
      root.removeEventListener('pointermove', cancel);
    };
  }, []);

  // Proximity: the ink word surfaces as the cursor nears the hidden door.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let mx = -9999;
    let my = -9999;
    // 原本 210px，游標大略往下飄就會亮。收到 96px：要真的停在那一段空白上才顯影。
    // 這道門是給我自己走的，不是給隨手滑過的人看的。
    const RADIUS = 96;
    const apply = () => {
      raf = 0;
      const door = doorRef.current;
      if (door) {
        const r = door.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(mx - cx, my - cy);
        const near = Math.max(0, Math.min(1, 1 - dist / RADIUS));
        root.style.setProperty('--near', near.toFixed(3));
      }
    };
    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = window.requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fd-root" ref={rootRef} style={DOOR_VARS}>
      <SeoHead />
      <style>{CSS}</style>

      <div className="fd-stage">
        <p className="fd-eyebrow">
          <span>Phenom</span><i className="fd-dot" aria-hidden="true" />
          <span className="fd-word"><span>Canvas</span><span>Lab</span></span>
        </p>

        <span className="fd-name" ref={nameRef} data-text="Phenom" aria-label="Phenom">Phenom</span>

        <div className="fd-poem">
          <p className="fd-poem-de">
            Fernes Licht mit nahem Schein<br />
            wie ich mich auch lenke,<br />
            lockt es dich nicht dazusein,<br />
            wenn ich an dich denke?
          </p>
          <p className="fd-poem-zh">
            遠方的光，帶著近在眼前的光暈，<br />
            無論我如何轉動身軀，<br />
            它難道不誘惑你出現，<br />
            當我思念著你的時候？
          </p>
          <p className="fd-cite">
            <span className="fd-word"><span>Karl</span><span>Kraus</span></span>
            <i className="fd-dot" aria-hidden="true" />
            <span className="fd-word"><span>Fernes</span><span>Licht</span></span>
            <i className="fd-dot" aria-hidden="true" /><span>1922</span>
          </p>
        </div>
      </div>

      {/* The way in. An ink word, hidden until the cursor is near. */}
      <Link to="/all" className={`fd-worddoor${open ? ' is-open' : ''}`} ref={doorRef} aria-label="進入索引">
        <span className="fd-doorword" aria-hidden="true">herein</span>
      </Link>

      <footer className="fd-foot">
        <p className="fd-tag">
          <span>音樂</span><i className="fd-dot" aria-hidden="true" /><span>研究</span>
          <i className="fd-dot" aria-hidden="true" /><span>實驗</span>
        </p>
        <p className="fd-credit">
          以偏愛的字體排印：
          <span className="fd-nb">匯文明朝體 Huiwen Mincho</span>{' '}
          <span className="fd-nb">· Radio Newsman</span>{' '}
          <span className="fd-nb">· Erikas Farbband</span>{' '}
          <span className="fd-nb">· 昭源宋體 Chiron Sung HK</span>
        </p>
      </footer>
    </div>
  );
}
