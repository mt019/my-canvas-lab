// 第三輪：收音順序改為先 getUserMedia 再建 AudioContext 之後的驗證。
// 用法：node order.mjs <含 a3.wav 的目錄>；dev server 開在 5288 埠。
// Chromium 以 a3.wav 當假麥克風；WebKit 用 Playwright 內建的假裝置。
import { chromium, webkit, devices } from 'playwright';
const S = process.argv[2] ?? '.';
const runs = [
  ['chromium', chromium, devices['iPhone 13'], { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${S}/a3.wav`, '--autoplay-policy=no-user-gesture-required'] }],
  ['webkit', webkit, devices['iPad Pro 11'], {}],
];
for (const [name, type, device, launch] of runs) {
  const browser = await type.launch({ headless: true, ...launch });
  for (const pianoFirst of [false, true]) {
    const ctx = await browser.newContext({ ...device, ...(name === 'chromium' ? { permissions: ['microphone'] } : {}) });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://localhost:5288/vocaltuner?debug');
    await page.waitForTimeout(1500);
    if (pianoFirst) {
      const box = await page.locator('canvas').boundingBox();
      await page.mouse.click(box.x + 15, box.y + box.height / 2);
      await page.waitForTimeout(500);
    }
    await page.getByRole('button', { name: /START/ }).click();
    await page.waitForTimeout(4000);
    const note = await page.locator('.text-5xl').first().textContent().catch(() => '?');
    const debug = await page.locator('.font-mono').first().textContent().catch(() => '(無讀數)');
    console.log(`${name} ${pianoFirst ? '先彈琴' : '直接START'} | 音名 ${note} | ${debug} | 錯誤 ${errors.length ? errors.join('; ') : '無'}`);
    await ctx.close();
  }
  await browser.close();
}
