import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Heart, Mic, MicOff, Zap } from 'lucide-react';

const INSTRUMENTS = {
  UKULELE: {
    name: '烏克麗麗',
    desc: '甜蜜模式：針對 C 弦進行微降補償，修正因琴弦張力產生的音準偏差，使常用和弦共鳴更加純淨。',
    notes: [
      { note: 'G4', short: 'G', freq: 392.0, label: '4', sweeten: -1.0, halfDown: 'G♭4' },
      { note: 'C4', short: 'C', freq: 261.63, label: '3', sweeten: -2.0, halfDown: 'B3' },
      { note: 'E4', short: 'E', freq: 329.63, label: '2', sweeten: -1.0, halfDown: 'E♭4' },
      { note: 'A4', short: 'A', freq: 440.0, label: '1', sweeten: -0.5, halfDown: 'A♭4' },
    ],
  },
  GUITARLELE: {
    name: '吉他麗麗',
    desc: '甜蜜模式：校正 A 弦與 C 弦偏差。這是吉他麗麗專屬的 A2 D3 G3 C4 E4 A4 定弦。',
    notes: [
      { note: 'A2', short: 'A', freq: 110.0, label: '6', sweeten: -1.5, halfDown: 'A♭2' },
      { note: 'D3', short: 'D', freq: 146.83, label: '5', sweeten: -1.0, halfDown: 'D♭3' },
      { note: 'G3', short: 'G', freq: 196.0, label: '4', sweeten: -1.0, halfDown: 'G♭3' },
      { note: 'C4', short: 'C', freq: 261.63, label: '3', sweeten: -2.0, halfDown: 'B3' },
      { note: 'E4', short: 'E', freq: 329.63, label: '2', sweeten: -1.0, halfDown: 'E♭4' },
      { note: 'A4', short: 'A', freq: 440.0, label: '1', sweeten: -0.5, halfDown: 'A♭4' },
    ],
  },
  GUITAR: {
    name: '吉他（標準）',
    desc: '甜蜜模式：補償 B 弦與低音 E 弦生硬感，釋放木吉他自然的泛音。這是 E2 A2 D3 G3 B3 E4 標準定弦。',
    notes: [
      { note: 'E2', short: 'E', freq: 82.41, label: '6', sweeten: -2.0, halfDown: 'E♭2' },
      { note: 'A2', short: 'A', freq: 110.0, label: '5', sweeten: -1.5, halfDown: 'A♭2' },
      { note: 'D3', short: 'D', freq: 146.83, label: '4', sweeten: -1.0, halfDown: 'D♭3' },
      { note: 'G3', short: 'G', freq: 196.0, label: '3', sweeten: -1.5, halfDown: 'G♭3' },
      { note: 'B3', short: 'B', freq: 246.94, label: '2', sweeten: -1.2, halfDown: 'B♭3' },
      { note: 'E4', short: 'E', freq: 329.63, label: '1', sweeten: -0.5, halfDown: 'E♭4' },
    ],
  },
};

const VOLUME_THRESHOLD = 0.001;
const AUTO_CORRELATE_RMS_THRESHOLD = 0.0008;
const SMOOTHING_FACTOR = 0.12;
const PERFECT_RANGE_CENTS = 6;
const NOTE_HOLD_TIME = 900;
const MAX_DETECTION_CENTS = 300;
const HISTORY_SIZE = 9;
const DISPLAY_CENT_CLAMP = 50;
const MIN_PITCH = 40;
const MAX_PITCH = 1100;
const HARMONIC_MATCH_TOLERANCE = 18;
const ATTACK_IGNORE_MS = 140;
const STABLE_FRAME_COUNT = 3;
const STABLE_CENTS_WINDOW = 18;
const LOCK_RELEASE_CENTS = 34;
const NOTE_SWITCH_FRAME_COUNT = 6;
const DISPLAY_FREEZE_CENTS = 1.8;
const DISPLAY_SLEW_LIMIT_CENTS = 3.2;

function getMediaDevices() {
  return navigator.mediaDevices;
}

function getMediaErrorMessage(error) {
  const name = error?.name;

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return '無法存取麥克風，請確認瀏覽器麥克風權限已開啟。';
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return '找不到可用麥克風，請確認裝置已連接。';
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return '麥克風目前被其他程式占用，請先關閉後再試一次。';
  }

  if (name === 'AbortError') {
    return '麥克風初始化失敗，請重新嘗試。';
  }

  return '無法存取麥克風，請確認權限與裝置狀態。';
}

