// 字號精準檢索：把使用者打的簡寫解析成完整字號，供索引頁把命中的那一件置頂。
//
// 為什麼要有這層：搜尋框原本只對 字號 做子字串比對，打「88」會同時撈到釋字第188號、
// 第880號、院字第88號——想找哪一件反而要自己在幾十件裡挑。這裡把「明確指名一件」的
// 寫法認出來，其餘（純數字、法律關鍵字）仍走原本的子字串搜尋，兩者不互相取代。
//
// 這支檔刻意不 import 任何資料或 React：純字串進、字號陣列出，所以 scripts/check-case-query.mjs
// 可以直接在 node 裡跑它。認得的寫法有變動時，改這裡一處，頁面與檢查腳本同時跟著改。

const 全形數字 = '０１２３４５６７８９';

// 全形數字→半形、全形井號與各種破折號統一、去掉所有空白。
export function normalize(input) {
  return String(input ?? '')
    .replace(/[０-９]/g, (c) => String(全形數字.indexOf(c)))
    .replace(/＃/g, '#')
    .replace(/[—–－ー]/g, '-')
    .replace(/\s+/g, '');
}

// 回傳候選字號陣列；不是字號寫法就回空陣列。
// 候選未必存在，存不存在由 lookupCases 對照真實資料決定。
export function parseCaseNo(input) {
  let s = normalize(input);
  if (!s) return [];

  // # 是「精準字號」前綴：#88 ＝ 釋字第88號。單獨的 88 不算字號（可能是想搜條號、金額），
  // 仍走關鍵字搜尋——這也是 # 存在的理由。
  const hashed = s.startsWith('#');
  if (hashed) s = s.slice(1);
  if (!s) return [];
  if (hashed && /^\d+$/.test(s)) return [`釋字第${Number(s)}號`];

  // 111年憲判字第1號／111憲判1／111年憲裁57
  let m = s.match(/^(\d+)年?(憲判|憲裁|憲暫裁)字?第?(\d+)號?(?:判決|裁定)?$/);
  if (m) return [`${Number(m[1])}年${m[2]}字第${Number(m[3])}號`];

  // 113-1：年份-號次。只解成判決（憲判字）——「113年第1號」在講的就是判決，而同一年同一號次
  // 另有憲裁字與憲暫裁字（例如 113年憲暫裁字第1號 真的存在），一起回等於又要使用者自己挑。
  // 要那兩種就打明字別：113憲裁1、113憲暫裁1。
  m = s.match(/^(\d+)-(\d+)$/);
  if (m) return [`${Number(m[1])}年憲判字第${Number(m[2])}號`];

  // 釋字第88號／釋字88／釋88
  m = s.match(/^釋字?第?(\d+)號?(?:解釋)?$/);
  if (m) return [`釋字第${Number(m[1])}號`];

  // 行憲前四種系列。院解 與 院／解 的前綴重疊，但整條規則錨定到結尾，「院解2876」試 院 會在
  // 「解2876」對不上數字時回溯到 院解，所以四個字別排任何順序結果都一樣。
  m = s.match(/^(院解|院|統|解)字?第?(\d+)號?(?:解釋)?$/);
  if (m) return [`${m[1]}字第${Number(m[2])}號`];

  return [];
}

// 把候選字號對照真實資料，回傳存在的那幾件（維持候選順序）。
export function lookupCases(input, docByNo) {
  return parseCaseNo(input)
    .map((no) => docByNo.get(no))
    .filter(Boolean);
}
