// WebKit 無頭模式下 getUserMedia 是否回應（排除測試環境本身的問題）。
import { webkit, devices } from 'playwright';
const b = await webkit.launch({ headless: true });
const p = await (await b.newContext({ ...devices['iPad Pro 11'] })).newPage();
await p.goto('http://localhost:5288/vocaltuner');
for (const c of [{ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }, { audio: true }]) {
  console.log(JSON.stringify(c), await p.evaluate((c) => Promise.race([
    navigator.mediaDevices?.getUserMedia(c).then((s) => 'ok ' + s.getAudioTracks()[0].label, (e) => 'err ' + e.name),
    new Promise((r) => setTimeout(() => r('timeout 4s'), 4000)),
  ]), c).catch((e) => 'eval ' + e.message.slice(0, 80)));
}
await b.close();
