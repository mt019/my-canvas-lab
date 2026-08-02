// 建置產物目錄的單一來源，外加一把寫共用 dist/ 時的鎖。
//
// 為什麼要有這支：碰產物的腳本有五支（vite build、prune、prerender、validate:prerender、
// sitemap），先前只有 prerender.mjs 讀 PRERENDER_DIST，其餘三支寫死 dist/。於是「把完整
// 建置跑在隔離目錄」這件事只做得到一半——prerender 讀隔離目錄、sitemap 卻寫回共用的
// dist/，兩份混在一起比不做還糟。路徑從這裡拿，就不會只改一半。
//
// 鎖的來歷是 2026-07-20 與 2026-07-27 兩次事故：兩個 build 同時跑，一邊 `vite build`
// 正在清空 dist/、另一邊的 prerender 正在往裡面寫，症狀是 ENOTEMPTY 與憑空消失的
// index.html，而症狀出現在受害者身上、不在肇事者身上，看著猜不出來。
import { closeSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT } from './site-config.mjs';

// PRERENDER_DIST：驗證用的隔離目錄（相對路徑以 repo 根目錄為準）。平常不設，就寫共用的 dist/。
export const DIST = process.env.PRERENDER_DIST
  ? resolve(ROOT, process.env.PRERENDER_DIST)
  : join(ROOT, 'dist');

// 隔離目錄是這個 session 自己的，不必跟任何人搶；只有共用的那個要排隊。
export const IS_SHARED_DIST = DIST === join(ROOT, 'dist');

const LOCK = join(ROOT, '.dist.lock');
const WAIT_MS = 15 * 60 * 1000;
const POLL_MS = 3000;

function holder() {
  try {
    return JSON.parse(readFileSync(LOCK, 'utf8'));
  } catch {
    return null;
  }
}

function alive(pid) {
  if (!Number.isInteger(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function take(label) {
  const fd = openSync(LOCK, 'wx');
  writeFileSync(fd, `${JSON.stringify({ pid: process.pid, label, since: new Date().toISOString() }, null, 2)}\n`);
  closeSync(fd);
}

// 取得共用 dist/ 的寫入權。已經有人在寫就等他，等不到就結束——不搶、不砍對方的進程
// （廣泛 pattern 殺進程是另一條踩過的雷）。對方的進程已經死了才接手。
export async function acquireDistLock(label) {
  if (!IS_SHARED_DIST) return () => {};
  const deadline = Date.now() + WAIT_MS;
  let announced = false;
  for (;;) {
    try {
      take(label);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const current = holder();
      if (!current || !alive(current.pid)) {
        console.log(`dist 鎖是死的（pid ${current?.pid ?? '?'} 已不在），接手。`);
        rmSync(LOCK, { force: true });
        continue;
      }
      if (!announced) {
        console.log(
          `另一個建置正在寫 dist/（pid ${current.pid}，${current.label ?? '未具名'}，自 ${current.since} 起），等它結束。\n`
          + `  不想等就把產物建到別處：npm run verify:full（寫 node_modules/.verify-dist）。`,
        );
        announced = true;
      }
      if (Date.now() > deadline) {
        console.error(`等了 ${WAIT_MS / 60000} 分鐘，pid ${current.pid} 還握著 dist/ 的鎖。`);
        console.error(`  它若其實已經不在了，刪掉 ${LOCK} 再跑一次。`);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const current = holder();
    if (current?.pid === process.pid) rmSync(LOCK, { force: true });
  };
  process.on('exit', release);
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      release();
      process.exit(130);
    });
  }
  return release;
}

// 給訊息用：把絕對路徑縮回 repo 相對。
export const rel = (path) => (path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path);
export const DIST_LABEL = rel(DIST);
