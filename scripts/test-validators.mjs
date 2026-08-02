#!/usr/bin/env node
// 驗 verify:policy 那批 validate-*.mjs 真的會擋。
//
// 兩個方向都測：(1) 基線——什麼都不動，跑一次該是 exit 0；(2) 違規——臨時造一個
// 那支閘該擋的東西，跑一次該是非 0。只測違規會漏掉「這支閘其實永遠報錯」；只測
// 基線就是現況（等於沒驗）。
//
// 「先確認假故障不是真的已經存在」怎麼做到：這支腳本開跑第一件事就是對每個案例
// 各跑一次未經改動的基線。這批基線若全部 exit 0（下面會印出來），就等於逐一確認過
// ——本腳本接下來要造的每一種違規（禁字、bad hex、越界字元、路徑衝突、slug 對不上、
// 版本不一致……）當下都不存在，因為只要有一個已經存在，對應那支閘的基線就會先跑
// 出非 0，會在這裡被看見而不是被吞掉。
//
// 每支閘的違規做法：能用「造一個全新的臨時檔」就不去動已入版控的檔案；不得不動
// 既有檔案時（tokens.css 的色票、App.jsx 的 stub、ZhuJiahua.jsx 的連結、
// userscripts.json 的版號……），一律先讀原始位元組存起來，跑完立刻寫回去，
// try/finally 保證中途出例外也會還原。
//
// 硬邊界：不改 validate-*.mjs 的任何一行、不改 package.json、不碰
// eslint.config.js／scripts/check-brief-pages.mjs／scripts/validate-ui-copy.mjs、
// 不 git add/commit/push。全部驗完會比對 git status --porcelain 前後一致。

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const abs = (relPath) => join(ROOT, relPath);

function run(scriptRelPath) {
  const res = spawnSync('node', [scriptRelPath], { cwd: ROOT, encoding: 'utf8' });
  return { code: res.status, stderr: res.stderr ?? '', stdout: res.stdout ?? '' };
}

function gitStatus() {
  return execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
}

// 造夾具時碰過的每個路徑都登記在這裡，跑完只拿這些路徑跟開跑前對照。由造夾具的函式
// 自己登記，不靠每個案例另外宣告一次——那種宣告遲早會跟實際碰的檔案對不上。
const touchedPaths = new Set();

// 造一個全新的臨時檔。若目標路徑已經存在，代表這不是我們造的假故障——中止，不覆蓋。
function tempFile(relPath, content) {
  const target = abs(relPath);
  if (existsSync(target)) {
    throw new Error(`夾具衝突：${relPath} 已經存在，這不是我們要造的假故障，中止`);
  }
  touchedPaths.add(relPath);
  writeFileSync(target, content, 'utf8');
  return () => {
    if (existsSync(target)) rmSync(target);
  };
}

// 臨時改寫一個既有檔案。transform 拿到原始內容、回傳新內容；新內容若跟原始一樣視為
// 夾具失效（沒有真的造出差異）。還原時整份寫回讀到的原始位元組，不重新格式化。
function editedFile(relPath, transform) {
  const target = abs(relPath);
  const original = readFileSync(target, 'utf8');
  const modified = transform(original);
  if (modified === original) {
    throw new Error(`夾具失效：${relPath} 的改寫沒有造成任何差異`);
  }
  touchedPaths.add(relPath);
  writeFileSync(target, modified, 'utf8');
  return () => writeFileSync(target, original, 'utf8');
}

// ── 15 支閘的違規夾具 ──────────────────────────────────────────────────
// npmScript 只是給人看的名字（對照 package.json 的 verify:policy），實際執行走
// script 直接 node 起，不透過 npm（不吃 package.json 的改動）。

