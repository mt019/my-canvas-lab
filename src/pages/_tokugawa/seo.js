// /tokugawa 的 per-page SEO（純資料，接進 App.jsx 的 PAGE_META；基建見 SeoHead）。
// 內容全部對得上頁面真實有的東西：六分頁、時代帶範圍、年表起訖、作者節。

export const TOKUGAWA_TITLE = '德川日本：分期、身分秩序、イエ與宗族的對照｜Phenom Canvas Lab';

export const TOKUGAWA_DESC =
  '德川日本（江戶時代，1603–1867）的背景整理：六軌時代帶對照日本、琉球、台灣、中國、朝鮮與歐洲（1350–1950）；政治與對外年表從 1467 年應仁之亂到 1945 年；武士身分秩序、イエ與宗族的對照；附假名讀音與羅馬字的術語表、背景問答十二題，以及作者渡邊浩（日本政治思想史，東京大學名譽教授）的履歷與著書。';

export const TOKUGAWA_KEYWORDS =
  '德川日本、江戶時代、德川幕府、幕藩體制、武士、身分制、イエ、家制度、宗族、鎖國、出島、參勤交代、明治維新、渡邊浩、日本近世史、日本政治思想史';

export const tokugawaSchema = (SITE_URL) => [
  {
    '@type': 'Article',
    '@id': `${SITE_URL}/tokugawa#article`,
    headline: '德川日本：分期、身分秩序、イエ與宗族的對照',
    inLanguage: 'zh-Hant',
    creator: { '@id': `${SITE_URL}/#org` },
    about: [
      { '@type': 'Thing', name: '德川時代（江戶時代）' },
      { '@type': 'Thing', name: '幕藩體制' },
      { '@type': 'Thing', name: '武士身分制' },
      { '@type': 'Thing', name: 'イエ（家）與宗族' },
      { '@type': 'Thing', name: '鎖國與四口貿易' },
    ],
  },
  {
    '@type': 'Person',
    '@id': `${SITE_URL}/tokugawa#watanabe`,
    name: '渡邊浩',
    alternateName: ['渡辺浩', 'わたなべ ひろし', 'Watanabe Hiroshi'],
    description: '日本政治思想史學者，東京大學名譽教授、日本學士院會員',
  },
];
