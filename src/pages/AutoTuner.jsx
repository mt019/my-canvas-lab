import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Music, Activity, ShieldCheck, VolumeX } from 'lucide-react';

// 烏克麗麗標準弦頻率 (G4, C4, E4, A4)
const UKE_NOTES = [
  { note: 'G', freq: 392.00, name: '4弦' },
  { note: 'C', freq: 261.63, name: '3弦' },
  { note: 'E', freq: 329.63, name: '2弦' },
  { note: 'A', freq: 440.00, name: '1弦' },
];

// --- 調優參數 ---
const VOLUME_THRESHOLD = 0.015; // 低於此能量(RMS)則判定為噪音
const SMOOTHING_FACTOR = 0.15;   // 平滑係數：越小越穩，越大越靈敏 (建議 0.1 ~ 0.2)

export default function AutoTuner() {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [note, setNote] = useState('--');
  const [displayDiff, setDisplayDiff] = useState(0); // 平滑後的顯示數值
  const [isTooQuiet, setIsTooQuiet] = useState(true);

  // 使用 useRef 儲存不觸發重新渲染的變數
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const stream = useRef(null);
  const animationId = useRef(null);
  const lastDiff = useRef(0); // 用於計算平滑的記憶體

  // 核心演算法：尋找最接近的音符
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

  // 自動相關函數 (Autocorrelation) 偵測音高
  const autoCorrelate = (buffer, sampleRate) => {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    const currentRMS = Math.sqrt(sum(buffer) / SIZE); // 這裡簡化，實際用下方的 RMS 判斷
    
    // 預處理：找出訊號範圍
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

  const sum = (arr) => arr.reduce((a, b) => a + b * b, 0);

  const startListening = async () => {
    try {
      const constraints = { 
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false 
        } 
      };
      stream.current = await navigator.mediaDevices.getUserMedia(constraints);
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 2048;
      
      const source = audioContext.current.createMediaStreamSource(stream.current);
      source.connect(analyser.current);
      setIsListening(true);
      updateLoop();
    } catch (err) {
      alert("請允許麥克風權限以進行調音。");
    }
  };

  const updateLoop = () => {
    const buffer = new Float32Array(analyser.current.fftSize);
    analyser.current.getFloatTimeDomainData(buffer);

    // 1. 計算音量能量 (RMS)
    const rms = Math.sqrt(sum(buffer) / buffer.length);
    
    if (rms < VOLUME_THRESHOLD) {
      setIsTooQuiet(true);
    } else {
      setIsTooQuiet(false);
      const detectedPitch = autoCorrelate(buffer, audioContext.current.sampleRate);
      
      if (detectedPitch !== -1 && detectedPitch < 1000) {
        setPitch(detectedPitch);
        const { note: detectedNote, diff } = findClosestNote(detectedPitch);
        setNote(detectedNote);

        // 2. 指數平滑演算法 (Exponential Smoothing)
        // 讓數值不要跳太快：新顯示值 = (舊值 * 0.85) + (新測值 * 0.15)
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
    setPitch(0);
    setDisplayDiff(0);
    lastDiff.current = 0;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* 背景裝飾光暈 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />

        <div className="relative z-10">
          <header className="text-center mb-10">
            <div className="inline-flex p-3 bg-slate-800 rounded-2xl mb-4 text-emerald-400">
              <Activity size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">AI 自動調音器</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">智能過濾環境音 · 平滑指針偵測</p>
          </header>

          {/* 中央儀表板 */}
          <div className="flex flex-col items-center justify-center mb-12">
            <div 
              className={`text-8xl font-black tabular-nums transition-colors duration-300 ${
                isTooQuiet ? 'text-slate-800' : (Math.abs(displayDiff) < 2 ? 'text-emerald-400' : 'text-blue-500')
              }`}
            >
              {isTooQuiet ? '--' : note}
            </div>
            
            {/* 動態指針軌道 */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-10 relative">
              {/* 中心點標記 */}
              <div className="absolute left-1/2 -top-1 w-0.5 h-3.5 bg-slate-600 z-0" />
              
              {/* 平滑移動的指針 */}
              <div 
                className={`absolute -top-3 w-1.5 h-8 rounded-full transition-all duration-75 shadow-lg ${
                  Math.abs(displayDiff) < 2 ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-blue-500 shadow-blue-500/50'
                }`}
                style={{ 
                  left: `calc(50% + ${Math.max(-48, Math.min(48, displayDiff * 4))}% )`,
                  opacity: isTooQuiet ? 0.2 : 1
                }}
              />
            </div>

            <div className="flex justify-between w-full mt-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
              <span>Low</span>
              <span className={Math.abs(displayDiff) < 2 && !isTooQuiet ? 'text-emerald-500' : ''}>Perfect</span>
              <span>High</span>
            </div>
          </div>

          {/* 數據卡片 */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">即時頻率</div>
              <div className="text-xl font-mono font-bold text-slate-300">
                {isTooQuiet ? '---' : `${pitch.toFixed(1)}Hz`}
              </div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-3xl border border-slate-800 text-right">
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">訊號狀態</div>
              <div className={`text-sm font-bold flex items-center justify-end gap-1 ${isTooQuiet ? 'text-slate-600' : 'text-emerald-500'}`}>
                {isTooQuiet ? <><VolumeX size={14}/> 靜音中</> : <><ShieldCheck size={14}/> 接收中</>}
              </div>
            </div>
          </div>

          {/* 控制按鈕 */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              isListening 
              ? 'bg-slate-800 text-rose-400 hover:bg-slate-700' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20'
            }`}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
            {isListening ? '停止偵測' : '開啟麥克風'}
          </button>
        </div>
      </div>

      {/* 底部參考弦 */}
      <div className="mt-10 flex gap-4">
        {UKE_NOTES.map(n => (
          <div key={n.note} className={`px-4 py-2 rounded-full border transition-colors ${note === n.note && !isTooQuiet ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-slate-800 text-slate-600'}`}>
            <span className="text-xs font-black">{n.name}</span>
            <span className="ml-1.5 font-mono text-[10px]">{n.freq}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
