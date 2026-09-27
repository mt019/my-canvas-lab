// End-to-end check: synthetic video stays in the local browser; no source is published.
// Requires local FFmpeg and Chrome. Usage: node scripts/test-vintage-rec.mjs [base-url]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const dir = await mkdtemp(join(tmpdir(), 'vintage-test-'));
const fixture = join(dir, 'test.mp4'), exported = join(dir, 'output.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '3', '-c:v', 'libx264', '-c:a', 'aac', fixture]);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const errors = [], uploads = [], metrics = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {
    if (!['POST', 'PUT'].includes(r.method())) return;
    // The production domain has existing Cloudflare performance telemetry.
    // Inspect it separately from video upload traffic, rather than assuming
    // every POST carries a media file.
    if (new URL(r.url()).pathname === '/cdn-cgi/rum') metrics.push(r.postData() || '');
    else uploads.push(r.url());
  });
  await page.goto(`${process.argv[2] || 'http://127.0.0.1:5187'}/vintagerec`);
  await page.getByLabel('選擇影片檔案').setInputFiles(fixture);
  await page.getByRole('button', { name: '匯出影片', exact: true }).waitFor();
  await page.locator('details').first().locator('summary').click();
  await page.getByLabel('開始秒數').fill('0.25');
  await page.getByLabel('結束秒數').fill('1.25');
  await page.getByLabel('整體濃度', { exact: true }).fill('50');
  await page.getByRole('button', { name: '匯出影片', exact: true }).click();
  await page.getByRole('link', { name: '下載 MP4' }).waitFor({ timeout: 60000 });
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: '下載 MP4' }).click();
  await (await download).saveAs(exported);
  const { streams } = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,duration', '-of', 'json', exported], { encoding: 'utf8' }));
  assert.equal(streams[0].codec_name, 'h264'); assert.equal(streams[0].width, 640);
  assert.equal(streams[1].codec_name, 'aac');
  for (const s of streams) assert.ok(Math.abs(Number(s.duration) - 1) < 0.04, `incorrect trim: ${s.duration}`);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole('button', { name: '使用整段' }).click();
  await page.getByRole('button', { name: '匯出影片', exact: true }).click();
  await page.getByRole('button', { name: '取消匯出' }).click();
  await page.getByRole('button', { name: '匯出影片', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: '下載 MP4' }).count(), 0);
  assert.deepEqual(await page.getByRole('alert').allTextContents(), []);
  assert.deepEqual(errors, []); assert.deepEqual(uploads, []);
  for (const body of metrics) {
    assert.ok(body.length < 16000 && !body.includes('test.mp4'));
    assert.equal(typeof JSON.parse(body), 'object');
  }
  console.log(JSON.stringify({ status: 'passed', bytes: (await readFile(exported)).length, streams, mobileOverflow: false, cancel: true, uploads: 0, performanceBeacons: metrics.length }, null, 2));
} finally { await browser.close(); await rm(dir, { recursive: true, force: true }); }
