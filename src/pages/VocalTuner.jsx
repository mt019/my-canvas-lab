import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const VOLUME_THRESHOLD = 0.001;
const RMS_THRESHOLD = 0.0008;
const PERFECT_CENTS = 8;
const HOLD_TIME = 800;
const HISTORY_SIZE = 7;
const MIN_FREQ = 70;
const MAX_FREQ = 1100;
const ATTACK_MS = 100;
const STABLE_FRAMES = 2;
const STABLE_WINDOW = 25;

// Piano roll visual settings
const TRAIL_FRAMES = 600;    // ~20s of history at ~30fps
const ROLL_SEMITONES = 14;   // visible semitone rows (just over an octave)
const KEY_W = 50;            // px: vertical piano keys column
const VIEW_FOLLOW_SLOW = 0.03;
const VIEW_FOLLOW_FAST = 0.22;

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]);

// Keyboard layout: A-K = C to C+1, W E T Y U = black keys
const KEY_TO_SEMITONE = { a:0, w:1, s:2, e:3, d:4, f:5, t:6, g:7, y:8, h:9, u:10, j:11, k:12 };

// ─── Utils ────────────────────────────────────────────────────────────────────
function freqToMidi(freq) { return 69 + 12 * Math.log2(freq / 440); }
function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function getNoteInfo(freq) {
  const midiExact = freqToMidi(freq);
  const midiRound = Math.round(midiExact);
  const cents = (midiExact - midiRound) * 100;
  const octave = Math.floor(midiRound / 12) - 1;
  const name = NOTE_NAMES[((midiRound % 12) + 12) % 12];
  return { name, octave, cents, midiNote: midiRound, midiExact };
}

function resolveOctave(freq) {
  const candidates = [
    { f: freq, penalty: 0 },
    { f: freq / 2, penalty: 35 },
    { f: freq * 2, penalty: 48 },
  ].filter(c => c.f >= MIN_FREQ && c.f <= MAX_FREQ);
  let best = freq, bestScore = Infinity;
  for (const c of candidates) {
    const d = Math.abs(freqToMidi(c.f) - Math.round(freqToMidi(c.f))) * 100;
    if (d + c.penalty < bestScore) { bestScore = d + c.penalty; best = c.f; }
  }
  return best;
}

function autoCorrelate(buf, sr) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < RMS_THRESHOLD) return -1;

  let s = 0, e = buf.length - 1;
  const thresh = 0.2;
  for (let i = 0; i < buf.length / 2; i++) { if (Math.abs(buf[i]) < thresh) { s = i; break; } }
  for (let i = 1; i < buf.length / 2; i++) { if (Math.abs(buf[buf.length - i]) < thresh) { e = buf.length - i; break; } }

  const t = buf.slice(s, e);
  if (t.length < 2) return -1;

  const c = new Array(t.length).fill(0);
  for (let lag = 0; lag < t.length; lag++) {
    let sum = 0;
    for (let i = 0; i < t.length - lag; i++) sum += t[i] * t[i + lag];
    c[lag] = sum;
  }

  let dip = 0;
  while (dip + 1 < c.length && c[dip] > c[dip + 1]) dip++;
  let maxV = -1, maxI = -1;
  for (let i = dip; i < c.length; i++) { if (c[i] > maxV) { maxV = c[i]; maxI = i; } }
  if (maxI <= 0) return -1;

  const x1 = c[maxI - 1] ?? c[maxI], x2 = c[maxI], x3 = c[maxI + 1] ?? c[maxI];
  const a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
  const period = maxI + (a ? -b / (2 * a) : 0);
  if (!Number.isFinite(period) || period <= 0) return -1;
  return sr / period;
}

async function requestMicStream() {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) throw new Error('unsupported');
  try {
    return await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (err) {
    if (['OverconstrainedError', 'ConstraintNotSatisfiedError', 'NotReadableError', 'AbortError'].includes(err?.name)) {
      return md.getUserMedia({ audio: true });
    }
    throw err;
  }
}

function getMicError(err) {
  const n = err?.name;
  if (n === 'NotAllowedError' || n === 'PermissionDeniedError') return '請確認瀏覽器麥克風權限已開啟。';
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError') return '找不到可用麥克風。';
  if (n === 'NotReadableError' || n === 'TrackStartError') return '麥克風被其他程式占用。';
  return '無法存取麥克風，請確認權限與裝置狀態。';
}

