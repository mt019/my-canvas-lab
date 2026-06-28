import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── CONFIG ────────────────────────────────────────────────────────────────────

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const WHITE_NOTES = ['C','D','E','F','G','A','B'];
const IS_BLACK = new Set(['C#','D#','F#','G#','A#']);
// Black key center position (in white-key-width units from start of octave)
const BLACK_POS = { 'C#': 0.60, 'D#': 1.40, 'F#': 3.60, 'G#': 4.50, 'A#': 5.40 };

const MIN_START_OCT = 1;
const MAX_START_OCT = 6;

// QWERTY → noteId (always anchored to C4 area)
const KEY_MAP = {
  a:'C4', w:'C#4', s:'D4', e:'D#4', d:'E4',
  f:'F4', t:'F#4', g:'G4', y:'G#4', h:'A4',
  u:'A#4', j:'B4', k:'C5', o:'C#5', l:'D5', p:'D#5',
};

const TIMBRES = {
  GRAND:      { name: '鋼琴',  sub: 'Grand Piano' },
  RHODES:     { name: '電鋼琴', sub: 'Rhodes EP' },
  ORGAN:      { name: '風琴',  sub: 'Hammond' },
  STRINGS:    { name: '弦樂',  sub: 'Strings' },
  MARIMBA:    { name: '木琴',  sub: 'Marimba' },
  VIBRAPHONE: { name: '鐵琴',  sub: 'Vibraphone' },
};

// ─── UTILITIES ─────────────────────────────────────────────────────────────────

function noteFreq(note, oct) {
  return 440 * Math.pow(2, ((oct + 1) * 12 + CHROMATIC.indexOf(note) - 69) / 12);
}

function parseId(id) {
  // e.g. "C#4" → ['C#', 4]   "D3" → ['D', 3]
  return [id.slice(0, -1), parseInt(id.slice(-1))];
}

function buildKeys(startOct, numOct) {
  const whites = [], blacks = [];
  let wi = 0;
  for (let o = startOct; o < startOct + numOct; o++) {
    const base = wi;
    for (const note of WHITE_NOTES) {
      whites.push({ note, oct: o, id: `${note}${o}`, wi: wi++ });
    }
    for (const [note, pos] of Object.entries(BLACK_POS)) {
      blacks.push({ note, oct: o, id: `${note}${o}`, pos: base + pos });
    }
  }
  const endOct = startOct + numOct;
  whites.push({ note: 'C', oct: endOct, id: `C${endOct}`, wi: wi++ });
  return { whites, blacks, totalWhite: wi };
}

// ─── SYNTHESIS ─────────────────────────────────────────────────────────────────

function createGrand(ctx, freq, dest) {
  const now = ctx.currentTime;
  const decay = Math.max(0.5, Math.min(3.5, 100 / freq)); // lower = longer
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.22, now);
  master.connect(dest);

  // Harmonic partials [ratio, amplitude, decayTime]
  for (const [r, amp, dur] of [
    [1,   1.00, 3.0 * decay],
    [2,   0.55, 2.0 * decay],
    [3,   0.22, 1.2 * decay],
    [4,   0.10, 0.7 * decay],
    [5.1, 0.04, 0.4 * decay],
  ]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * r, now);
    g.gain.setValueAtTime(amp, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + dur + 0.05);
  }
  return {
    stop() {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0.0001, t, 0.18);
    },
  };
}

