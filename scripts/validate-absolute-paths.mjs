#!/usr/bin/env node
// 固定檢查：入版控的檔案裡不得出現本機的家目錄絕對路徑。
//
// 來歷（2026-07-29）：這是公開 repo，`/Users/<使用者名稱>/...` 會把本機帳號名稱與整個
// 目錄結構寫進版控。2026-07-28 那一輪把工作樹全部清乾淨了（文件改 `~/` 前綴、腳本改用
// `homedir()` 組路徑），但沒有東西擋著它再長回來——歷史裡已經有 6 個 commit 帶著它，
// 而公開 repo 的歷史事後清不乾淨（force-push 之後舊的物件在回收前仍可用 SHA 取得）。
// 所以擋在進去之前，比事後改寫歷史便宜得多。
//
// 兩條規則：
// 1. 這台機器的家目錄字面值（用 homedir() 取，所以這支腳本自己不含那個字串）。
// 2. 別台 Mac 的個人目錄樣式（Users 底下某個人的 Documents／Desktop／Downloads／Library）。
//    這兩條的字串都不以字面形式寫在本檔裡，否則這支腳本會擋到自己。
//
// 例外：憲法法庭意見書原文裡有法官自己引用的 Windows 本機路徑
// （`file:///C:/Users/Administrator/Downloads/...`）。那是判決原文，要照錄。
//
// 用法：node scripts/validate-absolute-paths.mjs

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

const HOME = homedir();
const PERSONAL_DIR = /\/Users\/[A-Za-z0-9_.-]+\/(Documents|Desktop|Downloads|Library)\b/g;

// 只掃入版控的文字檔。鎖檔與資料快照不算，前者是工具產的、後者是原文照錄。
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.otf', '.pdf', '.zip', '.mp4', '.webm']);
const SKIP_FILE = new Set(['package-lock.json']);
const SKIP_DIR = [];

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\0')
  .filter(Boolean)
  .filter((f) => !SKIP_EXT.has(path.extname(f).toLowerCase()))
  .filter((f) => !SKIP_FILE.has(path.basename(f)))
  .filter((f) => !SKIP_DIR.some((d) => f.startsWith(d)));

// 法官在意見書裡引用自己電腦上的檔案，寫成 file:///C:/Users/... 。那是原文。
const isWindowsCitation = (line, index) => /(file:\/\/\/)?[A-Za-z]:$/.test(line.slice(0, index));

const failures = [];
for (const file of tracked) {
  let text;
  try {
    text = readFileSync(path.join(ROOT, file), 'utf8');
  } catch {
    continue; // 二進位或讀不到的檔跳過
  }
  if (text.includes('\0')) continue;

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const hits = [];
    let at = line.indexOf(HOME);
    while (at !== -1) {
      if (!isWindowsCitation(line, at)) hits.push(HOME);
      at = line.indexOf(HOME, at + 1);
    }
    for (const m of line.matchAll(PERSONAL_DIR)) {
      if (!isWindowsCitation(line, m.index)) hits.push(m[0]);
    }
    for (const hit of new Set(hits)) {
      failures.push(`${file}:${i + 1} 本機絕對路徑：${hit}`);
    }
  });
}

if (failures.length) {
  console.error(
    `絕對路徑檢查失敗（${failures.length} 處）。這是公開 repo，改成 \`~/\` 前綴，` +
      `腳本用 homedir() 組路徑：\n${failures.join('\n')}`,
  );
  process.exit(1);
}
console.log(`絕對路徑檢查通過：${tracked.length} 個檔案。`);
