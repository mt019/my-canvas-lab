import { useEffect, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import { bitrate, createRenderer, dimensions, exportVideo, loadSettings, openVideo } from './_vintage-rec/engine';

const button = 'rounded border border-line px-4 py-2 text-sm hover:bg-surface disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const seconds = n => `${Math.floor(n / 60)}:${(n % 60).toFixed(1).padStart(4, '0')}`;
const size = n => `${(n / 1e6).toFixed(1)} MB`;
function Slider({ name, value, onChange, disabled }) {
  return <label className="grid gap-2 text-sm"><span className="flex justify-between"><span>{name}</span><span className="tabular-nums">{value}%</span></span><input aria-label={name} type="range" min="0" max="100" value={value} disabled={disabled} onChange={e => onChange(Number(e.target.value))} className="w-full accent-accent" /></label>;
}

export default function VintageRec() {
  const [settings, setSettings] = useState(loadSettings);
  const [media, setMedia] = useState(null);
  const [time, setTime] = useState(0);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [original, setOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const canvas = useRef(null), picker = useRef(null), renderer = useRef(null), sample = useRef(null);
  const current = useRef(null), latestResult = useRef(null), request = useRef(0), cancel = useRef(null), aborted = useRef(false);
  const mounted = useRef(true);
  const clearResult = () => {
    if (latestResult.current) { URL.revokeObjectURL(latestResult.current.url); latestResult.current.cleanup(); latestResult.current = null; }
    setResult(null);
  };
  useEffect(() => { try { localStorage.setItem('vintage-rec-settings', JSON.stringify(settings)); } catch { /* Private storage is optional. */ } }, [settings]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false; request.current++; aborted.current = true; cancel.current?.();
      sample.current?.close(); sample.current = null; current.current?.input.dispose();
      renderer.current?.dispose(); renderer.current = null;
      if (latestResult.current) { URL.revokeObjectURL(latestResult.current.url); latestResult.current.cleanup(); }
    };
  }, []);
  useEffect(() => {
    if (!busy) return;
    const start = performance.now();
    const timer = setInterval(() => setElapsed((performance.now() - start) / 1000), 250);
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => { clearInterval(timer); window.removeEventListener('beforeunload', warn); };
  }, [busy]);
  useEffect(() => {
    if (!media || busy) return;
    const id = ++request.current;
    const timer = setTimeout(async () => {
      let next;
      try {
        next = await media.sink.getSample(Math.min(time, Math.max(0, media.duration - 0.04)));
        if (id !== request.current || !mounted.current) { next?.close(); return; }
        if (!next) throw Error('這個時間點沒有可讀取的畫面。');
        sample.current?.close(); sample.current = next;
        if (!renderer.current) {
          const ready = await createRenderer(canvas.current);
          if (!mounted.current) { ready.dispose(); return; }
          renderer.current = ready;
        }
        if (id === request.current && mounted.current) setPreviewVersion(v => v + 1);
      } catch (e) { if (id === request.current && mounted.current) setError(e.message); }
    }, 80);
    return () => { clearTimeout(timer); request.current++; };
  }, [media, time, busy]);
  useEffect(() => {
    if (!sample.current || !renderer.current || !media) return;
    try {
      const ratio = Math.min(1, 960 / Math.max(media.width, media.height));
      renderer.current.draw(sample.current, Math.max(0, time - range.start), original ? { ...settings, strength: 0 } : settings, Math.max(2, Math.round(media.width * ratio)), Math.max(2, Math.round(media.height * ratio)));
    } catch (e) { setError(e.message); }
  }, [previewVersion, settings, original, media, time, range.start]);

  async function select(file) {
    if (!file || busy || loading) return;
    setLoading(true); setError(''); clearResult();
    try {
      const next = await openVideo(file);
      if (!mounted.current) { next.input.dispose(); return; }
      request.current++; sample.current?.close(); sample.current = null;
      current.current?.input.dispose(); current.current = next;
      setTime(0); setRange({ start: 0, end: next.duration }); setMedia(next);
    } catch (e) { setError(e.message); }
    finally { if (mounted.current) setLoading(false); }
  }
  async function startExport() {
    if (!media || range.end <= range.start) return;
    setBusy(true); setError(''); setProgress(0); setElapsed(0); clearResult(); aborted.current = false;
    const start = performance.now();
    try {
      const output = await exportVideo(media, { ...settings }, { ...range }, p => { if (mounted.current) setProgress(p); }, fn => { cancel.current = fn; if (aborted.current) fn?.(); }, () => aborted.current);
      if (!mounted.current || aborted.current) { await output.cleanup(); return; }
      const item = { ...output, url: URL.createObjectURL(output.blob), name: `${media.file.name.replace(/\.[^.]+$/, '')}_VintageREC.mp4`, seconds: (performance.now() - start) / 1000 };
      latestResult.current = item; setResult(item);
    } catch (e) { if (mounted.current && !aborted.current) setError(e.message || '匯出失敗，請再試一次。'); }
    finally { if (mounted.current) setBusy(false); cancel.current = null; }
  }
  const change = (key, value) => setSettings(s => ({ ...s, [key]: value }));
  const [w, h] = media ? dimensions(media.width, media.height, settings.quality) : [0, 0];
  const duration = Math.max(0, range.end - range.start);
  const remaining = progress > 0.08 && elapsed > 4 ? elapsed * (1 - progress) / progress : null;
  return <PageShell title="Vintage REC" eyebrow="影片工具" width="wide">
    <p className="mb-6 text-ink-muted">調整復古色調與動態漏光，選好片段後存成較小的 MP4。影片在你的裝置處理，不會上傳。</p>
    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); select(e.dataTransfer.files[0]); }} className="border-y border-line py-5 mb-6 flex flex-wrap items-center gap-4">
      <input ref={picker} type="file" accept="video/*,.mkv" aria-label="選擇影片檔案" className="sr-only" disabled={busy || loading} onChange={e => { select(e.target.files[0]); e.target.value = ''; }} />
      <button className={button} disabled={busy || loading} onClick={() => picker.current.click()}>{loading ? '讀取影片中…' : media ? '更換影片' : '選擇影片'}</button>
      <span className="text-sm text-ink-muted break-all">{media ? `${media.file.name} · ${size(media.file.size)} · ${seconds(media.duration)}` : '也可以把影片拖到這裡'}</span>
    </div>
    {error && <p role="alert" className="mb-5 border-l-2 border-accent pl-3 text-ink">{error}</p>}
    <div className={media ? 'grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]' : 'hidden'}>
      <section aria-label="效果預覽" className="min-w-0">
        <div className="bg-surface border border-line flex justify-center items-center min-h-48"><canvas ref={canvas} aria-label="所選時間的濾鏡畫面" className="block max-w-full max-h-[60vh] w-auto h-auto" /></div>
        <div className="my-3 flex justify-between items-center gap-3 text-sm"><span className="tabular-nums">{seconds(time)} / {seconds(media?.duration || 0)}</span><label className="flex gap-2 items-center"><input type="checkbox" checked={original} onChange={e => setOriginal(e.target.checked)} />查看原片</label></div>
        <input aria-label="預覽時間" type="range" className="w-full accent-accent" min="0" max={media?.duration || 0} step="0.033333" value={time} disabled={busy} onChange={e => setTime(Number(e.target.value))} />
        <p className="mt-2 text-xs text-ink-muted">拖動時間軸查看畫面；下載的影片含動態效果。預覽未經輸出壓縮。</p>
      </section>
      <section aria-label="影片設定" className="space-y-5">
        <Slider name="整體濃度" value={settings.strength} onChange={v => change('strength', v)} disabled={busy} />
        <details className="border-t border-line pt-4"><summary className="cursor-pointer text-sm">選片段 · {range.start === 0 && range.end === media?.duration ? '整段影片' : `${seconds(range.start)}–${seconds(range.end)}`}</summary>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <label>開始秒數<input aria-label="開始秒數" type="number" min="0" max={range.end - 0.1} step="0.1" value={Number(range.start.toFixed(3))} disabled={busy} className="mt-1 w-full rounded border border-line bg-paper p-2" onChange={e => setRange(r => ({ ...r, start: Math.max(0, Math.min(Number(e.target.value), r.end - 0.1)) }))} /></label>
            <label>結束秒數<input aria-label="結束秒數" type="number" min={range.start + 0.1} max={media?.duration} step="0.1" value={Number(range.end.toFixed(3))} disabled={busy} className="mt-1 w-full rounded border border-line bg-paper p-2" onChange={e => setRange(r => ({ ...r, end: Math.min(media.duration, Math.max(Number(e.target.value), r.start + 0.1)) }))} /></label>
            <button className={button} disabled={busy || time >= range.end - 0.1} onClick={() => setRange(r => ({ ...r, start: time }))}>此處為起點</button>
            <button className={button} disabled={busy || time <= range.start + 0.1} onClick={() => setRange(r => ({ ...r, end: time }))}>此處為終點</button>
            <button className={`${button} col-span-2`} disabled={busy} onClick={() => setRange({ start: 0, end: media.duration })}>使用整段</button>
          </div>
        </details>
        <details className="border-t border-line pt-4"><summary className="cursor-pointer text-sm">進階設定</summary><div className="mt-4 space-y-4">
          {[['color', '色調'], ['frame', '黑框'], ['leak', '漏光'], ['grain', '顆粒']].map(([key, name]) => <Slider key={key} name={name} value={settings[key]} disabled={busy} onChange={v => change(key, v)} />)}
          <label className="grid gap-2 text-sm">輸出畫質<select aria-label="輸出畫質" value={settings.quality} disabled={busy} onChange={e => change('quality', e.target.value)} className="border border-line rounded bg-paper p-2"><option value="balanced">自動壓縮</option><option value="small">更小檔案</option><option value="high">較高畫質</option></select></label>
        </div></details>
        <div className="border-t border-line pt-4 space-y-3">
          <p className="text-sm text-ink-muted">{w} × {h} · {seconds(duration)} · 約 {size(duration * (bitrate(settings.quality) + 192000) / 8)}<br /><span className="text-xs">實際大小依畫面而變；原片已很小時，輸出仍可能較大。</span></p>
          {busy ? <div role="status" className="space-y-2"><progress aria-label="匯出進度" max="1" value={progress} className="w-full accent-accent" /><p className="text-sm tabular-nums">{Math.floor(progress * 100)}% · 已用 {seconds(elapsed)} · {remaining === null ? '剩餘時間估算中' : `約剩 ${seconds(remaining)}`}</p><p className="text-xs text-ink-muted">處理期間請保持此頁開啟。</p><button className={button} onClick={() => { aborted.current = true; cancel.current?.(); }}>取消匯出</button></div> : <button className={`${button} w-full font-medium`} disabled={!media || loading || duration <= 0} onClick={startExport}>匯出影片</button>}
          {result && <div role="status" className="space-y-2"><p className="text-sm">已完成 · {size(result.blob.size)} · 用時 {seconds(result.seconds)}</p><a className={`${button} inline-block`} href={result.url} download={result.name}>下載 MP4</a></div>}
        </div>
      </section>
    </div>
    <p className="mt-8 text-xs text-ink-muted">這是根據參考影片重現的視覺效果。支援情況依瀏覽器與影片格式而異，建議使用新版 Chrome 或 Safari。</p>
  </PageShell>;
}
