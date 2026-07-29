#!/usr/bin/env node
// 固定檢查：憲法法庭快照的取用入口只有一個。
//
// 快照 constitutionalCourt.json 的重複欄位是查表編碼的（資料倉 build-app-json.mjs 產
// 編碼表，前端 _constitutional-court/decode.js 還原）。直接 import 原始 JSON 的頁面
// 會拿到數字索引而非物件——渲染不會報錯，畫面上就是一堆 875、86 這種數字，或者
// `d.職權分類?.主類` 一律 undefined、篩選靜默全空。這支腳本擋兩件事：
//
// 1. src/ 底下除了 dataset.js，任何檔案不得直接 import constitutionalCourt.json。
// 2. 解碼真的能還原：對當前快照跑 decodeDataset，抽驗編碼欄位已變回物件。
//
// 跑法：npm run validate:ccdataset（已掛進 verify:policy）
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeDataset } from '../src/pages/_constitutional-court/decode.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const ENTRY = join(SRC, 'pages', '_constitutional-court', 'dataset.js');

const failures = [];

// 1. 唯一入口：src/ 全樹掃 import 語句（含動態 import），dataset.js 以外命中即失敗。
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
};
for (const file of walk(SRC)) {
  if (file === ENTRY) continue;
  const text = readFileSync(file, 'utf8');
  if (/import[^;]*['"][^'"]*data\/constitutionalCourt\.json['"]/.test(text)) {
    failures.push(`${relative(ROOT, file)} 直接 import 原始快照，改走 _constitutional-court/dataset.js`);
  }
}

// 2. 解碼抽驗：編碼表列出的每個欄位，解碼後第一筆有值的文件該欄要是物件／字串，不能還是數字。
const raw = JSON.parse(readFileSync(join(SRC, 'data', 'constitutionalCourt.json'), 'utf8'));
const encodedFields = Object.keys(raw.編碼表 ?? {});
const data = decodeDataset(raw);
for (const k of encodedFields) {
  const doc = data.文件.find((d) => d[k] !== undefined);
  if (doc && typeof doc[k] === 'number') {
    failures.push(`欄位 ${k} 解碼後仍是數字索引（decode.js 與資料倉的編碼規則分岔了）`);
  }
}
if (data.編碼表) failures.push('解碼後 編碼表 沒有移除，decodeDataset 不冪等');

if (failures.length) {
  console.error('憲法法庭快照入口檢查未通過：');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`憲法法庭快照入口檢查通過：src 內唯一入口 dataset.js；編碼欄位 ${encodedFields.join('、') || '（無）'} 解碼正常。`);
