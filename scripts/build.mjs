// 完整建置的單一入口：vite build → 清掉退役的 public 投影 → 預先渲染 → 驗產物 → sitemap。
//
//   node scripts/build.mjs                        寫共用的 dist/（部署走這條）
//   node scripts/build.mjs --dist <path>          寫隔離目錄（npm run verify:full 走這條）
//
// 兩件事只有從這裡跑才成立：
//   一、五個步驟拿到同一個產物目錄（scripts/dist-target.mjs 是那個目錄的單一來源）。
//       先前只有 prerender 讀得懂 PRERENDER_DIST，sitemap 與 validate:prerender 寫死
//       dist/，於是「建到別處」只做得到一半。
//   二、寫共用 dist/ 的時候先拿鎖，整段建置期間握著。兩個 build 同時跑會互相刪檔
//       （2026-07-20、2026-07-27 各踩過一次），而症狀出現在受害者身上，看著猜不出來。
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

const args = process.argv.slice(2);
const flag = args.indexOf('--dist');
if (flag !== -1) {
  if (!args[flag + 1]) {
    console.error('--dist 後面要接目錄路徑，例：node scripts/build.mjs --dist node_modules/.verify-dist');
    process.exit(1);
  }
  process.env.PRERENDER_DIST = args[flag + 1];
}

// dist-target 讀的是 process.env，所以要等上面設完才 import。
const { DIST, DIST_LABEL, IS_SHARED_DIST, acquireDistLock } = await import('./dist-target.mjs');

const run = (command, commandArgs) => {
  console.log(`\n$ ${command} ${commandArgs.join(' ')}`);
  execFileSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, PRERENDER_DIST: IS_SHARED_DIST ? '' : DIST },
  });
};

const vite = join(ROOT, 'node_modules', '.bin', 'vite');
const release = await acquireDistLock('build');
const started = Date.now();
try {
  run(vite, ['build', '--outDir', DIST, '--emptyOutDir']);
  run('node', ['scripts/prune-retired-public.mjs']);
  // npm run 而不是直接 node：prerender 有個 preprerender 步驟負責裝 chromium。
  run('npm', ['run', 'prerender']);
  run('node', ['scripts/validate-prerender.mjs']);
  run('node', ['scripts/generate-sitemap.mjs']);
} finally {
  release();
}

console.log(`\n建置完成：${DIST_LABEL}（${Math.round((Date.now() - started) / 1000)} 秒）`);
if (!IS_SHARED_DIST) console.log('這是隔離目錄，沒有動到共用的 dist/。');
