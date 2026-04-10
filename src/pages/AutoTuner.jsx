import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Activity, ShieldCheck, VolumeX, ChevronDown, Play, Music } from 'lucide-react';

// --- 樂器配置：區分八度音階 ---
const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗 (GCEA)',
    notes: [
      { note: 'G4', freq: 392.00, label: '4弦' },
      { note: 'C4', freq: 261.63, label: '3弦' },
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
      { note: 'C4', freq: 261.63, label: '3弦' },
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
      { note: 'B3', freq: 246.94, label: '2弦' },
      { note: 'E4', freq: 329.63, label: '1弦' },
    ]
  }
};

const VOLUME_THRESHOLD = 0.015;
const SMOOTHING_FACTOR = 0.18;
const REF_PLAY_DURATION = 1500; // 參考音播放時間 (毫秒)

export default function AutoTuner() {
  const [instrument, setInstrument] = useState('UKULELE');
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

  const currentNotes = useMemo(() => INSTRUMENTS[instrument].notes, [instrument]);

  useEffect(() => {
    return () => {
      stopAll();
      if (stopTimeout.current) clearTimeout(stopTimeout.current);
    };
  }, []);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      gain.current = audioCtx.current.createGain();
      gain.current.connect(audioCtx.current.destination);
    }
  };

  // --- 播放標準參考音 (短暫播放並自動停止) ---
  const playReference = (n) => {
    initAudio();
    stopReference(); // 先停止當前正在響的
    if (stopTimeout.current) clearTimeout(stopTimeout.current);

    setActiveRefNote(n.note);
    
    osc.current = audioCtx.current.createOscillator();
    osc.current.type = 'sine';
    osc.current.frequency.setValueAtTime(n.freq, audioCtx.current.currentTime);
    osc.current.connect(gain.current);
    
    // 淡入
    gain.current.gain.setValueAtTime(0, audioCtx.current.currentTime);
    gain.current.gain.linearRampToValueAtTime(0.3, audioCtx.current.currentTime + 0.05);
    
    osc.current.start();

    // 設定定時器：播放一段時間後淡出並停止
    stopTimeout.current = setTimeout(() => {
      stopReference();
    }, REF_PLAY_DURATION);
  };

  const stopReference = () => {
    if (osc.current && gain.current) {
      const now = audioCtx.current.currentTime;
      gain.current.gain.setValueAtTime(gain.current.gain.value, now);
      gain.current.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // 0.3秒淡出
      
      const tempOsc = osc.current;
      setTimeout(() => {
        try { tempOsc.stop(); tempOsc.disconnect(); } catch(e) {}
      }, 400);
      osc.current = null;
    }
    setActiveRefNote(null);
  };

  // --- 自動偵測邏輯 ---
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
    } catch (err) { alert("麥克風存取失敗"); }
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
        setNoteInfo({ note: closest.note, label: closest.label });
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
      const d = f - n.freq;
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
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 flex flex-col items-center justify-center font-sans selection:bg-blue-500/30">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-3xl rounded-[3rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* 背景裝飾 */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-[80px]" />

        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
               <Music size={14} className="text-white" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Pro Tuner</span>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="bg-slate-800/80 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700">
            {INSTRUMENTS[instrument].name} <ChevronDown size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
              {Object.keys(INSTRUMENTS).map(k => (
                <button key={k} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-blue-600 transition-colors" onClick={() => {setInstrument(k); setShowMenu(false); stopAll();}}>
                  {INSTRUMENTS[k].name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className="text-xs font-bold text-blue-400 mb-2 h-4">{isTooQuiet ? '' : noteInfo.label}</div>
          <div className={`text-8xl font-black tabular-nums transition-all duration-300 ${isTooQuiet ? 'text-slate-800' : (Math.abs(displayDiff) < 1.5 ? 'text-emerald-400 scale-110' : 'text-white')}`}>
            {isTooQuiet ? '--' : noteInfo.note}
          </div>
        </div>

        <div className="px-4 mb-12 relative z-10">
          <div className="h-1 bg-slate-800 rounded-full relative">
            <div className="absolute left-1/2 -top-1 w-0.5 h-3 bg-slate-700" />
            <div 
              className={`absolute -top-3.5 w-1.5 h-8 rounded-full transition-all duration-75 ${Math.abs(displayDiff) < 1.5 ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'}`}
              style={{ left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 3.8))}% )`, opacity: isTooQuiet ? 0.1 : 1 }}
            />
          </div>
          <div className="flex justify-between mt-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <span>Too Low</span>
            <span className={!isTooQuiet && Math.abs(displayDiff) < 1.5 ? 'text-emerald-400' : ''}>Perfect</span>
            <span>Too High</span>
          </div>
        </div>

        {/* 參考音按鈕 (輕觸一下播放 1.5 秒) */}
        <div className="grid grid-cols-3 gap-2 mb-8 relative z-10">
          {currentNotes.map(n => (
            <button 
              key={n.note} 
              onClick={() => playReference(n)}
              className={`py-3 px-1 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                activeRefNote === n.note 
                ? 'bg-blue-600 border-transparent shadow-lg scale-105 -translate-y-1' 
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-600'
              }`}
            >
              <span className={`text-[9px] font-bold ${activeRefNote === n.note ? 'text-blue-100' : 'text-slate-500'}`}>{n.label}</span>
              <span className="text-sm font-black tracking-tighter">{n.note}</span>
              <Play size={10} className={activeRefNote === n.note ? 'fill-white text-white' : 'text-slate-600'} />
            </button>
          ))}
        </div>

        <div className="flex gap-3 relative z-10">
          <button 
            onClick={isListening ? stopAll : startMic}
            className={`flex-1 py-5 rounded-[2rem] font-black transition-all flex items-center justify-center gap-3 ${
              isListening ? 'bg-slate-800 text-rose-400 border border-rose-400/20' : 'bg-white text-black hover:bg-slate-100 shadow-2xl shadow-white/10'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening ? 'STOP' : 'AUTO DETECT'}
          </button>
        </div>

      </div>
      
      <p className="mt-8 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
        Web Audio Engine • Auto Octave Correction
      </p>
    </div>
  );
}
