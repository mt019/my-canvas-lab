import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const extensions = new Set(['.jsx', '.tsx']);
const forbidden = [
  ['假對話式導覽', /這裡只回答一件事/g],
  ['糾正式導覽', /不用翻[^。\n]*[。]/g],
  ['危機式導覽', /別被[^。\n]*藏住/g],
  ['產品格言', /有缺口就講出來/g],
  ['產品格言', /看起來完整的清單/g],
  ['空泛強調', /真正選中的東西/g],
  ['空泛強調', /真正重要的是/g],
  ['無具體資訊的保證', /可以放心[。！]?/g],
];

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesIn(file);
    return extensions.has(path.extname(entry.name)) ? [file] : [];
  });
}

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const failures = [];
for (const file of filesIn(root)) {
  const source = withoutComments(fs.readFileSync(file, 'utf8'));
  for (const [label, pattern] of forbidden) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      failures.push(`${path.relative(process.cwd(), file)}:${line} ${label}：${match[0]}`);
    }
  }
}

if (failures.length) {
  console.error(`介面文案檢查失敗：\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`介面文案檢查通過：${filesIn(root).length} 個前端檔案。`);
