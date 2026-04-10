import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Activity, ShieldCheck, VolumeX, ChevronDown, Play, Music, Zap, Heart } from 'lucide-react';

// --- 樂器配置 ---
const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗 (GCEA)',
    notes: [
      { note: 'G4', freq: 392.00, label: '4弦' },
      { note: 'C4', freq: 261.63, label: '3弦', sweeten: -2 }, // C 弦通常降 2 cents 最好聽
      { note: 'E4', freq: 329.63, label: '2弦' },
      { note: 'A4', freq: 440.00, label: '1弦' },
    ]
  },
  GUITARLELE: {
    name: '吉他麗麗 (ADGCEA)',
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
    name: '吉他 (EADGBE)',
    notes: [
      { note: 'E2', freq: 82.41,  label: '6弦' },
      { note: 'A2', freq: 110.00, label: '5弦' },
      { note: 'D3', freq: 146.83, label: '4弦' },
      { note: 'G3', freq: 196.00, label: '3弦' },
      { note: 'B3', freq: 246.94, label: '2弦', sweeten: -1 }, // 吉他 B 弦也常微降
      { note: 'E4', freq: 329.63, label: '1弦' },
    ]
  }
};

const VOLUME_THRESHOLD = 0.015;
const SMOOTHING_FACTOR = 0.18;
const REF_PLAY_DURATION = 1500;

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

  // --- 核心邏輯：計算補償後的目標頻率 ---
  const currentNotes = useMemo(() => {
    let globalFactor = 1;
    if (mode === 'HALF_DOWN') globalFactor = Math.pow(2, -1/12);

    return INSTRUMENTS[instrument].notes.map(n => {
      let targetFreq = n.freq * globalFactor;
      
      // 如果是感性模式且該弦有定義 sweeten (單位為 cents)
      if (mode === 'SWEETENED' && n.sweeten) {
        // 1 cent = 2^(1/1200)
        targetFreq *= Math.pow(2, n.sweeten / 1200);
      }

      return {
        ...n,
        targetFreq,
        displayNote: mode === 'HALF_DOWN' ? `${n.note}♭` : n.note
      };
    });
  }, [instrument, mode]);

  useEffect(() => {
    return () => { stopAll(); if (stopTimeout.current) clearTimeout(stopTimeout.current); };
  }, []);

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
      gain.current.gain.setValueAtTime(gain.current.gain.value, now);
      gain.current.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
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
    } catch (err) { alert("麥克風開啟失敗"); }
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
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-3xl rounded-[3rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* 頂部選單 */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <button onClick={() => setShowMenu(!showMenu)} className="bg-slate-800/80 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700">
            {INSTRUMENTS[instrument].name} <ChevronDown size={14} />
          </button>
          
          <div className="flex gap-2">
            {/* 模式切換按鈕 */}
            <button 
              onClick={() => { setMode(mode === 'SWEETENED' ? 'STANDARD' : 'SWEETENED'); stopAll(); }}
              className={`p-2 rounded-xl transition-all border ${mode === 'SWEETENED' ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              title="感性模式 (微調特定弦使和弦更和諧)"
            >
              <Heart size={16} fill={mode === 'SWEETENED' ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => { setMode(mode === 'HALF_DOWN' ? 'STANDARD' : 'HALF_DOWN'); stopAll(); }}
              className={`p-2 rounded-xl transition-all border ${mode === 'HALF_DOWN' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              title="降半音模式"
            >
              <Zap size={16} fill={mode === 'HALF_DOWN' ? "currentColor" : "none"} />
            </button>
          </div>

          {showMenu && (
            <div className="absolute left-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
              {Object.keys(INSTRUMENTS).map(k => (
                <button key={k} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-blue-600" onClick={() => {setInstrument(k); setShowMenu(false); stopAll();}}>
                  {INSTRUMENTS[k].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 狀態顯示 */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2 h-4">
             {mode !== 'STANDARD' && (
               <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-widest">
                 {mode}
               </span>
             )}
             <span className="text-xs font-bold text-blue-400">{isTooQuiet ? '' : noteInfo.label}</span>
          </div>
          <div className={`text-8xl font-black tabular-nums transition-all duration-300 ${isTooQuiet ? 'text-slate-800' : (Math.abs(displayDiff) < 1.5 ? 'text-emerald-400' : 'text-white')}`}>
            {isTooQuiet ? '--' : noteInfo.note}
          </div>
        </div>

        {/* 儀表指針 */}
        <div className="px-4 mb-10 relative z-10">
          <div className="h-1 bg-slate-800 rounded-full relative">
            <div className="absolute left-1/2 -top-1 w-0.5 h-3 bg-slate-700" />
            <div 
              className={`absolute -top-3.5 w-1.5 h-8 rounded-full transition-all duration-75 ${Math.abs(displayDiff) < 1.5 ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'}`}
              style={{ left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 4))}% )`, opacity: isTooQuiet ? 0.1 : 1 }}
            />
          </div>
        </div>

        {/* 弦按鈕 */}
        <div className="grid grid-cols-3 gap-2 mb-8 relative z-10">
          {currentNotes.map(n => (
            <button 
              key={n.note} 
              onClick={() => playReference(n)}
              className={`py-3 px-1 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                activeRefNote === n.note 
                ? 'bg-blue-600 border-transparent shadow-lg scale-105' 
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-600'
              }`}
            >
              <span className={`text-[9px] font-bold ${activeRefNote === n.note ? 'text-blue-100' : 'text-slate-500'}`}>{n.label}</span>
              <span className="text-sm font-black">{n.displayNote}</span>
              <Play size={10} className={activeRefNote === n.note ? 'fill-white text-white' : 'text-slate-600'} />
            </button>
          ))}
        </div>

        <button 
          onClick={isListening ? stopAll : startMic}
          className={`w-full py-5 rounded-[2rem] font-black transition-all flex items-center justify-center gap-3 ${
            isListening ? 'bg-slate-800 text-rose-400 border border-rose-400/20' : 'bg-white text-black hover:bg-slate-100 shadow-2xl'
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening ? 'STOP' : 'AUTO DETECT'}
        </button>
      </div>
    </div>
  );
}
