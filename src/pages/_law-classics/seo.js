/*
 * SEO / AEO 資料，法學名著選讀・教師時序頁。純資料，App.jsx 接線、SeoHead 輸出。
 * 比照 _constitutional-court/seo.js 的做法：keywords ＋ buildSchema(JSON-LD)。
 *
 * 原則同 SeoHead：只描述頁面真的有的東西——這門課（Course）、它的開課史資料集
 * （Dataset）、真實在頁上出現的教師名（長尾關鍵字）。不捏造 FAQ、評分、更新日期。
 */

// 開課涵蓋 88–113 學年（民國）＝西元約 1999–2024。
const YEAR_FROM = 1999;

// 真實出現在頁上的教師名，當長尾關鍵字——答案引擎才接得住「某某老師 臺大 德文」這類問法。
const TEACHERS = [
  '陳妙芬', '林明昕', '王皇玉', '沈冠伶', '蔡宗珍', '林鈺雄', '周漾沂',
  '蘇慧婕', '薛智仁', '陳璋佑', '顏佑紘', '張譯文', '許恒達',
];

export const GLCT_KEYWORDS = [
  '臺大法學名著選讀',
  '德文法學名著選讀',
  '臺灣大學法律系課程',
  '法學德文',
  '法律系開課歷史',
  '歷年授課教師',
  '教師開課時序',
  ...TEACHERS,
].join('、');

export const GLCT_TITLE = '臺大法學名著選讀・歷年開課教師時序｜Phenom Canvas Lab';

export const GLCT_DESC =
  '臺大「法學名著選讀」26 個學年來誰在教、教了幾年、偏哪個法學領域——縱向時間軸攤開 20 位教師、96 個去重班次的開課紀錄，每個班次標註主要法學領域（公法/憲法、刑事法、民事法/民訴、基礎法/法史、歐盟/跨國/數位等）並直達原始課綱來源。目前收錄德文班，同一模式將擴及其他語言。';

export const glctSchema = (SITE_URL) => {
  const url = `${SITE_URL}/germanlawcoursetimeline`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      '@id': `${url}#course`,
      name: '德文法學名著選讀',
      alternateName: '法學名著選讀（德文）',
      description:
        '國立臺灣大學法律學院開設的德文法學經典研讀課程：授課教師指定德文法學教科書章節與期刊論文，課堂共同研讀、解析。歷年由多位不同專長的教師輪流開設。',
      courseCode: '40510',
      inLanguage: ['zh-Hant', 'de'],
      provider: {
        '@type': 'CollegeOrUniversity',
        name: '國立臺灣大學',
        sameAs: 'https://www.ntu.edu.tw/',
      },
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      '@id': `${url}#dataset`,
      name: '臺大法學名著選讀・歷年開課教師時序',
      description: GLCT_DESC,
      keywords: GLCT_KEYWORDS,
      temporalCoverage: `${YEAR_FROM}/..`,
      inLanguage: 'zh-Hant',
      isAccessibleForFree: true,
      creator: { '@id': `${SITE_URL}/#org` },
      url,
    },
  ];
};
