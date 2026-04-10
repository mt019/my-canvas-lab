import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Activity, ShieldCheck, VolumeX, ChevronDown, Play, Heart, Zap, Music } from 'lucide-react';

/**
 * 甜蜜模式 (Sweetened Tuning) 說明：
 * 這裡的補償值 (cents) 是基於樂器物理特性。
 * 負值代表稍微調低，正值代表稍微調高。
 */
const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    notes: [
      { note: 'G4', freq: 392.00, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 }, // C弦補償最重
      { note: 'E4', freq: 329.63, label: '2', sweeten: -1.0 },
      { note: 'A4', freq: 440.00, label: '1', sweeten: -0.5 },
    ]
  },
  GUITARLELE: {
    name: '吉他麗麗',
    notes: [
      { note: 'A2', freq: 110.00, label: '6', sweeten: -1.5 },
      { note: 'D3', freq: 146.83, label: '5', sweeten: -1.0 },
      { note: 'G3', freq: 196.00, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 },
      { note: 'E4', freq: 329.63, label: '2', sweeten: -1.0 },
      { note: 'A4', freq: 440.00, label: '1', sweeten: -0.5 },
    ]
  },
  GUITAR: {
    name: '吉他 (標準)',
    notes: [
      { note: 'E2', freq: 82.41,  label: '6', sweeten: -2.0 },
      { note: 'A2', freq: 110.00, label: '5', sweeten: -1.5 },
      { note: 'D3', freq: 146.83, label: '4', sweeten: -1.0 },
      { note: 'G3', freq: 196.00, label: '3', sweeten: -1.5 },
      { note: 'B3', freq: 246.94, label: '2', sweeten: -1.2 },
      { note: 'E4', freq: 329.63, label: '1', sweeten: -0.5 },
    ]
  }
};

const VOLUME_THRESHOLD = 0.015;
const SMOOTHING_FACTOR = 0.18;
const REF_PLAY_DURATION = 1200;

