// 浮層寫法的固定檢查：內容型浮層一律由 HoverCard 產生，不得寫回父層 absolute/group-hover。
//
// 原本只掃 _constitutional-court；那批檔 2026-08-02 隨憲法法庭移出本倉（現役副本在
// phenom-court，那邊有同名的一支）。掃描範圍改成全站頁面與 lab 元件——HoverCard 在
// canvas 仍是現役，_chen-yinke/LiuRushiEdition、HoverCite、TermLink 都在用它。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/pages', 'src/components'];
const HOVER_CARD = 'src/components/lab/HoverCard.jsx';
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
  // HoverCard 本身就是那個唯一的產生者，它當然要寫 role="tooltip"。
  if (relative('.', path) !== HOVER_CARD && /role=["']tooltip["']/.test(source)) {
    failures.push(`${relative('.', path)}：tooltip role 只能由共用 HoverCard 產生`);
  }
}

let hoverCard;
try {
  hoverCard = readFileSync(HOVER_CARD, 'utf8');
} catch {
  // 檔案被搬走時要當成失敗；直接跳過等於下面五項行為完全沒檢查到。
  console.error(`floating surface validation failed:\n- 讀不到 ${HOVER_CARD}，改這支腳本的 HOVER_CARD 常數`);
  process.exit(1);
}
for (const [needle, label] of [
  ['createPortal(', 'portal 脫離裁切層'],
  ["document.addEventListener('pointerdown'", '點外關閉'],
  ["e.key === 'Escape'", 'Esc 關閉'],
  ['window.innerWidth - cardW - GAP', 'viewport 左右避讓'],
  ['closeActiveCard', '單次只開一張'],
]) {
  if (!hoverCard.includes(needle)) failures.push(`HoverCard 缺少核心行為：${label}`);
}

if (failures.length) {
  console.error(`floating surface validation failed:\n${failures.map((line) => `- ${line}`).join('\n')}`);
  process.exit(1);
}
console.log(`floating surfaces ok: ${files.length} 個頁面／元件檔案，內容型浮層統一由 HoverCard 管理`);
