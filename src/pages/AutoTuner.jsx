import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, ChevronDown, Heart, Zap, Music, Volume2 } from 'lucide-react';

const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    desc: '甜蜜模式：針對 C 弦進行微降補償，修正張力造成的音準偏差。',
    notes: [
      { note: 'G4', freq: 392.0, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 },
      { note: 'E4', freq: 329.63, label: '2', sweeten: -1.0 },
      { note: 'A4', freq: 440.0, label: '1', sweeten: -0.5 },
    ],
  },
  GUITARLELE: {
    name: '吉他麗麗',
    desc: '甜蜜模式：校正 C 弦與低音 A 弦的物理音準誤差，提升低音弦穩定度。',
    notes: [
      { note: 'A2', freq: 110.0, label: '6', sweeten: -1.5 },
      { note: 'D3', freq: 146.83, label: '5', sweeten: -1.0 },
      { note: 'G3', freq: 196.0, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 },
      { note: 'E4', freq: 329.63, label: '2', sweeten: -1.0 },
      { note: 'A4', freq: 440.0, label: '1', sweeten: -0.5 },
    ],
  },
  GUITAR: {
    name: '吉他（標準）',
    desc: '甜蜜模式：補償 B 弦與低音 E 弦在平均律下的生硬感。',
    notes: [
      { note: 'E2', freq: 82.41, label: '6', sweeten: -2.0 },
      { note: 'A2', freq: 110.0, label: '5', sweeten: -1.5 },
      { note: 'D3', freq: 146.83, label: '4', sweeten: -1.0 },
      { note: 'G3', freq: 196.0, label: '3', sweeten: -1.5 },
      { note: 'B3', freq: 246.94, label: '2', sweeten: -1.2 },
      { note: 'E4', freq: 329.63, label: '1', sweeten: -0.5 },
    ],
  },
};

const NOTE_HOLD_MS = 220;
const QUIET_RESET_MS = 900;
const RMS_THRESHOLD = 0.012;
const MIN_CONFIDENCE = 0.72;
const MIN_FREQ = 65;
const MAX_FREQ = 1200;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function centsDiff(freq, targetFreq) {
  return 1200 * Math.log2(freq / targetFreq);
}

function getDisplayNote(note, mode) {
  const noOctave = note.replace(/\d/g, '');
  return mode === 'HALF_DOWN' ? `${noOctave}♭` : noOctave;
}

function createHannWindow(size) {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return window;
}

function applyWindow(buffer, window) {
  const out = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    out[i] = buffer[i] * window[i];
  }
  return out;
}

function computeRMS(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

function normalizedAutoCorrelate(buffer, sampleRate, minFreq = MIN_FREQ, maxFreq = MAX_FREQ) {
  const size = buffer.length;
  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.floor(sampleRate / minFreq);

  const corr = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let energy1 = 0;
    let energy2 = 0;

    for (let i = 0; i < size - lag; i++) {
      const x = buffer[i];
      const y = buffer[i + lag];
      sum += x * y;
      energy1 += x * x;
      energy2 += y * y;
    }

    const denom = Math.sqrt(energy1 * energy2) || 1;
    corr[lag] = sum / denom;
  }

  let bestLag = -1;
  let bestValue = -1;

  for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
    const c = corr[lag];
    if (c > corr[lag - 1] && c >= corr[lag + 1] && c > bestValue) {
      bestValue = c;
      bestLag = lag;
    }
  }

  if (bestLag <= 0) {
    return { freq: 0, clarity: 0 };
  }

  const y1 = corr[bestLag - 1] || corr[bestLag];
  const y2 = corr[bestLag];
  const y3 = corr[bestLag + 1] || corr[bestLag];
  const denom = y1 - 2 * y2 + y3;
  const shift = denom === 0 ? 0 : 0.5 * (y1 - y3) / denom;
  let refinedLag = bestLag + shift;

  let refinedFreq = sampleRate / refinedLag;
  let clarity = bestValue;

  // 次諧波修正：避免抓到高次泛音而忽略真正基音
  // 如果 2 倍或 3 倍週期處也有足夠相關性，且頻率更接近樂器最低音區，優先考慮較低頻
  for (const multiple of [2, 3]) {
    const subLag = refinedLag * multiple;
    const rounded = Math.round(subLag);
    if (rounded <= maxLag) {
      const subCorr = corr[rounded];
      if (subCorr > clarity * 0.88 && subCorr > 0.58) {
        refinedLag = subLag;
        refinedFreq = sampleRate / refinedLag;
        clarity = subCorr;
        break;
      }
    }
  }

  return { freq: refinedFreq, clarity };
}

