// 第五輪：畫布左下的「原始收音／預設收音／讀數」按鈕。用法同 order.mjs。
import { chromium, devices } from 'playwright';
const S = process.argv[2] ?? '.';
const b = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${S}/a3.wav`] });
for (const name of ['iPhone SE', 'iPad Pro 11']) {
  const ctx = await b.newContext({ ...devices[name], permissions: ['microphone'] });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5288/vocaltuner'); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /START/ }).click();
  await p.getByRole('button', { name: '讀數' }).click(); await p.waitForTimeout(2500);
  const raw = await p.locator('.font-mono').first().textContent();
  await p.getByRole('button', { name: '預設收音' }).click(); await p.waitForTimeout(2500);
  const plain = await p.locator('.font-mono').first().textContent();
  const note = await p.locator('.text-5xl').first().textContent();
  const keys = await p.locator('canvas').boundingBox();
  const btn = await p.getByRole('button', { name: '原始收音' }).boundingBox();
  console.log(`${name} | 原始 ${raw.match(/ec \d ns \d agc \d/)} | 預設 ${plain.match(/ec \d ns \d agc \d/)} | 音名 ${note} | 按鈕左緣 ${Math.round(btn.x - keys.x)}px 底距 ${Math.round(keys.y + keys.height - btn.y - btn.height)}px`);
  await p.screenshot({ path: `switch-${name.replace(/ /g, '-')}.png` });
  await ctx.close();
}
await b.close();
