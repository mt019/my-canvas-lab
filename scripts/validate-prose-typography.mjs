import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/*
 * 正文的行高只准用 DESIGN.md 訂的那幾個值。
 *
 * 來歷（2026-08-13）：德川頁的對讀分頁行高寫 leading-[2]，導言寫 1.95，年表寫 1.8，
 * 而 DESIGN.md 訂的正文是 18px／1.85、共用的 Prose 元件也是 1.85。站主翻分頁時看得出來
 * 「這一頁不一樣」，但看不出來是哪裡不一樣——因為每一頁都只差一點點。全站掃過去，
 * 1.75、1.9、1.95、2.05 各有幾處，全是手寫時憑感覺填的。
 *
 * 這種偏移不會壞掉任何東西，所以沒有人會回報，只會一直長。判準因此要機器守：
 * 行高是設計系統的參數，不是逐頁的品味。要新增一個值，先改 DESIGN.md 與這裡的 SCALE，
 * 讓它成為全站的選項；真的只此一處的例外寫進 EXCEPTIONS 並附理由。
 *
 * 只管 leading-[數字] 這種任意值；Tailwind 的具名 leading（snug、relaxed、none）是標題與
 * 介面用的，另有分寸，不在此列。
 */
const SCALE = new Map([
  ['1.85', '正文（18px 內文、DESIGN.md 的基準）'],
  ['1.8', '次要文字與清單（14–16px）'],
  ['1.7', '程式碼與表格'],
]);

// 只此一處的例外：檔案 → 值 → 理由。
const EXCEPTIONS = [
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    return e.isDirectory() ? walk(path) : [path];
  });
}

const allowed = (file, value) =>
  SCALE.has(value) || EXCEPTIONS.some((e) => e.file === file && e.value === value);

const problems = [];
for (const file of walk('src').filter((f) => /\.(jsx?|mdx)$/.test(f))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [, value] of line.matchAll(/leading-\[([0-9.]+)\]/g)) {
      if (!allowed(file, value)) problems.push(`${file}:${i + 1} leading-[${value}]`);
    }
  });
}

if (problems.length > 0) {
  console.error('正文行高不在設計系統的級距裡：');
  for (const p of problems) console.error(`  ${p}`);
  console.error('\n可用的值：');
  for (const [v, why] of SCALE) console.error(`  leading-[${v}] — ${why}`);
  console.error('\n→ 改用上列其中一個；真的需要新的值就先改 DESIGN.md 與本檔的 SCALE，');
  console.error('  只此一處的例外寫進本檔的 EXCEPTIONS 並寫明理由。');
  process.exit(1);
}

const used = new Set();
for (const file of walk('src').filter((f) => /\.(jsx?|mdx)$/.test(f))) {
  for (const [, v] of readFileSync(file, 'utf8').matchAll(/leading-\[([0-9.]+)\]/g)) used.add(v);
}
console.log(`正文行高檢查通過：全站用到 ${used.size} 個值（${[...used].sort().join('、')}），都在級距或例外清單裡。`);