async function requestMicStream(mediaDevices) {
  const preferredConstraints = {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  };

  try {
    return await mediaDevices.getUserMedia(preferredConstraints);
  } catch (error) {
    const recoverableNames = new Set([
      'OverconstrainedError',
      'ConstraintNotSatisfiedError',
      'NotReadableError',
      'AbortError',
    ]);

    if (!recoverableNames.has(error?.name)) {
      throw error;
    }
  }

  return mediaDevices.getUserMedia({ audio: true });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function frequencyToCents(freq, targetFreq) {
  return 1200 * Math.log2(freq / targetFreq);
}

function centsToFrequency(baseFreq, cents) {
  return baseFreq * Math.pow(2, cents / 1200);
}

function getClosestNote(notes, detectedFreq) {
  return notes.reduce((prev, curr) => {
    const prevDiff = Math.abs(frequencyToCents(detectedFreq, prev.targetFreq));
    const currDiff = Math.abs(frequencyToCents(detectedFreq, curr.targetFreq));
    return currDiff < prevDiff ? curr : prev;
  });
}

function autoCorrelate(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < AUTO_CORRELATE_RMS_THRESHOLD) return -1;

  let start = 0;
  let end = buffer.length - 1;
  const threshold = 0.2;

  for (let i = 0; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      start = i;
      break;
    }
  }

  for (let i = 1; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) {
      end = buffer.length - i;
      break;
    }
  }

  const trimmed = buffer.slice(start, end);
  if (trimmed.length < 2) return -1;

  const correlations = new Array(trimmed.length).fill(0);
  for (let lag = 0; lag < trimmed.length; lag += 1) {
    let sum = 0;
    for (let i = 0; i < trimmed.length - lag; i += 1) {
      sum += trimmed[i] * trimmed[i + lag];
    }
    correlations[lag] = sum;
  }

  let dip = 0;
  while (dip + 1 < correlations.length && correlations[dip] > correlations[dip + 1]) dip += 1;

  let maxValue = -1;
  let maxIndex = -1;
  for (let i = dip; i < correlations.length; i += 1) {
    if (correlations[i] > maxValue) {
      maxValue = correlations[i];
      maxIndex = i;
    }
  }

  if (maxIndex <= 0) return -1;

  const x1 = correlations[maxIndex - 1] ?? correlations[maxIndex];
  const x2 = correlations[maxIndex];
  const x3 = correlations[maxIndex + 1] ?? correlations[maxIndex];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const shift = a ? -b / (2 * a) : 0;
  const period = maxIndex + shift;

  if (!Number.isFinite(period) || period <= 0) return -1;
  return sampleRate / period;
}

function resolveHarmonic(detectedPitch, notes) {
  const candidates = [
    { pitch: detectedPitch, penalty: 0 },
    { pitch: detectedPitch / 2, penalty: 45 },
    { pitch: detectedPitch * 2, penalty: 30 },
  ].filter((candidate) => candidate.pitch >= MIN_PITCH && candidate.pitch <= MAX_PITCH);

  let bestPitch = detectedPitch;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    for (const note of notes) {
      const centsDelta = Math.abs(frequencyToCents(candidate.pitch, note.targetFreq));
      const score = centsDelta + candidate.penalty;

      if (score < bestScore) {
        bestScore = score;
        bestPitch = candidate.pitch;
      }
    }
  }

  return bestScore <= HARMONIC_MATCH_TOLERANCE ? bestPitch : detectedPitch;
}