function findClosestNote(freq, notes) {
  let best = notes[0];
  let bestCents = Infinity;

  for (const n of notes) {
    const cents = Math.abs(centsDiff(freq, n.targetFreq));
    if (cents < bestCents) {
      bestCents = cents;
      best = n;
    }
  }

  return { note: best, cents: centsDiff(freq, best.targetFreq) };
}

export default function AutoTuner() {
  const [instrument, setInstrument] = useState('UKULELE');
  const [mode, setMode] = useState('STANDARD');
  const [isListening, setIsListening] = useState(false);
  const [isTooQuiet, setIsTooQuiet] = useState(true);
  const [displayDiff, setDisplayDiff] = useState(0);
  const [noteInfo, setNoteInfo] = useState({ note: '--', label: '--' });
  const [showMenu, setShowMenu] = useState(false);
  const [activeRefNote, setActiveRefNote] = useState(null);
  const [errorText, setErrorText] = useState('');

  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const hpFilterRef = useRef(null);
  const lpFilterRef = useRef(null);
  const compressorRef = useRef(null);

  const refOscRef = useRef(null);
  const refGainRef = useRef(null);
  const refLimiterRef = useRef(null);

  const animationRef = useRef(null);
  const lastActiveTimeRef = useRef(0);
  const diffRef = useRef(0);
  const pitchHistoryRef = useRef([]);
  const stableNoteRef = useRef(null);
  const stableSinceRef = useRef(0);

  const hannWindowRef = useRef(createHannWindow(4096));

  const currentNotes = useMemo(() => {
    const halfDownFactor = mode === 'HALF_DOWN' ? Math.pow(2, -1 / 12) : 1;

    return INSTRUMENTS[instrument].notes.map((n) => {
      let targetFreq = n.freq * halfDownFactor;

      if (mode === 'SWEETENED' && typeof n.sweeten === 'number') {
        targetFreq *= Math.pow(2, n.sweeten / 1200);
      }

      return {
        ...n,
        targetFreq,
        displayNote: getDisplayNote(n.note, mode),
      };
    });
  }, [instrument, mode]);

  useEffect(() => {
    return () => {
      stopAll();
      stopReference();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const getAudioContext = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playReference = async (n) => {
    try {
      const ctx = await getAudioContext();
      stopReference();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();

      limiter.threshold.value = -16;
      limiter.knee.value = 8;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.targetFreq, ctx.currentTime);

      const volume = n.targetFreq < 150 ? 0.08 : 0.055;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(volume * 0.7, ctx.currentTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(limiter);
      limiter.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.55);

      osc.onended = () => {
        if (refOscRef.current === osc) {
          refOscRef.current = null;
          refGainRef.current = null;
          refLimiterRef.current = null;
          setActiveRefNote(null);
        }
      };

      refOscRef.current = osc;
      refGainRef.current = gain;
      refLimiterRef.current = limiter;
      setActiveRefNote(n.note);
    } catch (err) {
      setErrorText('參考音播放失敗');
    }
  };

  const stopReference = () => {
    try {
      if (refOscRef.current) {
        refOscRef.current.stop();
        refOscRef.current.disconnect();
      }
    } catch (_) {}

    try {
      refGainRef.current?.disconnect();
      refLimiterRef.current?.disconnect();
    } catch (_) {}

    refOscRef.current = null;
    refGainRef.current = null;
    refLimiterRef.current = null;
    setActiveRefNote(null);
  };

  const resetDetectorUI = () => {
    setIsTooQuiet(true);
    setDisplayDiff(0);
    setNoteInfo({ note: '--', label: '--' });
    pitchHistoryRef.current = [];
    stableNoteRef.current = null;
    stableSinceRef.current = 0;
    diffRef.current = 0;
  };

  const startMic = async () => {
    try {
      setErrorText('');
      const ctx = await getAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const hp = ctx.createBiquadFilter();
      const lp = ctx.createBiquadFilter();
      const comp = ctx.createDynamicsCompressor();
      const analyser = ctx.createAnalyser();

      hp.type = 'highpass';
      hp.frequency.value = 60;
      hp.Q.value = 0.707;

      lp.type = 'lowpass';
      lp.frequency.value = instrument === 'GUITARLELE' || instrument === 'GUITAR' ? 900 : 1200;
      lp.Q.value = 0.707;

      comp.threshold.value = -24;
      comp.knee.value = 18;
      comp.ratio.value = 3;
      comp.attack.value = 0.003;
      comp.release.value = 0.12;

      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.08;

      source.connect(hp);
      hp.connect(lp);
      lp.connect(comp);
      comp.connect(analyser);

      sourceRef.current = source;
      hpFilterRef.current = hp;
      lpFilterRef.current = lp;
      compressorRef.current = comp;
      analyserRef.current = analyser;

      resetDetectorUI();
      setIsListening(true);
      updateLoop();
    } catch (err) {
      setErrorText('麥克風啟動失敗，請確認瀏覽器權限與裝置輸入來源。');
      stopAll();
    }
  };

  const stopAll = () => {
    setIsListening(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    try {
      sourceRef.current?.disconnect();
      hpFilterRef.current?.disconnect();
      lpFilterRef.current?.disconnect();
      compressorRef.current?.disconnect();
      analyserRef.current?.disconnect();
    } catch (_) {}

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    mediaStreamRef.current = null;
    sourceRef.current = null;
    hpFilterRef.current = null;
    lpFilterRef.current = null;
    compressorRef.current = null;
    analyserRef.current = null;

    resetDetectorUI();
  };

  const commitDetectedNote = (closestNote, cents, freq) => {
    const now = performance.now();

    if (stableNoteRef.current?.note !== closestNote.note) {
      stableNoteRef.current = closestNote;
      stableSinceRef.current = now;
      return;
    }

    if (now - stableSinceRef.current < NOTE_HOLD_MS) {
      return;
    }

    setNoteInfo({
      note: closestNote.displayNote,
      label: closestNote.label,
    });

    const limitedCents = clamp(cents, -50, 50);
    const smoothed = diffRef.current * 0.78 + limitedCents * 0.22;
    diffRef.current = smoothed;
    setDisplayDiff(smoothed);
    setIsTooQuiet(false);
    lastActiveTimeRef.current = Date.now();
  };

  const updateLoop = () => {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;

    if (!analyser || !ctx) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const rms = computeRMS(buffer);

    if (rms < RMS_THRESHOLD) {
      if (Date.now() - lastActiveTimeRef.current > QUIET_RESET_MS) {
        resetDetectorUI();
      }
      animationRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    const windowed = applyWindow(buffer, hannWindowRef.current);
    const { freq, clarity } = normalizedAutoCorrelate(windowed, ctx.sampleRate);

    if (freq >= MIN_FREQ && freq <= MAX_FREQ && clarity >= MIN_CONFIDENCE) {
      pitchHistoryRef.current.push(freq);
      if (pitchHistoryRef.current.length > 7) {
        pitchHistoryRef.current.shift();
      }

      const stableFreq = median(pitchHistoryRef.current);
      const { note: closestNote, cents } = findClosestNote(stableFreq, currentNotes);

      // 第一層限制：必須落在該樂器有效音區附近
      const maxAllowedCents = instrument === 'GUITARLELE' || instrument === 'GUITAR' ? 70 : 60;
      if (Math.abs(cents) <= maxAllowedCents) {
        // 第二層限制：避免跨太遠的字串跳躍
        if (stableNoteRef.current) {
          const prevIndex = currentNotes.findIndex((n) => n.note === stableNoteRef.current.note);
          const nextIndex = currentNotes.findIndex((n) => n.note === closestNote.note);
          const largeJump = Math.abs(prevIndex - nextIndex) >= 3;

          if (largeJump && clarity < 0.84) {
            animationRef.current = requestAnimationFrame(updateLoop);
            return;
          }
        }

        commitDetectedNote(closestNote, cents, stableFreq);
      }
    }

    animationRef.current = requestAnimationFrame(updateLoop);
  };

  const centerPercent = clamp(displayDiff, -50, 50) * 1.6;
  const isInTune = Math.abs(displayDiff) < 5;

  return (
    <div className="min-h-screen bg-[#f5eceb] text-slate-800 p-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 border border-[#e8d3d1] shadow-2xl relative">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="bg-[#e8d3d1] px-4 py-2 rounded-2xl text-[11px] font-black text-[#8a7a78] flex items-center gap-2"
          >
            {INSTRUMENTS[instrument].name}
            <ChevronDown size={14} />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setMode((m) => (m === 'SWEETENED' ? 'STANDARD' : 'SWEETENED'))}
              className={`p-2.5 rounded-xl border transition-all ${
                mode === 'SWEETENED'
                  ? 'bg-[#d8e2dc] text-[#8d9e8c]'
                  : 'bg-white text-[#b09e9c]'
              }`}
              title="甜蜜模式"
            >
              <Heart size={18} fill={mode === 'SWEETENED' ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => setMode((m) => (m === 'HALF_DOWN' ? 'STANDARD' : 'HALF_DOWN'))}
              className={`p-2.5 rounded-xl border transition-all ${
                mode === 'HALF_DOWN'
                  ? 'bg-[#f0e4d7] text-[#d4a373]'
                  : 'bg-white text-[#b09e9c]'
              }`}
              title="降半音"
            >
              <Zap size={18} fill={mode === 'HALF_DOWN' ? 'currentColor' : 'none'} />
            </button>
          </div>

          {showMenu && (
            <div className="absolute left-8 top-20 w-48 bg-white border border-[#e8d3d1] rounded-2xl shadow-xl z-50 py-2">
              {Object.keys(INSTRUMENTS).map((key) => (
                <button
                  key={key}
                  className="w-full px-5 py-3 text-left text-xs font-bold hover:bg-rose-50"
                  onClick={() => {
                    setInstrument(key);
                    setShowMenu(false);
                    if (isListening) {
                      stopAll();
                    }
                  }}
                >
                  {INSTRUMENTS[key].name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mb-4">
          <div className="h-6 text-[10px] font-black text-[#b09e9c] tracking-[0.2em] uppercase">
            {isTooQuiet ? 'Ready' : `${noteInfo.label} String`}
          </div>

          <div
            className={`text-8xl md:text-9xl font-black transition-colors ${
              isTooQuiet ? 'text-[#e8d3d1]' : isInTune ? 'text-[#8d9e8c]' : 'text-[#b09e9c]'
            }`}
          >
            {isTooQuiet ? '--' : noteInfo.note}
          </div>

          <div className="mt-2 text-[11px] font-bold text-[#b09e9c] min-h-[18px]">
            {errorText ? errorText : INSTRUMENTS[instrument].desc}
          </div>
        </div>

        <div className="mb-10 px-2">
          <div className="relative h-14 flex items-center">
            <div className="absolute inset-x-0 h-1.5 bg-[#f5eceb] rounded-full" />

            <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-px h-6 bg-[#d7c2bf]" />
            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-px h-6 bg-[#d7c2bf]" />
            <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-1 h-9 rounded-full bg-[#8d9e8c]" />
            <div className="absolute left-[70%] top-1/2 -translate-y-1/2 w-px h-6 bg-[#d7c2bf]" />
            <div className="absolute left-[90%] top-1/2 -translate-y-1/2 w-px h-6 bg-[#d7c2bf]" />

            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-10 rounded-full bg-[#d4a373] shadow transition-all duration-100"
              style={{
                left: `calc(50% + ${centerPercent}% - 6px)`,
                opacity: isTooQuiet ? 0.25 : 1,
              }}
            />
          </div>

          <div className="text-center text-[11px] font-bold text-[#b09e9c]">
            {isTooQuiet ? '請撥動單一琴弦' : `${displayDiff > 0 ? '偏高' : displayDiff < 0 ? '偏低' : '準確'} ${Math.abs(displayDiff).toFixed(1)} cents`}
          </div>
        </div>

        <div className="flex justify-between gap-2 mb-10 bg-[#f5eceb]/50 p-3 rounded-[2rem]">
          {currentNotes.map((n) => (
            <button
              key={n.note}
              onClick={() => playReference(n)}
              className={`flex-1 aspect-[4/5] rounded-[1rem] border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                activeRefNote === n.note
                  ? 'bg-[#e8d3d1] border-white text-white shadow-lg'
                  : 'bg-white border-transparent text-[#b09e9c]'
              }`}
            >
              <span className="text-[9px] font-black">{n.label}</span>
              <span className="text-sm font-black">{n.displayNote}</span>
              <Volume2 size={13} />
            </button>
          ))}
        </div>

        <button
          onClick={isListening ? stopAll : startMic}
          className={`w-full py-5 rounded-[2rem] font-black text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
            isListening
              ? 'bg-[#b09e9c] text-white'
              : 'bg-white text-[#8a7a78] border border-[#e8d3d1] shadow-xl'
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening ? 'STOP' : 'START'}
        </button>
      </div>
    </div>
  );
}
