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

// QWERTY layout (key → note name offset from startOct)
const QWERTY_LAYOUT = [
  ['a','C',0], ['w','C#',0], ['s','D',0], ['e','D#',0], ['d','E',0],
  ['f','F',0], ['t','F#',0], ['g','G',0], ['y','G#',0], ['h','A',0],
  ['u','A#',0],['j','B',0],  ['k','C',1], ['o','C#',1], ['l','D',1], ['p','D#',1],
];

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
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
  );

  // Dynamic QWERTY map — follows startOct so Z/X actually changes played notes
  const keyMap = useMemo(() => {
    const map = {};
    for (const [key, note, octOffset] of QWERTY_LAYOUT) {
      map[key] = `${note}${startOct + octOffset}`;
    }
    return map;
  }, [startOct]);

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const voicesRef = useRef(new Map()); // pointerId → { noteId, stop }
  const timbreRef = useRef('GRAND');
  const mouseDownRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => { timbreRef.current = timbre; }, [timbre]);

  useEffect(() => {
    document.title = 'Klavier';
    return () => { document.title = 'Phenom Canvas Lab'; };
  }, []);

  // Orientation detection
  useEffect(() => {
    const update = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Measure keyboard container (both dimensions)
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    update();
    const obs = new ResizeObserver(update);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { w: cw, h: ch } = containerSize;

  // Portrait always 2 octaves; landscape responsive by width
  const numOct = isPortrait ? 2 : (cw >= 560 ? 2 : 1);
  const { whites, blacks, totalWhite } = useMemo(
    () => buildKeys(startOct, numOct),
    [startOct, numOct],
  );

  // Landscape dimensions
  const wkw  = cw > 0 ? Math.floor(cw / totalWhite) : 44;
  const wkh  = 148;
  const bkw  = Math.max(14, Math.round(wkw * 0.58));
  const bkh  = Math.round(wkh * 0.62);

  // Portrait (vertical) dimensions
  const wkh_v = Math.max(28, ch > 0 ? Math.floor(ch / totalWhite) : 36);
  const bkh_v = Math.round(wkh_v * 0.60);
  const bkw_v = Math.round(cw * 0.48);

  // ── Audio context ──────────────────────────────────────────────────────────

  const getCtx = useCallback(async () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new Ctx({ latencyHint: 'interactive' });
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = 1.8;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // ── Sustain pedal (declared early so all callbacks below can reference it) ──

  const [sustain, setSustain] = useState(false);
  const sustainRef = useRef(false);
  const sustainedRef = useRef(new Map()); // noteId → stop

  const updateActiveIds = useCallback(() => {
    setActiveIds(new Set([
      ...[...voicesRef.current.values()].map(v => v.noteId),
      ...sustainedRef.current.keys(),
    ]));
  }, []);

  const activateSustain = useCallback(() => {
    sustainRef.current = true;
    setSustain(true);
  }, []);

  const releaseSustain = useCallback(() => {
    sustainRef.current = false;
    setSustain(false);
    for (const stop of sustainedRef.current.values()) stop();
    sustainedRef.current.clear();
    updateActiveIds();
  }, [updateActiveIds]);

  const toggleSustain = useCallback(() => {
    if (sustainRef.current) releaseSustain();
    else activateSustain();
  }, [activateSustain, releaseSustain]);

  // ── Note press/release ─────────────────────────────────────────────────────

  const pressKey = useCallback(async (noteId, pointerId) => {
    const existing = voicesRef.current.get(pointerId);
    if (existing?.noteId === noteId) return; // already playing this note on this pointer
    if (existing) { existing.stop(); voicesRef.current.delete(pointerId); }

    const ctx = await getCtx();
    if (!ctx) return;
    const [note, oct] = parseId(noteId);
    const freq = noteFreq(note, oct);
    const sound = SYNTHS[timbreRef.current](ctx, freq, masterGainRef.current);
    voicesRef.current.set(pointerId, { noteId, stop: sound.stop });
    setActiveIds(new Set([...voicesRef.current.values()].map(v => v.noteId)));
  }, [getCtx]);

  const releaseKey = useCallback((pointerId) => {
    const voice = voicesRef.current.get(pointerId);
    if (!voice) return;
    voicesRef.current.delete(pointerId);
    if (sustainRef.current) {
      // Hand off to sustain buffer; stop any previous sustained instance of same note
      const prev = sustainedRef.current.get(voice.noteId);
      if (prev) prev();
      sustainedRef.current.set(voice.noteId, voice.stop);
    } else {
      voice.stop();
    }
    updateActiveIds();
  }, [updateActiveIds]);

  const releaseAll = useCallback(() => {
    for (const v of voicesRef.current.values()) v.stop();
    voicesRef.current.clear();
    for (const stop of sustainedRef.current.values()) stop();
    sustainedRef.current.clear();
    sustainRef.current = false;
    setSustain(false);
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
      if (e.key === ' ') { e.preventDefault(); activateSustain(); return; }
      if (e.key === 'z' || e.key === 'Z') {
        releaseAll();
        setStartOct(o => Math.max(MIN_START_OCT, o - 1));
        held.clear();
        return;
      }
      if (e.key === 'x' || e.key === 'X') {
        releaseAll();
        setStartOct(o => Math.min(MAX_START_OCT, o + 1));
        held.clear();
        return;
      }
      if (e.repeat || held.has(e.key)) return;
      const id = keyMap[e.key.toLowerCase()];
      if (!id) return;
      held.add(e.key);
      pressKey(id, `kb:${e.key}`);
    };
    const up = (e) => {
      if (e.key === ' ') { releaseSustain(); return; }
      held.delete(e.key);
      const id = keyMap[e.key.toLowerCase()];
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
  }, [keyMap, pressKey, releaseKey, onMouseUp, releaseAll, activateSustain, releaseSustain]);

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

  const keyH = Math.max(140, ch - 12); // landscape white key height

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="h-screen bg-[#f5eceb] flex flex-col font-sans overflow-hidden"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* ── Header ── */}
      <div className="flex-none px-4 pt-5 pb-2">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c]">
              Phenom&nbsp;·&nbsp;Keys
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#6b5b58] tracking-tight leading-tight">
              Klavier
            </h1>
          </div>

          {/* Sustain + active notes */}
          <div className="flex items-center gap-2">
            {activeList.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-end max-w-[160px]">
                {activeList.slice(0, 5).map(id => (
                  <span key={id} className="px-2 py-0.5 rounded-full bg-white/80 border border-[#e8d3d1] text-[10px] font-black text-[#8a7a78]">
                    {id}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={toggleSustain}
              className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                sustain
                  ? 'bg-[#d8e2dc] border-[#b8ccb4] text-[#6d8b74]'
                  : 'bg-white/70 border-[#e8d3d1] text-[#b09e9c] hover:bg-white'
              }`}
              aria-label="延音踏板"
            >
              延音
            </button>
          </div>
        </div>
      </div>

      {/* ── Timbre selector ── */}
      <div className="flex-none px-4 pb-2">
        <div className="flex gap-1.5 flex-wrap justify-center">
          {Object.entries(TIMBRES).map(([key, { name, sub }]) => (
            <button
              key={key}
              onClick={() => { releaseAll(); sustainedRef.current.clear(); setTimbre(key); }}
              className={`flex flex-col items-center px-3 py-1.5 rounded-2xl border transition-all active:scale-95 ${
                timbre === key
                  ? 'bg-[#e8d3d1] border-[#d4bcb9] text-[#8a7a78]'
                  : 'bg-white/70 border-[#e8d3d1] text-[#b09e9c] hover:bg-white'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-black leading-tight">{name}</span>
              <span className="text-[8px] font-medium opacity-60 leading-tight">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Octave nav ── */}
      <div className="flex-none flex items-center justify-between px-4 pb-2">
        <button
          onClick={() => { releaseAll(); sustainedRef.current.clear(); setStartOct(o => Math.max(MIN_START_OCT, o - 1)); }}
          disabled={startOct <= MIN_START_OCT}
          className="flex items-center gap-1 rounded-xl border border-[#e8d3d1] bg-white/70 px-3 py-1.5 text-[#8a7a78] transition-all active:scale-95 disabled:opacity-30 hover:bg-white"
        >
          <ChevronLeft size={13} />
          <span className="text-[9px] font-black uppercase tracking-wider">低音</span>
        </button>
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#b09e9c]">{octLabel}</span>
        <button
          onClick={() => { releaseAll(); sustainedRef.current.clear(); setStartOct(o => Math.min(MAX_START_OCT, o + 1)); }}
          disabled={startOct >= MAX_START_OCT}
          className="flex items-center gap-1 rounded-xl border border-[#e8d3d1] bg-white/70 px-3 py-1.5 text-[#8a7a78] transition-all active:scale-95 disabled:opacity-30 hover:bg-white"
        >
          <span className="text-[9px] font-black uppercase tracking-wider">高音</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* ── Keyboard ── */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative mx-3 mb-3 rounded-2xl overflow-hidden border border-[#e8d3d1] bg-[#f0e8e6]"
        style={{ touchAction: 'none', boxShadow: 'inset 0 2px 12px rgba(180,140,130,0.15)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className="absolute inset-0">
          {isPortrait ? (
            <>
              {/* Vertical layout: white keys are full-width horizontal bars */}
              {whites.map(({ note, oct, id, wi }) => {
                const isActive = activeIds.has(id);
                const top = (totalWhite - 1 - wi) * wkh_v + 1;
                const kbKey = Object.entries(keyMap).find(([, v]) => v === id)?.[0];
                return (
                  <div
                    key={id}
                    data-noteid={id}
                    onMouseDown={e => onMouseDown(id, e)}
                    onMouseEnter={() => onMouseEnter(id)}
                    className={`absolute left-0 cursor-pointer border-b transition-colors duration-75 ${
                      isActive ? 'bg-[#f5e8e5] border-[#d4bcb9]' : 'bg-white border-[#e8d3d1] hover:bg-[#fdfafa]'
                    }`}
                    style={{ top, width: cw, height: wkh_v - 1, zIndex: 1 }}
                  >
                    {note === 'C' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#c5b4b2] pointer-events-none" data-noteid={id}>
                        C{oct}
                      </span>
                    )}
                    {kbKey && (
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#ddd0ce] pointer-events-none" data-noteid={id}>
                        {kbKey.toUpperCase()}
                      </span>
                    )}
                  </div>
                );
              })}
              {/* Black keys: right-aligned shorter bars */}
              {blacks.map(({ note, oct, id, pos }) => {
                const isActive = activeIds.has(id);
                const top = (totalWhite - 1 - pos) * wkh_v - bkh_v / 2 + 1;
                return (
                  <div
                    key={id}
                    data-noteid={id}
                    onMouseDown={e => onMouseDown(id, e)}
                    onMouseEnter={() => onMouseEnter(id)}
                    className="absolute right-0 cursor-pointer rounded-l-md transition-colors duration-75"
                    style={{
                      top, width: bkw_v, height: bkh_v, zIndex: 2,
                      background: isActive
                        ? 'linear-gradient(to left, #7a6560, #5c4a47)'
                        : 'linear-gradient(to left, #4a3835, #2e201e)',
                      boxShadow: isActive
                        ? 'inset -2px 0 6px rgba(0,0,0,0.5)'
                        : '-4px 0 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  />
                );
              })}
            </>
          ) : (
            <>
              {/* Horizontal layout: standard piano keyboard */}
              {whites.map(({ note, oct, id, wi }) => {
                const isActive = activeIds.has(id);
                const kbKey = Object.entries(keyMap).find(([, v]) => v === id)?.[0];
                return (
                  <div
                    key={id}
                    data-noteid={id}
                    onMouseDown={e => onMouseDown(id, e)}
                    onMouseEnter={() => onMouseEnter(id)}
                    className={`absolute bottom-1 rounded-b-xl border cursor-pointer transition-colors duration-75 ${
                      isActive ? 'border-[#d4bcb9] bg-[#f5e8e5]' : 'border-[#ddd0ce] bg-white hover:bg-[#fefcfc]'
                    }`}
                    style={{
                      left: wi * wkw + 1, width: wkw - 2, height: keyH, zIndex: 1,
                      boxShadow: isActive
                        ? 'inset 0 3px 8px rgba(180,140,130,0.25)'
                        : '0 4px 10px rgba(0,0,0,0.10), inset 0 -2px 0 rgba(0,0,0,0.05)',
                    }}
                  >
                    {note === 'C' && (
                      <span className="absolute bottom-2 left-0 right-0 text-center text-[8px] sm:text-[9px] font-black text-[#c5b4b2] pointer-events-none" data-noteid={id}>
                        C{oct}
                      </span>
                    )}
                    {kbKey && (
                      <span className="absolute bottom-7 left-0 right-0 text-center text-[7px] font-bold text-[#d4c0be] pointer-events-none" data-noteid={id}>
                        {kbKey.toUpperCase()}
                      </span>
                    )}
                  </div>
                );
              })}
              {blacks.map(({ note, oct, id, pos }) => {
                const isActive = activeIds.has(id);
                const kbKey = Object.entries(keyMap).find(([, v]) => v === id)?.[0];
                return (
                  <div
                    key={id}
                    data-noteid={id}
                    onMouseDown={e => onMouseDown(id, e)}
                    onMouseEnter={() => onMouseEnter(id)}
                    className="absolute top-2 cursor-pointer rounded-b-lg transition-colors duration-75"
                    style={{
                      left: pos * wkw - bkw / 2 + 1, width: bkw, height: Math.round(keyH * 0.62), zIndex: 2,
                      background: isActive
                        ? 'linear-gradient(to bottom, #7a6560, #5c4a47)'
                        : 'linear-gradient(to bottom, #4a3835, #2e201e)',
                      boxShadow: isActive
                        ? 'inset 0 3px 6px rgba(0,0,0,0.5)'
                        : '0 5px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    {kbKey && (
                      <span className="absolute bottom-2 left-0 right-0 text-center text-[7px] font-bold pointer-events-none" style={{ color: 'rgba(200,170,160,0.7)' }} data-noteid={id}>
                        {kbKey.toUpperCase()}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Footer hint ── */}
      <p className="flex-none text-center text-[8px] font-medium text-[#c5b4b2] pb-3 tracking-wider">
        {isPortrait
          ? '多指同按可演奏和弦 · 延音鍵按住後放手仍持音'
          : 'A–J 彈奏 · W E T Y U 升號 · Z↓X↑ 換八度 · Space 延音'
        }
      </p>
    </div>
  );
}
