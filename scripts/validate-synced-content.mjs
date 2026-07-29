#!/usr/bin/env node
// 檢查一：從資料倉同步過來的內容，在 canvas 這邊沒有被手改過。
// 檢查二：吃這些內容的前端檔案沒有變重。
//
//   node scripts/validate-synced-content.mjs
//
// 為什麼要有這支：內容住在各自的資料倉（notes-data 等），canvas 只負責畫。
// 這條界線壞掉的方式很固定——有人為了快，直接改 canvas 這邊的 JSON 或 .mdx，
// 下一次 sync 就把他的改動洗掉；或者把分組、排序、字數這類算得出來的東西寫進
// JSX，於是同一份邏輯在兩個倉各有一份。兩件事都是「當下沒事、以後才炸」，
// 靠自律記不住，所以做成固定檢查。
//
// 清單由資料倉的 sync 腳本產生（src/data/*.sync.json），內含每個檔的 sha256。

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'src', 'data');

// 每條線：清單檔、它負責的正文目錄、以及前端檔案的行數上限。
// 上限是「前端只負責畫」的可量化說法——真的需要更多行，那多半是有東西該搬回資料倉。
const LINES = [
  {
    name: '手記 notes',
    manifest: 'notes.sync.json',
    ownedDirs: [
      { path: 'src/content/notes', extensions: ['.mdx'] },
      { path: 'public/notes-assets', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'] },
    ],
    // 清單頁、單篇（PostRoute）、舊帖存檔頁（ArchiveRoute）、短記流（StreamRoute）
    // 與它們共用的 seo.js。`src/pages/_notes` 是整個目錄，所以那底下新增的頁自動算進來。
    frontend: ['src/pages/Notes.jsx', 'src/pages/_notes'],
    // 2026-07-29：600 → 660。短記流那一頁進來時先觸線，處理過一輪——月分節、日分段、
    // 時刻與段落切分都搬回資料倉的 build-stream.mjs（669→619 行），舊帖與短記重複寫的
    // 左欄合成 seo.js 的 postsNav()。剩下的是「多一頁」本身的成本，不是前端又在算東西。
    maxFrontendLines: 660,
  },
  {
    name: '陳寅恪研究室',
    manifest: 'chenYinke.sync.json',
    ownedDirs: [
      { path: 'src/data/chenYinke', extensions: ['.json'] },
      { path: 'public/chen-yinke/glyphs', extensions: ['.gif', '.png', '.webp'] },
    ],
    frontend: ['src/pages/ChenYinke.jsx', 'src/pages/_chen-yinke'],
    maxFrontendLines: 650,
  },
];

const sha = (s) => createHash('sha256').update(s).digest('hex');
const errors = [];
const notes = [];

function jsxFiles(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [rel];
  return readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isFile() && /\.(jsx?|tsx?)$/.test(e.name))
    .map((e) => `${rel}/${e.name}`);
}

function ownedFiles(spec) {
  const abs = join(ROOT, spec.path);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${spec.path}/${entry.name}`;
    if (entry.isDirectory()) out.push(...ownedFiles({ ...spec, path: rel }));
    else if (entry.isFile() && spec.extensions.some((extension) => entry.name.endsWith(extension))) out.push(rel);
  }
  return out;
}

for (const line of LINES) {
  const manifestPath = join(DATA_DIR, line.manifest);
  if (!existsSync(manifestPath)) {
    notes.push(`${line.name}：還沒有 ${line.manifest}——資料倉跑過一次 npm run sync 就會有。跳過內容比對。`);
  } else {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const listed = Object.keys(manifest.files);
    for (const rel of listed) {
      const abs = join(ROOT, rel);
      if (!existsSync(abs)) {
        errors.push(`${line.name}：${rel} 在清單裡但檔案不見了——重跑資料倉的 npm run sync。`);
        continue;
      }
      const actual = sha(readFileSync(abs));
      if (actual !== manifest.files[rel]) {
        errors.push(
          `${line.name}：${rel} 的內容與資料倉送來的版本不一致。`
          + `canvas 不改內容——把改動做在資料倉（${manifest.source}）再 npm run sync 過來。`,
        );
      }
    }
    // 清單沒收錄、卻躺在正文目錄裡的檔：多半是手工新增的，下次 sync 會被清掉。
    for (const spec of line.ownedDirs ?? []) {
      for (const rel of ownedFiles(spec)) {
        if (!listed.includes(rel)) {
          errors.push(`${line.name}：${rel} 不在清單裡——手工加入的內容不會留住，請改從資料倉新增再 sync。`);
        }
      }
    }
  }

  const files = line.frontend.flatMap(jsxFiles);
  const total = files.reduce((s, rel) => s + readFileSync(join(ROOT, rel), 'utf8').split('\n').length, 0);
  if (total > line.maxFrontendLines) {
    errors.push(
      `${line.name}：前端合計 ${total} 行，超過 ${line.maxFrontendLines} 行的上限（${files.join('、')}）。`
      + `分組、排序、摘要、字數這類算得出來的東西請搬回資料倉，讓 JSX 只負責畫。`,
    );
  } else {
    notes.push(`${line.name}：前端 ${total}/${line.maxFrontendLines} 行，${files.length} 個檔。`);
  }
}

for (const n of notes) console.log(`  ${n}`);
if (errors.length) {
  console.error(`\n同步內容檢查未通過（${errors.length} 項）：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('同步內容檢查通過：產物與資料倉一致，前端沒有超重。');
