import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Activity, ShieldCheck, VolumeX, ChevronDown, Play, Heart, Zap } from 'lucide-react';

// --- 樂器配置 ---
const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    notes: [
      { note: 'G4', freq: 392.00, label: '4弦' },
      { note: 'C4', freq: 261.63, label: '3弦', sweeten: -2 },
      { note: 'E4', freq: 329.63, label: '2弦' },
      { note: 'A4', freq: 440.00, label: '1弦' },
    ]
  },
  GUITARLELE: {
    name: '吉他麗麗',
    notes: [
      { note: 'A2', freq: 110.00, label: '6弦' },
      { note: 'D3', freq: 146.83, label: '5弦' },
      { note: 'G3', freq: 196.00, label: '4弦' },
      { note: 'C4', freq: 261.63, label: '3弦', sweeten: -2 },
      { note: 'E4', freq: 329.63, label: '2弦' },
      { note: 'A4', freq: 440.00, label: '1弦' },
    ]
  },
  GUITAR: {
    name: '吉他 (標準)',
    notes: [
      { note: 'E2', freq: 82.41,  label: '6弦' },
      { note: 'A2', freq: 110.00, label: '5弦' },
      { note: 'D3', freq: 146.83, label: '4弦' },
      { note: 'G3', freq: 196.00, label: '3弦' },
      { note: 'B3', freq: 246.94, label: '2弦', sweeten: -1 },
      { note: 'E4', freq: 329.63, label: '1弦' },
    ]
  }
};

const VOLUME_THRESHOLD = 0.015;
const SMOOTHING_FACTOR = 0.18;
const REF_PLAY_DURATION = 1200;

export default function AutoTuner() {
  const [instrument, setInstrument] = useState('UKULELE');
  const [mode, setMode] = useState('STANDARD');
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

  const currentNotes = useMemo(() => {
    let globalFactor = mode === 'HALF_DOWN' ? Math.pow(2, -1/12) : 1;
    return INSTRUMENTS[instrument].notes.map(n => {
      let targetFreq = n.freq * globalFactor;
      if (mode === 'SWEETENED' && n.sweeten) targetFreq *= Math.pow(2, n.sweeten / 1200);
      return { ...n, targetFreq, displayNote: mode === 'HALF_DOWN' ? n.note.replace(/[0-9]/g, '') + '♭' : n.note.replace(/[0-9]/g, '') };
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
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl relative overflow-visible">
        
        {/* 工具欄 */}
        <div className="flex justify-between items-center mb-6 relative z-[100]">
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700"
            >
              {INSTRUMENTS[instrument].name} <ChevronDown size={14} />
            </button>
            {showMenu && (
              <div className="absolute left-0 top-10 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[110] py-1 overflow-hidden">
                {Object.keys(INSTRUMENTS).map(k => (
                  <button 
                    key={k} 
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors ${instrument === k ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}
                    onClick={() => { setInstrument(k); setShowMenu(false); stopAll(); }}
                  >
                    {INSTRUMENTS[k].name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => { setMode(mode === 'SWEETENED' ? 'STANDARD' : 'SWEETENED'); stopAll(); }}
              className={`p-2 rounded-lg border transition-all ${mode === 'SWEETENED' ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <Heart size={14} fill={mode === 'SWEETENED' ? "currentColor" : "none"} />
            </button>
            <button onClick={() => { setMode(mode === 'HALF_DOWN' ? 'STANDARD' : 'HALF_DOWN'); stopAll(); }}
              className={`p-2 rounded-lg border transition-all ${mode === 'HALF_DOWN' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <Zap size={14} fill={mode === 'HALF_DOWN' ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* 顯示主體 */}
        <div className="text-center mb-6">
          <div className="h-6 flex items-center justify-center gap-2">
            {mode !== 'STANDARD' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">{mode}</span>}
            <span className="text-xs font-bold text-blue-400">{isTooQuiet ? '' : noteInfo.label}</span>
          </div>
          <div className={`text-7xl font-black tabular-nums transition-all ${isTooQuiet ? 'text-slate-800' : (Math.abs(displayDiff) < 1.5 ? 'text-emerald-400' : 'text-white')}`}>
            {isTooQuiet ? '--' : noteInfo.note}
          </div>
        </div>

        {/* 儀表指針 */}
        <div className="px-2 mb-10">
          <div className="h-1 bg-slate-800 rounded-full relative">
            <div className="absolute left-1/2 -top-1 w-0.5 h-3 bg-slate-700" />
            <div 
              className={`absolute -top-3 w-1.5 h-7 rounded-full transition-all duration-75 ${Math.abs(displayDiff) < 1.5 ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`}
              style={{ left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 3.5))}% )`, opacity: isTooQuiet ? 0.1 : 1 }}
            />
          </div>
        </div>

        {/* 優化後的弦按鈕：橫向線性排列 */}
        <div className="flex justify-between items-center gap-1.5 mb-8 bg-slate-950/30 p-2 rounded-2xl border border-slate-800/50">
          {currentNotes.map(n => (
            <button 
              key={n.note} 
              onClick={() => playReference(n)}
              className={`flex-1 aspect-square max-w-[50px] rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeRefNote === n.note 
                ? 'bg-blue-600 border-transparent shadow-lg scale-110 -translate-y-1' 
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
              }`}
            >
              <span className={`text-[8px] font-bold ${activeRefNote === n.note ? 'text-blue-100' : 'text-slate-500'}`}>{n.label.replace('弦','')}</span>
              <span className="text-xs font-black">{n.displayNote}</span>
              <div className={`w-1 h-1 rounded-full ${activeRefNote === n.note ? 'bg-white' : 'bg-slate-600'}`} />
            </button>
          ))}
        </div>

        <button 
          onClick={isListening ? stopAll : startMic}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all flex items-center justify-center gap-3 ${
            isListening ? 'bg-slate-800 text-rose-400 border border-rose-400/20' : 'bg-white text-black hover:bg-slate-100 shadow-xl'
          }`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? 'STOP SCAN' : 'START AUTO DETECT'}
        </button>
      </div>
      <p className="mt-6 text-slate-700 text-[10px] font-bold tracking-[0.3em]">PRO TUNING ENGINE V2.1</p>
    </div>
  );
}
