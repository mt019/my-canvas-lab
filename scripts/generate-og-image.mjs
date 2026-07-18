// Renders the site-wide Open Graph card (1200×630) to public/og-default.png with
// Playwright. Run once (or when the palette/copy changes); the PNG is committed
// and served statically. Uses the homepage identity palette, not the banned
// cream + grey-green scheme. Run: node scripts/generate-og-image.mjs
import { chromium } from 'playwright';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const OUT = join(ROOT, 'public', 'og-default.png');

const sections = [
  ['研究地圖', 'research canvases'],
  ['法政解析', 'legal & policy'],
  ['教學實驗室', 'method teaching'],
  ['即用工具', 'interactive tools'],
];

const html = `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 76px 84px;
    background: #fbf8f9;
    color: #332b30;
    font-family: "Songti TC", "Noto Serif CJK TC", "Source Han Serif TC", Georgia, serif;
  }
  .top { display: flex; align-items: center; gap: 18px; }
  .dot { width: 34px; height: 34px; border-radius: 999px;
    background: radial-gradient(circle at 35% 30%, #c9a9b4, #a77b89); }
  .kicker { font-family: Georgia, "Times New Roman", serif; letter-spacing: .28em;
    text-transform: uppercase; font-size: 22px; color: #8a7480; }
  h1 { font-size: 92px; line-height: 1.02; font-weight: 600; letter-spacing: -.01em; }
  .sub { font-size: 34px; line-height: 1.5; color: #3f3339; max-width: 900px; }
  .rule { height: 2px; background: #d9c8cf; margin: 4px 0 2px; }
  .grid { display: flex; gap: 40px; }
  .cell { border-top: 3px solid #a77b89; padding-top: 12px; }
  .cell .zh { font-size: 28px; font-weight: 600; color: #332b30; }
  .cell .en { font-family: Georgia, serif; font-size: 18px; letter-spacing: .06em;
    color: #8a7480; margin-top: 4px; }
  .foot { font-family: Georgia, serif; font-size: 24px; color: #a77b89; letter-spacing: .04em; }
</style></head><body>
  <div>
    <div class="top"><span class="dot"></span><span class="kicker">Phenom Canvas Lab</span></div>
    <h1 style="margin-top:28px">研究、法政與<br>創作工具的實驗場</h1>
  </div>
  <div class="sub">可操作的資料研究地圖、法律與財稅解析、統計教學模擬與創作工具。</div>
  <div>
    <div class="rule"></div>
    <div class="grid" style="margin-top:26px">
      ${sections.map(([zh, en]) => `<div class="cell"><div class="zh">${zh}</div><div class="en">${en}</div></div>`).join('')}
    </div>
    <div class="foot" style="margin-top:34px">my-canvas-lab.vercel.app</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('wrote', OUT);
