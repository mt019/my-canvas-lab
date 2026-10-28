import { chromium, devices } from 'playwright';
const S=process.argv[2] ?? '.';
const browser = await chromium.launch({ headless: true, args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+S+'/a3.wav','--autoplay-policy=no-user-gesture-required'] });
for (const [name, opts, throttle] of [['desktop',{viewport:{width:1200,height:800}},1],['mobile',{...devices['iPhone 13']},1],['mobile-slow',{...devices['iPhone 13']},6]]) {
  const ctx = await browser.newContext({ ...opts, permissions:['microphone'] });
  const page = await ctx.newPage();
  page.on('pageerror', e=>console.log(name,'pageerror',e.message));
  const cdp = await ctx.newCDPSession(page);
  if (throttle>1) await cdp.send('Emulation.setCPUThrottlingRate',{rate:throttle});
  await page.goto('http://localhost:5288/vocaltuner');
  await page.waitForTimeout(1500);
  await page.evaluate(()=>{window.__n=0;const r=window.requestAnimationFrame;window.requestAnimationFrame=f=>r(t=>{window.__n++;f(t)});});
  await page.getByRole('button',{name:/START/}).click();
  await page.waitForTimeout(4000);
  const n = await page.evaluate(()=>window.__n);
  const note = await page.locator('.text-5xl').first().textContent().catch(()=>'?');
  console.log(name,'raf/4s',n,'note',note);
  await page.screenshot({path:S+'/'+name+'.png'});
  await ctx.close();
}
await browser.close();
