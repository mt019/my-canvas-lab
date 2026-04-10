import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Activity, ShieldCheck, VolumeX, Settings2, ChevronDown } from 'lucide-react';

// --- 樂器頻率配置 ---
const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    notes: [
      { note: 'G', freq: 392.00, label: '4弦' },
      { note: 'C', freq: 261.63, label: '3弦' },
      { note: 'E', freq: 329.63, label: '2弦' },
      { note: 'A', freq: 440.00, label: '1弦' },
    ]
  },
  GUITARLELE: {
    name: '吉他麗麗',
    notes: [
      { note: 'A', freq: 110.00, label: '6弦' },
      { note: 'D', freq: 146.83, label: '5弦' },
      { note: 'G', freq: 196.00, label: '4弦' },
      { note: 'C', freq: 261.63, label: '3弦' },
      { note: 'E', freq: 329.63, label: '2弦' },
      { note: 'A', freq: 440.00, label: '1弦' },
    ]
  },
  GUITAR: {
    name: '吉他 (標準)',
    notes: [
      { note: 'E', freq: 82.41,  label: '6弦' },
      { note: 'A', freq: 110.00, label: '5弦' },
      { note: 'D', freq: 146.83, label: '4弦' },
      { note: 'G', freq: 196.00, label: '3弦' },
      { note: 'B', freq: 246.94, label: '2弦' },
      { note: 'E', freq: 329.63, label: '1弦' },
    ]
  }
};

// --- 調優參數 ---
const VOLUME_THRESHOLD = 0.018; // 噪音過濾門檻
const SMOOTHING_FACTOR = 0.18;  // 指針平滑係數 (0.1~0.3)

export default function AutoTuner() {
  const [instrument, setInstrument] = useState('UKULELE');
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [note, setNote] = useState('--');
  const [displayDiff, setDisplayDiff] = useState(0);
  const [isTooQuiet, setIsTooQuiet] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const audioContext = useRef(null);
  const analyser = useRef(null);
  const stream = useRef(null);
  const animationId = useRef(null);
  const lastDiff = useRef(0);

  const currentNotes = useMemo(() => INSTRUMENTS[instrument].notes, [instrument]);

  // 核心演算法：頻率比對
  const findClosestNote = (frequency) => {
    let minDiff = Infinity;
    let closest = currentNotes[0];
    currentNotes.forEach((n) => {
      const d = frequency - n.freq;
      if (Math.abs(d) < Math.abs(minDiff)) {
        minDiff = d;
        closest = n;
      }
    });
    return { ...closest, diff: minDiff };
  };

  // 自動相關函數 (Pitch Detection Algorithm)
  const autoCorrelate = (buffer, sampleRate) => {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    if (Math.sqrt(rms / SIZE) < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buffer[j] * buffer[j + i];
    }
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    return sampleRate / maxpos;
  };

  const startListening = async () => {
    try {
      const constraints = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } };
      stream.current = await navigator.mediaDevices.getUserMedia(constraints);
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 2048;
      const source = audioContext.current.createMediaStreamSource(stream.current);
      source.connect(analyser.current);
      setIsListening(true);
      updateLoop();
    } catch (err) {
      alert("請開啟麥克風權限");
    }
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
      const detectedPitch = autoCorrelate(buffer, audioContext.current.sampleRate);
      if (detectedPitch !== -1 && detectedPitch < 1200) {
        setPitch(detectedPitch);
        const { note: detNote, diff } = findClosestNote(detectedPitch);
        setNote(detNote);
        const smoothed = (lastDiff.current * (1 - SMOOTHING_FACTOR)) + (diff * SMOOTHING_FACTOR);
        lastDiff.current = smoothed;
        setDisplayDiff(smoothed);
      }
    }
    animationId.current = requestAnimationFrame(updateLoop);
  };

  const stopListening = () => {
    setIsListening(false);
    cancelAnimationFrame(animationId.current);
    if (stream.current) stream.current.getTracks().forEach(t => t.stop());
    setNote('--');
    setIsTooQuiet(true);
    lastDiff.current = 0;
    setDisplayDiff(0);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] p-8 border border-slate-800 shadow-2xl relative">
        
        {/* Header & Instrument Selector */}
        <div className="relative z-20 mb-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <Activity className="text-blue-500" size={20} /> PRO TUNER
            </h1>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="bg-slate-800 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors"
            >
              {INSTRUMENTS[instrument].name} <ChevronDown size={14} />
            </button>
          </div>

          {showMenu && (
            <div className="absolute right-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
              {Object.keys(INSTRUMENTS).map((key) => (
                <button
                  key={key}
                  className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-blue-600 transition-colors"
                  onClick={() => { setInstrument(key); setShowMenu(false); stopListening(); }}
                >
                  {INSTRUMENTS[key].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Meter Display */}
        <div className="flex flex-col items-center mb-12">
          <div className={`text-9xl font-black tabular-nums transition-colors duration-300 ${
            isTooQuiet ? 'text-slate-800' : (Math.abs(displayDiff) < 2 ? 'text-emerald-400' : 'text-blue-500')
          }`}>
            {isTooQuiet ? '--' : note}
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full mt-12 relative overflow-visible">
            <div className="absolute left-1/2 -top-2 w-0.5 h-6 bg-slate-700" />
            <div 
              className={`absolute -top-4 w-2 h-10 rounded-full transition-all duration-75 shadow-xl ${
                Math.abs(displayDiff) < 2 ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-blue-600 shadow-blue-500/50'
              }`}
              style={{ 
                left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 4))}% )`,
                opacity: isTooQuiet ? 0.1 : 1
              }}
            />
          </div>
          <div className="flex justify-between w-full mt-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            <span>Low</span>
            <span className={!isTooQuiet && Math.abs(displayDiff) < 2 ? 'text-emerald-500' : ''}>Perfect</span>
            <span>High</span>
          </div>
        </div>

        {/* Status & Control */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
              <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase">頻率</div>
              <div className="text-xl font-mono font-bold text-slate-300">
                {isTooQuiet ? '---' : `${pitch.toFixed(1)}Hz`}
              </div>
            </div>
            <div className="flex-1 bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
              <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase">狀態</div>
              <div className={`text-sm font-bold flex items-center gap-2 ${isTooQuiet ? 'text-slate-600' : 'text-emerald-500'}`}>
                {isTooQuiet ? <VolumeX size={16}/> : <ShieldCheck size={16}/>}
                {isTooQuiet ? '等待訊號' : '偵測中'}
              </div>
            </div>
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-full py-6 rounded-[2.5rem] font-black text-xl transition-all ${
              isListening ? 'bg-slate-800 text-rose-400' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
            }`}
          >
            {isListening ? '停止' : '開始調音'}
          </button>
        </div>
      </div>

      {/* Reference Bar */}
      <div className="mt-10 flex flex-wrap justify-center gap-3 max-w-md">
        {currentNotes.map(n => (
          <div key={n.label} className={`px-4 py-2 rounded-2xl border text-[10px] font-bold transition-colors ${
            note === n.note && !isTooQuiet ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-600'
          }`}>
            {n.label}: {n.note}
          </div>
        ))}
      </div>
    </div>
  );
}
