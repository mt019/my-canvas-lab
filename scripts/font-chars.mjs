// 全站文字的字元抽取——validate-font-coverage.mjs 與 rebuild-font-subsets.mjs 共用，
// 兩邊必須用同一份規則，否則會出現「驗證綠燈但實際缺字」的假象（2026-07-07 教訓：
// 舊正則只留 Han/Letter/Number，全形標點（）–，：全被濾掉，子集缺字而驗證照樣通過）。
//
// 只掃「會 render 給讀者看的檔」：index.html 與 src/。**不掃 HANDOFF.md／README.md／
// TODO.md，也不特別處理註解**——那些字不會出現在畫面上，卻曾經逼字型子集重建（2026-07-18
// 教訓：marks.js 註解裡一個「垃圾」讓整個 build 想重建子集）。內文字型現在是固定全覆蓋
// （見 rebuild-font-subsets.mjs），所以就算註解帶進常用漢字也早就在子集裡；這裡收窄只是
// 讓「真的缺字」的驗證不被非畫面文字誤觸。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as fontkit from 'fontkit';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export function extractChars() {
  const textFiles = ['index.html', ...walk('src')].filter(Boolean);
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

// 內文字型（Huiwen）的固定全覆蓋目標：常用 BMP 的標點、符號、假名、CJK 統一漢字等區段。
// 「全覆蓋」= 取來源字型在這些區段裡實際畫得出來的每一個碼位，一次子集、之後不再隨網站
// 文字變動而重建。刻意不含 Plane-2（CJK 擴充 B 以上）等生僻區——那些交給 Chiron 動態補字。
const COVERAGE_RANGES = [
  [0x0020, 0x00ff], [0x0100, 0x024f], // Latin 基本＋補充＋擴充 A
  [0x0370, 0x03ff], // 希臘字母（Σ、Δ 等，數學/統計正文用）
  [0x2000, 0x209f], [0x20a0, 0x20cf], // 一般標點、上下標、貨幣
  [0x2100, 0x214f], [0x2150, 0x218f], [0x2190, 0x21ff], // letterlike、數字形式、箭頭
  [0x2200, 0x22ff], [0x2300, 0x23ff], // 數學運算子、雜項技術符號
  [0x2460, 0x24ff], // 圈圍字母數字（①②③、⑴…）
  [0x2500, 0x257f], [0x2580, 0x259f], [0x25a0, 0x25ff], // 制表、方塊、幾何圖形（◉○■□◆）
  [0x2600, 0x26ff], [0x2700, 0x27bf], // 雜項符號（⚠）、裝飾符號
  [0x2e00, 0x2e7f], // 補充標點
  [0x3000, 0x303f], [0x3040, 0x30ff], // CJK 標點、假名
  [0x3100, 0x312f], [0x31a0, 0x31bf], // 注音符號（ㄅㄆㄇ）
  [0x3190, 0x319f], [0x3200, 0x32ff], // 漢文訓讀、圈圍 CJK（㈱、㊙）
  [0x3400, 0x4dbf], // CJK 擴充 A
  [0x4e00, 0x9fff], // CJK 統一漢字（主體）
  [0xf900, 0xfaff], // CJK 相容漢字
  [0xfe10, 0xfe4f], [0xfe50, 0xfe6f], // 直排／相容形式、小形變體
  [0xff00, 0xffef], // 半形與全形
];

// 來源字型在 COVERAGE_RANGES 裡實際有字的碼位（字串陣列）。ttc 取第一個 face。
export function comprehensiveChars(sourcePath, fontNumber = 0) {
  let font = fontkit.openSync(sourcePath);
  if (font.fonts) font = font.fonts[fontNumber];
  const out = [];
  for (const [lo, hi] of COVERAGE_RANGES) {
    for (let cp = lo; cp <= hi; cp++) {
      if (font.hasGlyphForCodePoint(cp)) out.push(String.fromCodePoint(cp));
    }
  }
  return out;
}
