// 浮層回歸守衛：司法專案不得再把 tooltip 寫回父層 absolute/group-hover。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src/pages/_constitutional-court';
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = walk(ROOT).filter((path) => /\.(jsx|tsx)$/.test(path));
const failures = [];

for (const path of files) {
  const source = readFileSync(path, 'utf8');
  if (/group-hover(?:\/[\w-]+)?:block/.test(source)) {
    failures.push(`${relative('.', path)}：禁止以 group-hover:block 顯示浮層，改用 HoverCard portal`);
  }
  if (/role=["']tooltip["']/.test(source)) {
    failures.push(`${relative('.', path)}：tooltip role 只能由共用 HoverCard 產生`);
  }
}

const hoverCard = readFileSync('src/components/lab/HoverCard.jsx', 'utf8');
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
console.log(`floating surfaces ok: ${files.length} 個司法頁檔案，統一由 HoverCard 管理內容型浮層`);