export default function AutoTuner() {
  const [instrument, setInstrument] = useState('UKULELE');
  const [mode, setMode] = useState('STANDARD'); // STANDARD, HALF_DOWN, SWEETENED
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [noteInfo, setNoteInfo] = useState({ note: '--', label: '--' });
  const [displayDiff, setDisplayDiff] = useState(0);
  const [isTooQuiet, setIsTooQuiet] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [activeRefNote, setActiveRefNote] = useState(null);

  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const osc = useRef(null);
  const gain = useRef(null);
  const stream = useRef(null);
  const animId = useRef(null);
  const lastDiff = useRef(0);
  const stopTimeout = useRef(null);

  // --- 計算當前目標頻率 (包含降半音與全弦甜蜜補償) ---
  const currentNotes = useMemo(() => {
    const halfStepFactor = mode === 'HALF_DOWN' ? Math.pow(2, -1/12) : 1;
    return INSTRUMENTS[instrument].notes.map(n => {
      let targetFreq = n.freq * halfStepFactor;
      // 如果開啟甜蜜模式，套用該弦專屬補償
      if (mode === 'SWEETENED' && n.sweeten) {
        targetFreq *= Math.pow(2, n.sweeten / 1200);
      }
      return { 
        ...n, 
        targetFreq, 
        displayNote: mode === 'HALF_DOWN' ? n.note.replace(/[0-9]/g, '') + '♭' : n.note.replace(/[0-9]/g, '') 
      };
    });
  }, [instrument, mode]);

  useEffect(() => { return () => stopAll(); }, []);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      gain.current = audioCtx.current.createGain();
      gain.current.connect(audioCtx.current.destination);
    }
  };

  const playReference = (n) => {
    initAudio();
    stopReference();
    if (stopTimeout.current) clearTimeout(stopTimeout.current);
    setActiveRefNote(n.note);
    osc.current = audioCtx.current.createOscillator();
    osc.current.type = 'sine';
    osc.current.frequency.setValueAtTime(n.targetFreq, audioCtx.current.currentTime);
    osc.current.connect(gain.current);
    gain.current.gain.setValueAtTime(0, audioCtx.current.currentTime);
    gain.current.gain.linearRampToValueAtTime(0.2, audioCtx.current.currentTime + 0.05);
    osc.current.start();
    stopTimeout.current = setTimeout(() => stopReference(), REF_PLAY_DURATION);
  };

  const stopReference = () => {
    if (osc.current && gain.current) {
      const now = audioCtx.current.currentTime;
      gain.current.gain.linearRampToValueAtTime(0, now + 0.3);
      const tempOsc = osc.current;
      setTimeout(() => { try { tempOsc.stop(); tempOsc.disconnect(); } catch(e) {} }, 400);
      osc.current = null;
    }
    setActiveRefNote(null);
  };

  const startMic = async () => {
    initAudio();
    if (audioCtx.current.state === 'suspended') await audioCtx.current.resume();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 2048;
      const source = audioCtx.current.createMediaStreamSource(stream.current);
      source.connect(analyser.current);
      setIsListening(true);
      updateLoop();
    } catch (err) { alert("無法存取麥克風"); }
  };

  const updateLoop = () => {
    const buffer = new Float32Array(analyser.current.fftSize);
    analyser.current.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    const rms = Math.sqrt(sum / buffer.length);
    if (rms < VOLUME_THRESHOLD) {
      setIsTooQuiet(true);
    } else {
      setIsTooQuiet(false);
      const p = autoCorrelate(buffer, audioCtx.current.sampleRate);
      if (p > 50 && p < 1200) {
        setPitch(p);
        const closest = findClosest(p);
        setNoteInfo({ note: closest.displayNote, label: closest.label });
        const smoothed = (lastDiff.current * (1 - SMOOTHING_FACTOR)) + (closest.diff * SMOOTHING_FACTOR);
        lastDiff.current = smoothed;
        setDisplayDiff(smoothed);
      }
    }
    animId.current = requestAnimationFrame(updateLoop);
  };

  const autoCorrelate = (buf, sr) => {
    let r1 = 0, r2 = buf.length - 1, thres = 0.2;
    for (let i = 0; i < buf.length / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < buf.length / 2; i++) if (Math.abs(buf[buf.length - i]) < thres) { r2 = buf.length - i; break; }
    const b = buf.slice(r1, r2);
    const c = new Array(b.length).fill(0);
    for (let i = 0; i < b.length; i++) {
      for (let j = 0; j < b.length - i; j++) c[i] = c[i] + b[j] * b[j + i];
    }
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxv = -1, maxp = -1;
    for (let i = d; i < b.length; i++) if (c[i] > maxv) { maxv = c[i]; maxp = i; }
    return sr / maxp;
  };

  const findClosest = (f) => {
    let minD = Infinity;
    let target = currentNotes[0];
    currentNotes.forEach(n => {
      const d = f - n.targetFreq;
      if (Math.abs(d) < Math.abs(minD)) { minD = d; target = n; }
    });
    return { ...target, diff: minD };
  };

  const stopAll = () => {
    setIsListening(false);
    stopReference();
    cancelAnimationFrame(animId.current);
    if (stream.current) stream.current.getTracks().forEach(t => t.stop());
    setNoteInfo({ note: '--', label: '--' });
    setIsTooQuiet(true);
    lastDiff.current = 0;
    setDisplayDiff(0);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 flex flex-col items-center justify-center font-sans selection:bg-blue-500/30">
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl relative overflow-visible">
        
        {/* 工具列：修復 z-index 與層級 */}
        <div className="flex justify-between items-center mb-8 relative z-[100]">
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700"
            >
              {INSTRUMENTS[instrument].name} <ChevronDown size={14} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>
            {showMenu && (
              <div className="absolute left-0 top-11 w-44 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-[110] py-1.5 overflow-hidden animate-in fade-in zoom-in duration-200">
                {Object.keys(INSTRUMENTS).map(k => (
                  <button 
                    key={k} 
                    className={`w-full px-4 py-3 text-left text-[11px] font-bold transition-colors ${instrument === k ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                    onClick={() => { setInstrument(k); setShowMenu(false); stopAll(); }}
                  >
                    {INSTRUMENTS[k].name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { setMode(mode === 'SWEETENED' ? 'STANDARD' : 'SWEETENED'); stopAll(); }}
              className={`p-2.5 rounded-xl border transition-all ${mode === 'SWEETENED' ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              title="甜蜜模式：全弦物理補償"
            >
              <Heart size={16} fill={mode === 'SWEETENED' ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => { setMode(mode === 'HALF_DOWN' ? 'STANDARD' : 'HALF_DOWN'); stopAll(); }}
              className={`p-2.5 rounded-xl border transition-all ${mode === 'HALF_DOWN' ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              title="降半音模式"
            >
              <Zap size={16} fill={mode === 'HALF_DOWN' ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* 顯示核心 */}
        <div className="text-center mb-6">
          <div className="h-6 flex items-center justify-center gap-2 mb-1">
            {mode !== 'STANDARD' && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${mode === 'SWEETENED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {mode}
              </span>
            )}
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{isTooQuiet ? '' : `${noteInfo.label}弦`}</span>
          </div>
          <div className={`text-8xl font-black tabular-nums transition-all ${isTooQuiet ? 'text-slate-800' : (Math.abs(displayDiff) < 1.5 ? 'text-emerald-400 scale-105' : 'text-white')}`}>
            {isTooQuiet ? '--' : noteInfo.note}
          </div>
        </div>

        {/* 儀表指針 */}
        <div className="px-4 mb-10">
          <div className="h-1 bg-slate-800/50 rounded-full relative">
            <div className="absolute left-1/2 -top-1 w-0.5 h-3 bg-slate-700" />
            <div 
              className={`absolute -top-3.5 w-1.5 h-8 rounded-full transition-all duration-75 ${Math.abs(displayDiff) < 1.5 ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)]'}`}
              style={{ left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 4))}% )`, opacity: isTooQuiet ? 0.1 : 1 }}
            />
          </div>
        </div>

        {/* 線性排列弦按鈕：低音到高音 */}
        <div className="flex justify-between items-center gap-2 mb-10 bg-black/20 p-2.5 rounded-2xl border border-slate-800/50">
          {currentNotes.map(n => (
            <button 
              key={n.note} 
              onClick={() => playReference(n)}
              className={`flex-1 aspect-[4/5] rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                activeRefNote === n.note 
                ? 'bg-blue-600 border-transparent shadow-xl scale-110 -translate-y-1' 
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 text-slate-400'
              }`}
            >
              <span className={`text-[9px] font-black ${activeRefNote === n.note ? 'text-blue-100' : 'text-slate-600'}`}>{n.label}</span>
              <span className="text-sm font-black tracking-tighter">{n.displayNote}</span>
              <div className={`w-1.5 h-0.5 rounded-full ${activeRefNote === n.note ? 'bg-white' : 'bg-slate-700'}`} />
            </button>
          ))}
        </div>

        <button 
          onClick={isListening ? stopAll : startMic}
          className={`w-full py-5 rounded-3xl font-black text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            isListening ? 'bg-slate-800 text-rose-400 border border-rose-400/30' : 'bg-white text-black hover:bg-slate-100 shadow-[0_20px_40px_rgba(255,255,255,0.05)]'
          }`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? 'STOP SCAN' : 'START AUTO DETECT'}
        </button>
      </div>
      
      <div className="mt-8 flex items-center gap-4 text-slate-700">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={12} /> Web Audio API
          </div>
          <div className="w-1 h-1 bg-slate-800 rounded-full" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
            <Activity size={12} /> 64-bit Pitch Engine
          </div>
      </div>
    </div>
  );
}