function createRhodes(ctx, freq, dest) {
  const now = ctx.currentTime;
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const envGain = ctx.createGain();
  const tremoloGain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();

  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(freq, now);
  modulator.type = 'sine';
  modulator.frequency.setValueAtTime(freq, now); // 1:1 FM ratio

  // FM index: bright attack → warm sustain
  modGain.gain.setValueAtTime(freq * 5, now);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.6, now + 0.4);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.08, now + 4.0);

  // Amplitude envelope
  envGain.gain.setValueAtTime(0.0001, now);
  envGain.gain.exponentialRampToValueAtTime(0.30, now + 0.01);
  envGain.gain.exponentialRampToValueAtTime(0.18, now + 0.4);
  envGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

  // Tremolo: LFO adds to tremoloGain.gain (base 1.0)
  tremoloGain.gain.setValueAtTime(1.0, now);
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(5.2, now);
  lfoDepth.gain.setValueAtTime(0.06, now);
  lfo.connect(lfoDepth);
  lfoDepth.connect(tremoloGain.gain);

  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(envGain);
  envGain.connect(tremoloGain);
  tremoloGain.connect(dest);

  const life = now + 5.5;
  carrier.start(now);  carrier.stop(life);
  modulator.start(now); modulator.stop(life);
  lfo.start(now);       lfo.stop(life);

  return {
    stop() {
      const t = ctx.currentTime;
      envGain.gain.cancelScheduledValues(t);
      envGain.gain.setTargetAtTime(0.0001, t, 0.28);
    },
  };
}

function createOrgan(ctx, freq, dest) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.007);
  master.connect(dest);

  const drawbars = [
    [0.5, 0.5], [1, 1.0], [1.5, 0.8], [2, 0.9],
    [3, 0.35],  [4, 0.4], [5, 0.08],  [8, 0.12],
  ];
  const oscs = [];
  for (const [r, amp] of drawbars) {
    const f = freq * r;
    if (f > 20000) continue;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now);
    g.gain.setValueAtTime(amp, now);
    osc.connect(g); g.connect(master);
    osc.start(now);
    oscs.push(osc);
  }
  return {
    stop() {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0.0001, t, 0.018);
      setTimeout(() => { for (const o of oscs) try { o.stop(); } catch {} }, 200);
    },
  };
}

function createStrings(ctx, freq, dest) {
  const now = ctx.currentTime;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 7, 7000), now + 0.35);
  filter.frequency.setTargetAtTime(freq * 2.5, now + 0.5, 1.0);
  filter.Q.setValueAtTime(0.7, now);
  filter.connect(dest);

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.0001, now);
  envGain.gain.exponentialRampToValueAtTime(0.22, now + 0.35);
  envGain.connect(filter);

  const oscs = [];
  for (const det of [-7, 0, 7]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(det, now);
    g.gain.setValueAtTime(0.35, now);
    osc.connect(g); g.connect(envGain);
    osc.start(now);
    oscs.push(osc);
  }
  return {
    stop() {
      const t = ctx.currentTime;
      envGain.gain.cancelScheduledValues(t);
      envGain.gain.setTargetAtTime(0.0001, t, 0.35);
      setTimeout(() => { for (const o of oscs) try { o.stop(); } catch {} }, 1500);
    },
  };
}

function createMarimba(ctx, freq, dest) {
  const now = ctx.currentTime;
  const decayScale = Math.max(0.4, Math.min(1.0, 80 / freq));
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.30, now);
  master.connect(dest);

  for (const [r, amp, dur] of [
    [1,  1.00, 0.9 * decayScale],
    [4,  0.35, 0.45 * decayScale],
    [10, 0.15, 0.22 * decayScale],
  ]) {
    if (freq * r > 18000) continue;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * r, now);
    g.gain.setValueAtTime(amp, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + dur + 0.04);
  }
  return { stop() {} }; // natural decay
}

function createVibraphone(ctx, freq, dest) {
  const now = ctx.currentTime;
  const envGain = ctx.createGain();
  const tremoloGain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();

  // Decay envelope on output
  envGain.gain.setValueAtTime(0.0001, now);
  envGain.gain.exponentialRampToValueAtTime(0.26, now + 0.012);
  envGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

  // Tremolo: LFO → lfoDepth → tremoloGain.gain (base 1.0)
  tremoloGain.gain.setValueAtTime(1.0, now);
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(5.5, now);
  lfoDepth.gain.setValueAtTime(0.07, now);
  lfo.connect(lfoDepth);
  lfoDepth.connect(tremoloGain.gain);

  // Signal chain: partials → envGain → tremoloGain → dest
  envGain.connect(tremoloGain);
  tremoloGain.connect(dest);

  const life = now + 3.5;
  lfo.start(now); lfo.stop(life);

  for (const [r, amp] of [[1, 1.0], [3.98, 0.4]]) {
    if (freq * r > 18000) continue;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * r, now);
    g.gain.setValueAtTime(amp, now);
    osc.connect(g); g.connect(envGain);
    osc.start(now); osc.stop(life);
  }
  return {
    stop() {
      const t = ctx.currentTime;
      envGain.gain.cancelScheduledValues(t);
      envGain.gain.setTargetAtTime(0.0001, t, 0.28);
    },
  };
}

