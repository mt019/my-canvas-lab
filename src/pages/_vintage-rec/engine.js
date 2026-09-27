import { Input, BlobSource, ALL_FORMATS, VideoSampleSink, Output, BufferTarget, StreamTarget, Mp4OutputFormat, Conversion } from 'mediabunny';

export const defaults = { strength: 100, color: 100, frame: 100, leak: 100, grain: 100, quality: 'balanced' };
const keys = ['strength', 'color', 'frame', 'leak', 'grain'];
let profilePromise;
async function profile() {
  profilePromise ??= Promise.all([
    fetch('/vintage-rec/profile.json').then(r => { if (!r.ok) throw Error('效果素材讀取失敗，請重新整理。'); return r.json(); }),
    fetch('/vintage-rec/light-coefficients.bin').then(r => { if (!r.ok) throw Error('效果素材讀取失敗，請重新整理。'); return r.arrayBuffer(); }),
  ]).then(([data, bytes]) => ({ ...data, coefficients: new Float32Array(bytes) })).catch(error => { profilePromise = null; throw error; });
  return profilePromise;
}

export function dimensions(w, h, quality = 'balanced') {
  const bounds = quality === 'high' ? [1920, 1920] : w > h ? [1920, 1080] : h > w ? [1080, 1920] : [1080, 1080];
  const ratio = Math.min(1, bounds[0] / w, bounds[1] / h);
  return [Math.max(2, Math.floor(w * ratio / 2) * 2), Math.max(2, Math.floor(h * ratio / 2) * 2)];
}
export function bitrate(quality) { return quality === 'small' ? 2e6 : quality === 'high' ? 8e6 : 4e6; }

