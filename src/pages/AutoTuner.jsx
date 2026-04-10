import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Activity, ShieldCheck, VolumeX, ChevronDown, Play, Heart, Zap, Info } from 'lucide-react';

const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    notes: [
      { note: 'G4', freq: 392.00, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 },
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

const VOLUME_THRESHOLD = 0.012; 
const SMOOTHING_FACTOR = 0.28;  // 進一步優化反應速度，解決延遲感
const PERFECT_RANGE = 2.8;      // 舒適的 Perfect 綠色感應範圍
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
  const pitchBuffer = useRef([]);

  const currentNotes = useMemo(() => {
    const halfStepFactor = mode === 'HALF_DOWN' ? Math.pow(2, -1/12) : 1;
    return INSTRUMENTS[instrument].notes.map(n => {
      let targetFreq = n.freq * halfStepFactor;
      if (mode === 'SWEETENED' && n.sweeten) targetFreq *= Math.pow(2, n.sweeten / 1200);
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
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    stopReference();
    if (stopTimeout.current) clearTimeout(stopTimeout.current);
    setActiveRefNote(n.note);
    osc.current = audioCtx.current.createOscillator();
    osc.current.type = 'triangle'; 
    osc.current.frequency.setValueAtTime(n.targetFreq, audioCtx.current.currentTime);
    const baseVolume = n.targetFreq < 120 ? 0.6 : 0.35;
    osc.current.connect(gain.current);
    const now = audioCtx.current.currentTime;
    gain.current.gain.cancelScheduledValues(now);
    gain.current.gain.setValueAtTime(0, now);
    gain.current.gain.linearRampToValueAtTime(baseVolume, now + 0.02);
    gain.current.gain.exponentialRampToValueAtTime(0.001, now + REF_PLAY_DURATION / 1000);
    osc.current.start();
    stopTimeout.current = setTimeout(() => stopReference(), REF_PLAY_DURATION);
  };

  const stopReference = () => {
    if (osc.current && gain.current) {
      const now = audioCtx.current.currentTime;
      gain.current.gain.cancelScheduledValues(now);
      gain.current.gain.exponentialRampToValueAtTime(0.001, now + 0.2); 
      const tempOsc = osc.current;
      setTimeout(() => { try { tempOsc.stop(); tempOsc.disconnect(); } catch(e) {} }, 250);
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
    } catch (err) { alert("請允許麥克風權限以進行調音。"); }
  };

  const updateLoop = () => {
    const buffer = new Float32Array(analyser.current.fftSize);
    analyser.current.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    const rms = Math.sqrt(sum / buffer.length);
    
    if (rms < VOLUME_THRESHOLD) {
      setIsTooQuiet(true);
      pitchBuffer.current = [];
    } else {
      setIsTooQuiet(false);
      const p = autoCorrelate(buffer, audioCtx.current.sampleRate);
      
      if (p > 50 && p < 1200) {
        pitchBuffer.current.push(p);
        if (pitchBuffer.current.length > 3) pitchBuffer.current.shift();
        
        const sortedPitches = [...pitchBuffer.current].sort((a, b) => a - b);
        const medianPitch = sortedPitches[Math.floor(sortedPitches.length / 2)];

        setPitch(medianPitch);
        const closest = findClosest(medianPitch);
        
        if (Math.abs(closest.diff) < 45) {
            setNoteInfo({ note: closest.displayNote, label: closest.label });
            const smoothed = (lastDiff.current * (1 - SMOOTHING_FACTOR)) + (closest.diff * SMOOTHING_FACTOR);
            lastDiff.current = smoothed;
            setDisplayDiff(smoothed);
        }
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
    <div className="min-h-screen bg-[#f5eceb] text-slate-800 p-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 border border-[#e8d3d1] shadow-2xl shadow-rose-200/50 relative">
        
        {/* 工具欄 */}
        <div className="flex justify-between items-center mb-8 relative z-[100]">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="bg-[#e8d3d1] px-4 py-2 rounded-2xl text-[11px] font-black text-[#8a7a78] flex items-center gap-2"
          >
            {INSTRUMENTS[instrument].name} <ChevronDown size={14} className={showMenu ? 'rotate-180' : ''} />
          </button>
          
          <div className="flex gap-2">
            <button onClick={() => { setMode(mode === 'SWEETENED' ? 'STANDARD' : 'SWEETENED'); stopAll(); }}
              className={`p-2.5 rounded-xl border transition-all ${mode === 'SWEETENED' ? 'bg-[#d8e2dc] border-[#8d9e8c] text-[#8d9e8c]' : 'bg-white border-[#e8d3d1] text-[#b09e9c]'}`}>
              <Heart size={18} fill={mode === 'SWEETENED' ? "currentColor" : "none"} />
            </button>
            <button onClick={() => { setMode(mode === 'HALF_DOWN' ? 'STANDARD' : 'HALF_DOWN'); stopAll(); }}
              className={`p-2.5 rounded-xl border transition-all ${mode === 'HALF_DOWN' ? 'bg-[#f0e4d7] border-[#d4a373] text-[#d4a373]' : 'bg-white border-[#e8d3d1] text-[#b09e9c]'}`}>
              <Zap size={18} fill={mode === 'HALF_DOWN' ? "currentColor" : "none"} />
            </button>
          </div>

          {showMenu && (
            <div className="absolute left-0 top-12 w-44 bg-white border border-[#e8d3d1] rounded-2xl shadow-xl z-[110] py-2">
              {Object.keys(INSTRUMENTS).map(k => (
                <button key={k} className={`w-full px-5 py-3 text-left text-xs font-bold ${instrument === k ? 'bg-[#e8d3d1] text-[#8a7a78]' : 'text-slate-400'}`}
                  onClick={() => { setInstrument(k); setShowMenu(false); stopAll(); }}>
                  {INSTRUMENTS[k].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 顯示核心 */}
        <div className="text-center mb-10">
          <div className="h-6 flex items-center justify-center gap-2 mb-2">
            <span className="text-[10px] font-black text-[#b09e9c] tracking-widest uppercase">
              {isTooQuiet ? 'Pukanala Tuning' : `${noteInfo.label} String`}
            </span>
          </div>
          <div className={`text-9xl font-black tabular-nums transition-all ${isTooQuiet ? 'text-[#e8d3d1]' : (Math.abs(displayDiff) < PERFECT_RANGE ? 'text-[#8d9e8c]' : 'text-[#b09e9c]')}`}>
            {isTooQuiet ? '--' : noteInfo.note}
          </div>
        </div>

        {/* 儀表盤 */}
        <div className="px-2 mb-12">
          <div className="h-1.5 bg-[#f5eceb] rounded-full relative">
            <div className="absolute left-1/2 -top-1 w-0.5 h-3.5 bg-[#e8d3d1]" />
            <div 
              className={`absolute -top-4 w-2 h-10 rounded-full transition-all duration-150 shadow-sm ${Math.abs(displayDiff) < PERFECT_RANGE ? 'bg-[#8d9e8c]' : 'bg-[#d4a373]'}`}
              style={{ left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 3.5))}% )`, opacity: isTooQuiet ? 0.2 : 1 }}
            />
          </div>
        </div>

        {/* 弦按鈕排列 */}
        <div className="flex justify-between items-center gap-2 mb-8 bg-[#f5eceb]/50 p-3 rounded-[2rem]">
          {currentNotes.map(n => (
            <button key={n.note} onClick={() => playReference(n)}
              className={`flex-1 aspect-[4/5] rounded-[1rem] border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                activeRefNote === n.note ? 'bg-[#e8d3d1] border-white text-white shadow-lg -translate-y-1' : 'bg-white border-transparent text-[#b09e9c]'
              }`}
            >
              <span className="text-[9px] font-black opacity-60">{n.label}</span>
              <span className="text-sm font-black">{n.displayNote}</span>
            </button>
          ))}
        </div>

        {/* 功能說明提醒文字 */}
        <div className="mb-8 px-4 py-3 bg-[#fdfaf9] rounded-2xl border border-[#e8d3d1]/30">
          <div className="flex items-start gap-3 text-[#b09e9c]">
            <Info size={14} className="mt-1 flex-shrink-0" />
            <div className="text-[11px] leading-relaxed font-medium">
              <span className="text-[#8d9e8c] font-bold">♥ 甜蜜模式：</span> 針對烏克麗麗 C 弦等特定弦微調，讓和弦共鳴更完美。<br/>
              <span className="text-[#d4a373] font-bold">⚡ 降半音：</span> 將全弦降低半音，適合彈奏搖滾或柔和曲風。
            </div>
          </div>
        </div>

        <button onClick={isListening ? stopAll : startMic}
          className={`w-full py-5 rounded-[2rem] font-black text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
            isListening ? 'bg-[#b09e9c] text-white shadow-inner' : 'bg-white text-[#8a7a78] border border-[#e8d3d1] shadow-xl hover:bg-[#fcf7f6]'
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening ? 'STOP SCAN' : 'START TUNING'}
        </button>
      </div>
      
      <p className="mt-8 text-[#b09e9c] text-[10px] font-black uppercase tracking-[0.5em]">
        Pukanala • Professional Acoustic Solution
      </p>
    </div>
  );
}
