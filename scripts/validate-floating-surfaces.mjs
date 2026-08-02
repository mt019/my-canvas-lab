// 浮層寫法的固定檢查：內容型浮層一律由 HoverCard 產生，不得寫回父層 absolute/group-hover。
//
// 原本只掃 _constitutional-court；那批檔 2026-08-02 隨憲法法庭移出本倉（現役副本在
// phenom-court，那邊有同名的一支）。掃描範圍改成全站頁面與 lab 元件——HoverCard 在
// canvas 仍是現役，_chen-yinke/LiuRushiEdition、HoverCite、TermLink 都在用它。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/pages', 'src/components'];
const HOVER_CARD = 'src/components/lab/HoverCard.jsx';
// AnnotatedHtml 是第二個獲准的產生者：它的註標在 dangerouslySetInnerHTML 進來的 HTML 裡，
// 只能事件委派＋自己開 portal，包不進 HoverCard 的子元件寫法。所以它不走白名單放行，
// 而是照 HoverCard 的規格逐項驗核心行為（見下方 PRODUCERS）。定位與避讓在共用的
// useFloatingCard.js，那支的 viewport 夾擠另外驗。
const ANNOTATED_HTML = 'src/components/lab/AnnotatedHtml.jsx';
const FLOATING_HOOK = 'src/components/lab/useFloatingCard.js';
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = ROOTS.flatMap(walk).filter((path) => /\.(jsx|tsx)$/.test(path));
const failures = [];

for (const path of files) {
  const source = readFileSync(path, 'utf8');
  if (/group-hover(?:\/[\w-]+)?:block/.test(source)) {
    failures.push(`${relative('.', path)}：禁止以 group-hover:block 顯示浮層，改用 HoverCard portal`);
  }
  // 產生者以外的檔案一律不得自己寫 tooltip role。
  const rel = relative('.', path);
  if (rel !== HOVER_CARD && rel !== ANNOTATED_HTML && /role=["']tooltip["']/.test(source)) {
    failures.push(`${rel}：tooltip role 只能由共用 HoverCard／AnnotatedHtml 產生`);
  }
}

// 每個獲准的產生者都要具備同一組核心行為；獲准不等於免檢。
const PRODUCERS = [
  [HOVER_CARD, [
    ['createPortal(', 'portal 脫離裁切層'],
    ["document.addEventListener('pointerdown'", '點外關閉'],
    ["e.key === 'Escape'", 'Esc 關閉'],
    ['window.innerWidth - cardW - GAP', 'viewport 左右避讓'],
    ['closeActiveCard', '單次只開一張'],
  ]],
  [ANNOTATED_HTML, [
    ['createPortal(', 'portal 脫離裁切層'],
    ["document.addEventListener('pointerdown'", '點外關閉'],
    ["event.key === 'Escape'", 'Esc 關閉'],
    ['useFloatingCard(', '定位交給共用 useFloatingCard'],
    ['const [active, setActive]', '單一 active 狀態，單次只開一張'],
  ]],
  [FLOATING_HOOK, [
    ['window.innerWidth - cardW - CARD_GAP', 'viewport 左右避讓'],
  ]],
];
for (const [file, needles] of PRODUCERS) {
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    // 檔案被搬走時要當成失敗；直接跳過等於底下的行為完全沒檢查到。
    failures.push(`讀不到 ${file}，改這支腳本的產生者清單`);
    continue;
  }
  for (const [needle, label] of needles) {
    if (!source.includes(needle)) failures.push(`${file} 缺少核心行為：${label}`);
  }
}

if (failures.length) {
  console.error(`floating surface validation failed:\n${failures.map((line) => `- ${line}`).join('\n')}`);
  process.exit(1);
}
console.log(`floating surfaces ok: ${files.length} 個頁面／元件檔案，內容型浮層統一由 HoverCard 管理`);
