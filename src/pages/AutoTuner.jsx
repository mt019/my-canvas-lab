import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, ChevronDown, Heart, Zap } from 'lucide-react';

/* ===== 樂器 ===== */
const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    notes: [
      { note: 'G4', freq: 392.0, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 },
      { note: 'E4', freq: 329.63, label: '2', sweeten: -1.0 },
      { note: 'A4', freq: 440.0, label: '1', sweeten: -0.5 },
    ]
  },
  GUITARLELE: {
    name: '吉他麗麗',
    notes: [
      { note: 'A2', freq: 110.0, label: '6', sweeten: -1.5 },
      { note: 'D3', freq: 146.83, label: '5', sweeten: -1.0 },
      { note: 'G3', freq: 196.0, label: '4', sweeten: -1.0 },
      { note: 'C4', freq: 261.63, label: '3', sweeten: -2.0 },
      { note: 'E4', freq: 329.63, label: '2', sweeten: -1.0 },
      { note: 'A4', freq: 440.0, label: '1', sweeten: -0.5 },
    ]
  },
  GUITAR: {
    name: '吉他',
    notes: [
      { note: 'E2', freq: 82.41, label: '6', sweeten: -2.0 },
      { note: 'A2', freq: 110.0, label: '5', sweeten: -1.5 },
      { note: 'D3', freq: 146.83, label: '4', sweeten: -1.0 },
      { note: 'G3', freq: 196.0, label: '3', sweeten: -1.5 },
      { note: 'B3', freq: 246.94, label: '2', sweeten: -1.2 },
      { note: 'E4', freq: 329.63, label: '1', sweeten: -0.5 },
    ]
  }
};

/* ===== YIN ===== */
const yin = (buf, sr) => {
  const size = buf.length / 2;
  const diff = new Float32Array(size);

  for (let tau = 1; tau < size; tau++) {
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const d = buf[i] - buf[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  const cmnd = new Float32Array(size);
  cmnd[0] = 1;

  let running = 0;
  for (let tau = 1; tau < size; tau++) {
    running += diff[tau];
    cmnd[tau] = diff[tau] * tau / (running || 1);
  }

  for (let tau = 2; tau < size; tau++) {
    if (cmnd[tau] < 0.12) {
      return { freq: sr / tau, conf: 1 - cmnd[tau] };
    }
  }

  return { freq: 0, conf: 0 };
};

/* ===== 主體 ===== */
export default function AutoTuner() {

  const [instrument, setInstrument] = useState('UKULELE');
  const [mode, setMode] = useState('STANDARD');
  const [isListening, setIsListening] = useState(false);
  const [noteInfo, setNoteInfo] = useState({ note: '--', label: '--' });
  const [displayDiff, setDisplayDiff] = useState(0);
  const [isTooQuiet, setIsTooQuiet] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const stream = useRef(null);
  const anim = useRef(null);

  const lastDiff = useRef(0);
  const pitchBuffer = useRef([]);

  const notes = useMemo(() => {
    const factor = mode === 'HALF_DOWN' ? Math.pow(2, -1/12) : 1;
    return INSTRUMENTS[instrument].notes.map(n => {
      let f = n.freq * factor;
      if (mode === 'SWEETENED') f *= Math.pow(2, n.sweeten / 1200);

      return {
        ...n,
        targetFreq: f,
        displayNote: mode === 'HALF_DOWN'
          ? n.note.replace(/\d/,'') + '♭'
          : n.note.replace(/\d/,'')
      };
    });
  }, [instrument, mode]);

  useEffect(() => () => stop(), []);

  /* ===== 麥克風 ===== */
  const start = async () => {
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.current.resume();

    stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });

    const source = audioCtx.current.createMediaStreamSource(stream.current);

    const lp = audioCtx.current.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;

    analyser.current = audioCtx.current.createAnalyser();
    analyser.current.fftSize = 4096;

    source.connect(lp);
    lp.connect(analyser.current);

    setIsListening(true);
    loop();
  };

  const stop = () => {
    setIsListening(false);
    cancelAnimationFrame(anim.current);
    stream.current?.getTracks().forEach(t => t.stop());
  };

  /* ===== 核心 ===== */
  const loop = () => {
    const buf = new Float32Array(analyser.current.fftSize);
    analyser.current.getFloatTimeDomainData(buf);

    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i]*buf[i];
    const rms = Math.sqrt(sum / buf.length);

    if (rms < 0.01) {
      setIsTooQuiet(true);
    } else {
      setIsTooQuiet(false);

      const { freq, conf } = yin(buf, audioCtx.current.sampleRate);

      if (conf > 0.7 && freq > 60) {

        let fixed = freq;
        if (freq > 200) fixed /= 2;
        if (freq > 350) fixed /= 3;

        pitchBuffer.current.push(fixed);
        if (pitchBuffer.current.length > 8) pitchBuffer.current.shift();

        const med = [...pitchBuffer.current].sort((a,b)=>a-b)[Math.floor(pitchBuffer.current.length/2)];

        const closest = notes.reduce((p,c)=>
          Math.abs(c.targetFreq - med) < Math.abs(p.targetFreq - med) ? c : p
        );

        setNoteInfo({ note: closest.displayNote, label: closest.label });

        const diff = med - closest.targetFreq;
        const smooth = lastDiff.current*0.7 + diff*0.3;
        lastDiff.current = smooth;
        setDisplayDiff(smooth);
      }
    }

    anim.current = requestAnimationFrame(loop);
  };

  /* ===== 參考音 ===== */
  const play = (n) => {
    const ctx = audioCtx.current || new (window.AudioContext || window.webkitAudioContext)();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = n.targetFreq;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.25);
  };

  /* ===== UI ===== */
  return (
    <div className="min-h-screen bg-[#f5eceb] flex items-center justify-center relative">

      {/* ⭐ overlay */}
      {mode !== 'STANDARD' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-xl text-white text-xs font-bold">
            {mode === 'SWEETENED' ? 'SWEETENED' : 'HALF DOWN'}
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl w-80">

        <button onClick={() => setShowMenu(!showMenu)}>
          {INSTRUMENTS[instrument].name}
        </button>

        {showMenu && (
          <div>
            {Object.keys(INSTRUMENTS).map(k => (
              <div key={k} onClick={()=>setInstrument(k)}>
                {INSTRUMENTS[k].name}
              </div>
            ))}
          </div>
        )}

        <div className="text-6xl text-center my-6">
          {noteInfo.note}
        </div>

        <div className="grid grid-cols-6 gap-2">
          {notes.map(n=>(
            <button key={n.note} onClick={()=>play(n)}>
              {n.label}
            </button>
          ))}
        </div>

        <button onClick={isListening ? stop : start}>
          {isListening ? <MicOff/> : <Mic/>}
        </button>

      </div>
    </div>
  );
}
