// 全站文字的字元抽取——rebuild-font-subsets.mjs 與 validate-font-coverage.mjs 共用，
// 兩邊必須用同一份規則，否則會出現「驗證綠燈但實際缺字」的假象（2026-07-07 教訓：
// 舊正則只留 Han/Letter/Number，全形標點（）–，：全被濾掉，子集缺字而驗證照樣通過）。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export function extractChars() {
  const textFiles = ['index.html', 'README.md', 'TODO.md', 'HANDOFF.md', ...walk('src')].filter(Boolean);
  const text = textFiles
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

  // 文字、數字之外，標點（\p{P}：含全形（）、–、，、：、・、…）與符號（\p{S}：×、→ 等）
  // 一律納入，否則落到系統字。控制字元與一般半形空白除外；全形空白 U+3000 保留。
  const chars = [...new Set([...text])].filter((char) => {
    const code = char.codePointAt(0);
    if (code < 0x21) return false;
    return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Letter}\p{Number}\p{P}\p{S}]/u.test(char) || code === 0x3000;
  });
  const cjkChars = chars.filter((char) => {
    const code = char.codePointAt(0);
    return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(char)
      || (code >= 0x3000 && code <= 0x303f) || (code >= 0xff00 && code <= 0xffef); // CJK 標點與全形區
  });
  return { chars, cjkChars };
}
