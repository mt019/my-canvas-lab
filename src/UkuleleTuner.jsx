import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Music, Volume2, Info } from 'lucide-react';

// 定義烏克麗麗的標準調音 (G4, C4, E4, A4) 的頻率 (Hz)
const UKULELE_NOTES = [
  { note: 'G', name: 'Low G', freq: 392.00, color: 'bg-rose-500' },
  { note: 'C', name: 'Do', freq: 261.63, color: 'bg-sky-500' },
  { note: 'E', name: 'Mi', freq: 329.63, color: 'bg-emerald-500' },
  { note: 'A', name: 'La', freq: 440.00, color: 'bg-amber-500' },
];

export default function UkuleleTuner() {
  const [selectedNote, setSelectedNote] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContext = useRef(null);
  const oscillator = useRef(null);
  const gainNode = useRef(null);

  // 初始化 Web Audio API (只需執行一次)
  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    // 建立音量控制器，用於平滑淡出聲音
    gainNode.current = audioContext.current.createGain();
    gainNode.current.connect(audioContext.current.destination);
    
    // 清理函數：組件卸載時停止聲音
    return () => {
      stopSound();
    };
  }, []);

  const playSound = (freq) => {
    if (!audioContext.current) return;

    // 如果正在播放，先停止舊的聲音
    stopSound();

    // 建立振盪器 (發聲器)
    oscillator.current = audioContext.current.createOscillator();
    oscillator.current.type = 'sine'; // 正弦波，聲音最純
    oscillator.current.frequency.setValueAtTime(freq, audioContext.current.currentTime);
    
    // 連接到音量控制器
    oscillator.current.connect(gainNode.current);
    
    // 設置音量淡入 (防止"啵"一聲)
    gainNode.current.gain.setValueAtTime(0, audioContext.current.currentTime);
    gainNode.current.gain.linearRampToValueAtTime(0.5, audioContext.current.currentTime + 0.01);
    
    // 開始播放
    oscillator.current.start();
    setIsPlaying(true);
  };

  const stopSound = () => {
    if (oscillator.current) {
      // 設置音量淡出 (防止"啵"一聲)
      gainNode.current.gain.setValueAtTime(gainNode.current.gain.value, audioContext.current.currentTime);
      gainNode.current.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.05);
      
      // 在淡出後真正停止振盪器
      setTimeout(() => {
        if (oscillator.current) {
          oscillator.current.stop();
          oscillator.current.disconnect();
          oscillator.current = null;
        }
      }, 50);
    }
    setIsPlaying(false);
    setSelectedNote(null);
  };

  const handleNoteClick = (noteEntry) => {
    if (isPlaying && selectedNote === noteEntry.note) {
      stopSound();
    } else {
      setSelectedNote(noteEntry.note);
      playSound(noteEntry.freq);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Music className="text-rose-500" size={32} />
            <h1 className="text-4xl font-black tracking-tight text-gray-900">
              烏克麗麗 <span className="text-rose-600">標準調音器</span>
            </h1>
          </div>
          <p className="text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
            點擊下方弦鈕，聽取標準音高 (G-C-E-A) 進行耳朵調音。聲音由瀏覽器即時合成。
          </p>
        </div>

        {/* Tuner Interface */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 relative overflow-hidden">
          {/* 裝飾用的音符 */}
          <Music className="absolute -top-10 -right-10 text-gray-50" size={160} />
          
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {UKULELE_NOTES.map((item, index) => (
              <button
                key={item.note}
                onClick={() => handleNoteClick(item)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                  selectedNote === item.note
                    ? `${item.color} border-transparent shadow-lg scale-105 text-white`
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm text-gray-900'
                }`}
              >
                {/* 顯示弦編號 */}
                <span className={`absolute top-3 left-3 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  selectedNote === item.note ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {4 - index}弦
                </span>

                <div className="text-center mt-4">
                  <div className={`text-6xl font-black mb-1 tabular-nums ${selectedNote === item.note ? 'text-white' : item.color.replace('bg-','text-')}`}>
                    {item.note}
                  </div>
                  <div className={`text-sm font-bold uppercase tracking-wider ${selectedNote === item.note ? 'text-white/80' : 'text-gray-500'}`}>
                    {item.name}
                  </div>
                  <div className={`text-xs mt-1 tabular-nums ${selectedNote === item.note ? 'text-white/60' : 'text-gray-400'}`}>
                    {item.freq.toFixed(2)} Hz
                  </div>
                </div>

                {/* 播放/停止圖標 */}
                <div className="absolute top-3 right-3">
                  {selectedNote === item.note && isPlaying ? (
                    <Square size={20} className="text-white animate-pulse" />
                  ) : (
                    <Play size={20} className={`text-gray-300 group-hover:text-gray-500 transition-colors`} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* 全局控制按鈕 */}
          {isPlaying && (
            <div className="text-center">
              <button 
                onClick={stopSound}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors shadow-md"
              >
                <Square size={16} /> 停止所有聲音
              </button>
            </div>
          )}
        </div>

        {/* Info & Status */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-start gap-4 shadow-sm">
            <Volume2 className="text-gray-400 mt-1" size={24} />
            <div>
              <h5 className="font-bold text-gray-800">使用提示：</h5>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                這是「聽音調音器」。點擊按鈕，用你的耳朵分辨你的烏克麗麗是否與標準音高一致。
              </p>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 flex items-start gap-4 shadow-sm">
            <Info className="text-gray-400 mt-1" size={24} />
            <div>
              <h5 className="font-bold text-gray-800">關於聲音合成：</h5>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                我們使用了 Web Audio API 的 `OscillatorNode` 生成正弦波。這是一個純粹的物理頻率，不包含樂器的共鳴音色，最適合用於對準音高。
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic */}
        {!audioContext.current && (
          <div className="mt-8 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-lg text-sm">
            警告：你的瀏覽器似乎不支援 Web Audio API。聲音功能可能無法運作。
          </div>
        )}
      </div>
    </div>
  );
}
