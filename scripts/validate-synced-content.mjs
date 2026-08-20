#!/usr/bin/env node
// 檢查一：從資料倉同步過來的內容，在 canvas 這邊沒有被手改過。
// 檢查二：吃這些內容的前端檔案沒有變重。
// 檢查三：同步過來的資料沒有無聲縮水——每個檔的筆數對上一份基線，掉太多就擋。
//
//   node scripts/validate-synced-content.mjs             跑檢查
//   node scripts/validate-synced-content.mjs --update     資料長大之後刷新筆數基線
//
// 為什麼要有這支：內容住在各自的資料倉（phenom-notes-data 等），canvas 只負責畫。
// 這條界線壞掉的方式很固定——有人為了快，直接改 canvas 這邊的 JSON 或 .mdx，
// 下一次 sync 就把他的改動洗掉；或者把分組、排序、字數這類算得出來的東西寫進
// JSX，於是同一份邏輯在兩個倉各有一份。兩件事都是「當下沒事、以後才炸」，
// 靠自律記不住，所以做成固定檢查。
//
// 檢查一的清單由資料倉的 sync 腳本產生（src/data/*.sync.json），內含每個檔的 sha256；
// 目前只有兩條線在產，其餘十幾條線同步進來的檔沒有人看。檢查三補的就是那個缺口：
// 它不需要資料倉配合，只拿產物自己比。來歷是 2026-07-29——一支腳本的關卡比既有驗證器
// 寬，拿零筆的輸入照樣 exit 0，把上一次產好的正式清單覆寫成空的。那種故障不會報錯，
// 產物看起來也正常，只有筆數看得出來。
//
// 判準只擋縮水、不擋長大：資料每天在加，長大就自動當成新基線的候選（印一行提醒去
// --update），掉超過門檻或掉到 0 才擋。這樣它不會因為正常的內容更新天天亮紅燈。

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const COUNTS_FILE = join(ROOT, 'scripts', 'synced-data-counts.json');
const UPDATE = process.argv.includes('--update');

// 允許的縮水幅度。內容偶爾會刪掉一兩筆，10% 以內不吵；再多就是有東西壞了。
const SHRINK_TOLERANCE = 0.1;
// 這個數以下的陣列不看比例，只要掉了就報——三筆掉一筆也是 33%，比例在小數字上沒有意義。
const SMALL_ARRAY = 10;

// 每條線：清單檔、它負責的正文目錄、以及前端檔案的行數上限。
// 上限是「前端只負責畫」的可量化說法——真的需要更多行，那多半是有東西該搬回資料倉。
//
// 2026-08-20 起是空的：唯一一條（陳寅恪研究室）隨三個專題拆去 studies 倉一併移走，
// 檢查一與前端行數上限因此在本倉沒有對象。空著時收尾那句要說出這件事，不能照舊印
// 「產物與資料倉一致」——那句在沒有比對任何東西的情況下讀起來像比對過了。
const LINES = [
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

// ── 檢查三：筆數不能無聲縮水 ────────────────────────────────────────────

// 數的是「透過物件鍵走得到的每個陣列」有幾筆，鍵名當路徑（datasets.debt.rows）。
// 不鑽進陣列元素內部：那會隨資料筆數暴增，而且元素內的小陣列本來就不穩定。
function arrayCounts(value, path, out) {
  if (Array.isArray(value)) {
    out[path || '.'] = value.length;
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      arrayCounts(child, path ? `${path}.${key}` : key, out);
    }
  }
  return out;
}

function countsOf(rel) {
  return arrayCounts(JSON.parse(readFileSync(join(ROOT, rel), 'utf8')), '', {});
}

// 基線只收受版控的檔。src/data 底下有幾個是本機殘留（notes 那批已 gitignore），
// 收進來的話 CI 上就會變成「基線有、檔案不見」的假警報。
function trackedDataFiles() {
  const out = execFileSync('git', ['ls-files', 'src/data'], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n')
    .filter((rel) => rel.endsWith('.json') && !rel.endsWith('.sync.json'))
    .filter((rel) => rel.split('/').length === 3); // 只看 src/data 第一層；子目錄歸 sha 清單管
}

if (UPDATE) {
  const files = {};
  for (const rel of trackedDataFiles()) files[rel] = countsOf(rel);
  writeFileSync(
    COUNTS_FILE,
    `${JSON.stringify({ note: '同步進來的資料的筆數基線。由 npm run baseline:synced 產生。', files }, null, 2)}\n`,
  );
  const total = Object.values(files).reduce((s, c) => s + Object.keys(c).length, 0);
  console.log(`筆數基線已更新：${Object.keys(files).length} 個檔、${total} 條陣列 → ${COUNTS_FILE.slice(ROOT.length + 1)}`);
  process.exit(0);
}

if (!existsSync(COUNTS_FILE)) {
  notes.push(`還沒有筆數基線——跑一次 npm run baseline:synced 建起來（${COUNTS_FILE.slice(ROOT.length + 1)}）。`);
} else {
  const baseline = JSON.parse(readFileSync(COUNTS_FILE, 'utf8')).files;
  let grew = 0;
  for (const [rel, expected] of Object.entries(baseline)) {
    if (!existsSync(join(ROOT, rel))) {
      errors.push(`${rel} 在筆數基線裡，檔案卻不見了——sync 沒跑完，或者這條線已經搬走（搬走就重跑 npm run baseline:synced）。`);
      continue;
    }
    const actual = countsOf(rel);
    for (const [path, was] of Object.entries(expected)) {
      const now = actual[path];
      if (now === undefined) {
        errors.push(`${rel} 的 ${path} 整條不見了（基線有 ${was} 筆）——上游的結構換了或產物產壞了。`);
        continue;
      }
      if (now >= was) {
        if (now > was) grew += 1;
        continue;
      }
      const drop = (was - now) / was;
      if (now === 0 || was <= SMALL_ARRAY || drop > SHRINK_TOLERANCE) {
        errors.push(
          `${rel} 的 ${path} 從 ${was} 筆掉到 ${now} 筆（少了 ${Math.round(drop * 100)}%）。`
          + `先回資料倉確認上游真的少了這些，是真的就跑 npm run baseline:synced 把基線帶下來；`
          + `不是的話這份產物不要進版控——上游回空清單覆寫掉好產物就長這樣。`,
        );
      }
    }
  }
  const known = new Set(Object.keys(baseline));
  const fresh = trackedDataFiles().filter((rel) => !known.has(rel));
  if (fresh.length) notes.push(`筆數基線還沒收錄 ${fresh.length} 個檔（${fresh.join('、')}）——跑 npm run baseline:synced 收進來。`);
  notes.push(`筆數：${Object.keys(baseline).length} 個檔對過基線${grew ? `，其中 ${grew} 條陣列變多了（要收進基線就跑 npm run baseline:synced）` : ''}。`);
}

for (const n of notes) console.log(`  ${n}`);
if (errors.length) {
  console.error(`\n同步內容檢查未通過（${errors.length} 項）：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  LINES.length === 0
    ? '同步內容檢查通過：筆數已對過基線；本倉目前沒有任何線在做 sha 比對（LINES 是空的）。'
    : `同步內容檢查通過：${LINES.length} 條線的產物與資料倉一致，前端沒有超重，筆數已對過基線。`,
);
