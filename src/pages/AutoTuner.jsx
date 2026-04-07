import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Music, Activity, AlertCircle } from 'lucide-react';

// 烏克麗麗標準弦頻率
const UKE_NOTES = [
  { note: 'G', freq: 392.00, hex: '#f43f5e' },
  { note: 'C', freq: 261.63, hex: '#0ea5e9' },
  { note: 'E', freq: 329.63, hex: '#10b981' },
  { note: 'A', freq: 440.00, hex: '#f59e0b' },
];

export default function AutoTuner() {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [note, setNote] = useState('--');
  const [diff, setDiff] = useState(0); // 偏差值
  
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const stream = useRef(null);
  const animationId = useRef(null);

  // 核心演算法：從頻率推算音符與偏差
  const findClosestNote = (frequency) => {
    let minDiff = Infinity;
    let closest = UKE_NOTES[0];

    UKE_NOTES.forEach((n) => {
      const d = frequency - n.freq;
      if (Math.abs(d) < Math.abs(minDiff)) {
        minDiff = d;
        closest = n;
      }
    });
    return { ...closest, diff: minDiff };
  };

  // 自動相關函數 (Autocorrelation) 演算法：偵測音高精確度比 FFT 高
  const autoCorrelate = (buffer, sampleRate) => {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      rms += buffer[i] * buffer[i];
    }
    if (Math.sqrt(rms / SIZE) < 0.01) return -1; // 聲音太小

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buffer[j] * buffer[j + i];
      }
    }

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    return sampleRate / T0;
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
      updatePitch();
    } catch (err) {
      alert("無法開啟麥克風，請檢查權限設定。");
    }
  };

  const updatePitch = () => {
    const buffer = new Float32Array(analyser.current.fftSize);
    analyser.current.getFloatTimeDomainData(buffer);
    const acPitch = autoCorrelate(buffer, audioContext.current.sampleRate);

    if (acPitch !== -1 && acPitch < 1000) {
      setPitch(acPitch);
      const result = findClosestNote(acPitch);
      setNote(result.note);
      setDiff(result.diff);
    }
    animationId.current = requestAnimationFrame(updatePitch);
  };

  const stopListening = () => {
    setIsListening(false);
    cancelAnimationFrame(animationId.current);
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
    }
    setNote('--');
    setPitch(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-slate-900 rounded-[40px] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* 背景光暈 */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          <header className="mb-10">
            <h1 className="text-3xl font-black mb-2 flex items-center justify-center gap-3">
              <Activity className="text-emerald-400" /> 自動調音器
            </h1>
            <p className="text-slate-500 text-sm">撥動琴弦，電腦會自動辨識音高</p>
          </header>

          {/* 指針儀表盤 */}
          <div className="relative h-40 mb-10 flex flex-col items-center justify-center">
            <div className="text-7xl font-black mb-2 tabular-nums transition-all duration-100" 
                 style={{ color: Math.abs(diff) < 2 ? '#10b981' : '#f43f5e' }}>
              {note}
            </div>
            
            {/* 指針 */}
            <div className="w-full h-2 bg-slate-800 rounded-full mt-4 relative">
              <div 
                className="absolute top-[-10px] w-1 h-6 bg-blue-500 transition-all duration-100 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                style={{ left: `calc(50% + ${Math.max(-50, Math.min(50, diff * 5))}% )` }}
              />
              <div className="absolute left-1/2 top-0 w-[1px] h-2 bg-slate-600" />
            </div>
            
            <div className="flex justify-between w-full mt-2 text-[10px] font-bold text-slate-600">
              <span>太低 (Low)</span>
              <span>準確 (Perfect)</span>
              <span>太高 (High)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">即時頻率</div>
              <div className="text-xl font-mono">{pitch > 0 ? pitch.toFixed(1) : '---'} <span className="text-xs">Hz</span></div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">音分偏差</div>
              <div className="text-xl font-mono">{pitch > 0 ? (diff > 0 ? '+' : '') + diff.toFixed(1) : '---'}</div>
            </div>
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-full py-5 rounded-full font-black text-lg transition-all flex items-center justify-center gap-3 ${
              isListening 
              ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
            }`}
          >
            {isListening ? <><MicOff /> 停止偵測</> : <><Mic /> 開始調音</>}
          </button>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        {UKE_NOTES.map(n => (
          <div key={n.note} className="text-center">
            <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
              {n.note}
            </div>
            <div className="text-[10px] text-slate-700 mt-1">{n.freq}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
