/*
 * 手記的 SEO/AEO 資料層。純資料與純函式，沒有 JSX——首頁那條路由（PAGE_META）與單篇
 * 文章那條路由都吃它，將來若有 node 腳本要用也進得來。
 *
 * 每篇的 keywords、摘要、日期都住在資料倉（notes-data），這裡只負責把它們接成 SeoHead
 * 認得的形狀。文章一多也不必回來改這個檔。
 */

export const NOTES_TITLE = '手記｜聽講、讀書與整理資料時寫下的短文｜Phenom Canvas Lab';

export const NOTES_DESC =
  '個人短文集：學術演講的現場筆記、讀完一批出版品之後的讀後記，以及整理資料途中想到的問題。題材集中在法律制度、法實證研究與學術社群，依發表日期由新到舊排列，每篇標明發表日與閱讀時間。';

export const NOTES_KEYWORDS = [
  '手記',
  '演講筆記',
  '讀後記',
  '法律制度觀察',
  '法實證研究',
  '學術演講紀錄',
  '個人隨筆',
].join('、');

/* 首頁：一個 Blog 節點，作為每篇文章的容器。這裡刻意不列出每一篇——文章的
   BlogPosting 節點長在它自己那一頁上（見下方 postSeo），sitemap 也會把網址交出去，
   在這裡再抄一份只會讓 App.jsx 為了產 schema 而把整份文章清單拉進主 bundle。 */
export function notesSchema(SITE_URL) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${SITE_URL}/notes#blog`,
      url: `${SITE_URL}/notes`,
      name: '手記',
      description: NOTES_DESC,
      inLanguage: 'zh-Hant-TW',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ];
}

/* 單篇：SeoHead 收到 type: 'Article' 之後會自己產 headline／author／publisher 那些欄位，
   這裡補的是它不知道的東西——發表日、改版日、閱讀時間、標籤，以及這篇屬於哪個文集。
   節點的 @id 與 SeoHead 主節點相同，JSON-LD 消費端會把兩者併成同一個實體。 */
export function postSeo(post) {
  return {
    name: post.title,
    title: `${post.title}｜手記｜Phenom Canvas Lab`,
    description: post.summary,
    keywords: (post.keywords ?? []).join('、'),
    type: 'Article',
    parent: { name: '手記', path: '/notes' },
    buildSchema: (SITE_URL, url) => [
      {
        '@context': 'https://schema.org',
        '@id': `${url}#webpage`,
        alternativeHeadline: post.subtitle,
        datePublished: post.publishedAt,
        ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
        timeRequired: `PT${post.readingMinutes}M`,
        keywords: (post.keywords ?? []).join('、'),
        isPartOf: { '@id': `${SITE_URL}/notes#blog` },
        about: (post.tags ?? []).map((tag) => ({ '@type': 'Thing', name: tag })),
      },
    ],
  };
}
