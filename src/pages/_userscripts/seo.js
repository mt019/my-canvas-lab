/*
 * SEO / AEO 資料，使用者腳本區（總覽頁＋三支腳本各一頁）。純資料，App.jsx 接線、
 * SeoHead 輸出。比照 _law-classics/seo.js。
 *
 * 原則同 SeoHead：只描述頁面真的有的東西。schema 的每個欄位都對得上 userscripts.json
 * 裡的事實——版號、@match、原始碼位置、授權——不捏造評分、下載數、更新日期。
 *
 * 關鍵字放的是頁上真的出現的長尾詞：目標網站的正式名稱（全國法規資料庫、司法院裁判書
 * 系統）、腳本管理器名稱、以及使用者實際會打的問法（「法規 項次 複製」這類）。
 */
import data from '../../data/userscripts.json';

const byId = Object.fromEntries(data.scripts.map((s) => [s.id, s]));

const common = ['使用者腳本', 'userscript', 'Tampermonkey', 'Violentmonkey', '瀏覽器腳本'];

export const USERSCRIPTS_TITLE = '使用者腳本——法規項次、社群展開、裁判書一鍵查詢｜Phenom Canvas Lab';

export const USERSCRIPTS_DESC =
  '三支自己寫來自己用的瀏覽器使用者腳本，都是 MIT 授權、原始碼公開：全國法規資料庫的條文項次改成可複製的文字（法規條文項次顯示器）、LinkedIn 與 Facebook 動態的「查看更多」自動展開（社群貼文自動展開）、選字按快捷鍵直接開司法院裁判書系統並送出查詢（裁判書一鍵查詢）。每支都列出它會在哪些網址執行、要哪些腳本管理器權限。';

export const USERSCRIPTS_KEYWORDS = [
  ...common,
  '全國法規資料庫',
  '司法院裁判書系統',
  '法規條文項次',
  '法條項次複製',
  'LinkedIn 查看更多',
  'Facebook 展開全文',
  '裁判書快捷鍵查詢',
  'Tampermonkey 腳本推薦',
].join('、');

// 每支腳本一組。title 鎖「腳本名＋目標網站」，description 塞得下版號與 @match 涵蓋範圍。
const PER_SCRIPT = {
  'law-item-labeler': {
    title: '法規條文項次顯示器——全國法規資料庫「第 X 項」可複製｜Phenom Canvas Lab',
    description:
      '全國法規資料庫的項次號碼是 CSS ::before 畫的，選取複製帶不走。這支使用者腳本改用真正的文字元素把「第 X 項」插進條文原位置，複製得到也搜尋得到，排版與對齊不動，右上角可隨時關掉。只在 LawAll.aspx 與 LawSingle.aspx 兩種頁面執行，不宣告任何 GM_* 權限。MIT 授權，原始碼公開。',
    keywords: [
      ...common,
      '全國法規資料庫',
      '法規條文項次',
      '第X項',
      '法條項次複製',
      '法條複製沒有項次',
      'law.moj.gov.tw',
      '法規資料庫 項次 顯示',
    ].join('、'),
  },
  'social-auto-expand': {
    title: '社群貼文自動展開——LinkedIn 與 Facebook 的「查看更多」自動按掉｜Phenom Canvas Lab',
    description:
      '把 LinkedIn 與 Facebook 動態裡摺起來的長貼文自動展開的使用者腳本：認得 see more、show more、查看更多、顯示更多、展開全文等中英文寫法，LinkedIn 另有背景預載（Facebook 的預載關掉，因為那個站對程式化捲動會抖）。只在五個社群網址執行，不宣告任何 GM_* 權限。MIT 授權，原始碼公開。',
    keywords: [
      ...common,
      'LinkedIn 查看更多',
      'LinkedIn see more 自動展開',
      'Facebook 展開全文',
      'Facebook 顯示更多',
      '社群動態自動展開',
      '貼文摺疊',
      'LinkedIn 動態預載',
    ].join('、'),
  },
  fjud: {
    title: '裁判書一鍵查詢——選字按快捷鍵直接查司法院裁判書系統｜Phenom Canvas Lab',
    description:
      '在任何網頁選中一段文字，按 Cmd + Shift + P（Windows 與 Linux 是 Ctrl + Shift + P），新分頁直接開在司法院裁判書系統並且已經送出查詢。選中的文字透過腳本管理器的儲存空間在分頁間傳遞。@match 涵蓋所有網站是為了在任何頁面監聽快捷鍵，腳本在那些頁面上只註冊鍵盤監聽器。MIT 授權，原始碼公開。',
    keywords: [
      ...common,
      '司法院裁判書系統',
      '裁判書查詢',
      'FJUD',
      'judgment.judicial.gov.tw',
      '裁判書快捷鍵',
      '選字查判決',
      '判決字號查詢',
    ].join('、'),
  },
};

export const scriptSeo = (id) => PER_SCRIPT[id];

// 總覽頁：一份 ItemList，對得上畫面上那三個連結；每支腳本一個 SoftwareApplication node，
// 由 @id 指回它自己的落地頁，答案引擎才把「這一支」解析成一個實體而不是三行文字。
export const userscriptsSchema = (SITE_URL) => {
  const hub = `${SITE_URL}/userscripts`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${hub}#collection`,
      name: '使用者腳本',
      description: USERSCRIPTS_DESC,
      inLanguage: 'zh-Hant',
      url: hub,
      creator: { '@id': `${SITE_URL}/#org` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: data.scripts.length,
        itemListElement: data.scripts.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: s.name,
          url: `${SITE_URL}/userscripts/${s.id}`,
        })),
      },
    },
    ...data.scripts.map((s) => softwareNode(SITE_URL, s)),
  ];
};

// 單支腳本頁：同一個 node，加上它自己是這一頁的主體。
export const scriptSchema = (id) => (SITE_URL) => [softwareNode(SITE_URL, byId[id], true)];

function softwareNode(SITE_URL, s, primary = false) {
  const url = `${SITE_URL}/userscripts/${s.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${url}#app`,
    name: s.name,
    alternateName: s.latin,
    description: primary ? PER_SCRIPT[s.id].description : s.summary,
    applicationCategory: 'BrowserApplication',
    applicationSubCategory: 'Userscript',
    // 使用者腳本沒有自己的安裝程序，執行環境是腳本管理器擴充套件。
    operatingSystem: 'Tampermonkey / Violentmonkey',
    softwareVersion: s.version,
    downloadUrl: `${SITE_URL}/scripts/${s.file}`,
    installUrl: `${SITE_URL}/scripts/${s.file}`,
    codeRepository: s.repo,
    license: 'https://opensource.org/licenses/MIT',
    inLanguage: 'zh-Hant',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
    author: { '@id': `${SITE_URL}/#org` },
    url,
  };
}
