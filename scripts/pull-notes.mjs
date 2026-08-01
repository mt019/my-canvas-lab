// 開 dev server 之前，把手機用 iOS 捷徑發的短記抓回來。
//
// 捷徑寫的是 phenom-notes-data 的 GitHub issue，東西只存在 GitHub 那邊；本機要跑過
// `npm run stream:fetch` 才會進 raw/，再 build＋sync 才會出現在畫面上。線上不必管，
// deploy.yml 每次部署自己抓一次。少的就是本機這一趟，所以掛在 predev 上。
//
// 這支腳本只做「叫隔壁跑一次 npm run update」。抓不到、隔壁不在、gh 沒登入，
// 一律印一行就結束（exit 0）——dev server 不該因為抓不到短記就開不起來。
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const NOTES_DATA = process.env.NOTES_DATA_DIR
  ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'phenom-notes-data');

if (!existsSync(join(NOTES_DATA, 'package.json'))) {
  console.log(`短記：找不到 ${NOTES_DATA}，跳過（要換位置設 NOTES_DATA_DIR）`);
  process.exit(0);
}

console.log('短記：抓一次手機發的 issue，再同步進來⋯⋯');
const run = spawnSync('npm', ['run', 'update'], { cwd: NOTES_DATA, encoding: 'utf8' });
const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
// 只回報有意義的兩行：抓到幾則、同步了什麼。整份輸出留給直接跑 phenom-notes-data 的時候看。
for (const line of out.split('\n')) {
  if (/^(stream|sync|validate|build-stream|fetch-stream)/.test(line.trim())) console.log(`  ${line.trim()}`);
}
if (run.status !== 0) console.log('短記：這次沒同步成功，dev 照開，畫面上是上一次的內容。');
process.exit(0);