const cases = [
  {
    npmScript: 'validate:fonts',
    script: 'scripts/validate-font-coverage.mjs',
    setup: () =>
      tempFile(
        'src/components/__validator_test_fonts.jsx',
        "export const ValidatorTestFonts = '😀';\n",
      ),
  },
  {
    npmScript: 'validate:tokens',
    script: 'scripts/validate-design-tokens.mjs',
    setup: () =>
      tempFile(
        'src/components/__validator_test_tokens.jsx',
        "export const validatorTestTokens = { color: '#ff00ff' };\n",
      ),
  },
  {
    npmScript: 'validate:colors',
    script: 'scripts/validate-color-system.mjs',
    // 把 --tone-slate-tx 的 L 拉到 0（純黑），band 是 0.46–0.58，穩穩出界。
    setup: () =>
      editedFile('src/styles/tokens.css', (src) => {
        const re = /(--tone-slate-tx:\s*)#[0-9a-fA-F]{6}/;
        if (!re.test(src)) throw new Error('夾具失效：tokens.css 找不到 --tone-slate-tx');
        return src.replace(re, '$1#000000');
      }),
  },
  {
    npmScript: 'validate:floating',
    script: 'scripts/validate-floating-surfaces.mjs',
    setup: () =>
      tempFile(
        'src/components/__validator_test_floating.jsx',
        "export default function ValidatorTestFloating() {\n" +
          "  return <div className=\"hidden group-hover:block\">peek</div>;\n" +
          "}\n",
      ),
  },
  {
    npmScript: 'validate:copy',
    script: 'scripts/validate-ui-copy.mjs',
    setup: () =>
      tempFile(
        'src/components/__validator_test_copy.jsx',
        "export const validatorTestCopy = '這裡只回答一件事';\n",
      ),
  },
  {
    npmScript: 'validate:math',
    script: 'scripts/validate-math-notation.mjs',
    setup: () =>
      tempFile(
        'src/components/lab/__validator_test_math.jsx',
        "export const validatorTestSigma = 'σ';\n",
      ),
  },
  {
    npmScript: 'validate:shell',
    script: 'scripts/validate-shell-chrome.mjs',
    // 寬容器（max-w-6xl + mx-auto）手寫 px-4 sm:px-6，該走 shellPadding.js 卻沒走。
    setup: () =>
      tempFile(
        'src/components/__validator_test_shell.jsx',
        "export default function ValidatorTestShell() {\n" +
          "  return <div className=\"max-w-6xl mx-auto px-4 sm:px-6\">test</div>;\n" +
          "}\n",
      ),
  },
  {
    npmScript: 'validate:publicpaths',
    script: 'scripts/validate-public-paths.mjs',
    // public/ 第一層新增一個跟既有路由字首同名的檔案（userscripts 是現役路由）。
    setup: () => tempFile('public/userscripts', 'validator test\n'),
  },
  {
    npmScript: 'validate:abspaths',
    script: 'scripts/validate-absolute-paths.mjs',
    // 這條假故障的路徑要在跑的時候才組出來。validate:abspaths 掃的是受版控的檔，
    // 而這支腳本一進版控就被自己掃到——2026-08-02 第一次推送就被它擋下來。
    setup: () =>
      editedFile('docs/domain-migration.md', (src) =>
        `${src}\n<!-- validator test: ${['', 'Users', 'testuser', 'Documents', 'example'].join('/')} -->\n`,
      ),
  },
  {
    npmScript: 'validate:tabroutes',
    script: 'scripts/validate-tab-routes.mjs',
    // 加一個 ZhuJiahua 頁面裡的 /zhujiahua/<slug> 字面連結，該 slug 在 SEO 表裡不存在。
    setup: () =>
      editedFile('src/pages/ZhuJiahua.jsx', (src) =>
        `${src}\n// validator test literal: '/zhujiahua/__validator_bogus_slug'\n`,
      ),
  },
  {
    npmScript: 'validate:extcards',
    script: 'scripts/validate-external-cards.mjs',
    // 拿掉 Notes 的 stub route 條目，讓 PAGE_META.Notes 的 externalUrl 找不到對應的卡片路由。
    setup: () =>
      editedFile('src/App.jsx', (src) => {
        const re = /\{\s*name:\s*'Notes',\s*path:\s*'\/notes',\s*component:\s*null,\s*meta:\s*PAGE_META\.Notes,\s*\},/;
        if (!re.test(src)) throw new Error('夾具失效：App.jsx 找不到 Notes 的 stub route 條目');
        return src.replace(re, '');
      }),
  },
  {
    npmScript: 'validate:cachehdrs',
    script: 'scripts/validate-vercel-cache-headers.mjs',
    // 把死設定（頂層 headers）加回去。這正是 2026-08-02 掛了一整天沒人發現的那個長相：
    // 設定看起來完全正確，部署不報錯，線上量起來沒生效。
    setup: () =>
      editedFile('vercel.json', (src) => {
        const config = JSON.parse(src);
        config.headers = [
          { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
        ];
        return `${JSON.stringify(config, null, 2)}\n`;
      }),
  },
  {
    npmScript: 'validate:cccutover',
    script: 'scripts/validate-constitutional-court-cutover.mjs',
    // 憲法法庭已徹底搬離本倉；讓其中一個「不得存在」的檔案重新出現。
    setup: () => tempFile('src/data/typologyReport.md', '# validator test\n'),
  },
  {
    npmScript: 'validate:notescutover',
    script: 'scripts/validate-notes-cutover.mjs',
    // Notes 頁面已搬離本倉；讓它的檔案重新出現。
    setup: () =>
      tempFile(
        'src/pages/Notes.jsx',
        "export default function Notes() { return null; }\n",
      ),
  },
  {
    npmScript: 'validate:userscripts',
    script: 'scripts/validate-userscripts.mjs',
    // 把第一支腳本在 userscripts.json 裡的版號改掉，跟 public/scripts/ 那份 .user.js
    // 的 @version 對不上。
    setup: () =>
      editedFile('src/data/userscripts.json', (src) => {
        const data = JSON.parse(src);
        if (!data.scripts?.[0]) throw new Error('夾具失效：userscripts.json 沒有 scripts[0]');
        data.scripts[0].version = '9.9.9-validator-test';
        return JSON.stringify(data, null, 2) + '\n';
      }),
  },
  {
    npmScript: 'validate:synced',
    script: 'scripts/validate-synced-content.mjs',
    // 陳寅恪資料的其中一個檔案改一個位元組，讓 sha256 跟 chenYinke.sync.json 記錄的對不上。
    setup: () => editedFile('src/data/chenYinke.json', (src) => `${src} `),
  },
  {
    npmScript: 'validate:synced',
    label: 'validate:synced（筆數）',
    script: 'scripts/validate-synced-content.mjs',
    // 同一支閘的第二種故障：同步進來的資料無聲縮水。把一個陣列砍掉一半，模擬上游
    // 回了空清單或半份清單、把好產物覆寫掉（2026-07-29 那次的長相）。sha 那個夾具
    // 抓不到這種——它改的是內容，這裡少的是筆數。
    setup: () =>
      editedFile('src/data/iiasPublications.json', (src) => {
        const data = JSON.parse(src);
        if (!Array.isArray(data.publications) || data.publications.length < 20) {
          throw new Error('夾具失效：iiasPublications.json 沒有夠長的 publications 陣列');
        }
        data.publications = data.publications.slice(0, Math.floor(data.publications.length / 2));
        return `${JSON.stringify(data, null, 2)}\n`;
      }),
  },
];

// ── 執行 ────────────────────────────────────────────────────────────────

// 先確認這份清單跟 verify:policy 是同一批。新加一支閘卻沒有配測試案例，是這支腳本
// 最容易的失效方式：它照樣印一排 ✓，而新的那支從沒被驗過。2026-08-02 就發生過一次
// ——verify:policy 在同一天從 14 支變成 15 支（多了 validate:extcards）。
const policy = JSON.parse(readFileSync(abs('package.json'), 'utf8')).scripts['verify:policy'];
const inPolicy = policy
  .split('&&')
  .map((s) => s.trim().replace(/^npm run /, ''))
  .filter((s) => s.startsWith('validate:'));
const covered = new Set(cases.map((c) => c.npmScript));
const missing = inPolicy.filter((s) => !covered.has(s));
const stale = [...covered].filter((s) => !inPolicy.includes(s));
if (missing.length || stale.length) {
  console.error('這份清單跟 package.json 的 verify:policy 對不上：');
  if (missing.length) console.error(`  verify:policy 有、這裡沒有：${missing.join('、')}`);
  if (stale.length) console.error(`  這裡有、verify:policy 已經沒有：${stale.join('、')}`);
  console.error('補上對應的違規夾具（或刪掉多餘的案例）之後再跑。');
  process.exit(1);
}

const beforeStatus = gitStatus();

console.log(`${covered.size} 支閘、${cases.length} 個案例，與 verify:policy 逐一對上，跑基線＋違規：\n`);

let anyUnexpected = false;
const results = [];

for (const c of cases) {
  const base = run(c.script);
  const baseOk = base.code === 0;

  let teardown = null;
  let viol = null;
  let setupError = null;
  try {
    teardown = c.setup();
    viol = run(c.script);
  } catch (err) {
    setupError = err.message;
  } finally {
    if (teardown) {
      try {
        teardown();
      } catch (err) {
        console.error(`還原失敗：${c.npmScript} — ${err.message}`);
        anyUnexpected = true;
      }
    }
  }

  const violOk = viol ? viol.code !== 0 : false;
  const ok = baseOk && violOk && !setupError;
  if (!ok) anyUnexpected = true;

  const baseMark = baseOk ? '✓' : '✗';
  const violMark = setupError ? '（夾具失敗）' : violOk ? '✓' : '✗';
  const violCodeStr = viol ? viol.code : 'n/a';

  console.log(
    `${(c.label ?? c.npmScript).padEnd(26)} 基線 exit ${base.code} ${baseMark}   `
    + `違規 exit ${violCodeStr} ${violMark}`,
  );
  if (setupError) {
    console.log(`  → 夾具本身出錯：${setupError}`);
  } else if (!violOk) {
    console.log('  → 造了違規，這支閘仍然 exit 0：沒有擋下來！');
    if (viol.stderr) console.log(`  stderr: ${viol.stderr.split('\n').slice(0, 5).join('\n  ')}`);
  } else if (!baseOk) {
    console.log('  → 沒動任何東西，這支閘卻已經是非 0（基線本身就紅）：');
    if (base.stderr) console.log(`  stderr: ${base.stderr.split('\n').slice(0, 5).join('\n  ')}`);
  }

  results.push({ ...c, baseOk, violOk, setupError, violCode: viol?.code ?? null });
}

const uncovered = [];
console.log(`\n未涵蓋：${uncovered.length === 0 ? `無——${covered.size} 支閘全部有雙向測試案例` : ''}`);
for (const u of uncovered) console.log(`  - ${u.name}：${u.reason}`);

// ── 安全帶：跑完後工作樹要跟開跑前一模一樣 ──────────────────────────────

// 只比對本腳本碰過的路徑。這個倉經常有第二個 session 同時在改別的檔（2026-08-02 實測，
// 45 秒內工作樹就變了一次），拿整份 git status 前後相比會因為別人的改動而誤報，
// 而一個會為了別人的原因亮紅燈的檢查，用兩次就沒人看了。
const linesFor = (status) => status
  .split('\n')
  .filter((line) => [...touchedPaths].some((p) => line.includes(p)))
  .sort()
  .join('\n');

const afterStatus = gitStatus();
if (linesFor(afterStatus) !== linesFor(beforeStatus)) {
  console.error('\n本腳本碰過的檔案，跑完跟開跑前不一致，還原沒有做乾淨：');
  console.error('--- 開跑前 ---');
  console.error(linesFor(beforeStatus) || '（這些路徑當時都是乾淨的）');
  console.error('--- 跑完後 ---');
  console.error(linesFor(afterStatus) || '（乾淨）');
  console.error(`\n受監看的路徑：${[...touchedPaths].join('、')}`);
  process.exit(1);
}

if (anyUnexpected) {
  console.error('\n有至少一支閘沒有通過雙向驗證，見上面的細節。');
  process.exit(1);
}

console.log(`\n全部通過：${results.length} 支閘的基線與違規測試都符合預期，git status 前後一致。`);
