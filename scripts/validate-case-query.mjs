// 字號精準檢索的固定檢查：每個認得的寫法都要解析成正確字號，且真的在庫裡對得到一件。
// 認定規則的單一入口是 src/pages/_constitutional-court/caseQuery.js；這支腳本直接跑它，
// 改壞任一條寫法，build 當場失敗而不是等使用者搜不到才發現。
//
// 跑法：npm run validate:cases（已掛進 npm run build）
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCaseNo } from '../src/pages/_constitutional-court/caseQuery.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = JSON.parse(readFileSync(join(root, 'src/data/constitutionalCourt.json'), 'utf8')).文件;
const docByNo = new Map(docs.map((d) => [d.字號, d]));

// [使用者打的字, 期望解析出且庫裡存在的字號]
const 應命中 = [
  ['#88', '釋字第88號'],
  ['＃８８', '釋字第88號'],      // 全形井號與全形數字
  ['#113-1', '113年憲判字第1號'],
  ['113-1', '113年憲判字第1號'],
  ['113—1', '113年憲判字第1號'], // 破折號當減號打
  ['釋88', '釋字第88號'],
  ['釋字88', '釋字第88號'],
  ['釋字第88號', '釋字第88號'],
  ['釋字第 88 號解釋', '釋字第88號'],
  ['111憲判1', '111年憲判字第1號'],
  ['111年憲判字第1號', '111年憲判字第1號'],
  ['111年憲判字第1號判決', '111年憲判字第1號'],
  ['111憲裁57', '111年憲裁字第57號'],
  ['111憲暫裁1', '111年憲暫裁字第1號'],
  ['院88', '院字第88號'],
  ['院字第88號', '院字第88號'],
  ['院解2876', '院解字第2876號'],  // 院解 與 院 前綴重疊，這條咬的是它不會被解成院字第2876號
  ['統1000', '統字第1000號'],
  ['解1', '解字第1號'],
];

// 不該被當成字號的寫法（要留給原本的關鍵字搜尋，或本來就不存在）
const 不應命中 = [
  ['88', '純數字沒指名字號，可能是想搜條號或金額'],
  ['比例原則', '法律關鍵字'],
  ['', '空字串'],
  ['釋字第99999號', '寫法對但庫裡沒有這件'],
  ['#99999', '同上'],
];

let 失敗 = 0;
for (const [輸入, 期望] of 應命中) {
  const 命中 = parseCaseNo(輸入).map((no) => docByNo.get(no)).filter(Boolean);
  if (命中.length !== 1 || 命中[0].字號 !== 期望) {
    失敗 += 1;
    console.error(`✗ 「${輸入}」應命中 ${期望}，實得 ${JSON.stringify(命中.map((d) => d.字號))}（候選 ${JSON.stringify(parseCaseNo(輸入))}）`);
  }
}
for (const [輸入, 理由] of 不應命中) {
  const 命中 = parseCaseNo(輸入).map((no) => docByNo.get(no)).filter(Boolean);
  if (命中.length) {
    失敗 += 1;
    console.error(`✗ 「${輸入}」不應命中任何字號（${理由}），實得 ${JSON.stringify(命中.map((d) => d.字號))}`);
  }
}

// 精準的意義在於「只給一件」：確認簡寫不會順帶撈到號次相近的件。
for (const [輸入] of [['#88'], ['釋88']]) {
  const 命中 = parseCaseNo(輸入).map((no) => docByNo.get(no)).filter(Boolean);
  if (命中.some((d) => d.字號 !== '釋字第88號')) {
    失敗 += 1;
    console.error(`✗ 「${輸入}」撈到了不該有的件：${JSON.stringify(命中.map((d) => d.字號))}`);
  }
}

if (失敗) {
  console.error(`\n字號檢索檢查失敗 ${失敗} 項。`);
  process.exit(1);
}
console.log(`字號檢索檢查通過：${應命中.length} 個寫法命中正確、${不應命中.length} 個非字號正確略過（母體 ${docs.length} 件）。`);