const vertex = `attribute vec2 position; varying vec2 uv;
void main(){uv=(position+1.0)/2.0;gl_Position=vec4(position,0.0,1.0);}`;
const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D source;
uniform vec3 c0,c1,c2,c3; uniform float frameParams[10]; uniform vec3 lights[15];
uniform float strength,colorAmount,frameAmount,leakAmount,grainAmount,frameTime;
uniform vec2 resolution;
float sigmoid(float a){return 1.0/(1.0+exp(-a));}
float noise(vec2 xy){return fract(sin(dot(xy,vec2(12.9898,78.233))+frameTime*51.73)*43758.5453);}
void main(){
 vec2 p=vec2(uv.x,1.0-uv.y); vec3 original=texture2D(source,uv).rgb;
 vec3 mapped=clamp(c0+original*(c1+original*(c2+original*c3)),0.0,1.0);
 vec3 image=mix(original,mapped,colorAmount); vec3 light=vec3(0.0);
 for(int i=0;i<15;i++){
   float x=-0.1+float(i-5*(i/5))*0.3; float y=-0.05+float(i/5)*0.55;
   vec2 delta=(p-vec2(x,y))/vec2(0.17,0.28);
   light+=lights[i]*exp(-0.5*dot(delta,delta));
 }
 image+=(1.0-image)*clamp(light,0.0,0.85)*leakAmount;
 image+=vec3((noise(floor(p*resolution))-0.5)*0.062*grainAmount);
 float ex=pow(abs(2.0*p.x-1.0),8.0),ey=pow(abs(2.0*p.y-1.0),8.0);
 float mask=sigmoid((p.x-frameParams[0]-frameParams[6]*ey)/frameParams[4]);
 mask*=sigmoid((1.0-frameParams[1]-p.x-frameParams[6]*ey)/frameParams[4]);
 mask*=sigmoid((p.y-frameParams[2]-frameParams[7]*ex)/frameParams[5]);
 mask*=sigmoid((1.0-frameParams[3]-p.y-frameParams[7]*ex)/frameParams[5]);
 mask*=exp(-frameParams[8]*pow(2.0*p.x-1.0,2.0)-frameParams[9]*pow(2.0*p.y-1.0,2.0));
 image*=mix(1.0,mask,frameAmount);
 gl_FragColor=vec4(mix(original,clamp(image,0.0,1.0),strength),1.0);
}`;

export async function createRenderer(canvas) {
  const data = await profile();
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw Error('這個瀏覽器無法顯示濾鏡，請使用新版 Chrome 或 Safari。');
  function shader(type, text) {
    const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('濾鏡無法啟動，請更新瀏覽器。');
    return s;
  }
  const program = gl.createProgram();
  const shaders = [shader(gl.VERTEX_SHADER, vertex), shader(gl.FRAGMENT_SHADER, fragment)];
  shaders.forEach(s => gl.attachShader(program, s)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('濾鏡無法啟動。');
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const loc = name => gl.getUniformLocation(program, name);
  for (let i = 0; i < 4; i++) gl.uniform3fv(loc(`c${i}`), data.parameters.slice(i * 3, i * 3 + 3));
  gl.uniform1fv(loc('frameParams'), data.parameters.slice(12));
  const work = document.createElement('canvas'); const context = work.getContext('2d', { alpha: false });
  const light = new Float32Array(45);
  function lightFrame(index, component) {
    const value = data.coefficients[index * 45 + component];
    const tail = Math.max(0, (index - (data.lightFrames - 24) + 1) / 24);
    return value * (1 - tail) + data.coefficients[component] * tail;
  }
  return {
    draw(sample, time, settings, width, height) {
      if (gl.isContextLost()) throw Error('濾鏡暫時無法運作，請重新整理後再試。');
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; work.width = width; work.height = height; }
      sample.draw(context, 0, 0, width, height);
      gl.viewport(0, 0, width, height); gl.useProgram(program); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, work);
      const at = Math.max(0, time) * data.lightFps % data.lightFrames, i = Math.floor(at), f = at - i;
      for (let n = 0; n < 45; n++) light[n] = lightFrame(i, n) * (1 - f) + lightFrame((i + 1) % data.lightFrames, n) * f;
      gl.uniform3fv(loc('lights'), light);
      for (const [key, uniform] of [['strength', 'strength'], ['color', 'colorAmount'], ['frame', 'frameAmount'], ['leak', 'leakAmount'], ['grain', 'grainAmount']]) gl.uniform1f(loc(uniform), settings[key] / 100);
      gl.uniform1f(loc('frameTime'), Math.floor(time * 30)); gl.uniform2f(loc('resolution'), width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return canvas;
    },
    dispose() { gl.deleteTexture(texture); gl.deleteBuffer(buffer); shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}

export async function openVideo(file) {
  if (!globalThis.VideoDecoder || !globalThis.VideoEncoder) throw Error('此瀏覽器尚未支援影片處理，請使用新版 Chrome 或 Safari。');
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track || !await track.canDecode()) throw Error('無法讀取這種影片，請另存為 MP4 後再試。');
    if (await track.hasHighDynamicRange()) throw Error('這個濾鏡目前適用 SDR 影片，請先將 HDR 影片另存為 SDR 再加入。');
    const duration = await input.computeDuration();
    if (!Number.isFinite(duration) || duration <= 0) throw Error('無法讀取影片長度。');
    return { input, track, sink: new VideoSampleSink(track), duration, width: track.displayWidth, height: track.displayHeight, file };
  } catch (error) { input.dispose(); throw error; }
}

export async function exportVideo(media, settings, range, onProgress, onCancelReady, isCanceled = () => false) {
  const [width, height] = dimensions(media.width, media.height, settings.quality);
  const canvas = document.createElement('canvas'); const renderer = await createRenderer(canvas);
  const input = new Input({ source: new BlobSource(media.file), formats: ALL_FORMATS });
  let output, conversion, folder, temporaryName;
  const cleanup = async () => { input.dispose(); renderer.dispose(); if (folder && temporaryName) await folder.removeEntry(temporaryName).catch(() => {}); };
  try {
    const estimate = (range.end - range.start) * (bitrate(settings.quality) + 192000) / 8;
    let target;
    if (estimate > 80e6 && navigator.storage?.getDirectory) {
      folder = await navigator.storage.getDirectory(); temporaryName = `vintage-${crypto.randomUUID()}.mp4`;
      const handle = await folder.getFileHandle(temporaryName, { create: true });
      target = new StreamTarget(await handle.createWritable());
    } else {
      if (estimate > 180e6) throw Error('這個瀏覽器適合較短的影片；請縮短片段，或使用新版 Chrome。');
      target = new BufferTarget();
    }
    output = new Output({ target, format: new Mp4OutputFormat({ fastStart: false }) });
    conversion = await Conversion.init({
      input, output, tracks: 'primary', trim: range, tags: {},
      video: { codec: 'avc', width, height, fit: 'contain', frameRate: 30, bitrate: bitrate(settings.quality), allowTransformationMetadata: false, forceTranscode: true,
        process: sample => renderer.draw(sample, Math.max(0, sample.timestamp), settings, width, height) },
      audio: { codec: 'aac' },
    });
    if (!conversion.isValid || conversion.discardedTracks.length) throw Error('此瀏覽器無法完整輸出這支影片的影像或音訊，請使用新版 Chrome 或 Safari。');
    onCancelReady(() => conversion.cancel());
    if (isCanceled()) throw Error('已取消匯出。');
    conversion.onProgress = fraction => onProgress(Math.min(0.99, fraction));
    await conversion.execute();
    if (isCanceled()) throw Error('已取消匯出。');
    onProgress(1);
    if (folder) {
      const file = await (await folder.getFileHandle(temporaryName)).getFile();
      // Keep the backing file until the user loads another clip or leaves the page.
      const storedFolder = folder, name = temporaryName; folder = null;
      return { blob: file, cleanup: () => storedFolder.removeEntry(name).catch(() => {}) };
    }
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), cleanup: () => {} };
  } catch (error) {
    if (output && output.state !== 'finalized' && output.state !== 'canceled') await output.cancel().catch(() => {});
    throw error;
  } finally { onCancelReady(null); await cleanup(); }
}

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('vintage-rec-settings') || '{}');
    return { ...defaults, ...Object.fromEntries(keys.map(k => [k, Number.isFinite(saved[k]) ? Math.min(100, Math.max(0, saved[k])) : 100])), quality: ['balanced', 'small', 'high'].includes(saved.quality) ? saved.quality : 'balanced' };
  } catch { return { ...defaults }; }
}