// ─── Piano Roll + Vertical Keys Renderer ─────────────────────────────────────
// cssW / cssH are display (CSS) pixel dimensions, independent of devicePixelRatio
function drawPianoRoll(canvas, cssW, cssH, trail, viewCenter, targetMidi, detectedMidi) {
  const ctx = canvas.getContext('2d');
  const plotW = cssW - KEY_W;
  const rowH = cssH / ROLL_SEMITONES;
  const halfRange = ROLL_SEMITONES / 2;
  const topMidi = viewCenter + halfRange;
  const bottomMidi = viewCenter - halfRange;

  function midiToY(midi) {
    return cssH - ((midi - bottomMidi) / ROLL_SEMITONES) * cssH;
  }

  // Background
  ctx.fillStyle = '#f8f2f1';
  ctx.fillRect(0, 0, cssW, cssH);

  // ── Semitone rows (right of keys) ──
  for (let m = Math.floor(bottomMidi) - 1; m <= Math.ceil(topMidi) + 1; m++) {
    const noteIdx = ((m % 12) + 12) % 12;
    const isBlack = BLACK_KEY_INDICES.has(noteIdx);
    const centerY = midiToY(m);
    const topY = centerY - rowH / 2;

    ctx.fillStyle = isBlack ? '#ede5e3' : '#faf5f4';
    ctx.fillRect(KEY_W, topY, plotW, rowH);

    // In-tune green zone
    const zoneH = (PERFECT_CENTS / 100) * rowH;
    ctx.fillStyle = 'rgba(141,158,140,0.11)';
    ctx.fillRect(KEY_W, centerY - zoneH, plotW, zoneH * 2);

    // Row boundary
    ctx.strokeStyle = '#e4d4d2';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(KEY_W, topY);
    ctx.lineTo(cssW, topY);
    ctx.stroke();

    // Center dashed line
    ctx.strokeStyle = '#ddd0ce';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(KEY_W, centerY);
    ctx.lineTo(cssW, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Target band ──
  if (targetMidi !== null) {
    const ty = midiToY(targetMidi);
    const bandH = (PERFECT_CENTS / 100) * rowH * 3;
    ctx.fillStyle = 'rgba(141,158,140,0.22)';
    ctx.fillRect(KEY_W, ty - bandH / 2, plotW, bandH);
    ctx.strokeStyle = '#8d9e8c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(KEY_W, ty);
    ctx.lineTo(cssW, ty);
    ctx.stroke();
  }

  // ── Pitch trail ──
  if (trail.length >= 2) {
    let seg = [];
    const segments = [];
    for (let i = 0; i < trail.length; i++) {
      if (trail[i] === null) {
        if (seg.length > 0) { segments.push(seg); seg = []; }
      } else {
        seg.push({ idx: i, midi: trail[i] });
      }
    }
    if (seg.length > 0) segments.push(seg);

    for (const group of segments) {
      if (group.length < 1) continue;

      // Glow
      ctx.beginPath();
      group.forEach((pt, i) => {
        const x = KEY_W + (pt.idx / (TRAIL_FRAMES - 1)) * plotW;
        const y = midiToY(pt.midi);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(176,158,156,0.22)';
      ctx.lineWidth = 9;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Main line
      ctx.beginPath();
      group.forEach((pt, i) => {
        const x = KEY_W + (pt.idx / (TRAIL_FRAMES - 1)) * plotW;
        const y = midiToY(pt.midi);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#c4906a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Current dot
    const lastIdx = trail.length - 1 - [...trail].reverse().findIndex(v => v !== null);
    const lastVal = trail[lastIdx];
    if (lastVal !== null && lastVal !== undefined) {
      const x = KEY_W + (lastIdx / (TRAIL_FRAMES - 1)) * plotW;
      const y = midiToY(lastVal);
      const centsOff = (lastVal - Math.round(lastVal)) * 100;
      const color = Math.abs(centsOff) < PERFECT_CENTS ? '#8d9e8c'
        : Math.abs(centsOff) < 25 ? '#d4a373' : '#e08080';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ── Vertical piano keys (left column) ──
  ctx.fillStyle = '#f5eeec';
  ctx.fillRect(0, 0, KEY_W, cssH);

  for (let m = Math.floor(bottomMidi) - 1; m <= Math.ceil(topMidi) + 1; m++) {
    const noteIdx = ((m % 12) + 12) % 12;
    const isBlack = BLACK_KEY_INDICES.has(noteIdx);
    const isC = noteIdx === 0;
    const octave = Math.floor(m / 12) - 1;
    const centerY = midiToY(m);
    const topY = centerY - rowH / 2;
    const isTarget = targetMidi !== null && Math.round(targetMidi) === m;
    const isDetected = detectedMidi !== null && detectedMidi === m;

    if (isBlack) {
      // Black key: narrower, occupies left 60%
      const kw = KEY_W * 0.6;
      ctx.fillStyle = isTarget ? '#5d8e7c' : isDetected ? '#7a6a68' : '#2e1e1c';
      ctx.fillRect(0, topY + 0.5, kw, rowH - 0.5);
      // Thin right section matches background
      ctx.fillStyle = '#f5eeec';
      ctx.fillRect(kw, topY, KEY_W - kw, rowH);
    } else {
      // White key: full width
      ctx.fillStyle = isTarget ? '#d0ddd4' : isDetected ? '#ead8d4' : '#f8f2f1';
      ctx.fillRect(0, topY + 0.5, KEY_W, rowH - 0.5);
    }

    // Key bottom border
    ctx.strokeStyle = isBlack ? '#1a0e0c' : '#ddd0ce';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, topY + rowH);
    ctx.lineTo(isBlack ? KEY_W * 0.6 : KEY_W, topY + rowH);
    ctx.stroke();

    // C note label (right-aligned inside white key)
    if (isC && centerY > -4 && centerY < cssH + 4) {
      ctx.fillStyle = isTarget ? '#5d8e7c' : '#8a7a78';
      ctx.font = 'bold 8px system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`C${octave}`, KEY_W - 3, centerY + 3.5);
    }
  }

  // Divider line between keys and roll
  ctx.strokeStyle = '#c8b8b6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(KEY_W, 0);
  ctx.lineTo(KEY_W, cssH);
  ctx.stroke();
}

// Helper: get CSS dimensions from canvas element
function getCanvasCSS(canvas) {
  return { cssW: canvas.offsetWidth, cssH: canvas.offsetHeight };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VocalTuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState(null);
  const [detectedFreq, setDetectedFreq] = useState(0);
  const [isTooQuiet, setIsTooQuiet] = useState(true);
  const [inputLevel, setInputLevel] = useState(0);
  const [targetNote, setTargetNote] = useState(null);
  const [keyOctave, setKeyOctave] = useState(4); // for keyboard shortcut reference
  const [error, setError] = useState('');

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const mountedRef = useRef(true);
  const pitchHistoryRef = useRef([]);
  const lastNoteTimeRef = useRef(0);
  const attackStartRef = useRef(0);
  const stableMatchRef = useRef({ midi: null, frames: 0, cents: 0 });
  const midiTrailRef = useRef(new Array(TRAIL_FRAMES).fill(null));
  const viewCenterRef = useRef(60); // C4 default
  const targetNoteRef = useRef(null);
  const detectedMidiRef = useRef(null);
  const pianoGainRef = useRef(null);
  const pianoOscRef = useRef(null);

  useEffect(() => { targetNoteRef.current = targetNote; }, [targetNote]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { cssW, cssH } = getCanvasCSS(canvas);
    drawPianoRoll(canvas, cssW, cssH, midiTrailRef.current, viewCenterRef.current, targetNoteRef.current?.midi ?? null, detectedMidiRef.current);
  }, []);

  const resetDisplay = useCallback(() => {
    pitchHistoryRef.current = [];
    attackStartRef.current = 0;
    stableMatchRef.current = { midi: null, frames: 0, cents: 0 };
    midiTrailRef.current = new Array(TRAIL_FRAMES).fill(null);
    detectedMidiRef.current = null;
    setIsTooQuiet(true);
    setInputLevel(0);
    setDetectedNote(null);
    setDetectedFreq(0);
    redrawCanvas();
  }, [redrawCanvas]);

  const ensureCtx = useCallback(async () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('此瀏覽器不支援 AudioContext。');
    if (!audioCtxRef.current) audioCtxRef.current = new AC({ latencyHint: 'interactive' });
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const resumeCtx = useCallback(async () => {
    if (audioCtxRef.current?.state === 'suspended' || audioCtxRef.current?.state === 'interrupted') {
      await audioCtxRef.current.resume();
    }
  }, []);

  const stopAll = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} sourceRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    analyserRef.current = null;
    setIsListening(false);
    resetDisplay();
  }, [resetDisplay]);

  const playPianoNote = useCallback(async (midi) => {
    try {
      const ctx = await ensureCtx();
      await resumeCtx();
      if (pianoGainRef.current) {
        try { pianoGainRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02); } catch {}
      }
      if (pianoOscRef.current) { try { pianoOscRef.current.stop(ctx.currentTime + 0.06); } catch {} }

      const freq = midiToFreq(midi);
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const toneFilter = ctx.createBiquadFilter();

      osc1.type = 'triangle';
      osc1.frequency.value = freq;
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;
      toneFilter.type = 'lowpass';
      toneFilter.frequency.value = Math.min(3200, freq * 7);

      const boost = clamp(220 / freq, 1.0, 3.2);
      const peak = clamp(0.1 * boost, 0.1, 0.28);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(peak * 0.25, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(toneFilter); osc2.connect(toneFilter);
      toneFilter.connect(gain); gain.connect(ctx.destination);
      osc1.start(now); osc2.start(now);
      osc1.stop(now + 1.5); osc2.stop(now + 1.5);
      pianoOscRef.current = osc1;
      pianoGainRef.current = gain;
    } catch {}
  }, [ensureCtx, resumeCtx]);

  const handlePianoPress = useCallback((midi) => {
    if (midi < 28 || midi > 100) return;
    playPianoNote(midi);
    const octave = Math.floor(midi / 12) - 1;
    const name = NOTE_NAMES[((midi % 12) + 12) % 12];
    const note = { midi, name, octave, freq: midiToFreq(midi) };
    setTargetNote(note);
    targetNoteRef.current = note;
    viewCenterRef.current = midi;
    redrawCanvas();
  }, [playPianoNote, redrawCanvas]);

  // Canvas click → play key
  const handleCanvasPointer = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x > KEY_W) return;
    const halfRange = ROLL_SEMITONES / 2;
    const topMidi = viewCenterRef.current + halfRange;
    const midi = Math.round(topMidi - (y / rect.height) * ROLL_SEMITONES);
    handlePianoPress(midi);
  }, [handlePianoPress]);

  const updateLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;
    if (!analyser || !ctx || !mountedRef.current) return;

    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    let ss = 0;
    for (let i = 0; i < buf.length; i++) ss += buf[i] * buf[i];
    const rms = Math.sqrt(ss / buf.length);
    const now = Date.now();
    setInputLevel(prev => prev * 0.78 + clamp(rms * 260, 0, 1) * 0.22);

    if (rms < VOLUME_THRESHOLD) {
      if (now - lastNoteTimeRef.current > HOLD_TIME) {
        resetDisplay();
      } else {
        midiTrailRef.current.shift();
        midiTrailRef.current.push(null);
        redrawCanvas();
      }
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    if (!attackStartRef.current || now - lastNoteTimeRef.current > HOLD_TIME) {
      attackStartRef.current = now;
      stableMatchRef.current = { midi: null, frames: 0, cents: 0 };
      pitchHistoryRef.current = [];
    }

    setIsTooQuiet(false);
    lastNoteTimeRef.current = now;

    const raw = autoCorrelate(buf, ctx.sampleRate);
    if (raw < MIN_FREQ || raw > MAX_FREQ) {
      midiTrailRef.current.shift();
      midiTrailRef.current.push(null);
      redrawCanvas();
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    const resolved = resolveOctave(raw);
    pitchHistoryRef.current.push(resolved);
    if (pitchHistoryRef.current.length > HISTORY_SIZE) pitchHistoryRef.current.shift();

    const pitch = median(pitchHistoryRef.current);
    const info = getNoteInfo(pitch);

    if (now - attackStartRef.current < ATTACK_MS) {
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    const match = stableMatchRef.current;
    const same = match.midi === info.midiNote && Math.abs(match.cents - info.cents) <= STABLE_WINDOW;
    stableMatchRef.current = same
      ? { midi: info.midiNote, frames: match.frames + 1, cents: info.cents }
      : { midi: info.midiNote, frames: 1, cents: info.cents };

    if (stableMatchRef.current.frames < STABLE_FRAMES) {
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    setDetectedNote(info);
    setDetectedFreq(pitch);
    detectedMidiRef.current = info.midiNote;

    midiTrailRef.current.shift();
    midiTrailRef.current.push(info.midiExact);

    const target = targetNoteRef.current;
    const wantCenter = target ? target.midi : info.midiExact;
    const followSpeed = target ? VIEW_FOLLOW_FAST : VIEW_FOLLOW_SLOW;
    viewCenterRef.current = viewCenterRef.current * (1 - followSpeed) + wantCenter * followSpeed;

    redrawCanvas();
    rafRef.current = requestAnimationFrame(updateLoop);
  }, [resetDisplay, redrawCanvas]);

  const startMic = useCallback(async () => {
    try {
      setError('');
      stopAll();
      const ctx = await ensureCtx();
      await resumeCtx();
      const stream = await requestMicStream();

      stream.getAudioTracks().forEach(t => {
        t.onended = () => {
          if (!mountedRef.current) return;
          setError('麥克風連線已中斷，請重新啟動。');
          stopAll();
        };
      });

      streamRef.current = stream;
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.12;
      sourceRef.current = ctx.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      await resumeCtx();
      lastNoteTimeRef.current = Date.now();
      setIsListening(true);
      resetDisplay();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateLoop);
    } catch (err) {
      setError(err?.message === 'unsupported' ? '此瀏覽器不支援麥克風功能。' : getMicError(err));
      stopAll();
    }
  }, [ensureCtx, resumeCtx, stopAll, resetDisplay, updateLoop]);

  // Size canvas to container with device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.offsetWidth;
      const cssH = canvas.offsetHeight;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      const ctx2d = canvas.getContext('2d');
      ctx2d.scale(dpr, dpr);
      drawPianoRoll(canvas, cssW, cssH, midiTrailRef.current, viewCenterRef.current, targetNoteRef.current?.midi ?? null, detectedMidiRef.current);
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const pressed = new Set();
    const down = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (pressed.has(key)) return;
      pressed.add(key);
      if (key === 'z') { setKeyOctave(o => Math.max(2, o - 1)); return; }
      if (key === 'x') { setKeyOctave(o => Math.min(5, o + 1)); return; }
      if (key in KEY_TO_SEMITONE) {
        setKeyOctave(oct => {
          handlePianoPress((oct + 1) * 12 + KEY_TO_SEMITONE[key]);
          return oct;
        });
      }
    };
    const up = (e) => pressed.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [handlePianoPress]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAll();
      if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close().catch(() => {});
    };
  }, [stopAll]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') { stopAll(); return; }
      resumeCtx().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', stopAll);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', stopAll);
    };
  }, [resumeCtx, stopAll]);

  // Derived display values
  const targetCentsOff = targetNote && detectedNote && !isTooQuiet && detectedFreq
    ? (freqToMidi(detectedFreq) - freqToMidi(targetNote.freq)) * 100
    : null;
  const activeCents = targetCentsOff ?? (detectedNote?.cents ?? 0);
  const isPerfect = !isTooQuiet && detectedNote && Math.abs(activeCents) < PERFECT_CENTS;

  return (
    <div className="min-h-screen bg-[#f5eceb] px-4 py-6 text-slate-800 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md rounded-[3rem] border border-[#e8d3d1] bg-white/70 shadow-2xl shadow-rose-200/50 backdrop-blur-xl overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-6 pb-3 flex items-start justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8a7a78]">VOCAL TUNER</div>
            <div className="mt-1 text-sm font-bold text-[#b09e9c]">Chromatic · C2 – B5</div>
          </div>
          <div className="rounded-2xl bg-[#e8d3d1] px-3 py-2 text-[11px] font-black text-[#8a7a78]">VOICE</div>
        </div>

        {/* Note + deviation display */}
        <div className="px-7 pb-3 flex items-end justify-between">
          <div>
            <div className={`text-7xl font-black leading-none transition-all ${
              isTooQuiet ? 'text-[#e8d3d1]' : isPerfect ? 'text-[#8d9e8c]' : 'text-[#b09e9c]'
            }`}>
              {isTooQuiet || !detectedNote ? '--' : `${detectedNote.name}${detectedNote.octave}`}
            </div>
            <div className={`mt-1 text-[11px] font-bold text-[#b09e9c] transition-opacity ${isTooQuiet ? 'opacity-0' : 'opacity-100'}`}>
              {!isTooQuiet && detectedFreq ? `${detectedFreq.toFixed(1)} Hz` : ''}
            </div>
          </div>

          <div className="text-right">
            {isTooQuiet ? (
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#d8c9c7]">點左側琴鍵設目標</div>
            ) : isPerfect ? (
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8d9e8c] animate-pulse">PERFECT ✓</div>
            ) : targetCentsOff !== null ? (
              <div className={`text-sm font-black ${Math.abs(targetCentsOff) > 50 ? 'text-rose-400' : 'text-[#d4a373]'}`}>
                {Math.abs(targetCentsOff) > 50
                  ? (targetCentsOff > 0 ? '↑ ' : '↓ ') + Math.abs(targetCentsOff).toFixed(0) + ' ¢'
                  : (targetCentsOff > 0 ? '+' : '') + targetCentsOff.toFixed(1) + ' ¢'
                }
              </div>
            ) : (
              <div className="text-sm font-black text-[#b09e9c]">
                {(detectedNote?.cents ?? 0) > 0 ? '+' : ''}{(detectedNote?.cents ?? 0).toFixed(1)} ¢
              </div>
            )}
            {targetNote && (
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="text-[9px] font-black text-[#8d9e8c] uppercase">▶ {targetNote.name}{targetNote.octave}</span>
                <button
                  onClick={() => { setTargetNote(null); targetNoteRef.current = null; redrawCanvas(); }}
                  className="text-[8px] font-black text-[#c5b4b2] hover:text-[#8a7a78] uppercase"
                >✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Piano Roll Canvas — vertical keys on left + pitch trail */}
        <div
          style={{ height: 280 }}
          onMouseDown={(e) => handleCanvasPointer(e.clientX, e.clientY)}
          onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; handleCanvasPointer(t.clientX, t.clientY); }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Bottom bar */}
        <div className="px-7 pt-3 pb-5">
          <div className="flex items-center justify-between mb-4">
            {/* Mic status */}
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full transition-all ${inputLevel > 0.08 ? 'bg-[#8d9e8c] shadow-[0_0_0_4px_rgba(141,158,140,0.18)]' : 'bg-[#d8c9c7]'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${inputLevel > 0.08 ? 'text-[#8d9e8c]' : 'text-[#c5b4b2]'}`}>
                {inputLevel > 0.08 ? 'Signal On' : 'Standby'}
              </span>
            </div>
            {/* Keyboard octave (for keyboard shortcut users) */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setKeyOctave(o => Math.max(2, o - 1))} className="w-5 h-5 rounded-full border border-[#eadad8] text-[#b09e9c] text-xs flex items-center justify-center hover:bg-[#faf4f3]">‹</button>
              <span className="text-[9px] font-black text-[#b09e9c] uppercase tracking-[0.15em]">Key Oct {keyOctave}</span>
              <button onClick={() => setKeyOctave(o => Math.min(5, o + 1))} className="w-5 h-5 rounded-full border border-[#eadad8] text-[#b09e9c] text-xs flex items-center justify-center hover:bg-[#faf4f3]">›</button>
            </div>
          </div>

          <button
            onClick={isListening ? stopAll : startMic}
            className={`flex w-full items-center justify-center gap-3 rounded-[2rem] py-4 text-xs font-black tracking-[0.3em] transition-all ${
              isListening ? 'bg-[#b09e9c] text-white shadow-inner' : 'border border-[#e8d3d1] bg-white text-[#8a7a78] shadow-xl hover:bg-[#fcf7f6]'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            {isListening ? 'STOP' : 'START LISTENING'}
          </button>

          {error && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-500">
              {error}
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 text-center text-[9px] font-black uppercase tracking-[0.5em] text-[#b09e9c]">
        Phenom · Vocal Training Solution
      </p>
    </div>
  );
}