function InfoOverlay({ type, instrument, onClose }) {
  const title = type === 'SWEETENED' ? 'Sweetened Mode' : 'Half-Step Down';
  const desc =
    type === 'SWEETENED'
      ? INSTRUMENTS[instrument].desc
      : '將全弦音調降低半音，適合需要降半音配置的曲目與伴奏。';

  return (
    <div
      className="fixed inset-0 z-[200] bg-white/40 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-slate-700 mb-4 uppercase tracking-widest">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500 font-medium">{desc}</p>
        <button
          onClick={onClose}
          className="mt-10 rounded-2xl border border-[#e8d3d1] bg-white px-5 py-2 text-[11px] font-black tracking-[0.2em] text-[#8a7a78]"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

export default function AutoTuner() {
  const [instrument, setInstrument] = useState('UKULELE');
  const [isSweetened, setIsSweetened] = useState(false);
  const [isHalfDown, setIsHalfDown] = useState(false);
  const [infoOverlay, setInfoOverlay] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [noteInfo, setNoteInfo] = useState({ note: '--', label: '--' });
  const [detectedNoteKey, setDetectedNoteKey] = useState(null);
  const [displayDiffCents, setDisplayDiffCents] = useState(0);
  const [isTooQuiet, setIsTooQuiet] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [activeRefNote, setActiveRefNote] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputLevel, setInputLevel] = useState(0);

  const menuRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const oscillatorRef = useRef(null);
  const overtoneOscRef = useRef(null);
  const gainRef = useRef(null);
  const toneFilterRef = useRef(null);
  const lastDiffRef = useRef(0);
  const pitchHistoryRef = useRef([]);
  const lastNoteTimeRef = useRef(0);
  const mountedRef = useRef(true);
  const currentNotesRef = useRef([]);
  const noteAttackStartRef = useRef(0);
  const stableCandidateRef = useRef({ noteId: null, frames: 0, cents: 0 });
  const lockedNoteRef = useRef({ noteId: null, frames: 0 });

  const currentNotes = useMemo(() => {
    const halfDownFactor = isHalfDown ? Math.pow(2, -1 / 12) : 1;

    return INSTRUMENTS[instrument].notes.map((note) => {
      const sweetenedCents = isSweetened ? note.sweeten ?? 0 : 0;
      const targetFreq = centsToFrequency(note.freq * halfDownFactor, sweetenedCents);
      const displayNote = isHalfDown ? note.halfDown : note.note;
      const displayShort = isHalfDown ? note.halfDown.replace(/\d+/g, '') : note.short;

      return {
        ...note,
        displayNote,
        displayShort,
        targetFreq,
        id: `${note.note}${note.label}`,
      };
    });
  }, [instrument, isHalfDown, isSweetened]);

  useEffect(() => {
    currentNotesRef.current = currentNotes;
  }, [currentNotes]);

  const resetDisplay = useCallback(() => {
    pitchHistoryRef.current = [];
    lastDiffRef.current = 0;
    noteAttackStartRef.current = 0;
    stableCandidateRef.current = { noteId: null, frames: 0, cents: 0 };
    lockedNoteRef.current = { noteId: null, frames: 0 };
    setIsTooQuiet(true);
    setInputLevel(0);
    setDetectedNoteKey(null);
    setDisplayDiffCents(0);
    setNoteInfo({ note: '--', label: '--' });
  }, []);

  const stopReference = useCallback(() => {
    const now = audioCtxRef.current?.currentTime ?? 0;

    if (gainRef.current) {
      try {
        gainRef.current.gain.cancelScheduledValues(now);
        gainRef.current.gain.setTargetAtTime(0.0001, now, 0.03);
      } catch {}
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop(now + 0.08);
      } catch {}
      try {
        oscillatorRef.current.disconnect();
      } catch {}
    }

    if (overtoneOscRef.current) {
      try {
        overtoneOscRef.current.stop(now + 0.08);
      } catch {}
      try {
        overtoneOscRef.current.disconnect();
      } catch {}
    }

    if (toneFilterRef.current) {
      try {
        toneFilterRef.current.disconnect();
      } catch {}
    }

    oscillatorRef.current = null;
    overtoneOscRef.current = null;
    gainRef.current = null;
    toneFilterRef.current = null;
    setActiveRefNote(null);
  }, []);

  const ensureAudioContext = useCallback(async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('此瀏覽器不支援 AudioContext。');

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass({ latencyHint: 'interactive' });
    }

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const resumeAudioContext = useCallback(async () => {
    if (!audioCtxRef.current) return;

    if (audioCtxRef.current.state === 'suspended' || audioCtxRef.current.state === 'interrupted') {
      await audioCtxRef.current.resume();
    }
  }, []);

  const stopAll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    stopReference();

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    setIsListening(false);
    resetDisplay();
  }, [resetDisplay, stopReference]);

  const updateLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const audioCtx = audioCtxRef.current;
    const notes = currentNotesRef.current;

    if (!analyser || !audioCtx || !mountedRef.current || !notes.length) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i += 1) sumSquares += buffer[i] * buffer[i];
    const rms = Math.sqrt(sumSquares / buffer.length);
    const now = Date.now();
    setInputLevel((prev) => prev * 0.78 + clamp(rms * 260, 0, 1) * 0.22);

    if (rms < VOLUME_THRESHOLD) {
      if (now - lastNoteTimeRef.current > NOTE_HOLD_TIME) {
        resetDisplay();
      }
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    if (!noteAttackStartRef.current || now - lastNoteTimeRef.current > NOTE_HOLD_TIME) {
      noteAttackStartRef.current = now;
      stableCandidateRef.current = { noteId: null, frames: 0, cents: 0 };
      pitchHistoryRef.current = [];
    }

    setIsTooQuiet(false);
    lastNoteTimeRef.current = now;

    const rawPitch = autoCorrelate(buffer, audioCtx.sampleRate);
    if (rawPitch < MIN_PITCH || rawPitch > MAX_PITCH) {
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    const stabilizedPitch = resolveHarmonic(rawPitch, notes);
    pitchHistoryRef.current.push(stabilizedPitch);
    if (pitchHistoryRef.current.length > HISTORY_SIZE) pitchHistoryRef.current.shift();

    const detectedPitch = median(pitchHistoryRef.current);
    const closestNote = getClosestNote(notes, detectedPitch);
    const lockedCandidate = lockedNoteRef.current.noteId
      ? notes.find((note) => note.id === lockedNoteRef.current.noteId) ?? null
      : null;
    const lockedCentsOff = lockedCandidate
      ? frequencyToCents(detectedPitch, lockedCandidate.targetFreq)
      : null;
    const useLockedNote =
      lockedCandidate &&
      Math.abs(lockedCentsOff) <= LOCK_RELEASE_CENTS &&
      closestNote.id !== lockedCandidate.id;

    const targetNote = useLockedNote ? lockedCandidate : closestNote;
    const centsOff = useLockedNote ? lockedCentsOff : frequencyToCents(detectedPitch, closestNote.targetFreq);

    if (Math.abs(centsOff) > MAX_DETECTION_CENTS) {
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    if (now - noteAttackStartRef.current < ATTACK_IGNORE_MS) {
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    const stableCandidate = stableCandidateRef.current;
    const isSameStableTarget =
      stableCandidate.noteId === targetNote.id &&
      Math.abs(stableCandidate.cents - centsOff) <= STABLE_CENTS_WINDOW;

    if (isSameStableTarget) {
      stableCandidateRef.current = {
        noteId: targetNote.id,
        frames: stableCandidate.frames + 1,
        cents: centsOff,
      };
    } else {
      stableCandidateRef.current = {
        noteId: targetNote.id,
        frames: 1,
        cents: centsOff,
      };
    }

    const framesNeeded =
      lockedNoteRef.current.noteId && lockedNoteRef.current.noteId !== targetNote.id
        ? NOTE_SWITCH_FRAME_COUNT
        : STABLE_FRAME_COUNT;

    if (stableCandidateRef.current.frames < framesNeeded) {
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    lockedNoteRef.current = { noteId: targetNote.id, frames: stableCandidateRef.current.frames };
    setNoteInfo({ note: targetNote.displayNote, label: targetNote.label });
    setDetectedNoteKey(targetNote.id);

    const smoothed =
      lastDiffRef.current * (1 - SMOOTHING_FACTOR) + centsOff * SMOOTHING_FACTOR;
    const deltaFromLast = smoothed - lastDiffRef.current;
    const limitedDiff =
      Math.abs(deltaFromLast) > DISPLAY_SLEW_LIMIT_CENTS
        ? lastDiffRef.current + Math.sign(deltaFromLast) * DISPLAY_SLEW_LIMIT_CENTS
        : smoothed;

    const stabilizedDisplay =
      Math.abs(limitedDiff - lastDiffRef.current) < DISPLAY_FREEZE_CENTS
        ? lastDiffRef.current
        : limitedDiff;

    lastDiffRef.current = stabilizedDisplay;
    setDisplayDiffCents(stabilizedDisplay);

    rafRef.current = requestAnimationFrame(updateLoop);
  }, [resetDisplay]);

  const startMic = useCallback(async () => {
    try {
      setErrorMessage('');
      const mediaDevices = getMediaDevices();
      if (!mediaDevices?.getUserMedia) {
        throw new Error('unsupported-media-devices');
      }

      stopAll();
      const audioCtx = await ensureAudioContext();
      await resumeAudioContext();

      const stream = await requestMicStream(mediaDevices);

      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          if (!mountedRef.current) return;
          setErrorMessage('麥克風連線已中斷，請重新啟動。');
          stopAll();
        };
      });

      streamRef.current = stream;
      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.12;

      sourceRef.current = audioCtx.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      await resumeAudioContext();

      lastNoteTimeRef.current = Date.now();
      setIsListening(true);
      resetDisplay();

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateLoop);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.message === 'unsupported-media-devices'
          ? '此瀏覽器或目前環境不支援麥克風功能。'
          : getMediaErrorMessage(error),
      );
      stopAll();
    }
  }, [ensureAudioContext, resetDisplay, resumeAudioContext, stopAll, updateLoop]);

  const playReference = useCallback(
    async (note) => {
      try {
        setErrorMessage('');
        const audioCtx = await ensureAudioContext();
        await resumeAudioContext();
        stopReference();

        const oscillator = audioCtx.createOscillator();
        const overtoneOsc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const toneFilter = audioCtx.createBiquadFilter();
        const lowShelf = audioCtx.createBiquadFilter();
        const noteFreq = note.targetFreq;
        // PATCH: update loudnessBoost and attackGain
        const loudnessBoost = clamp(240 / noteFreq, 1.2, 3.2);
        const attackGain = clamp(0.09 * loudnessBoost, 0.09, 0.24);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(noteFreq, audioCtx.currentTime);
        overtoneOsc.type = 'triangle';
        overtoneOsc.frequency.setValueAtTime(noteFreq * 2, audioCtx.currentTime);

        toneFilter.type = 'lowpass';
        toneFilter.frequency.setValueAtTime(Math.min(2200, noteFreq * 6), audioCtx.currentTime);
        toneFilter.Q.setValueAtTime(0.7, audioCtx.currentTime);

        lowShelf.type = 'lowshelf';
        lowShelf.frequency.setValueAtTime(180, audioCtx.currentTime);
        // PATCH: update lowshelf gain
        lowShelf.gain.setValueAtTime(noteFreq < 180 ? 9 : 4, audioCtx.currentTime);

        // PATCH: update gain envelope
        gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(attackGain, audioCtx.currentTime + 0.06);
        gainNode.gain.exponentialRampToValueAtTime(Math.max(attackGain * 0.28, 0.006), audioCtx.currentTime + 1.45);

        oscillator.connect(gainNode);
        overtoneOsc.connect(gainNode);
        gainNode.connect(lowShelf);
        lowShelf.connect(toneFilter);
        toneFilter.connect(audioCtx.destination);
        oscillator.start();
        overtoneOsc.start();
        oscillator.stop(audioCtx.currentTime + 1.5);
        overtoneOsc.stop(audioCtx.currentTime + 1.38);
        oscillator.onended = () => {
          if (oscillatorRef.current === oscillator) {
            oscillatorRef.current = null;
            overtoneOscRef.current = null;
            gainRef.current = null;
            toneFilterRef.current = null;
            setActiveRefNote(null);
          }
        };

        oscillatorRef.current = oscillator;
        overtoneOscRef.current = overtoneOsc;
        gainRef.current = gainNode;
        toneFilterRef.current = toneFilter;
        setActiveRefNote(note.id);
      } catch (error) {
        console.error(error);
        setErrorMessage('參考音播放失敗，請確認喇叭輸出與瀏覽器音訊權限。');
      }
    },
    [ensureAudioContext, resumeAudioContext, stopReference],
  );

  const toggleSweetened = useCallback(() => {
    stopReference();
    setIsSweetened((prev) => {
      const next = !prev;
      setInfoOverlay(next ? 'SWEETENED' : null);
      return next;
    });
    resetDisplay();
  }, [resetDisplay, stopReference]);

  const toggleHalfDown = useCallback(() => {
    stopReference();
    setIsHalfDown((prev) => {
      const next = !prev;
      setInfoOverlay(next ? 'HALF_DOWN' : null);
      return next;
    });
    resetDisplay();
  }, [resetDisplay, stopReference]);

  const handleInstrumentChange = useCallback(
    (key) => {
      stopReference();
      resetDisplay();
      setInstrument(key);
      setShowMenu(false);
      setInfoOverlay(null);
      setErrorMessage('');
    },
    [resetDisplay, stopReference],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAll();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAll]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      resumeAudioContext().catch(() => {});
    };

    const handleWindowFocus = () => {
      resumeAudioContext().catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [resumeAudioContext]);

  const isPerfect = !isTooQuiet && Math.abs(displayDiffCents) < PERFECT_RANGE_CENTS;
  const clampedMeterOffset = clamp(displayDiffCents, -DISPLAY_CENT_CLAMP, DISPLAY_CENT_CLAMP);
  const detectedNote = currentNotes.find((note) => note.id === detectedNoteKey) ?? null;
  const sweetenedMarkerOffset =
    isSweetened && detectedNote
      ? clamp(detectedNote.sweeten ?? 0, -DISPLAY_CENT_CLAMP, DISPLAY_CENT_CLAMP)
      : null;

  return (
    <div className="min-h-screen bg-[#f5eceb] px-4 py-8 text-slate-800 flex flex-col items-center justify-center font-sans">
      {infoOverlay && (
        <InfoOverlay
          type={infoOverlay}
          instrument={instrument}
          onClose={() => setInfoOverlay(null)}
        />
      )}

      <div className="w-full max-w-md rounded-[3rem] border border-[#e8d3d1] bg-white/70 p-8 shadow-2xl shadow-rose-200/50 backdrop-blur-xl relative">
        <div className="mb-10 flex items-center justify-between relative z-[100]" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-2xl bg-[#e8d3d1] px-4 py-2 text-[11px] font-black text-[#8a7a78] transition-all active:scale-95"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              {INSTRUMENTS[instrument].name}
              <ChevronDown size={14} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
              <div className="absolute left-0 top-12 z-[110] w-44 rounded-2xl border border-[#e8d3d1] bg-white py-2 shadow-xl animate-in fade-in zoom-in duration-200">
                {Object.keys(INSTRUMENTS).map((key) => (
                  <button
                    key={key}
                    className={`w-full px-5 py-3 text-left text-xs font-bold transition-colors ${
                      instrument === key
                        ? 'bg-[#e8d3d1] text-[#8a7a78]'
                        : 'text-slate-400 hover:bg-[#faf4f3]'
                    }`}
                    onClick={() => handleInstrumentChange(key)}
                  >
                    {INSTRUMENTS[key].name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleSweetened}
              className={`rounded-xl border p-2.5 transition-all ${
                isSweetened
                  ? 'bg-[#d8e2dc] text-[#8d9e8c]'
                  : 'bg-white text-[#b09e9c] hover:bg-[#fafafa]'
              }`}
              aria-label="切換甜蜜模式"
            >
              <Heart size={18} fill={isSweetened ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={toggleHalfDown}
              className={`rounded-xl border p-2.5 transition-all ${
                isHalfDown
                  ? 'bg-[#f0e4d7] text-[#d4a373]'
                  : 'bg-white text-[#b09e9c] hover:bg-[#fafafa]'
              }`}
              aria-label="切換降半音模式"
            >
              <Zap size={18} fill={isHalfDown ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="mb-10 text-center">
          <div className="h-6 text-[10px] font-black uppercase tracking-widest text-[#b09e9c]">
            {isTooQuiet ? (
              'Acoustic Tuning'
            ) : isPerfect ? (
              <span className="animate-pulse font-bold text-[#8d9e8c]">PERFECT</span>
            ) : (
              `${noteInfo.label} String`
            )}
          </div>

          <div
            className={`text-8xl sm:text-9xl font-black transition-all ${
              isTooQuiet
                ? 'text-[#e8d3d1]'
                : isPerfect
                  ? 'text-[#8d9e8c]'
                  : 'text-[#b09e9c]'
            }`}
          >
            {isTooQuiet ? '--' : noteInfo.note}
          </div>

          <div
            className={`mt-3 min-h-[1.25rem] text-xs font-bold tracking-[0.2em] transition-opacity text-[#b09e9c] ${
              isTooQuiet ? 'opacity-0' : 'opacity-100'
            }`}
            aria-live="polite"
          >
            {!isTooQuiet ? `${displayDiffCents > 0 ? '偏高' : '偏低'} ${Math.abs(displayDiffCents).toFixed(1)} cents` : '偏低 0.0 cents'}
          </div>
        </div>

        <div className="relative mb-14 flex h-1.5 items-center px-2">
          <div className="relative h-full w-full rounded-full bg-[#f5eceb]">
            <div
              className={`absolute left-1/2 top-1/2 h-6 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                isSweetened ? 'border-l border-dashed border-[#d8c1bf] bg-transparent' : 'bg-[#e8d3d1]'
              }`}
              style={{ zIndex: 10 }}
            />
            {sweetenedMarkerOffset !== null && (
              <div
                className="absolute top-1/2 h-7 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8d9e8c]"
                style={{
                  left: `calc(50% + ${(sweetenedMarkerOffset / DISPLAY_CENT_CLAMP) * 48}% )`,
                  zIndex: 15,
                }}
              />
            )}
            <div
              className={`absolute top-1/2 z-30 h-10 w-2.5 -translate-y-1/2 rounded-full shadow-sm transition-all duration-150 ${
                isPerfect
                  ? 'bg-[#8d9e8c] shadow-[#8d9e8c]/50'
                  : 'bg-[#d4a373]'
              }`}
              style={{
                left: `calc(50% + ${(clampedMeterOffset / DISPLAY_CENT_CLAMP) * 48}% )`,
                transform: 'translate(-50%, -50%)',
                opacity: isTooQuiet ? 0.2 : 1,
              }}
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="rounded-[1.25rem] border border-[#eadad8] bg-white/70 px-4 py-3">
            <div className="flex min-h-[20px] items-center justify-between gap-3">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.25em] text-[#b09e9c]">
                MIC
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-150 ${
                    inputLevel > 0.08 ? 'bg-[#8d9e8c] shadow-[0_0_0_6px_rgba(141,158,140,0.16)]' : 'bg-[#d8c9c7]'
                  }`}
                />
                <span
                  className={`truncate text-[10px] font-black uppercase tracking-[0.16em] ${
                    inputLevel > 0.08 ? 'text-[#8d9e8c]' : 'text-[#c5b4b2]'
                  }`}
                >
                  {inputLevel > 0.08 ? 'Signal On' : 'Standby'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="mb-10 flex items-center justify-between gap-2 rounded-[2rem] bg-[#f5eceb]/50 p-3">
          {currentNotes.map((note) => {
            const isDetected = detectedNoteKey === note.id && isListening && !isTooQuiet;
            const isActive = activeRefNote === note.id;

            return (
              <button
                key={note.id}
                onClick={() => playReference(note)}
                className={`relative flex flex-1 aspect-[4/5] flex-col items-center justify-center gap-1 rounded-[1rem] border-2 transition-all duration-300 ${
                  isActive
                    ? 'bg-[#e8d3d1] border-white text-white shadow-lg -translate-y-1'
                    : isDetected
                      ? 'bg-white border-[#e8d3d1] text-[#8a7a78] shadow-md scale-105'
                      : 'bg-white border-transparent text-[#b09e9c] opacity-80 hover:opacity-100'
                }`}
                aria-label={`播放 ${note.displayNote} 參考音`}
              >
                {isDetected && (
                  <span className="absolute inset-0 rounded-[1rem] border border-[#e8d3d1] animate-ping opacity-20" />
                )}
                <span className="text-[9px] font-black opacity-60">{note.label}</span>
                <span className="text-sm font-black">{note.displayShort}</span>
                <span className="text-[9px] font-bold opacity-60">{note.displayNote}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={isListening ? stopAll : startMic}
          className={`flex w-full items-center justify-center gap-3 rounded-[2rem] py-5 text-xs font-black tracking-[0.3em] transition-all ${
            isListening
              ? 'bg-[#b09e9c] text-white shadow-inner'
              : 'border border-[#e8d3d1] bg-white text-[#8a7a78] shadow-xl hover:bg-[#fcf7f6]'
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening ? 'STOP SCAN' : 'START TUNING'}
        </button>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-500">
            {errorMessage}
          </div>
        )}
      </div>

      <p className="mt-8 px-4 text-center text-[10px] font-black uppercase tracking-[0.5em] text-[#b09e9c]">
        Phenom • Professional Acoustic Solution
      </p>
    </div>
  );
}
