// 浮層寫法的固定檢查：內容型浮層一律由 portal 產生，不得寫回父層 absolute/group-hover，
// 也不得自己寫 tooltip role。
//
// 2026-08-27 起本倉一個產生者都沒有：註解叢集（AnnotatedHtml、HoverCard、HoverCite、
// TermLink、SourcesList、textNotes、useFloatingCard）沒有 src/components/lab/ 以外的
// 引用，dist 的 HTML 也沒有一頁帶那幾個 class，整組已刪。現役的那份在 @phenomcanvas/ui，
// 產生者的核心行為（portal、點外關閉、Esc 關閉、視窗避讓、單次只開一張）由那個倉的
// scripts/lib/floating-surfaces.mjs 逐項驗。本倉這一支只驗自己的頁面沒有把浮層寫回去。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/pages', 'src/components'];
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = ROOTS.flatMap(walk).filter((path) => /\.(jsx|tsx)$/.test(path));
const failures = [];

for (const path of files) {
  const source = readFileSync(path, 'utf8');
  const rel = relative('.', path);
  if (/group-hover(?:\/[\w-]+)?:block/.test(source)) {
    failures.push(`${rel}：禁止以 group-hover:block 顯示浮層，改用共用包的 HoverCard portal`);
  }
  if (/role=["']tooltip["']/.test(source)) {
    failures.push(`${rel}：tooltip role 只能由 @phenomcanvas/ui 的 HoverCard／AnnotatedHtml 產生`);
  }
}

// 一個檔案都沒讀到時要當成失敗，否則掃描根改名之後這支會是空跑的綠燈。
if (files.length === 0) {
  console.error(`浮層檢查一個檔案都沒讀到（掃描根 ${ROOTS.join('、')}），檢查沒有實際執行。`);
  process.exit(1);
}
if (failures.length) {
  console.error(`floating surface validation failed:\n${failures.map((line) => `- ${line}`).join('\n')}`);
  process.exit(1);
}
console.log(`floating surfaces ok: ${files.length} 個頁面／元件檔案，本倉不自產內容型浮層`);
