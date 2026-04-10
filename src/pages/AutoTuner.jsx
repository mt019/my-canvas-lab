import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, ChevronDown, Heart, Zap, Music, Info, X } from 'lucide-react';

const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    desc: '甜蜜模式：針對 C 弦進行微降補償，修正因琴弦張力產生的音準偏差，使常用和弦共鳴更加純淨。',
    notes: [
      { note: 'G4', freq: 392.00, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 },
      { note: 'E4', freq: 329.63, label: '2', sweeten: -1.0 },
      { note: 'A4', freq: 440.00, label: '1', sweeten: -0.5 },
    ]
  },
  GUITARLELE: {
    name: '吉他麗麗',
    desc: '甜蜜模式：校正 C 弦與低音 A 弦的物理音準誤差，確保這把精緻的小琴在各個音域都能保持出色的音色平衡。',
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
    desc: '甜蜜模式：補償 B 弦與低音 E 弦在平均律下的生硬感，釋放木吉他自然的泛音與共鳴。',
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

const VOLUME_THRESHOLD = 0.006; 
const SMOOTHING_FACTOR = 0.18;  
const PERFECT_RANGE = 2.8;
const REF_PLAY_DURATION = 1500;
const NOTE_HOLD_TIME = 1000;

export default function AutoTuner() {
  const [instrument, setInstrument] = useState('UKULELE');
  const [mode, setMode] = useState('STANDARD'); 
  const [infoOverlay, setInfoOverlay] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [noteInfo, setNoteInfo] = useState({ note: '--', label: '--' });
  const [displayDiff, setDisplayDiff] = useState(0);
  const [isTooQuiet, setIsTooQuiet] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [activeRefNote, setActiveRefNote] = useState(null);

  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const osc = useRef(null);
  const gainNode = useRef(null);
  const stream = useRef(null);
  const animId = useRef(null);
  const lastDiff = useRef(0);
  const stopTimeout = useRef(null);
  const pitchBuffer = useRef([]);
  const lastNoteTime = useRef(0);

  const currentNotes = useMemo(() => {
    const factor = mode === 'HALF_DOWN' ? Math.pow(2, -1/12) : 1;
    return INSTRUMENTS[instrument].notes.map(n => {
      let f = n.freq * factor;
      if (mode === 'SWEETENED' && n.sweeten) f *= Math.pow(2, n.sweeten / 1200);
      return { 
        ...n, 
        targetFreq: f, 
        displayNote: mode === 'HALF_DOWN' ? n.note.replace(/\d/,'') + '♭' : n.note.replace(/\d/,'') 
      };
    });
  }, [instrument, mode]);

  useEffect(() => () => stopAll(), []);

  const initAudio = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
  };

  const playReference = (n) => {
    initAudio();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    stopReference();
    setActiveRefNote(n.note);
    const g = audioCtx.current.createGain();
    const o = audioCtx.current.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(n.targetFreq, audioCtx.current.currentTime);
    const vol = n.targetFreq < 150 ? 0.12 : 0.08;
    g.gain.setValueAtTime(0, audioCtx.current.currentTime);
    g.gain.linearRampToValueAtTime(vol, audioCtx.current.currentTime + 0.15); 
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 2.0);
    o.connect(g).connect(audioCtx.current.destination);
    o.start();
    osc.current = o;
    gainNode.current = g;
  };

  const stopReference = () => {
    if (osc.current) {
      try { osc.current.stop(); osc.current.disconnect(); } catch(e) {}
      osc.current = null;
    }
    setActiveRefNote(null);
  };

  const startMic = async () => {
    initAudio();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 4096;
      audioCtx.current.createMediaStreamSource(stream.current).connect(analyser.current);
      setIsListening(true);
      updateLoop();
    } catch (e) { alert("無法取得麥克風。"); }
  };

  const updateLoop = () => {
    const buffer = new Float32Array(analyser.current.fftSize);
    analyser.current.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    const rms = Math.sqrt(sum / buffer.length);
    const now = Date.now();
    
    if (rms < VOLUME_THRESHOLD) {
      if (now - lastNoteTime.current > NOTE_HOLD_TIME) {
        setIsTooQuiet(true);
        pitchBuffer.current = [];
      }
    } else {
      setIsTooQuiet(false);
      lastNoteTime.current = now;
      const p = autoCorrelate(buffer, audioCtx.current.sampleRate);
      
      if (p > 40 && p < 1100) {
        let detectedPitch = p;
        const subHarmonic = p / 2;
        const tripleHarmonic = p / 3;
        const hasLowTarget = currentNotes.some(n => Math.abs(n.targetFreq - subHarmonic) < 15);
        const hasTripleLowTarget = currentNotes.some(n => Math.abs(n.targetFreq - tripleHarmonic) < 15);
        if (hasLowTarget) detectedPitch = subHarmonic;
        else if (hasTripleLowTarget) detectedPitch = tripleHarmonic;

        pitchBuffer.current.push(detectedPitch);
        if (pitchBuffer.current.length > 12) pitchBuffer.current.shift();
        const sorted = [...pitchBuffer.current].sort((a,b)=>a-b);
        const med = sorted[Math.floor(sorted.length/2)];
        const closest = currentNotes.reduce((prev, curr) => 
          Math.abs(curr.targetFreq - med) < Math.abs(prev.targetFreq - med) ? curr : prev
        );

        if (Math.abs(closest.targetFreq - med) < 45) {
          setNoteInfo({ note: closest.displayNote, label: closest.label });
          const diff = med - closest.targetFreq;
          const smoothed = (lastDiff.current * (1 - SMOOTHING_FACTOR)) + (diff * SMOOTHING_FACTOR);
          lastDiff.current = smoothed;
          setDisplayDiff(smoothed);
        }
      }
    }
    animId.current = requestAnimationFrame(updateLoop);
  };

  const autoCorrelate = (buf, sr) => {
    let r1 = 0, r2 = buf.length-1, thres = 0.2;
    for (let i=0; i<buf.length/2; i++) if (Math.abs(buf[i])<thres) { r1=i; break; }
    for (let i=1; i<buf.length/2; i++) if (Math.abs(buf[buf.length-i])<thres) { r2=buf.length-i; break; }
    const b = buf.slice(r1, r2);
    const c = new Array(b.length).fill(0);
    for (let i=0; i<b.length; i++) {
      for (let j=0; j<b.length-i; j++) c[i] = c[i] + b[j]*b[j+i];
    }
    let d=0; while(c[d]>c[d+1]) d++;
    let maxv=-1, maxp=-1;
    for(let i=d; i<b.length; i++) if(c[i]>maxv) { maxv=c[i]; maxp=i; }
    return sr/maxp;
  };

  const stopAll = () => {
    setIsListening(false);
    stopReference();
    cancelAnimationFrame(animId.current);
    if (stream.current) stream.current.getTracks().forEach(t => t.stop());
  };

  return (
    <div className="min-h-screen bg-[#f5eceb] text-slate-800 p-4 flex flex-col items-center justify-center font-sans overflow-hidden">
      
      {/* 沉浸式說明遮罩 */}
      {infoOverlay && (
        <div 
          className="fixed inset-0 z-[200] bg-white/40 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300" 
          onClick={() => setInfoOverlay(null)}
        >
          <div className="max-w-xs text-center">
            <div className="flex justify-center mb-6">
              {infoOverlay === 'SWEETENED' ? (
                <div className="p-4 bg-rose-100 rounded-full text-rose-500 shadow-sm"><Heart size={32} fill="currentColor" /></div>
              ) : (
                <div className="p-4 bg-amber-100 rounded-full text-amber-500 shadow-sm"><Zap size={32} fill="currentColor" /></div>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-4 uppercase tracking-widest">
              {infoOverlay === 'SWEETENED' ? 'Sweetened Mode' : 'Half-Step Down'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 font-medium">
              {infoOverlay === 'SWEETENED' ? INSTRUMENTS[instrument].desc : '將全弦音調降低半音，獲得溫暖、柔軟的音色表現。'}
            </p>
            {/* 恢復引導文字 */}
            <div className="mt-12 text-[10px] font-black text-[#b09e9c] uppercase tracking-[0.3em] animate-pulse">
              Click anywhere to continue
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 border border-[#e8d3d1] shadow-2xl relative shadow-rose-200/50">
        
        {/* 工具欄 */}
        <div className="flex justify-between items-center mb-10 relative z-[100]">
          <button onClick={() => setShowMenu(!showMenu)} className="bg-[#e8d3d1] px-4 py-2 rounded-2xl text-[11px] font-black text-[#8a7a78] flex items-center gap-2">
            {INSTRUMENTS[instrument].name} <ChevronDown size={14} className={showMenu ? 'rotate-180' : ''} />
          </button>
          <div className="flex gap-2">
            <button onClick={() => { const next = mode==='SWEETENED'?'STANDARD':'SWEETENED'; setMode(next); if (next==='SWEETENED') setInfoOverlay('SWEETENED'); stopReference(); }} className={`p-2.5 rounded-xl border transition-all ${mode==='SWEETENED'?'bg-[#d8e2dc] text-[#8d9e8c]':'bg-white text-[#b09e9c]'}`}><Heart size={18} fill={mode==='SWEETENED'?"currentColor":"none"}/></button>
            <button onClick={() => { const next = mode==='HALF_DOWN'?'STANDARD':'HALF_DOWN'; setMode(next); if (next==='HALF_DOWN') setInfoOverlay('HALF_DOWN'); stopReference(); }} className={`p-2.5 rounded-xl border transition-all ${mode==='HALF_DOWN'?'bg-[#f0e4d7] text-[#d4a373]':'bg-white text-[#b09e9c]'}`}><Zap size={18} fill={mode==='HALF_DOWN'?"currentColor":"none"}/></button>
          </div>
          {showMenu && <div className="absolute left-0 top-12 w-44 bg-white border border-[#e8d3d1] rounded-2xl shadow-xl z-[110] py-2 animate-in fade-in zoom-in duration-200">
            {Object.keys(INSTRUMENTS).map(k => <button key={k} className={`w-full px-5 py-3 text-left text-xs font-bold ${instrument === k ? 'bg-[#e8d3d1] text-[#8a7a78]' : 'text-slate-400'}`} onClick={() => {setInstrument(k);setShowMenu(false);stopAll();}}>{INSTRUMENTS[k].name}</button>)}
          </div>}
        </div>

        {/* 顯示主體 */}
        <div className="text-center mb-10">
          <div className="h-6 text-[10px] font-black tracking-widest uppercase text-[#b09e9c]">
            {isTooQuiet ? 'Acoustic Tuning' : (Math.abs(displayDiff) < PERFECT_RANGE ? <span className="text-[#8d9e8c] animate-pulse">Perfectly Tuned</span> : `${noteInfo.label} String`)}
          </div>
          <div className={`text-9xl font-black tabular-nums transition-all ${isTooQuiet ? 'text-[#e8d3d1]' : (Math.abs(displayDiff) < PERFECT_RANGE ? 'text-[#8d9e8c]' : 'text-[#b09e9c]')}`}>
            {isTooQuiet ? '--' : noteInfo.note}
          </div>
        </div>

        {/* 儀表盤：強化中心豎線視覺 */}
        <div className="px-2 mb-14 relative h-1.5 flex items-center">
          <div className="w-full h-full bg-[#f5eceb] rounded-full relative overflow-visible">
            {/* 中心基準線 */}
            <div className="absolute left-1/2 -top-1.5 w-0.5 h-4.5 bg-[#e8d3d1] z-20" />
            
            {/* 滑動指針 */}
            <div 
              className={`absolute -top-4 w-2.5 h-10 rounded-full transition-all duration-150 shadow-sm z-30 ${Math.abs(displayDiff) < PERFECT_RANGE ? 'bg-[#8d9e8c] shadow-[#8d9e8c]/50' : 'bg-[#d4a373]'}`}
              style={{ left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 3.8))}% )`, transform: 'translateX(-50%)', opacity: isTooQuiet ? 0.2 : 1 }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 mb-10 bg-[#f5eceb]/50 p-3 rounded-[2rem]">
          {currentNotes.map(n => (
            <button key={n.note} onClick={() => playReference(n)} className={`flex-1 aspect-[4/5] rounded-[1rem] border-2 transition-all flex flex-col items-center justify-center gap-1 ${activeRefNote === n.note ? 'bg-[#e8d3d1] border-white text-white shadow-lg' : 'bg-white border-transparent text-[#b09e9c]'}`}>
              <span className="text-[9px] font-black">{n.label}</span>
              <span className="text-sm font-black">{n.displayNote}</span>
            </button>
          ))}
        </div>

        <button onClick={isListening ? stopAll : startMic} className={`w-full py-5 rounded-[2rem] font-black text-xs tracking-[0.3em] transition-all ${isListening ? 'bg-[#b09e9c] text-white shadow-inner' : 'bg-white text-[#8a7a78] border border-[#e8d3d1] shadow-xl hover:bg-[#fcf7f6]'}`}>
          {isListening ? 'STOP SCAN' : 'START TUNING'}
        </button>
      </div>
      
      <p className="mt-8 text-[#b09e9c] text-[10px] font-black uppercase tracking-[0.5em]">Pukanala • Professional Acoustic Solution</p>
    </div>
  );
}