const SYNTHS = { GRAND: createGrand, RHODES: createRhodes, ORGAN: createOrgan,
                 STRINGS: createStrings, MARIMBA: createMarimba, VIBRAPHONE: createVibraphone };

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function ElectricPiano() {
  const [timbre, setTimbre] = useState('GRAND');
  const [startOct, setStartOct] = useState(3);
  const [activeIds, setActiveIds] = useState(new Set());
  const [containerWidth, setContainerWidth] = useState(0);

  const audioCtxRef = useRef(null);
  const voicesRef = useRef(new Map()); // pointerId → { noteId, stop }
  const timbreRef = useRef('GRAND');
  const mouseDownRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => { timbreRef.current = timbre; }, [timbre]);

  useEffect(() => {
    document.title = 'Klavier';
    return () => { document.title = 'Phenom Canvas Lab'; };
  }, []);

  // Measure keyboard container
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    update();
    const obs = new ResizeObserver(update);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Responsive: 1 octave on mobile, 2 on wider screens
  const numOct = containerWidth >= 560 ? 2 : 1;
  const { whites, blacks, totalWhite } = useMemo(
    () => buildKeys(startOct, numOct),
    [startOct, numOct],
  );

  const wkw = containerWidth > 0 ? Math.floor(containerWidth / totalWhite) : 44;
  const wkh = 148;
  const bkw = Math.max(14, Math.round(wkw * 0.58));
  const bkh = Math.round(wkh * 0.62);

  // ── Audio context ──────────────────────────────────────────────────────────

  const getCtx = useCallback(async () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx({ latencyHint: 'interactive' });
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // ── Note press/release ─────────────────────────────────────────────────────

  const pressKey = useCallback(async (noteId, pointerId) => {
    const existing = voicesRef.current.get(pointerId);
    if (existing?.noteId === noteId) return; // already playing this note on this pointer
    if (existing) { existing.stop(); voicesRef.current.delete(pointerId); }

    const ctx = await getCtx();
    if (!ctx) return;
    const [note, oct] = parseId(noteId);
    const freq = noteFreq(note, oct);
    const sound = SYNTHS[timbreRef.current](ctx, freq, ctx.destination);
    voicesRef.current.set(pointerId, { noteId, stop: sound.stop });
    setActiveIds(new Set([...voicesRef.current.values()].map(v => v.noteId)));
  }, [getCtx]);

  const releaseKey = useCallback((pointerId) => {
    const voice = voicesRef.current.get(pointerId);
    if (!voice) return;
    voice.stop();
    voicesRef.current.delete(pointerId);
    setActiveIds(new Set([...voicesRef.current.values()].map(v => v.noteId)));
  }, []);

  const releaseAll = useCallback(() => {
    for (const v of voicesRef.current.values()) v.stop();
    voicesRef.current.clear();
    setActiveIds(new Set());
  }, []);

  // ── Mouse ──────────────────────────────────────────────────────────────────

  const onMouseDown = useCallback((noteId, e) => {
    e.preventDefault();
    mouseDownRef.current = true;
    pressKey(noteId, 'mouse');
  }, [pressKey]);

  const onMouseEnter = useCallback((noteId) => {
    if (mouseDownRef.current) pressKey(noteId, 'mouse');
  }, [pressKey]);

  const onMouseUp = useCallback(() => {
    mouseDownRef.current = false;
    releaseKey('mouse');
  }, [releaseKey]);

  // ── Touch ──────────────────────────────────────────────────────────────────

  const idAtPoint = useCallback((x, y) => {
    let el = document.elementFromPoint(x, y);
    while (el) {
      if (el.dataset?.noteid) return el.dataset.noteid;
      el = el.parentElement;
    }
    return null;
  }, []);

  const onTouchStart = useCallback((e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const id = idAtPoint(t.clientX, t.clientY);
      if (id) pressKey(id, t.identifier);
    }
  }, [idAtPoint, pressKey]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const id = idAtPoint(t.clientX, t.clientY);
      if (id) pressKey(id, t.identifier);
      else releaseKey(t.identifier);
    }
  }, [idAtPoint, pressKey, releaseKey]);

  const onTouchEnd = useCallback((e) => {
    for (const t of e.changedTouches) releaseKey(t.identifier);
  }, [releaseKey]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const held = new Set();
    const down = (e) => {
      if (e.repeat || held.has(e.key)) return;
      const id = KEY_MAP[e.key.toLowerCase()];
      if (!id) return;
      held.add(e.key);
      pressKey(id, `kb:${e.key}`);
    };
    const up = (e) => {
      held.delete(e.key);
      const id = KEY_MAP[e.key.toLowerCase()];
      if (id) releaseKey(`kb:${e.key}`);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', releaseAll);
    };
  }, [pressKey, releaseKey, onMouseUp, releaseAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseAll();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [releaseAll]);

  // ── Derived display ────────────────────────────────────────────────────────

  const activeList = [...activeIds].sort();
  const octLabel = numOct === 1
    ? `C${startOct} – B${startOct}`
    : `C${startOct} – B${startOct + 1}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-[#f5eceb] flex flex-col font-sans"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* ── Header ── */}
      <div className="flex-none px-4 sm:px-6 pt-8 pb-3">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b09e9c] mb-1 text-center">
            Phenom&nbsp;·&nbsp;Keys
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#6b5b58] tracking-tight text-center mb-5">
            Klavier
          </h1>

          {/* Timbre selector */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
            {Object.entries(TIMBRES).map(([key, { name, sub }]) => (
              <button
                key={key}
                onClick={() => { releaseAll(); setTimbre(key); }}
                className={`flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border transition-all active:scale-95 ${
                  timbre === key
                    ? 'bg-[#e8d3d1] border-[#d4bcb9] text-[#8a7a78]'
                    : 'bg-white/70 border-[#e8d3d1] text-[#b09e9c] hover:bg-white'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black leading-tight">{name}</span>
                <span className="text-[8px] sm:text-[9px] font-medium opacity-60 leading-tight">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active notes display ── */}
      <div className="flex-none flex justify-center items-center gap-2 py-3 min-h-[44px] flex-wrap px-4">
        {activeList.length > 0 ? (
          activeList.map(id => (
            <span
              key={id}
              className="px-2.5 py-1 rounded-full bg-white/80 border border-[#e8d3d1] text-[11px] font-black text-[#8a7a78] animate-in fade-in zoom-in duration-100"
            >
              {id}
            </span>
          ))
        ) : (
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c5b4b2]">
            {TIMBRES[timbre].sub}
          </span>
        )}
      </div>

      {/* ── Octave navigation + keyboard ── */}
      <div className="flex-1 flex flex-col justify-end pb-4 sm:pb-6">
        {/* Octave nav bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 mb-3">
          <button
            onClick={() => { releaseAll(); setStartOct(o => Math.max(MIN_START_OCT, o - 1)); }}
            disabled={startOct <= MIN_START_OCT}
            className="flex items-center gap-1 rounded-xl border border-[#e8d3d1] bg-white/70 px-3 py-2 text-[#8a7a78] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
          >
            <ChevronLeft size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">低音</span>
          </button>

          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b09e9c]">
            {octLabel}
          </span>

          <button
            onClick={() => { releaseAll(); setStartOct(o => Math.min(MAX_START_OCT, o + 1)); }}
            disabled={startOct >= MAX_START_OCT}
            className="flex items-center gap-1 rounded-xl border border-[#e8d3d1] bg-white/70 px-3 py-2 text-[#8a7a78] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
          >
            <span className="text-[10px] font-black uppercase tracking-wider">高音</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Keyboard */}
        <div
          ref={containerRef}
          className="relative mx-4 sm:mx-6 rounded-2xl overflow-hidden border border-[#e8d3d1] bg-[#f0e8e6] shadow-inner"
          style={{ height: wkh + 16, touchAction: 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div className="absolute inset-0 px-1 pt-2">
            {/* White keys */}
            {whites.map(({ note, oct, id, wi }) => {
              const isActive = activeIds.has(id);
              const kbKey = Object.entries(KEY_MAP).find(([, v]) => v === id)?.[0];
              return (
                <div
                  key={id}
                  data-noteid={id}
                  onMouseDown={e => onMouseDown(id, e)}
                  onMouseEnter={() => onMouseEnter(id)}
                  className={`absolute bottom-1 rounded-b-lg border cursor-pointer transition-colors duration-75 ${
                    isActive
                      ? 'border-[#d4bcb9] bg-[#f5e8e5]'
                      : 'border-[#ddd0ce] bg-white hover:bg-[#fefcfc]'
                  }`}
                  style={{
                    left: wi * wkw + 1,
                    width: wkw - 2,
                    height: wkh - 4,
                    zIndex: 1,
                    boxShadow: isActive
                      ? 'inset 0 2px 6px rgba(180,140,130,0.25)'
                      : '0 3px 6px rgba(0,0,0,0.10), inset 0 -1px 0 rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Octave C label */}
                  {note === 'C' && (
                    <span
                      className="absolute bottom-1.5 left-0 right-0 text-center text-[7px] sm:text-[8px] font-black text-[#c5b4b2] pointer-events-none"
                      data-noteid={id}
                    >
                      C{oct}
                    </span>
                  )}
                  {/* QWERTY hint */}
                  {kbKey && (
                    <span
                      className="absolute bottom-5 sm:bottom-6 left-0 right-0 text-center text-[7px] font-bold text-[#d4c0be] pointer-events-none"
                      data-noteid={id}
                    >
                      {kbKey.toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Black keys */}
            {blacks.map(({ note, oct, id, pos }) => {
              const isActive = activeIds.has(id);
              const kbKey = Object.entries(KEY_MAP).find(([, v]) => v === id)?.[0];
              return (
                <div
                  key={id}
                  data-noteid={id}
                  onMouseDown={e => onMouseDown(id, e)}
                  onMouseEnter={() => onMouseEnter(id)}
                  className="absolute top-2 cursor-pointer rounded-b-md transition-colors duration-75"
                  style={{
                    left: pos * wkw - bkw / 2 + 1,
                    width: bkw,
                    height: bkh,
                    zIndex: 2,
                    background: isActive
                      ? 'linear-gradient(to bottom, #7a6560 0%, #5c4a47 100%)'
                      : 'linear-gradient(to bottom, #4a3835 0%, #2e201e 100%)',
                    boxShadow: isActive
                      ? 'inset 0 2px 4px rgba(0,0,0,0.5)'
                      : '0 4px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  {kbKey && (
                    <span
                      className="absolute bottom-1.5 left-0 right-0 text-center text-[6px] sm:text-[7px] font-bold pointer-events-none"
                      style={{ color: 'rgba(200,170,160,0.7)' }}
                      data-noteid={id}
                    >
                      {kbKey.toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-center text-[9px] font-medium text-[#c5b4b2] mt-3 tracking-wider">
          鍵盤：<span className="font-mono">A S D F G H J K</span>
          &nbsp;·&nbsp;升號：<span className="font-mono">W E T Y U</span>
          &nbsp;·&nbsp;可多鍵同按
        </p>
      </div>

      {/* Footer */}
      <p className="flex-none text-center text-[9px] font-black uppercase tracking-[0.4em] text-[#c5b4b2] pb-5">
        Phenom&nbsp;·&nbsp;Professional Acoustic Solution
      </p>
    </div>
  );
}
